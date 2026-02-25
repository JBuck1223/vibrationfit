/**
 * Sequence Step Processor
 *
 * Called by the cron job every minute. For each active enrollment whose
 * next_step_at has passed, it:
 *   1. Looks up the next step in the sequence
 *   2. Fetches the template and substitutes variables from enrollment metadata
 *   3. Inserts a row into scheduled_messages
 *   4. Advances the enrollment to the next step (or marks completed)
 */

import { createAdminClient } from '@/lib/supabase/admin'

function applyVariables(text: string, variables: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

export interface ProcessResult {
  processed: number
  sent: number
  completed: number
  skipped: number
  errors: number
}

export async function processSequenceSteps(): Promise<ProcessResult> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const result: ProcessResult = {
    processed: 0,
    sent: 0,
    completed: 0,
    skipped: 0,
    errors: 0,
  }

  const { data: dueEnrollments, error: fetchErr } = await supabase
    .from('sequence_enrollments')
    .select('*')
    .eq('status', 'active')
    .lte('next_step_at', now)
    .order('next_step_at', { ascending: true })
    .limit(100)

  if (fetchErr || !dueEnrollments || dueEnrollments.length === 0) {
    return result
  }

  for (const enrollment of dueEnrollments) {
    result.processed++
    const nextOrder = enrollment.current_step_order + 1

    try {
      const { data: step } = await supabase
        .from('sequence_steps')
        .select('*')
        .eq('sequence_id', enrollment.sequence_id)
        .eq('step_order', nextOrder)
        .eq('status', 'active')
        .single()

      if (!step) {
        await supabase
          .from('sequence_enrollments')
          .update({
            status: 'completed',
            completed_at: now,
            current_step_order: nextOrder - 1,
            next_step_at: null,
          })
          .eq('id', enrollment.id)

        await supabase.rpc('increment_field', {
          table_name: 'sequences',
          field_name: 'total_completed',
          row_id: enrollment.sequence_id,
        }).then(() => {}).catch(() => {
          supabase
            .from('sequences')
            .select('total_completed')
            .eq('id', enrollment.sequence_id)
            .single()
            .then(({ data }) => {
              if (data) {
                supabase
                  .from('sequences')
                  .update({ total_completed: (data.total_completed || 0) + 1 })
                  .eq('id', enrollment.sequence_id)
              }
            })
        })

        result.completed++
        continue
      }

      // --- Skip condition check ---
      // If the step has a skip_if_checklist condition and the user meets it,
      // skip this message entirely but still advance the enrollment.
      const skipCheck = (step.conditions as Record<string, unknown>)?.skip_if_checklist as {
        table: string
        user_field: string
        check_field: string
        check_value: unknown
      } | undefined

      let shouldSkip = false
      if (skipCheck && enrollment.user_id) {
        try {
          const { data: row } = await supabase
            .from(skipCheck.table)
            .select(skipCheck.check_field)
            .eq(skipCheck.user_field, enrollment.user_id)
            .maybeSingle()

          if (row && (row as Record<string, unknown>)[skipCheck.check_field] === skipCheck.check_value) {
            shouldSkip = true
          }
        } catch (checkErr) {
          console.error(
            `[sequence-processor] Error checking skip condition for step ${step.id}:`,
            checkErr
          )
        }
      }

      if (!shouldSkip) {
        const variables: Record<string, string> = {}
        if (enrollment.metadata && typeof enrollment.metadata === 'object') {
          for (const [k, v] of Object.entries(
            enrollment.metadata as Record<string, unknown>
          )) {
            if (typeof v === 'string') variables[k] = v
          }
        }

        let subject: string | null = null
        let body = ''
        let textBody: string | null = null

        if (step.channel === 'email') {
          const { data: template } = await supabase
            .from('email_templates')
            .select('subject, html_body, text_body')
            .eq('id', step.template_id)
            .single()

          if (!template) {
            result.skipped++
            continue
          }

          subject = step.subject_override
            ? applyVariables(step.subject_override, variables)
            : applyVariables(template.subject, variables)
          body = applyVariables(template.html_body, variables)
          textBody = template.text_body
            ? applyVariables(template.text_body, variables)
            : null
        } else {
          const { data: template } = await supabase
            .from('sms_templates')
            .select('body')
            .eq('id', step.template_id)
            .single()

          if (!template) {
            result.skipped++
            continue
          }

          body = applyVariables(template.body, variables)
        }

        await supabase.from('scheduled_messages').insert({
          message_type: step.channel,
          recipient_email: enrollment.email || null,
          recipient_phone: enrollment.phone || null,
          recipient_name: variables.name || variables.firstName || null,
          recipient_user_id: enrollment.user_id || null,
          subject,
          body,
          text_body: textBody,
          scheduled_for: now,
          email_template_id:
            step.channel === 'email' ? step.template_id : null,
          sms_template_id: step.channel === 'sms' ? step.template_id : null,
        })

        await supabase
          .from('sequence_steps')
          .update({ total_sent: (step.total_sent || 0) + 1 })
          .eq('id', step.id)

        result.sent++
      } else {
        result.skipped++
      }

      // Advance enrollment to next step (shared by both send and skip paths)
      const { data: followingStep } = await supabase
        .from('sequence_steps')
        .select('delay_minutes, delay_from')
        .eq('sequence_id', enrollment.sequence_id)
        .eq('step_order', nextOrder + 1)
        .eq('status', 'active')
        .single()

      let nextStepAt: string | null = null
      if (followingStep) {
        const baseTime =
          followingStep.delay_from === 'enrollment'
            ? new Date(enrollment.enrolled_at).getTime()
            : Date.now()
        nextStepAt = new Date(
          baseTime + (followingStep.delay_minutes || 0) * 60 * 1000
        ).toISOString()
      }

      await supabase
        .from('sequence_enrollments')
        .update({
          current_step_order: nextOrder,
          next_step_at: nextStepAt,
          ...(nextStepAt ? {} : { status: 'completed', completed_at: now }),
        })
        .eq('id', enrollment.id)

      if (!nextStepAt) {
        result.completed++
      }
    } catch (err) {
      console.error(
        `[sequence-processor] Error processing enrollment ${enrollment.id}:`,
        err
      )
      result.errors++
    }
  }

  if (result.processed > 0) {
    console.log(
      `[sequence-processor] Processed ${result.processed}: ${result.sent} sent, ${result.completed} completed, ${result.skipped} skipped, ${result.errors} errors`
    )
  }

  return result
}
