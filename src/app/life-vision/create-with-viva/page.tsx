"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, PageLayout, Button } from '@/lib/design-system/components'
import { CategoryProgress } from '@/components/vision/CategoryProgress'
import { PathSelector } from '@/components/vision/PathSelector'
import { ChatInterface } from '@/components/vision/ChatInterface'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// 12 life categories
const LIFE_CATEGORIES = [
  'Health & Vitality',
  'Relationships',
  'Career & Purpose',
  'Financial Freedom',
  'Personal Growth',
  'Family',
  'Social Life',
  'Recreation & Fun',
  'Physical Environment',
  'Spirituality',
  'Contribution',
  'Creativity & Expression'
]

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  emotion_score?: number
}

export default function VisionCreateWithAIPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [visionId, setVisionId] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)

  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<{
    categories_completed: string[]
    current_category: string | null
    total_categories: number
  } | null>(null)
  
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)
  const [pathChosen, setPathChosen] = useState<'clarity' | 'contrast' | 'discovery' | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessage, setIsLoadingMessage] = useState(false)
  const [vibrationalState, setVibrationalState] = useState<'above_green_line' | 'below_green_line' | 'neutral'>('neutral')

  // Initialize: Create new vision on mount
  useEffect(() => {
    initializeVision()
  }, [])

  // Load progress and determine current category
  useEffect(() => {
    if (visionId) {
      loadProgress()
    }
  }, [visionId])
  
  const initializeVision = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get the next version number for this user
      const { data: existingVisions } = await supabase
        .from('vision_versions')
        .select('version_number')
        .eq('user_id', user.id)
        .order('version_number', { ascending: false })
        .limit(1)

      const nextVersionNumber = existingVisions && existingVisions.length > 0 
        ? (existingVisions[0].version_number || 0) + 1 
        : 1

      console.log('Creating vision with version number:', nextVersionNumber)

      // Create a new blank vision for AI conversation
      const { data: newVision, error } = await supabase
        .from('vision_versions')
        .insert({
          user_id: user.id,
          version_number: nextVersionNumber,
          category: 'viva-created',
          is_active: false,
          ai_generated: true,
          // Initialize with empty sections for all 12 categories
          forward: '',
          fun: '',
          travel: '',
          home: '',
          family: '',
          romance: '',
          health: '',
          money: '',
          business: '',
          social: '',
          possessions: '',
          giving: '',
          spirituality: '',
          conclusion: ''
        })
        .select()
        .single()

      if (error) {
        console.error('Vision creation FAILED')
        console.error('Error message:', error.message || 'No message')
        console.error('Error code:', error.code || 'No code')
        console.error('Error details:', error.details || 'No details')
        console.error('Error hint:', error.hint || 'No hint')
        console.error('Full error object:', JSON.stringify(error, null, 2))
        throw error
      }

      if (!newVision) {
        console.error('No vision returned from insert')
        throw new Error('Failed to create vision - no data returned')
      }

      console.log('Vision created successfully:', newVision.id)
      setVisionId(newVision.id)
    } catch (error) {
      console.error('Error initializing vision:', error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', error ? Object.keys(error) : 'null')
      
      // Show user-friendly error
      alert('Unable to create vision. Please try again or contact support if the issue persists.')
      router.push('/life-vision')
    } finally {
      setInitializing(false)
    }
  }

  // Load conversation when category is selected
  useEffect(() => {
    if (currentCategory) {
      loadConversation()
    }
  }, [currentCategory])

  const loadProgress = async () => {
    try {
      const response = await fetch(`/api/vision/progress?vision_id=${visionId}`)
      const data = await response.json()
      
      if (data.progress) {
        setProgress(data.progress)
        
        // Determine next category to work on
        const completedCategories = data.progress.categories_completed || []
        const nextCategory = LIFE_CATEGORIES.find(cat => !completedCategories.includes(cat))
        
        if (nextCategory) {
          setCurrentCategory(nextCategory)
        } else if (completedCategories.length === LIFE_CATEGORIES.length) {
          // All categories complete
          router.push(`/vision/review/${visionId}`)
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConversation = async () => {
    if (!currentCategory) return

    try {
      const response = await fetch(`/api/vision/conversation?vision_id=${visionId}&category=${encodeURIComponent(currentCategory)}`)
      const data = await response.json()
      
      if (data.conversation) {
        setMessages(data.conversation.messages || [])
        setPathChosen(data.conversation.path_chosen)
        setVibrationalState(data.conversation.vibrational_state || 'neutral')
      } else {
        // No existing conversation, start fresh
        setMessages([])
        setPathChosen(null)
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const handlePathSelection = async (path: 'clarity' | 'contrast' | 'discovery') => {
    setPathChosen(path)
    
    // Save path choice to database
    await fetch('/api/vision/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vision_id: visionId,
        category: currentCategory,
        path_chosen: path,
        messages: []
      })
    })

    // Update progress with current category
    await fetch('/api/vision/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vision_id: visionId,
        current_category: currentCategory
      })
    })

    // Start conversation with AI based on path
    await startConversation(path)
  }

  const startConversation = async (path: 'clarity' | 'contrast' | 'discovery') => {
    setIsLoadingMessage(true)
    
    try {
      // Call OpenAI to start the conversation
      const response = await fetch('/api/vision/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision_id: visionId,
          category: currentCategory,
          path: path,
          messages: [],
          action: 'start'
        })
      })

      const data = await response.json()
      
      if (data.message) {
        const newMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
          emotion_score: data.emotion_score
        }
        
        setMessages([newMessage])
        
        // Save to database
        await saveConversation([newMessage])
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
    } finally {
      setIsLoadingMessage(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoadingMessage(true)

    try {
      // Call AI to get response
      const response = await fetch('/api/vision/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision_id: visionId,
          category: currentCategory,
          path: pathChosen,
          messages: updatedMessages,
          action: 'continue'
        })
      })

      const data = await response.json()
      
      if (data.message) {
        const aiMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
          emotion_score: data.emotion_score
        }
        
        const finalMessages = [...updatedMessages, aiMessage]
        setMessages(finalMessages)
        
        // Update vibrational state
        if (data.vibrational_state) {
          setVibrationalState(data.vibrational_state)
        }

        // Save conversation
        await saveConversation(finalMessages, data.vibrational_state, data.emotion_score)

        // Check if vision should be generated
        if (data.generate_vision && data.vibrational_state === 'above_green_line') {
          await generateVision(finalMessages)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoadingMessage(false)
    }
  }

  const saveConversation = async (
    msgs: Message[], 
    vibState?: string, 
    emotionScore?: number
  ) => {
    await fetch('/api/vision/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vision_id: visionId,
        category: currentCategory,
        path_chosen: pathChosen,
        messages: msgs,
        vibrational_state: vibState,
        final_emotion_score: emotionScore
      })
    })
  }

  const generateVision = async (conversationMessages: Message[]) => {
    try {
      const response = await fetch('/api/vision/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision_id: visionId,
          category: currentCategory,
          conversation_messages: conversationMessages,
          vibrational_state: vibrationalState
        })
      })

      const data = await response.json()
      
      if (data.vision) {
        // Mark conversation as completed
        await saveConversation(conversationMessages, vibrationalState, undefined)
        await fetch('/api/vision/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vision_id: visionId,
            category: currentCategory,
            completed: true
          })
        })

        // Reload progress and move to next category
        await loadProgress()
      }
    } catch (error) {
      console.error('Error generating vision:', error)
    }
  }

  const handleSkipCategory = () => {
    // Move to next category
    const completedCategories = progress?.categories_completed || []
    const nextCategory = LIFE_CATEGORIES.find(cat => 
      cat !== currentCategory && !completedCategories.includes(cat)
    )
    
    if (nextCategory) {
      setCurrentCategory(nextCategory)
      setPathChosen(null)
      setMessages([])
    }
  }

  if (initializing || loading) {
    return (
      <PageLayout>
        <Container className="py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#8B5CF6] flex items-center justify-center animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Viva is Getting Ready</h2>
              <p className="text-neutral-400">Preparing your vision creation journey...</p>
            </div>
          </div>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Container size="xl" className="py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push('/life-vision')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Visions
            </Button>
            <h1 className="text-3xl font-bold text-white mt-4">Create with Viva</h1>
            <p className="text-neutral-400 mt-2">Your personal Vibe Assistant will guide you through creating your complete life vision</p>
          </div>
          <Button
            variant="outline"
            onClick={handleSkipCategory}
            disabled={!currentCategory}
          >
            Skip Category
          </Button>
        </div>

        {/* Progress tracker */}
        {progress && (
          <CategoryProgress
            totalCategories={LIFE_CATEGORIES.length}
            completedCategories={progress.categories_completed || []}
            currentCategory={currentCategory || ''}
            allCategories={LIFE_CATEGORIES}
          />
        )}

        {/* Main content */}
        <div className="max-w-4xl mx-auto">
          {currentCategory && !pathChosen ? (
            <PathSelector
              category={currentCategory}
              onSelectPath={handlePathSelection}
            />
          ) : currentCategory && pathChosen ? (
            <div className="min-h-[600px]">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoadingMessage}
                category={currentCategory}
                vibrationalState={vibrationalState}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-400">
                All categories completed! Redirecting to review...
              </p>
            </div>
          )}
        </div>
      </Container>
    </PageLayout>
  )
}
