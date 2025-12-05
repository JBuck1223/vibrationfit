import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const dailyPaperPayloadSchema = z.object({
  entryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'entryDate must be in YYYY-MM-DD format'),
  gratitude: z
    .string()
    .min(1, 'gratitude is required')
    .max(10000, 'gratitude is too long'),
  tasks: z
    .array(z.string().max(1000))
    .length(3, 'tasks must contain exactly 3 items')
    .optional(),
  funPlan: z
    .string()
    .min(1, 'funPlan is required')
    .max(1000, 'funPlan is too long'),
  attachment: z
    .object({
      url: z.string().url(),
      key: z.string(),
      contentType: z.string().optional(),
      size: z.number().int().nonnegative().optional(),
    })
    .partial()
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  taskOne: z.string().max(1000).optional(),
  taskTwo: z.string().max(1000).optional(),
  taskThree: z.string().max(1000).optional(),
})

const DAILY_PAPER_SELECT_COLUMNS =
  'id, entry_date, gratitude, task_one, task_two, task_three, fun_plan, attachment_url, attachment_key, attachment_content_type, attachment_size, metadata, created_at, updated_at'

const normalizeText = (value?: string | null) =>
  typeof value === 'string' ? value.trim() : ''

async function getUserId() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw Object.assign(new Error('Failed to fetch user'), {
      status: 500,
      cause: userError,
    })
  }

  if (!user) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 })
  }

  return { supabase, userId: user.id }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId } = await getUserId()
    const url = new URL(request.url)
    const entryDateFilter = url.searchParams.get('date')
    const limit = Number(url.searchParams.get('limit')) || 30

    let query = supabase
      .from('daily_papers')
      .select(DAILY_PAPER_SELECT_COLUMNS)
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (entryDateFilter) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDateFilter)) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD.' },
          { status: 400 },
        )
      }
      query = query.eq('entry_date', entryDateFilter)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ Daily Paper GET failed:', error)

    const status =
      (error as { status?: number })?.status ||
      (error as { statusCode?: number })?.statusCode ||
      500

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch daily papers',
      },
      { status },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId } = await getUserId()
    const json = await request.json()
    const parseResult = dailyPaperPayloadSchema.safeParse(json)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid payload',
          details: parseResult.error.flatten(),
        },
        { status: 400 },
      )
    }

    const {
      entryDate,
      gratitude,
      funPlan,
      tasks,
      taskOne,
      taskTwo,
      taskThree,
      attachment,
      metadata,
    } = parseResult.data

    const normalizedGratitude = normalizeText(gratitude)
    const normalizedFunPlan = normalizeText(funPlan)

    if (!normalizedGratitude) {
      return NextResponse.json(
        { error: 'gratitude cannot be empty' },
        { status: 400 },
      )
    }

    if (!normalizedFunPlan) {
      return NextResponse.json(
        { error: 'funPlan cannot be empty' },
        { status: 400 },
      )
    }

    if (attachment) {
      if (!attachment.url || !attachment.key) {
        return NextResponse.json(
          { error: 'attachment requires both url and key' },
          { status: 400 },
        )
      }
    }

    const [task1, task2, task3] = tasks
      ? tasks.map((task) => normalizeText(task))
      : [normalizeText(taskOne), normalizeText(taskTwo), normalizeText(taskThree)]

    if (!tasks && (task1 === undefined || task2 === undefined || task3 === undefined)) {
      return NextResponse.json(
        {
          error:
            'Provide either tasks array with 3 items or taskOne, taskTwo, taskThree fields.',
        },
        { status: 400 },
      )
    }

    const payload = {
      user_id: userId,
      entry_date: entryDate,
      gratitude: normalizedGratitude,
      task_one: task1 ?? '',
      task_two: task2 ?? '',
      task_three: task3 ?? '',
      fun_plan: normalizedFunPlan,
      attachment_url: attachment?.url ?? null,
      attachment_key: attachment?.key ?? null,
      attachment_content_type: attachment?.contentType ?? null,
      attachment_size:
        typeof attachment?.size === 'number' ? attachment.size : null,
      metadata: (metadata ?? {}) as Record<string, unknown>,
    }

    const { data, error } = await supabase
      .from('daily_papers')
      .upsert(payload, { onConflict: 'user_id,entry_date' })
      .select(DAILY_PAPER_SELECT_COLUMNS)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(
      {
        data,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('❌ Daily Paper POST failed:', error)

    const status =
      (error as { status?: number })?.status ||
      (error as { statusCode?: number })?.statusCode ||
      500

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to save daily paper',
      },
      { status },
    )
  }
}

