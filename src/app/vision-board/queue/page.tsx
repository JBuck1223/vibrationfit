'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Container,
  Card,
  Button,
  Stack,
  Spinner,
  Badge,
} from '@/lib/design-system/components'
import { ChevronRight, Layers } from 'lucide-react'

type QueueBatchRow = {
  id: string
  status: string
  total_jobs: number
  jobs_succeeded: number
  jobs_failed: number
  created_at: string
  completed_at: string | null
  error_message: string | null
  /** Vision titles from queue jobs, ordered (filled after jobs query) */
  jobNames: string[]
}

function formatBatchHeadline(names: string[]): string {
  if (names.length === 0) return 'Creation batch'
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} · ${names[1]}`
  return `${names[0]} · ${names[1]} · +${names.length - 2} more`
}

/** Shown for multi-item batches, in-progress, failures, or partial success — not for a lone “1 of 1” success. */
function shouldShowBatchStats(
  b: Pick<QueueBatchRow, 'total_jobs' | 'jobs_succeeded' | 'jobs_failed' | 'status'>
) {
  if (b.status === 'pending' || b.status === 'processing') return true
  if (b.total_jobs > 1) return true
  if (b.jobs_failed > 0) return true
  if (b.status === 'completed' && b.jobs_succeeded < b.total_jobs) return true
  return false
}

function formatBatchStats(
  b: Pick<QueueBatchRow, 'total_jobs' | 'jobs_succeeded' | 'jobs_failed' | 'status'>
) {
  const n = b.total_jobs
  const itemWord = n === 1 ? 'item' : 'items'
  if (b.status === 'pending' || b.status === 'processing') {
    return `${n} ${itemWord} in queue`
  }
  if (b.jobs_failed > 0) {
    return `${b.jobs_succeeded} of ${n} added · ${b.jobs_failed} failed`
  }
  return `${b.jobs_succeeded} of ${n} added`
}

function statusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'processing':
      return 'Processing'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

function VisionBoardQueueIndexContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ready, setReady] = useState(false)
  const [batches, setBatches] = useState<QueueBatchRow[]>([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        router.push('/auth/login')
        return
      }

      const legacy = searchParams.get('batchId')
      if (legacy) {
        router.replace(`/vision-board/queue/${encodeURIComponent(legacy)}`)
        return
      }

      const { data: list, error: listError } = await supabase
        .from('vision_board_queue_batches')
        .select('id, status, total_jobs, jobs_succeeded, jobs_failed, created_at, completed_at, error_message')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (cancelled) return

      if (listError) {
        console.error('vision_board_queue_batches list:', listError)
        setBatches([])
        setReady(true)
        return
      }

      const baseRows = (list || []) as Omit<QueueBatchRow, 'jobNames'>[]
      const rows: QueueBatchRow[] = baseRows.map((b) => ({ ...b, jobNames: [] }))

      if (rows.length > 0) {
        const batchIds = rows.map((r) => r.id)
        const { data: jobRows, error: jobsError } = await supabase
          .from('vision_board_queue_jobs')
          .select('batch_id, name, sort_index')
          .in('batch_id', batchIds)
          .order('sort_index', { ascending: true })

        if (cancelled) return

        if (jobsError) {
          console.error('vision_board_queue_jobs list for index:', jobsError)
        } else {
          const namesByBatch = new Map<string, string[]>()
          for (const j of jobRows || []) {
            const bid = j.batch_id as string
            if (!namesByBatch.has(bid)) namesByBatch.set(bid, [])
            namesByBatch.get(bid)!.push((j as { name: string }).name)
          }
          for (const b of rows) {
            b.jobNames = namesByBatch.get(b.id) ?? []
          }
        }
      }

      const active = rows.find((b) => b.status === 'pending' || b.status === 'processing')
      if (active) {
        router.replace(`/vision-board/queue/${active.id}`)
        return
      }

      if (cancelled) return
      setBatches(rows)
      setReady(true)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  if (!ready) {
    return (
      <Container size="xl">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Spinner size="lg" />
          <p className="text-neutral-400">Loading queue...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        {batches.length === 0 ? (
          <Card className="p-6">
            <Stack gap="md" className="text-center">
              <p className="text-neutral-300">No queue history yet.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={() => router.push('/vision-board/ideas')} variant="primary">
                  Go to VIVA Ideas
                </Button>
                <Button onClick={() => router.push('/vision-board')} variant="outline">
                  View my vision board
                </Button>
              </div>
            </Stack>
          </Card>
        ) : (
          <Card className="p-4 sm:p-6">
            <Stack gap="md">
              <h2 className="text-sm font-medium text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-500 shrink-0" aria-hidden />
                Recent batches
              </h2>
              <ul className="space-y-2">
                {batches.map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/vision-board/queue/${b.id}`)}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-3 text-left transition-colors hover:border-primary-500/40 hover:bg-neutral-900"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white line-clamp-2 leading-snug">
                          {formatBatchHeadline(b.jobNames)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xs text-neutral-500">
                            {new Date(b.created_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                          <Badge
                            variant={
                              b.status === 'completed'
                                ? 'success'
                                : b.status === 'failed'
                                  ? 'danger'
                                  : b.status === 'cancelled'
                                    ? 'neutral'
                                    : 'primary'
                            }
                            className="text-[10px]"
                          >
                            {statusLabel(b.status)}
                          </Badge>
                        </div>
                        {shouldShowBatchStats(b) ? (
                          <p className="text-xs text-neutral-500 mt-1">{formatBatchStats(b)}</p>
                        ) : null}
                        {b.error_message && b.status === 'failed' ? (
                          <p className="text-xs text-red-400/90 mt-1 line-clamp-2">{b.error_message}</p>
                        ) : null}
                      </div>
                      <ChevronRight className="w-5 h-5 text-neutral-500 shrink-0" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <Button onClick={() => router.push('/vision-board/ideas')} variant="primary" size="sm">
                  New batch from VIVA Ideas
                </Button>
                <Button onClick={() => router.push('/vision-board')} variant="outline" size="sm">
                  View my vision board
                </Button>
              </div>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  )
}

export default function VisionBoardQueueIndexPage() {
  return (
    <Suspense
      fallback={
        <Container size="xl">
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <Spinner size="lg" />
            <p className="text-neutral-400">Loading queue...</p>
          </div>
        </Container>
      }
    >
      <VisionBoardQueueIndexContent />
    </Suspense>
  )
}
