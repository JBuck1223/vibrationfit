/**
 * Event Bus for the Automation Engine
 *
 * triggerEvent(eventName, payload) does three things:
 * 1. Fires matching automation_rules (single-fire sends)
 * 2. Enrolls into matching sequences (multi-step drips)
 * 3. Processes sequence exit events (cancel active enrollments)
 *
 * All sends go through the scheduled_messages queue.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export interface EventPayload {
  email?: string
  phone?: string
  userId?: string
  name?: string
  [key: string]: string | undefined
}

function applyVariables(text: string, variables: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

function cleanPayload(payload: EventPayload): Record<string, string> {
  const clean: Record<string, string> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) clean[key] = value
  }
  return clean
}

function matchesConditions(
  conditions: Record<string, unknown>,
  payload: EventPayload
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true
  for (const [key, expected] of Object.entries(conditions)) {
    if (payload[key] !== expected) return false
  }
  return true
}

/**
 * Fire an event. Checks automation rules, enrolls in sequences, handles exits.
 * Safe to call from any API route -- errors are caught per-rule so one failure
 * doesn't block others.
 */
export async function triggerEvent(
  eventName: string,
  payload: EventPayload
): Promise<{ rulesFired: number; sequencesEnrolled: number; sequencesExited: number }> {
  const supabase = createAdminClient()
  const variables = cleanPayload(payload)
  const result = { rulesFired: 0, sequencesEnrolled: 0, sequencesExited: 0 }

  // --- 1. Automation Rules (single-fire) ---
  try {
    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('event_name', eventName)
      .eq('status', 'active')

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        try {
          if (!matchesConditions(rule.conditions, payload)) continue

          let subject: string | null = null
          let body = ''
          let textBody: string | null = null

          if (rule.channel === 'email') {
            const { data: template } = await supabase
              .from('email_templates')
              .select('subject, html_body, text_body')
              .eq('id', rule.template_id)
              .single()
            if (!template) continue
            subject = applyVariables(template.subject, variables)
            body = applyVariables(template.html_body, variables)
            textBody = template.text_body
              ? applyVariables(template.text_body, variables)
              : null
          } else {
            const { data: template } = await supabase
              .from('sms_templates')
              .select('body')
              .eq('id', rule.template_id)
              .single()
            if (!template) continue
            body = applyVariables(template.body, variables)
          }

          const scheduledFor = new Date(
            Date.now() + (rule.delay_minutes || 0) * 60 * 1000
          ).toISOString()

          await supabase.from('scheduled_messages').insert({
            message_type: rule.channel,
            recipient_email: payload.email || null,
            recipient_phone: payload.phone || null,
            recipient_name: payload.name || null,
            recipient_user_id: payload.userId || null,
            subject,
            body,
            text_body: textBody,
            scheduled_for: scheduledFor,
            email_template_id:
              rule.channel === 'email' ? rule.template_id : null,
            sms_template_id:
              rule.channel === 'sms' ? rule.template_id : null,
          })

          await supabase
            .from('automation_rules')
            .update({
              total_sent: (rule.total_sent || 0) + 1,
              last_sent_at: new Date().toISOString(),
            })
            .eq('id', rule.id)

          result.rulesFired++
        } catch (err) {
          console.error(
            `[events] Error processing rule ${rule.id} for ${eventName}:`,
            err
          )
        }
      }
    }
  } catch (err) {
    console.error(`[events] Error fetching automation rules for ${eventName}:`, err)
  }

  // --- 2. Sequence Enrollment ---
  try {
    const { data: sequences } = await supabase
      .from('sequences')
      .select('*')
      .eq('trigger_event', eventName)
      .eq('status', 'active')

    if (sequences && sequences.length > 0) {
      for (const seq of sequences) {
        try {
          if (!matchesConditions(seq.trigger_conditions, payload)) continue

          if (!payload.email) continue

          const { data: firstStep } = await supabase
            .from('sequence_steps')
            .select('delay_minutes')
            .eq('sequence_id', seq.id)
            .eq('step_order', 1)
            .eq('status', 'active')
            .single()

          const delayMs = (firstStep?.delay_minutes || 0) * 60 * 1000
          const nextStepAt = new Date(Date.now() + delayMs).toISOString()

          const { error: enrollError } = await supabase
            .from('sequence_enrollments')
            .insert({
              sequence_id: seq.id,
              user_id: payload.userId || null,
              email: payload.email,
              phone: payload.phone || null,
              metadata: variables,
              current_step_order: 0,
              status: 'active',
              next_step_at: nextStepAt,
            })

          if (enrollError) {
            if (enrollError.code === '23505') {
              // unique violation -- already enrolled, skip
              continue
            }
            console.error(
              `[events] Error enrolling in sequence ${seq.id}:`,
              enrollError
            )
            continue
          }

          await supabase
            .from('sequences')
            .update({ total_enrolled: (seq.total_enrolled || 0) + 1 })
            .eq('id', seq.id)

          result.sequencesEnrolled++
        } catch (err) {
          console.error(
            `[events] Error enrolling in sequence ${seq.id} for ${eventName}:`,
            err
          )
        }
      }
    }
  } catch (err) {
    console.error(`[events] Error fetching sequences for ${eventName}:`, err)
  }

  // --- 3. Sequence Exit Events ---
  try {
    const { data: activeEnrollments } = await supabase
      .from('sequence_enrollments')
      .select('id, sequence_id, email, sequences!inner(exit_events)')
      .eq('status', 'active')

    if (activeEnrollments) {
      for (const enrollment of activeEnrollments) {
        try {
          const seq = enrollment.sequences as unknown as {
            exit_events: string[]
          }
          const exitEvents = Array.isArray(seq?.exit_events)
            ? seq.exit_events
            : []
          if (!exitEvents.includes(eventName)) continue

          if (
            payload.email &&
            enrollment.email &&
            payload.email !== enrollment.email
          ) {
            continue
          }

          await supabase
            .from('sequence_enrollments')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              cancel_reason: `exit_event: ${eventName}`,
            })
            .eq('id', enrollment.id)

          result.sequencesExited++
        } catch (err) {
          console.error(
            `[events] Error processing exit for enrollment ${enrollment.id}:`,
            err
          )
        }
      }
    }
  } catch (err) {
    console.error(`[events] Error processing exit events for ${eventName}:`, err)
  }

  if (
    result.rulesFired > 0 ||
    result.sequencesEnrolled > 0 ||
    result.sequencesExited > 0
  ) {
    console.log(
      `[events] ${eventName}: ${result.rulesFired} rules fired, ${result.sequencesEnrolled} enrolled, ${result.sequencesExited} exited`
    )
  }

  return result
}
