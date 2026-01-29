'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Badge, Container, Stack, PageHero, VIVALoadingOverlay, Toggle, Spinner } from '@/lib/design-system/components'
import { Sparkles, CheckCircle, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react'
import { VISION_CATEGORIES, getVisionCategory, type VisionCategoryKey } from '@/lib/design-system/vision-categories'

interface CategoryState {
  key: VisionCategoryKey
  label: string
  status: 'pending' | 'waiting' | 'streaming' | 'complete' | 'error'
  text: string
  error?: string
}

export default function AssemblyPage() {
  const router = useRouter()
  const supabase = createClient()
  const activeCardRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isProcessingRef = useRef(false)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [vivaProgress, setVivaProgress] = useState(0)
  const [waitingStartTime, setWaitingStartTime] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [visionId, setVisionId] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryState[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isAssembling, setIsAssembling] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [perspective, setPerspective] = useState<'singular' | 'plural'>('singular')

  const categoryKeys = VISION_CATEGORIES
    .filter(c => c.order > 0 && c.order < 13)
    .map(c => c.key)
    .sort((a, b) => {
      const catA = getVisionCategory(a)
      const catB = getVisionCategory(b)
      return (catA?.order || 0) - (catB?.order || 0)
    })

  const completedCount = categories.filter(c => c.status === 'complete').length
  const hasErrors = categories.some(c => c.status === 'error')
  const allComplete = completedCount === 12

  // Load initial state
  useEffect(() => {
    loadInitialState()
    return () => {
      // Cleanup abort controller on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Poll for updates when processing (for background completion detection)
  useEffect(() => {
    if (!isProcessing && !allComplete) {
      // Poll every 5 seconds to detect background completions
      const interval = setInterval(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: categoryStates } = await supabase
          .from('vision_new_category_state')
          .select('category, category_vision_text')
          .eq('user_id', user.id)
          .in('category', categoryKeys)

        // Update any newly completed categories
        let hasUpdates = false
        setCategories(prev => prev.map(cat => {
          const state = categoryStates?.find(cs => cs.category === cat.key)
          if (state?.category_vision_text && cat.status !== 'complete') {
            hasUpdates = true
            return { ...cat, status: 'complete', text: state.category_vision_text }
          }
          return cat
        }))

        // If all complete and we weren't processing, check for vision
        if (hasUpdates) {
          const newCompleted = categoryStates?.filter(cs => cs.category_vision_text)?.length || 0
          if (newCompleted === 12) {
            const { data: vision } = await supabase
              .from('vision_versions')
              .select('id')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            if (vision) setVisionId(vision.id)
          }
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isProcessing, allComplete, categoryKeys])

  // Progress bar animation for waiting state
  useEffect(() => {
    if (waitingStartTime) {
      const estimatedDuration = 90000
      const interval = setInterval(() => {
        const elapsed = Date.now() - waitingStartTime
        const progress = Math.min((elapsed / estimatedDuration) * 95, 95)
        setVivaProgress(progress)
      }, 100)
      return () => clearInterval(interval)
    } else {
      setVivaProgress(0)
    }
  }, [waitingStartTime])

  // Scroll active card into view
  useEffect(() => {
    if (activeCardRef.current && currentIndex >= 0) {
      activeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentIndex])

  // Browser warning when processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing) {
        // Don't prevent - just warn. Processing continues in background!
        e.returnValue = 'Generation will continue in the background. You can return to see progress.'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isProcessing])

  const loadInitialState = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if in intensive mode
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        setIsIntensiveMode(true)
      }

      // Perspective defaults to 'singular' - user will select on page before assembly

      // Check for active batch (only pending/processing/retrying - not completed/failed/cancelled)
      const { data: batch } = await supabase
        .from('vision_generation_batches')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing', 'retrying'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (batch) setBatchId(batch.id)

      // Get all category texts
      const { data: categoryStates } = await supabase
        .from('vision_new_category_state')
        .select('category, clarity_keys, ideal_state, blueprint_data, category_vision_text, contrast_flips')
        .eq('user_id', user.id)
        .in('category', categoryKeys)

      // Get scenes count per category
      const { data: allScenes } = await supabase
        .from('scenes')
        .select('category')
        .eq('user_id', user.id)
        .in('category', categoryKeys)

      const scenesByCategory: Record<string, number> = {}
      allScenes?.forEach(scene => {
        scenesByCategory[scene.category] = (scenesByCategory[scene.category] || 0) + 1
      })

      // Check readiness for each category
      const readyCategories = categoryKeys.filter(key => {
        const state = categoryStates?.find(cs => cs.category === key)
        const hasClarity = state?.clarity_keys && Array.isArray(state.clarity_keys) && state.clarity_keys.length > 0
        const hasIdealState = state?.ideal_state && state.ideal_state.trim().length > 0
        const hasBlueprint = state?.blueprint_data && Object.keys(state.blueprint_data).length > 0
        const hasScenes = (scenesByCategory[key] || 0) > 0
        return hasClarity && hasIdealState && hasBlueprint && hasScenes
      })

      if (readyCategories.length < 12) {
        setError(`Please complete all 12 categories first. ${readyCategories.length} of 12 ready.`)
      }

      // Initialize categories with existing text
      const initialCategories: CategoryState[] = categoryKeys.map(key => {
        const category = getVisionCategory(key)
        const state = categoryStates?.find(cs => cs.category === key)
        const hasText = state?.category_vision_text && state.category_vision_text.length > 50
        
        let status: CategoryState['status'] = 'pending'
        if (hasText) {
          status = 'complete'
        } else if (batch?.status === 'processing' && batch.current_category === key) {
          status = 'waiting'
        } else if (batch?.categories_failed?.includes(key)) {
          status = 'error'
        }
        
        return {
          key,
          label: category?.label || key,
          status,
          text: state?.category_vision_text || ''
        }
      })
      setCategories(initialCategories)

      // Check for existing completed vision
      if (batch?.vision_id) {
        setVisionId(batch.vision_id)
      } else if (initialCategories.every(c => c.status === 'complete')) {
        const { data: existingVision } = await supabase
          .from('vision_versions')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (existingVision) {
          setVisionId(existingVision.id)
        }
      }

      // Auto-resume if batch is active
      if (batch && ['pending', 'processing', 'retrying'].includes(batch.status)) {
        const pendingCategories = initialCategories.filter(c => c.status === 'pending' || c.status === 'waiting')
        if (pendingCategories.length > 0 && !isProcessingRef.current) {
          setTimeout(() => processQueue(), 500)
        }
      }
    } catch (err) {
      console.error('Error loading initial state:', err)
      setError('Failed to load state')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelGeneration = async () => {
    console.log('[Assembly] Cancel generation requested')
    
    // Abort the fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Update batch status to cancelled
    if (batchId) {
      try {
        await supabase
          .from('vision_generation_batches')
          .update({ 
            status: 'cancelled', 
            error_message: 'Cancelled by user',
            completed_at: new Date().toISOString()
          })
          .eq('id', batchId)
      } catch (err) {
        console.error('[Assembly] Error updating batch status:', err)
      }
    }
    
    // Reset UI states - these will also be reset by processQueue's finally block
    // but we do it here immediately for better UX
    setIsProcessing(false)
    setIsAssembling(false)
    setCurrentIndex(-1)
    setWaitingStartTime(null)
    isProcessingRef.current = false
    
    // Reset any streaming/waiting categories back to pending
    setCategories(prev => prev.map(cat => 
      cat.status === 'streaming' || cat.status === 'waiting'
        ? { ...cat, status: 'pending', text: '', error: undefined }
        : cat
    ))
    
    console.log('[Assembly] Generation cancelled')
  }

  const processQueue = async () => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    setIsProcessing(true)
    setError(null)

    // Create new abort controller for this run
    abortControllerRef.current = new AbortController()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Create or get batch
      let currentBatchId = batchId
      if (!currentBatchId) {
        const { data: newBatch, error: batchError } = await supabase
          .from('vision_generation_batches')
          .insert({
            user_id: user.id,
            status: 'processing',
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (batchError) throw batchError
        currentBatchId = newBatch.id
        setBatchId(currentBatchId)
      } else {
        await supabase
          .from('vision_generation_batches')
          .update({ status: 'processing', started_at: new Date().toISOString() })
          .eq('id', currentBatchId)
      }

      // Get all category states and scenes
      const { data: categoryStates } = await supabase
        .from('vision_new_category_state')
        .select('*')
        .eq('user_id', user.id)
        .in('category', categoryKeys)

      const { data: allScenes } = await supabase
        .from('scenes')
        .select('*')
        .eq('user_id', user.id)
        .in('category', categoryKeys)

      // Group scenes by category
      const scenesByCategory: Record<string, any[]> = {}
      allScenes?.forEach(scene => {
        if (!scenesByCategory[scene.category]) {
          scenesByCategory[scene.category] = []
        }
        scenesByCategory[scene.category].push({
          title: scene.title,
          text: scene.text,
          essence_word: scene.essence_word
        })
      })

      const failedCategories: VisionCategoryKey[] = []

      // Process each category
      for (let i = 0; i < categoryKeys.length; i++) {
        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          console.log('[Assembly] Processing aborted')
          break
        }

        const categoryKey = categoryKeys[i]
        const state = categoryStates?.find(cs => cs.category === categoryKey)

        // Skip if already has text
        if (categories[i]?.status === 'complete' && categories[i]?.text) {
          continue
        }

        // Also check DB for fresh data (in case background completed)
        const { data: freshState } = await supabase
          .from('vision_new_category_state')
          .select('category_vision_text')
          .eq('user_id', user.id)
          .eq('category', categoryKey)
          .maybeSingle()

        if (freshState?.category_vision_text && freshState.category_vision_text.length > 50) {
          setCategories(prev => prev.map((c, idx) => 
            idx === i ? { ...c, status: 'complete', text: freshState.category_vision_text } : c
          ))
          continue
        }

        setCurrentIndex(i)
        
        // Update batch current_category
        await supabase
          .from('vision_generation_batches')
          .update({ current_category: categoryKey })
          .eq('id', currentBatchId)

        // Set to waiting
        setCategories(prev => prev.map((c, idx) => 
          idx === i ? { ...c, status: 'waiting', text: '' } : c
        ))
        setWaitingStartTime(Date.now())
        setVivaProgress(0)

        try {
          // Fire off the request - use fire-and-forget pattern but also stream if page stays open
          const response = await fetch('/api/viva/category-vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryKey,
              idealStateText: state?.ideal_state || '',
              clarityPresentStateText: state?.clarity_keys?.[0] || '',
              contrastFlips: state?.contrast_flips || [],
              scenes: scenesByCategory[categoryKey] || [],
              blueprintData: state?.blueprint_data || null,
              transcript: state?.transcript || '',
              perspective
            }),
            signal: abortControllerRef.current?.signal
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `HTTP ${response.status}`)
          }

          // Switch to streaming state
          setCategories(prev => prev.map((c, idx) => 
            idx === i ? { ...c, status: 'streaming' } : c
          ))
          setWaitingStartTime(null)
          setVivaProgress(100)

          // Read the streaming response
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let fullText = ''

          if (reader) {
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                
                const chunk = decoder.decode(value, { stream: true })
                fullText += chunk
                
                setCategories(prev => prev.map((c, idx) => 
                  idx === i ? { ...c, text: fullText } : c
                ))
              }
            } catch (readError) {
              // Stream reading interrupted (user navigated away) - that's OK!
              // The API will still complete and save via onFinish
              console.log(`[Assembly] Stream interrupted for ${categoryKey}, API will complete in background`)
            }
          }

          // Mark complete if we got text
          if (fullText && fullText.trim().length > 50) {
            setCategories(prev => prev.map((c, idx) => 
              idx === i ? { ...c, status: 'complete', text: fullText } : c
            ))
            
            // Update batch progress
            const currentCompleted = categories.filter(c => c.status === 'complete').map(c => c.key)
            await supabase
              .from('vision_generation_batches')
              .update({ 
                categories_completed: [...currentCompleted, categoryKey],
                current_category: null
              })
              .eq('id', currentBatchId)
          } else {
            // If no text, poll DB to see if it completed in background
            await new Promise(resolve => setTimeout(resolve, 2000))
            const { data: checkState } = await supabase
              .from('vision_new_category_state')
              .select('category_vision_text')
              .eq('user_id', user.id)
              .eq('category', categoryKey)
              .maybeSingle()

            if (checkState?.category_vision_text && checkState.category_vision_text.length > 50) {
              setCategories(prev => prev.map((c, idx) => 
                idx === i ? { ...c, status: 'complete', text: checkState.category_vision_text } : c
              ))
            } else {
              throw new Error('Generated text too short')
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.log(`[Assembly] Aborted ${categoryKey}`)
            break
          }
          console.error(`Error processing ${categoryKey}:`, err)
          setWaitingStartTime(null)
          failedCategories.push(categoryKey)
          setCategories(prev => prev.map((c, idx) => 
            idx === i ? { ...c, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' } : c
          ))
          
          // Update batch with failure but continue
          await supabase
            .from('vision_generation_batches')
            .update({ 
              categories_failed: failedCategories,
              current_category: null
            })
            .eq('id', currentBatchId)
        }
      }

      // Retry failed categories once
      if (failedCategories.length > 0 && !abortControllerRef.current?.signal.aborted) {
        console.log(`Retrying ${failedCategories.length} failed categories...`)
        for (const categoryKey of [...failedCategories]) {
          if (abortControllerRef.current?.signal.aborted) break

          const i = categoryKeys.indexOf(categoryKey)
          const state = categoryStates?.find(cs => cs.category === categoryKey)

          setCurrentIndex(i)
          setCategories(prev => prev.map((c, idx) => 
            idx === i ? { ...c, status: 'waiting', error: undefined } : c
          ))
          setWaitingStartTime(Date.now())

          try {
            const response = await fetch('/api/viva/category-vision', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                categoryKey,
                idealStateText: state?.ideal_state || '',
                clarityPresentStateText: state?.clarity_keys?.[0] || '',
                contrastFlips: state?.contrast_flips || [],
                scenes: scenesByCategory[categoryKey] || [],
                blueprintData: state?.blueprint_data || null,
                transcript: state?.transcript || '',
                perspective
              }),
              signal: abortControllerRef.current?.signal
            })

            if (response.ok) {
              setCategories(prev => prev.map((c, idx) => 
                idx === i ? { ...c, status: 'streaming' } : c
              ))
              setWaitingStartTime(null)

              const reader = response.body?.getReader()
              const decoder = new TextDecoder()
              let fullText = ''

              if (reader) {
                try {
                  while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    fullText += decoder.decode(value, { stream: true })
                    setCategories(prev => prev.map((c, idx) => 
                      idx === i ? { ...c, text: fullText } : c
                    ))
                  }
                } catch (e) {
                  console.log(`[Assembly] Retry stream interrupted for ${categoryKey}`)
                }
              }

              if (fullText && fullText.length > 50) {
                setCategories(prev => prev.map((c, idx) => 
                  idx === i ? { ...c, status: 'complete', text: fullText } : c
                ))
                const idx = failedCategories.indexOf(categoryKey)
                if (idx > -1) failedCategories.splice(idx, 1)
              }
            }
          } catch (retryErr: any) {
            if (retryErr.name === 'AbortError') break
            console.error(`Retry failed for ${categoryKey}:`, retryErr)
          }
        }
      }

      // Assemble final vision if not aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setIsAssembling(true)
        setCurrentIndex(-1)
        setWaitingStartTime(null)

        const response = await fetch('/api/viva/assemble-vision-from-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ perspective })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to assemble vision')
        }

        const data = await response.json()
        
        if (data.visionId) {
          setVisionId(data.visionId)
          
          const finalStatus = failedCategories.length > 0 ? 'partial_success' : 'completed'
          await supabase
            .from('vision_generation_batches')
            .update({
              status: finalStatus,
              vision_id: data.visionId,
              completed_at: new Date().toISOString()
            })
            .eq('id', currentBatchId)

          // Mark intensive step if in intensive mode
          if (isIntensiveMode) {
            const { markIntensiveStep } = await import('@/lib/intensive/checklist')
            const success = await markIntensiveStep('vision_built')
            if (success) {
              // Redirect to dashboard to show progress
              router.push('/intensive/dashboard')
              return
            }
          }
        }
      }

    } catch (err: any) {
      // Check if this was an abort (either AbortError or abort controller signal)
      const isAborted = err?.name === 'AbortError' || 
                        abortControllerRef.current?.signal.aborted ||
                        !isProcessingRef.current // If we're no longer processing, it was cancelled
      
      if (isAborted) {
        console.log('[Assembly] Processing aborted by user')
        // Batch status is already updated by handleCancelGeneration
        // Reset any streaming/waiting categories
        setCategories(prev => prev.map(cat => 
          cat.status === 'streaming' || cat.status === 'waiting'
            ? { ...cat, status: 'pending', text: '', error: undefined }
            : cat
        ))
      } else {
        console.error('Queue processing error:', err)
        setError(err instanceof Error ? err.message : 'Failed to process queue')
        
        // Reset waiting/streaming categories on error too
        setCategories(prev => prev.map(cat => 
          cat.status === 'streaming' || cat.status === 'waiting'
            ? { ...cat, status: 'error', error: err instanceof Error ? err.message : 'Generation failed' }
            : cat
        ))
        
        if (batchId) {
          await supabase
            .from('vision_generation_batches')
            .update({ status: 'failed', error_message: err instanceof Error ? err.message : 'Unknown error' })
            .eq('id', batchId)
        }
      }
    } finally {
      setIsProcessing(false)
      setIsAssembling(false)
      setCurrentIndex(-1)
      setWaitingStartTime(null)
      isProcessingRef.current = false
    }
  }

  const handleViewVision = () => {
    if (visionId) {
      router.push(`/life-vision/${visionId}`)
    }
  }

  const clearAndRegenerate = async () => {
    setIsLoading(true)
    // Abort any in-progress processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('vision_new_category_state')
        .update({ category_vision_text: null })
        .eq('user_id', user.id)
        .in('category', categoryKeys)

      if (batchId) {
        await supabase
          .from('vision_generation_batches')
          .update({ status: 'failed', error_message: 'Cancelled by user' })
          .eq('id', batchId)
      }

      setBatchId(null)
      setVisionId(null)
      setCategories(categoryKeys.map(key => ({
        key,
        label: getVisionCategory(key)?.label || key,
        status: 'pending',
        text: ''
      })))
      setError(null)
    } catch (err) {
      console.error('Error clearing:', err)
      setError('Failed to clear')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePerspectiveChange = (newPerspective: 'singular' | 'plural') => {
    setPerspective(newPerspective)
    // Perspective will be saved to vision_versions when assembly completes
  }

  const waitingMessages = [
    "Evaluating your clarity and present state...",
    "Analyzing your imagination text...",
    "Reviewing your contrast flips...",
    "Applying the 5-Phase Vision Flow...",
    "Crafting your Life I Choose text...",
    "Polishing your authentic voice..."
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" variant="branded" />
      </div>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title="Your Life Vision Document"
          subtitle="Watch as VIVA crafts each category. Processing continues even if you leave."
        >
          <div className="flex justify-center gap-3 flex-wrap">
            <Badge variant={isProcessing ? "accent" : allComplete ? "success" : "neutral"}>
              {isProcessing ? (
                <>
                  <Spinner size="sm" variant="branded" className="mr-2" />
                  Generating {completedCount + 1} of 12
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {completedCount} of 12 Complete
                </>
              )}
            </Badge>
            {isProcessing && (
              <Badge variant="primary">
                <Sparkles className="w-4 h-4 mr-2" />
                Continues in background
              </Badge>
            )}
          </div>
        </PageHero>

        {/* Perspective Toggle */}
        {!allComplete && !isProcessing && completedCount === 0 && (
          <Card className="border-neutral-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-medium mb-1">Vision Perspective</h3>
                <p className="text-sm text-neutral-400">Choose how your vision will be written</p>
              </div>
              <Toggle
                options={[
                  { value: 'singular', label: 'I / Me' },
                  { value: 'plural', label: 'We / Our' }
                ]}
                value={perspective}
                onChange={(val) => handlePerspectiveChange(val as 'singular' | 'plural')}
                size="sm"
              />
            </div>
          </Card>
        )}

        {/* Start / Cancel Buttons */}
        {!allComplete && categories.length === 12 && !hasErrors && !visionId && (
          <div className="flex justify-center gap-4">
            {!isProcessing ? (
              <Button variant="primary" size="lg" onClick={processQueue}>
                <Sparkles className="w-5 h-5 mr-2" />
                {completedCount > 0 ? 'Continue Generation' : 'Start Vision Generation'}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleCancelGeneration}
              >
                <AlertCircle className="w-5 h-5 mr-2" />
                Cancel Generation
              </Button>
            )}
          </div>
        )}

{/* VIVALoadingOverlay is now inside each category card */}

        {/* Assembling State */}
        {isAssembling && (
          <Card className="border-2 border-accent-500/50 bg-gradient-to-r from-accent-500/10 to-primary-500/10">
            <div className="flex items-center gap-4 py-4">
              <Spinner size="lg" variant="branded" />
              <div>
                <div className="text-lg font-semibold text-white">Assembling Your Complete Vision...</div>
                <div className="text-sm text-neutral-400">Combining all 12 categories</div>
              </div>
            </div>
          </Card>
        )}

        {/* Category Sections */}
        {categories.length > 0 && (
          <div className="space-y-6">
            {categories.map((cat, idx) => {
              const categoryData = getVisionCategory(cat.key)
              const IconComponent = categoryData?.icon || Sparkles
              const isActive = idx === currentIndex
              
              return (
                <div
                  key={cat.key}
                  ref={isActive ? activeCardRef : undefined}
                  className={`transition-all duration-500 ${isActive ? 'scale-[1.01]' : ''}`}
                >
                  <Card className={`
                    relative overflow-hidden
                    ${cat.status === 'complete' ? 'border-primary-500/30' 
                      : cat.status === 'streaming' ? 'border-secondary-500/50 shadow-lg shadow-secondary-500/20'
                      : cat.status === 'waiting' ? 'border-accent-500/50 shadow-lg shadow-accent-500/20'
                      : cat.status === 'error' ? 'border-red-500/50'
                      : 'border-neutral-700/50 opacity-60'}
                  `}>
                    {/* VIVA Loading Overlay - covers entire card */}
                    {cat.status === 'waiting' && (
                      <VIVALoadingOverlay
                        isVisible={true}
                        messages={waitingMessages}
                        cycleDuration={10000}
                        estimatedTime="This usually takes 60-90 seconds"
                        estimatedDuration={90000}
                        progress={vivaProgress}
                        size="md"
                      />
                    )}
                    
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-700/50">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                        ${cat.status === 'complete' ? 'bg-primary-500/20' 
                          : cat.status === 'streaming' || cat.status === 'waiting' ? 'bg-secondary-500/20'
                          : cat.status === 'error' ? 'bg-red-500/20' : 'bg-neutral-800'}
                      `}>
                        {cat.status === 'complete' ? <CheckCircle className="w-5 h-5 text-primary-500" />
                          : cat.status === 'streaming' || cat.status === 'waiting' ? <Spinner size="sm" variant="branded" />
                          : cat.status === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" />
                          : <IconComponent className="w-5 h-5 text-neutral-500" />}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${cat.status === 'pending' ? 'text-neutral-400' : 'text-white'}`}>
                          {cat.label}
                        </h3>
                        {cat.status === 'streaming' && <span className="text-xs text-secondary-400">Writing...</span>}
                        {cat.status === 'waiting' && <span className="text-xs text-accent-400">Preparing...</span>}
                        {cat.status === 'complete' && cat.text && <span className="text-xs text-neutral-500">{cat.text.length.toLocaleString()} characters</span>}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-h-[100px]">
                      {/* Streaming / Complete - Show Text */}
                      {(cat.status === 'streaming' || cat.status === 'complete') && cat.text && (
                        <p className="text-neutral-200 whitespace-pre-wrap leading-relaxed">
                          {cat.text}
                          {cat.status === 'streaming' && <span className="inline-block w-2 h-4 bg-secondary-500 animate-pulse ml-0.5" />}
                        </p>
                      )}
                      
                      {/* Pending State */}
                      {cat.status === 'pending' && (
                        <div className="text-center py-8 text-neutral-500 text-sm">
                          Waiting to generate...
                        </div>
                      )}
                      
                      {/* Error State */}
                      {cat.status === 'error' && (
                        <div className="text-center py-8">
                          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <div className="text-red-400 text-sm">{cat.error || 'Failed - will retry'}</div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>
        )}

        {/* Bottom Action Card */}
        {!isProcessing && categories.length === 12 && (allComplete || hasErrors || visionId) && (
          <Card className={`border-2 ${visionId ? 'border-primary-500/30 bg-gradient-to-br from-primary-500/10 to-secondary-500/5' : 'border-neutral-700'}`}>
            <div className="text-center py-6">
              {visionId && (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Your Life Vision is Complete!</h2>
                  <p className="text-neutral-300 mb-8 max-w-xl mx-auto">All 12 categories assembled into your Life Vision Document.</p>
                </>
              )}
              {hasErrors && !visionId && (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Generation Interrupted</h2>
                  <p className="text-neutral-300 mb-8">Some categories failed. Reset and try again.</p>
                </>
              )}
              <div className="flex justify-center gap-4 flex-wrap">
                <Button variant="outline" size="lg" onClick={clearAndRegenerate} disabled={isLoading}>
                  <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Clearing...' : 'Reset & Start Fresh'}
                </Button>
                {visionId && (
                  <Button variant="primary" size="lg" onClick={handleViewVision}>
                    View My Vision
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {error && (
          <Card className="border-red-500/50 bg-red-500/10">
            <p className="text-red-400">{error}</p>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
