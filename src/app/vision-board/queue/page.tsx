'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Container,
  Card,
  Button,
  Stack,
  PageHero,
  Spinner,
  Badge,
} from '@/lib/design-system/components'
import { Check, Loader2, Sparkles, Eye } from 'lucide-react'

interface QueueItem {
  name: string
  description: string
  category: string
  categoryLabel: string
  ideaId?: string
  createdItemId?: string
  status?: 'pending' | 'processing' | 'complete' | 'error'
  error?: string
}

export default function VisionBoardQueuePage() {
  const router = useRouter()
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [allComplete, setAllComplete] = useState(false)

  useEffect(() => {
    // Load queue from sessionStorage
    const queueData = sessionStorage.getItem('visionBoardQueue')
    
    if (!queueData) {
      // No queue data, redirect to ideas page
      router.push('/vision-board/ideas')
      return
    }

    try {
      const items = JSON.parse(queueData) as QueueItem[]
      setQueueItems(items.map(item => ({ ...item, status: 'pending' })))
    } catch (err) {
      console.error('Failed to parse queue data:', err)
      router.push('/vision-board/ideas')
    }
  }, [router])

  useEffect(() => {
    // Start processing when queue items are loaded
    if (queueItems.length > 0 && !isProcessing && !allComplete) {
      processNextItem()
    }
  }, [queueItems, isProcessing, allComplete])

  const updateVisionBoardIdeasTracking = async () => {
    try {
      // Group items by ideaId
      const itemsByIdeaId = new Map<string, string[]>()
      
      queueItems.forEach(item => {
        if (item.ideaId && item.createdItemId && item.status === 'complete') {
          if (!itemsByIdeaId.has(item.ideaId)) {
            itemsByIdeaId.set(item.ideaId, [])
          }
          itemsByIdeaId.get(item.ideaId)!.push(item.createdItemId)
        }
      })

      // Update each idea record
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
        } else {
          console.log(`✅ Updated vision_board_ideas ${ideaId} with ${createdIds.length} items`)
        }
      }
    } catch (err) {
      console.error('Error updating vision board ideas tracking:', err)
      // Don't fail - this is just tracking
    }
  }

  const processNextItem = async () => {
    if (currentIndex >= queueItems.length) {
      setAllComplete(true)
      
      // Update vision_board_ideas table with created items
      await updateVisionBoardIdeasTracking()
      
      // Clear sessionStorage
      sessionStorage.removeItem('visionBoardQueue')
      return
    }

    setIsProcessing(true)
    const item = queueItems[currentIndex]

    // Update status to processing
    setQueueItems(prev => prev.map((q, i) => 
      i === currentIndex ? { ...q, status: 'processing' } : q
    ))

    try {
      // Create vision board item via API
      const response = await fetch('/api/vision-board/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          categories: [item.category],
          status: 'active',
          generateImage: true, // Request AI image generation
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create vision board item')
      }

      const data = await response.json()
      const createdItemId = data.item?.id

      // Update status to complete and store created item ID
      setQueueItems(prev => prev.map((q, i) => 
        i === currentIndex ? { ...q, status: 'complete', createdItemId } : q
      ))

      // Move to next item after a brief delay
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setIsProcessing(false)
      }, 500)

    } catch (err) {
      console.error('Error creating item:', err)
      
      // Update status to error
      setQueueItems(prev => prev.map((q, i) => 
        i === currentIndex 
          ? { ...q, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' } 
          : q
      ))

      // Move to next item anyway
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setIsProcessing(false)
      }, 500)
    }
  }

  const handleViewBoard = () => {
    router.push('/vision-board')
  }

  const completedCount = queueItems.filter(q => q.status === 'complete').length
  const errorCount = queueItems.filter(q => q.status === 'error').length
  const totalCount = queueItems.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (queueItems.length === 0) {
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
      <Stack gap="lg">
        <PageHero
          title={allComplete ? "Vision Board Items Created!" : "Creating Your Vision Board Items"}
          subtitle={
            allComplete
              ? `Successfully added ${completedCount} items to your vision board`
              : "Please wait while we create your vision board items with VIVA-generated images..."
          }
        >
          {allComplete && (
            <div className="flex justify-center">
              <Button onClick={handleViewBoard} variant="primary" className="gap-2">
                <Eye className="w-4 h-4" />
                View My Vision Board
              </Button>
            </div>
          )}
        </PageHero>

        {/* Progress Card */}
        <Card className="p-6">
          <Stack gap="md">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Progress</h3>
              <Badge variant="info" className="text-base px-4 py-2">
                {completedCount} / {totalCount} complete
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-neutral-800 rounded-full h-3">
              <div
                className="bg-primary-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">
                {errorCount > 0 && `${errorCount} error${errorCount !== 1 ? 's' : ''}`}
              </span>
              <span className="text-primary-500 font-semibold">
                {progressPercentage}%
              </span>
            </div>
          </Stack>
        </Card>

        {/* Queue Items */}
        <Stack gap="sm">
          {queueItems.map((item, index) => {
            const isActive = index === currentIndex
            const isPast = index < currentIndex
            
            return (
              <Card 
                key={`${item.category}-${index}`} 
                className={`
                  p-4 transition-all
                  ${isActive ? 'border-2 border-primary-500' : ''}
                  ${item.status === 'complete' ? 'bg-primary-500/5' : ''}
                  ${item.status === 'error' ? 'bg-red-500/5' : ''}
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {item.status === 'complete' && (
                      <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                    {item.status === 'processing' && (
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                      </div>
                    )}
                    {item.status === 'error' && (
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-500 text-lg">✕</span>
                      </div>
                    )}
                    {item.status === 'pending' && (
                      <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                        <span className="text-neutral-500 text-sm">{index + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-semibold text-white">
                        {item.name}
                      </h4>
                      <Badge variant="info" className="text-xs">
                        {item.categoryLabel}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-300 mb-2">
                      {item.description}
                    </p>
                    
                    {/* Status Message */}
                    {item.status === 'processing' && (
                      <div className="flex items-center gap-2 text-sm text-primary-500">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Generating image and creating item...</span>
                      </div>
                    )}
                    {item.status === 'complete' && (
                      <div className="flex items-center gap-2 text-sm text-primary-500">
                        <Check className="w-4 h-4" />
                        <span>Added to your vision board</span>
                      </div>
                    )}
                    {item.status === 'error' && (
                      <div className="text-sm text-red-400">
                        Error: {item.error || 'Failed to create item'}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </Stack>

        {/* Complete Actions */}
        {allComplete && (
          <Card className="p-6 bg-primary-500/5 border-primary-500/20">
            <Stack gap="md" className="text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white">
                All Done!
              </h3>
              <p className="text-neutral-300">
                {completedCount} vision board items have been created and added to your board.
                {errorCount > 0 && ` ${errorCount} item${errorCount !== 1 ? 's' : ''} had errors.`}
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleViewBoard} variant="primary" className="gap-2">
                  <Eye className="w-4 h-4" />
                  View My Vision Board
                </Button>
                <Button onClick={() => router.push('/vision-board/ideas')} variant="outline">
                  Add More Ideas
                </Button>
              </div>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  )
}

