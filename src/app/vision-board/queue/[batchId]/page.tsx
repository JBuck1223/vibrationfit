'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Container,
  Card,
  Button,
  Stack,
  Spinner,
  Badge,
} from '@/lib/design-system/components'
import { Check, Loader2, Sparkles, Eye, X } from 'lucide-react'
import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'

type JobStatus = 'pending' | 'processing' | 'complete' | 'error'

export interface QueueItem {
  jobId: string
  name: string
  description: string
  category: string
  categoryLabel: string
  ideaId?: string
  createdItemId?: string
  status: JobStatus
  error?: string
}

interface BatchRow {
  id: string
  user_id: string
  status: string
  total_jobs: number
  jobs_succeeded: number
  jobs_failed: number
}

function mapRowStatus(s: string, hasItem: boolean): JobStatus {
  if (s === 'complete') return 'complete'
  if (s === 'error') return 'error'
  if (s === 'processing' && !hasItem) return 'pending'
  if (s === 'processing') return 'processing'
  return 'pending'
}

export default function VisionBoardQueueBatchPage() {
  const router = useRouter()
  const pathname = usePathname()
  const isIntensivePath = pathname?.startsWith('/intensive') ?? false
  const params = useParams()
  const paramBatchId = typeof params?.batchId === 'string' ? params.batchId : null

  const [batchId, setBatchId] = useState<string | null>(paramBatchId)
  const [batchRecord, setBatchRecord] = useState<BatchRow | null>(null)
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [queueLoaded, setQueueLoaded] = useState(false)
  const [hasQueueData, setHasQueueData] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [allComplete, setAllComplete] = useState(false)
  const finalizingRef = useRef(false)
  const batchStartMarkedRef = useRef(false)

  const updateVisionBoardIdeasTracking = async (items: QueueItem[]) => {
    try {
      const itemsByIdeaId = new Map<string, string[]>()
      items.forEach(item => {
        if (item.ideaId && item.createdItemId && item.status === 'complete') {
          if (!itemsByIdeaId.has(item.ideaId)) {
            itemsByIdeaId.set(item.ideaId, [])
          }
          itemsByIdeaId.get(item.ideaId)!.push(item.createdItemId)
        }
      })

      const supabase = createClient()
      for (const [ideaId, createdIds] of itemsByIdeaId.entries()) {
        const { error } = await supabase
          .from('vision_board_ideas')
          .update({
            items_created: createdIds.length,
            created_item_ids: createdIds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ideaId)

        if (error) {
          console.error(`Failed to update vision_board_ideas ${ideaId}:`, error)
        }
      }
    } catch (err) {
      console.error('Error updating vision board ideas tracking:', err)
    }
  }

  const finalizeBatch = useCallback(
    async (bId: string, items: QueueItem[]) => {
      if (finalizingRef.current) return
      finalizingRef.current = true
      const succeeded = items.filter(q => q.status === 'complete').length
      const failed = items.filter(q => q.status === 'error').length
      const supabase = createClient()
      await supabase
        .from('vision_board_queue_batches')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          jobs_succeeded: succeeded,
          jobs_failed: failed,
        })
        .eq('id', bId)
      await updateVisionBoardIdeasTracking(items)

      if (isIntensivePath) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: allItems } = await supabase
              .from('vision_board_items')
              .select('categories')
              .eq('user_id', user.id)
              .in('status', ['active', 'actualized'])

            if (allItems) {
              const coveredCategories = new Set<string>()
              allItems.forEach(item => {
                if (item.categories && Array.isArray(item.categories)) {
                  item.categories.forEach((cat: string) => coveredCategories.add(cat))
                }
              })
              const allCategoriesCovered = LIFE_CATEGORY_KEYS.every(cat => coveredCategories.has(cat))
              if (allCategoriesCovered) {
                const { markIntensiveStep } = await import('@/lib/intensive/checklist')
                await markIntensiveStep('vision_board_completed')
              }
            }
          }
        } catch (err) {
          console.error('Error checking intensive completion:', err)
        }
      }

      setAllComplete(true)
    },
    [isIntensivePath]
  )

  useEffect(() => {
    if (paramBatchId) {
      setBatchId(paramBatchId)
    }
  }, [paramBatchId])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!paramBatchId) {
        if (!cancelled) {
          setHasQueueData(false)
          setQueueLoaded(true)
        }
        return
      }

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        router.push('/auth/login')
        return
      }

      const targetBatchId = paramBatchId

      const { data: batchRow, error: bErr } = await supabase
        .from('vision_board_queue_batches')
        .select('id, user_id, status, total_jobs, jobs_succeeded, jobs_failed')
        .eq('id', targetBatchId)
        .eq('user_id', user.id)
        .single()

      if (bErr || !batchRow) {
        if (!cancelled) {
          setHasQueueData(false)
          setQueueLoaded(true)
        }
        return
      }

      await supabase
        .from('vision_board_queue_jobs')
        .update({ status: 'pending' })
        .eq('batch_id', targetBatchId)
        .eq('status', 'processing')
        .is('created_vision_board_item_id', null)

      const { data: jobRows, error: jErr } = await supabase
        .from('vision_board_queue_jobs')
        .select(
          'id, name, description, category, category_label, idea_id, status, error_message, created_vision_board_item_id'
        )
        .eq('batch_id', targetBatchId)
        .order('sort_index', { ascending: true })

      if (jErr || !jobRows?.length) {
        if (!cancelled) {
          setHasQueueData(false)
          setQueueLoaded(true)
        }
        return
      }

      const mapped: QueueItem[] = jobRows.map(j => {
        const hasItem = Boolean(j.created_vision_board_item_id)
        const st = j.status as string
        return {
          jobId: j.id,
          name: j.name,
          description: j.description,
          category: j.category,
          categoryLabel: j.category_label,
          ideaId: j.idea_id ?? undefined,
          createdItemId: j.created_vision_board_item_id ?? undefined,
          status: mapRowStatus(st, hasItem),
          error: j.error_message ?? undefined,
        }
      })

      if (cancelled) return

      setBatchId(targetBatchId)
      setBatchRecord(batchRow as BatchRow)
      setQueueItems(mapped)
      setHasQueueData(true)

      if (batchRow.status === 'completed') {
        setAllComplete(true)
        setCurrentIndex(mapped.length)
      } else {
        const firstWork = mapped.findIndex(
          q => q.status === 'pending' || (q.status === 'processing' && !q.createdItemId)
        )
        if (firstWork === -1) {
          const allTerminal = mapped.every(q => q.status === 'complete' || q.status === 'error')
          if (allTerminal) {
            await finalizeBatch(targetBatchId, mapped)
            setCurrentIndex(mapped.length)
          }
        } else {
          setCurrentIndex(firstWork)
        }
      }
      setQueueLoaded(true)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [paramBatchId, router, finalizeBatch])

  const processNextItem = useCallback(async () => {
    if (!batchId || !batchRecord) return
    if (batchRecord.status === 'completed') return

    if (currentIndex >= queueItems.length && queueItems.length > 0) {
      if (!allComplete) {
        await finalizeBatch(batchId, queueItems)
      }
      return
    }

    const item = queueItems[currentIndex]
    if (!item) return

    if (item.status === 'complete' || item.status === 'error') {
      setCurrentIndex(i => i + 1)
      return
    }

    setIsProcessing(true)
    const supabase = createClient()

    if (!batchStartMarkedRef.current) {
      batchStartMarkedRef.current = true
      await supabase
        .from('vision_board_queue_batches')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', batchId)
    }

    await supabase
      .from('vision_board_queue_jobs')
      .update({ status: 'processing' })
      .eq('id', item.jobId)

    setQueueItems(prev =>
      prev.map((q, i) => (i === currentIndex ? { ...q, status: 'processing' as const } : q))
    )

    try {
      const response = await fetch('/api/vision-board/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          categories: [item.category],
          status: 'active',
          generateImage: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create vision board item')
      }

      const data = await response.json()
      const createdItemId = data.item?.id as string | undefined

      await supabase
        .from('vision_board_queue_jobs')
        .update({
          status: 'complete',
          created_vision_board_item_id: createdItemId ?? null,
          error_message: null,
        })
        .eq('id', item.jobId)

      setQueueItems(prev => {
        const next = prev.map((q, i) =>
          i === currentIndex
            ? { ...q, status: 'complete' as const, createdItemId }
            : q
        )
        return next
      })

      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setIsProcessing(false)
      }, 500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      await supabase
        .from('vision_board_queue_jobs')
        .update({
          status: 'error',
          error_message: message,
        })
        .eq('id', item.jobId)

      setQueueItems(prev =>
        prev.map((q, i) =>
          i === currentIndex ? { ...q, status: 'error' as const, error: message } : q
        )
      )
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setIsProcessing(false)
      }, 500)
    }
  }, [
    batchId,
    batchRecord,
    currentIndex,
    queueItems,
    allComplete,
    finalizeBatch,
  ])

  useEffect(() => {
    if (!queueLoaded || !hasQueueData) return
    if (queueItems.length === 0) return
    if (allComplete) return
    if (isProcessing) return
    if (batchRecord?.status === 'completed') return
    void processNextItem()
  }, [
    queueLoaded,
    hasQueueData,
    queueItems,
    isProcessing,
    allComplete,
    batchRecord?.status,
    currentIndex,
    processNextItem,
  ])

  const handleViewBoard = () => {
    router.push(isIntensivePath ? '/intensive/vision-board' : '/vision-board')
  }

  const completedCount = queueItems.filter(q => q.status === 'complete').length
  const errorCount = queueItems.filter(q => q.status === 'error').length
  const totalCount = queueItems.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (!paramBatchId) {
    return (
      <Container size="xl">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <h1 className="text-lg font-semibold text-white">Invalid queue</h1>
          <Button onClick={() => router.push('/vision-board/queue')} variant="primary">
            Back to queue
          </Button>
        </div>
      </Container>
    )
  }

  if (!queueLoaded) {
    return (
      <Container size="xl">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Spinner size="lg" />
          <p className="text-neutral-400 text-sm">Loading queue...</p>
        </div>
      </Container>
    )
  }

  if (!hasQueueData) {
    return (
      <Container size="xl">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-white">Queue not found</h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-lg mx-auto">
              This batch does not exist or you do not have access to it.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => router.push('/vision-board/queue')} variant="primary">
              Vision board queue
            </Button>
            <Button onClick={() => router.push('/vision-board/ideas')} variant="outline">
              Go to VIVA Ideas
            </Button>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl border-2 border-[#333] bg-[#1F1F1F] p-6 md:p-8">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              {allComplete ? (
                <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check className="w-7 h-7 text-black" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-500 animate-pulse" />
                </div>
              )}
            </div>
            <h1 className="text-xl font-semibold text-white">
              {allComplete
                ? (totalCount === 1 ? 'Vision Board Item Created' : 'Vision Board Items Created')
                : (totalCount === 1
                    ? 'Creating Your Vision Board Item'
                    : 'Creating Your Vision Board Items')}
            </h1>
            <p className="text-sm text-neutral-400 max-w-md mx-auto">
              {allComplete
                ? `Successfully added ${completedCount} item${completedCount === 1 ? '' : 's'} to your vision board.`
                : (totalCount === 1
                    ? 'Please wait while we add your item with VIVA-generated images.'
                    : 'Please wait while we add your items with VIVA-generated images.')}
            </p>

            {/* Progress bar */}
            <div className="pt-2 space-y-2 max-w-sm mx-auto">
              <div className="w-full bg-neutral-800 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-center text-xs text-neutral-400">
                {completedCount}/{totalCount} complete
                {errorCount > 0 && <span className="text-neutral-500 ml-2">({errorCount} error{errorCount !== 1 ? 's' : ''})</span>}
              </div>
            </div>

            {allComplete && (
              <div className="flex justify-center pt-2">
                <Button onClick={handleViewBoard} variant="primary" className="gap-2">
                  <Eye className="w-4 h-4" />
                  View My Vision Board
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Queue items */}
        <div className="space-y-2">
          {queueItems.map((item, index) => {
            const isActive = index === currentIndex && !allComplete
            return (
              <div
                key={item.jobId}
                className={`
                  rounded-xl border p-4 transition-all
                  ${isActive
                    ? 'border-primary-500 bg-primary-500/5'
                    : item.status === 'complete'
                      ? 'border-[#2A2A2A] bg-[#161616]'
                      : item.status === 'error'
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-[#2A2A2A] bg-[#1A1A1A]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {item.status === 'complete' && (
                      <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    )}
                    {item.status === 'processing' && (
                      <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                      </div>
                    )}
                    {item.status === 'error' && (
                      <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-red-500" aria-hidden />
                      </div>
                    )}
                    {item.status === 'pending' && (
                      <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center">
                        <span className="text-neutral-500 text-xs font-medium">{index + 1}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-white truncate">{item.name}</h4>
                      <span className="text-[10px] uppercase tracking-wide text-neutral-500 shrink-0">
                        {item.categoryLabel}
                      </span>
                    </div>
                    {item.status === 'processing' && (
                      <p className="text-xs text-primary-500 mt-0.5">Generating image...</p>
                    )}
                    {item.status === 'error' && (
                      <p className="text-xs text-red-400 mt-0.5">{item.error || 'Failed to create item'}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Completion card */}
        {allComplete && (
          <div className="rounded-2xl border border-primary-500/20 bg-primary-500/5 p-6 text-center space-y-4">
            <p className="text-sm text-neutral-300">
              {completedCount === 1
                ? '1 vision board item has been created and added to your board.'
                : `${completedCount} vision board items have been created and added to your board.`}
              {errorCount > 0
                ? (errorCount === 1
                    ? ' 1 item had an error.'
                    : ` ${errorCount} items had errors.`)
                : ''}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleViewBoard} variant="primary" className="gap-2">
                <Eye className="w-4 h-4" />
                View My Vision Board
              </Button>
              <Button onClick={() => router.push(isIntensivePath ? '/intensive/vision-board/ideas' : '/vision-board/ideas')} variant="outline">
                Add More Ideas
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}
