'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, 
  MessageCircle, 
  Send,
  Copy,
  Check,
  ArrowLeft,
  Bot,
  User,
  Wand2,
  Brain,
  Target
} from 'lucide-react'
import { 
  Card, 
  Button, 
  Badge, 
  Spinner,
  Textarea,
  Icon
} from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'

interface VisionData {
  id: string
  user_id: string
  forward: string
  fun: string
  travel: string
  home: string
  family: string
  romance: string
  health: string
  money: string
  business: string
  social: string
  possessions: string
  giving: string
  spirituality: string
  conclusion: string
  status: 'draft' | 'complete' | string
  completion_percent: number
  created_at: string
  updated_at: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ExperimentPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [vision, setVision] = useState<VisionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentRefinement, setCurrentRefinement] = useState('')
  const [showCopyPrompt, setShowCopyPrompt] = useState(false)
  const [lastVivaResponse, setLastVivaResponse] = useState('')
  const [conversationPhase, setConversationPhase] = useState<'initial' | 'exploring' | 'refining' | 'finalizing'>('initial')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // Load user's vision when component mounts
  useEffect(() => {
    loadUserVision()
  }, [])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const loadUserVision = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No authenticated user found')
        return
      }

      // First try to get a complete vision
      let { data, error } = await supabase
        .from('life_visions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'complete')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      // If no complete vision, try to get any vision (including draft)
      if (error && error.code === 'PGRST116') {
        console.log('No complete vision found, trying to get any vision...')
        const { data: draftData, error: draftError } = await supabase
          .from('life_visions')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        if (draftError) {
          console.log('No vision found at all:', draftError.message)
          return
        }
        
        data = draftData
        error = null
      }

      if (error) {
        console.log('Error loading vision:', error.message)
        return
      }

      if (data) {
        setVision(data)
        console.log('Vision loaded successfully')
      }
    } catch (error) {
      console.log('Unexpected error loading vision:', error)
    }
  }

  const getCategoryValue = (category: string) => {
    if (!vision) return ''
    return vision[category as keyof VisionData] as string || ''
  }

  const startConversation = () => {
    if (!selectedCategory || !vision) return

    const categoryValue = getCategoryValue(selectedCategory)
    const categoryInfo = VISION_CATEGORIES.find(cat => cat.key === selectedCategory)
    
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Hello! I'm VIVA, your intelligent vision refinement assistant. I see you want to work on your **${categoryInfo?.label}** vision.

Your current vision for this area is:
"${categoryValue}"

Let me help you refine this vision through a thoughtful conversation. I'll ask you questions to help you dive deeper and create a more powerful, specific vision.

What aspects of your ${categoryInfo?.label.toLowerCase()} vision feel most important to you right now?`,
      timestamp: new Date()
    }

    setChatMessages([initialMessage])
    setConversationPhase('exploring')
  }

  const sendMessage = async () => {
    if (!currentMessage.trim() || !selectedCategory) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsTyping(true)

    // Simulate AI response (in real implementation, this would call your AI API)
    setTimeout(() => {
      const aiResponse = generateAIResponse(currentMessage, conversationPhase)
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, assistantMessage])
      setLastVivaResponse(aiResponse.content)
      setConversationPhase(aiResponse.nextPhase)
      setIsTyping(false)

      // Show copy prompt if we're in finalizing phase
      if (aiResponse.nextPhase === 'finalizing') {
        setShowCopyPrompt(true)
      }
    }, 1500)
  }

  const generateAIResponse = (userMessage: string, phase: string) => {
    const responses = {
      exploring: {
        content: `That's a great insight! I can see how ${userMessage.toLowerCase()} connects to your vision. 

Let me ask you this: When you imagine achieving this vision, what specific feelings do you want to experience? How will you know you've truly actualized this vision in your life?

The more specific and emotionally connected we can make your vision, the more powerful it becomes.`,
        nextPhase: 'refining' as const
      },
      refining: {
        content: `Beautiful! I can feel the energy in what you're describing. 

Based on our conversation, here's a refined version of your vision:

**Refined Vision:**
"${userMessage}"

This refined vision is more specific, emotionally connected, and actionable than your original. It captures the essence of what you truly want to actualize.

Would you like me to copy this refined vision to your current refinement? You can always edit it further after I copy it over.`,
        nextPhase: 'finalizing' as const
      },
      finalizing: {
        content: `Perfect! I've copied the refined vision to your current refinement. You can now edit it further if you'd like, or move on to refine another category.

Remember, this is your vision - make it yours! The refinement process is about making it more powerful and aligned with your true desires.

Would you like to refine another category, or are you satisfied with this refinement?`,
        nextPhase: 'initial' as const
      }
    }

    return responses[phase as keyof typeof responses] || responses.exploring
  }

  const copyToRefinement = () => {
    setCurrentRefinement(lastVivaResponse)
    setShowCopyPrompt(false)
  }

  const CategoryCard = ({ category }: { category: any }) => {
    const isSelected = selectedCategory === category.key
    const categoryValue = getCategoryValue(category.key)
    
    return (
      <Card 
        variant="outlined"
        hover
        className={`cursor-pointer transition-all duration-300 ${
          isSelected 
            ? 'border-primary-500 bg-primary-500/10 shadow-lg' 
            : 'hover:border-primary-500/50'
        }`}
        onClick={() => setSelectedCategory(category.key)}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isSelected ? 'bg-primary-500' : 'bg-neutral-700'
            }`}>
              <category.icon className={`w-6 h-6 ${
                isSelected ? 'text-white' : 'text-neutral-400'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${
                isSelected ? 'text-primary-300' : 'text-white'
              }`}>
                {category.label}
              </h3>
              <p className="text-sm text-neutral-400">
                {category.description}
              </p>
            </div>
            {isSelected && (
              <Badge variant="success" className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                Selected
              </Badge>
            )}
          </div>
          
          {categoryValue && (
            <div className="mt-3 p-3 bg-neutral-800/50 rounded-lg">
              <p className="text-sm text-neutral-300 line-clamp-2">
                "{categoryValue}"
              </p>
            </div>
          )}
        </div>
      </Card>
    )
  }

  const ChatInterface = () => (
    <div className="space-y-6">
      {/* Current Vision & Refinement Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-400" />
            Current Vision
          </h3>
          <div className="bg-neutral-800/50 p-4 rounded-lg">
            <p className="text-neutral-300 text-sm">
              "{getCategoryValue(selectedCategory!)}"
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            Current Refinement
          </h3>
          <Textarea
            value={currentRefinement}
            onChange={(e) => setCurrentRefinement(e.target.value)}
            placeholder="Your refined vision will appear here..."
            className="min-h-[100px] bg-neutral-800/50 border-neutral-600"
          />
        </Card>
      </div>

      {/* Chat Interface */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">VIVA Assistant</h3>
            <p className="text-sm text-neutral-400">Intelligent Vision Refinement</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-800 text-neutral-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-neutral-800 p-4 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex gap-3">
          <Textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Type your response..."
            className="flex-1 bg-neutral-800/50 border-neutral-600"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isTyping}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Copy Prompt */}
        {showCopyPrompt && (
          <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">
                  Ready to copy this refinement to your current refinement?
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCopyPrompt(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={copyToRefinement}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy to Refinement
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )

  return (
    <div className="py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Intelligent Refinement</h1>
            <Badge variant="premium" className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              VIVA AI
            </Badge>
          </div>
          <p className="text-neutral-400 text-lg">
            Select a category and let VIVA help you refine your vision through intelligent conversation
          </p>
        </div>

        {/* Category Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Choose a Category to Refine</h2>
          
          {!vision ? (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Vision Found</h3>
              <p className="text-neutral-400 mb-6">
                You need to create a life vision first before you can refine it. 
                VIVA can help you create a powerful vision from scratch.
              </p>
              <Button
                onClick={() => router.push('/life-vision/new')}
                variant="primary"
                size="lg"
                className="flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Create Your Life Vision
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {VISION_CATEGORIES.map((category) => (
                <CategoryCard key={category.key} category={category} />
              ))}
            </div>
          )}
        </div>

        {/* Chat Interface */}
        {selectedCategory && vision && (
          <div className="space-y-6">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Ready to Start?</h3>
                <p className="text-neutral-400 mb-6">
                  VIVA will help you refine your {VISION_CATEGORIES.find(cat => cat.key === selectedCategory)?.label.toLowerCase()} vision through intelligent conversation.
                </p>
                <Button
                  onClick={startConversation}
                  variant="primary"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Start Conversation with VIVA
                </Button>
              </div>
            ) : (
              <ChatInterface />
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push('/life-vision')}
            variant="outline"
            className="flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Life Vision
          </Button>
        </div>
      </div>
  )
}