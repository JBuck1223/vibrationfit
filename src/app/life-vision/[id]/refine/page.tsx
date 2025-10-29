'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Sparkles, 
  MessageCircle, 
  Send,
  Copy, 
  Check,
  Bot,
  User,
  Wand2,
  Brain,
  Target,
  Zap,
  Save,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { 
  PageLayout, 
  Card, 
  Button, 
  Badge, 
  Spinner,
  Textarea,
  AutoResizeTextarea,
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
  love: string
  health: string
  money: string
  work: string
  social: string
  stuff: string
  giving: string
  spirituality: string
  conclusion: string
  status: 'draft' | 'complete' | string
  completion_percent: number
  version_number: number
  created_at: string
  updated_at: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// CategoryCard component moved outside to prevent re-creation on every render
const CategoryCard = ({ category, selected, onClick, className = '' }: { 
  category: any, 
  selected: boolean, 
  onClick: () => void, 
  className?: string 
}) => {
  const IconComponent = category.icon
  return (
    <Card 
      variant="outlined" 
      hover 
      className={`cursor-pointer aspect-square transition-all duration-300 ${selected ? 'border border-primary-500' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-2 p-2 justify-center h-full">
        <Icon icon={IconComponent} size="sm" color={selected ? '#39FF14' : '#14B8A6'} />
        <span className="text-xs font-medium text-center leading-tight text-neutral-300 break-words hyphens-auto">
          {category.label}
        </span>
      </div>
    </Card>
  )
}

// ChatInterface component moved outside to prevent re-creation on every render
const ChatInterface = ({ 
  chatMessages, 
  isTyping, 
  chatEndRef, 
  currentMessage, 
  setCurrentMessage, 
  sendMessage, 
  showCopyPrompt, 
  setShowCopyPrompt, 
  copyToRefinement 
}: { 
  chatMessages: ChatMessage[], 
  isTyping: boolean, 
  chatEndRef: React.RefObject<HTMLDivElement | null>, 
  currentMessage: string, 
  setCurrentMessage: (value: string) => void, 
  sendMessage: () => void, 
  showCopyPrompt: boolean, 
  setShowCopyPrompt: (value: boolean) => void, 
  copyToRefinement: () => void 
}) => (
  <div className="space-y-6">
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
          key="viva-input"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder="Type your response..."
          className="flex-1 bg-neutral-800/50 border-neutral-600"
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

export default function VisionRefinementPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [vision, setVision] = useState<VisionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentRefinement, setCurrentRefinement] = useState('')
  const [showCopyPrompt, setShowCopyPrompt] = useState(false)
  const [lastVivaResponse, setLastVivaResponse] = useState('')
  const [conversationPhase, setConversationPhase] = useState<'initial' | 'exploring' | 'refining' | 'finalizing'>('initial')
  const [draftStatus, setDraftStatus] = useState<'none' | 'draft' | 'committed'>('none')
  const [isDraftSaving, setIsDraftSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [allDrafts, setAllDrafts] = useState<any[]>([])
  const [showAllDrafts, setShowAllDrafts] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [visionId, setVisionId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<string | null>(null)
  const [showCurrentVision, setShowCurrentVision] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // Load all drafts for this vision
  const loadAllDrafts = useCallback(async () => {
    if (!user || !visionId) {
      console.log('Skipping loadAllDrafts - missing user or visionId:', { user: !!user, visionId })
      return
    }

    try {
      console.log('Loading drafts for user:', user.id, 'vision:', visionId)
      
      // First, let's check if the refinements table exists and what columns it has
      const { data, error } = await supabase
        .from('refinements')
        .select('*')
        .eq('user_id', user.id)
        .eq('vision_id', visionId)
        .eq('operation_type', 'refine_vision') // Filter for refinement operations
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error loading refinements:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // If the table doesn't exist or has different structure, return empty array
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.log('Refinements table does not exist yet, returning empty array')
          setAllDrafts([])
          return
        }
        throw error
      }
      
      console.log('Successfully loaded drafts:', data?.length || 0)
      setAllDrafts(data || [])
    } catch (error) {
      console.error('Error loading drafts:', error)
      // Set empty array on error to prevent UI issues
      setAllDrafts([])
    }
  }, [user, visionId, supabase])

  // Load vision by ID function
  const loadVisionById = async () => {
    try {
      const resolvedParams = await params
      const { data: { user } } = await supabase.auth.getUser()
        
      if (!user) {
        setError('Please log in to access this page')
        return
      }

      setUser(user)
      setVisionId(resolvedParams.id)

      // Get the vision data by ID
      const { data: visionData, error: visionError } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single()

      if (visionError || !visionData) {
        setError('Vision not found or access denied')
        return
      }

      setVision(visionData)
      console.log('Vision loaded successfully:', visionData.id)
    } catch (error) {
      console.error('Error loading vision:', error)
      setError('Failed to load vision data')
    } finally {
      setLoading(false)
    }
  }

  // Commit all drafts to new vision
  const commitAllDrafts = useCallback(async () => {
    if (!user || !visionId || !vision || allDrafts.length === 0) return

    try {
      setIsDraftSaving(true)

      // Create new vision version with all draft refinements
      const updatedVision = { ...vision } as any
      allDrafts.forEach((draft: any) => {
        if (draft.category && (draft.output_text || draft.refinement_text)) {
          updatedVision[draft.category] = draft.output_text || draft.refinement_text
        }
      })

      // Create new vision version
      const { data: newVersion, error: versionError } = await supabase
        .from('vision_versions')
        .insert({
          user_id: user.id,
          vision: updatedVision,
          version_number: (vision.version_number || 0) + 1,
          status: 'complete'
        })
        .select()
        .single()

      if (versionError) throw versionError

      // Reload vision and drafts
      await loadVisionById()
      await loadAllDrafts()
      
      setDraftStatus('committed')
      setTimeout(() => setDraftStatus('none'), 2000)

    } catch (error) {
      console.error('Error committing all drafts:', error)
    } finally {
      setIsDraftSaving(false)
    }
  }, [user, visionId, vision, allDrafts, supabase, loadVisionById])

  // Edit a draft
  const editDraft = (draft: any) => {
    console.log('Edit draft clicked:', draft.id)
    setSelectedCategory(draft.category)
    setCurrentRefinement(draft.output_text || draft.refinement_text || draft.current_refinement || '')
    setEditingDraft(draft.id)
    setShowAllDrafts(false) // Hide drafts when editing
    
    // Scroll to refinement section
    setTimeout(() => {
      const refinementSection = document.querySelector('[data-refinement-section]')
      if (refinementSection) {
        refinementSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  // Commit a single draft to new vision
  const commitSingleDraft = async (draft: any) => {
    console.log('Commit single draft clicked:', draft.id)
    if (!user || !visionId || !vision) return

    try {
      setIsDraftSaving(true)

      // Create new vision version with this draft refinement
      const updatedVision = { ...vision } as any
      if (draft.category && (draft.output_text || draft.refinement_text)) {
        updatedVision[draft.category] = draft.output_text || draft.refinement_text
      }

      // Create new vision version
      const { data: newVersion, error: versionError } = await supabase
        .from('vision_versions')
        .insert({
          user_id: user.id,
          vision: updatedVision,
          version_number: (vision.version_number || 0) + 1,
          status: 'complete'
        })
        .select()
        .single()

      if (versionError) throw versionError

      // Delete the committed draft
      const { error: deleteError } = await supabase
        .from('refinements')
        .delete()
        .eq('id', draft.id)

      if (deleteError) throw deleteError

      // Reload vision and drafts
      await loadVisionById()
      await loadAllDrafts()
      
      setDraftStatus('committed')
      setTimeout(() => setDraftStatus('none'), 2000)

    } catch (error) {
      console.error('Error committing single draft:', error)
      alert(`Failed to commit draft: ${error}`)
    } finally {
      setIsDraftSaving(false)
    }
  }

  // Delete a draft
  const deleteDraft = async (draftId: string) => {
    console.log('Delete draft clicked:', draftId)
    if (!confirm('Are you sure you want to delete this draft?')) return

    try {
      console.log('Attempting to delete draft:', draftId)
      
      // First, let's check if the draft exists
      const { data: checkData, error: checkError } = await supabase
        .from('refinements')
        .select('id, category, output_text')
        .eq('id', draftId)
        .single()

      if (checkError) {
        console.error('Error checking draft before delete:', checkError)
        alert(`Draft not found: ${checkError.message}`)
        return
      }

      console.log('Draft found for deletion:', checkData)
      
      const { error } = await supabase
        .from('refinements')
        .delete()
        .eq('id', draftId)

      if (error) {
        console.error('Error deleting draft:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        alert(`Failed to delete draft: ${error.message}`)
        return
      }

      console.log('Draft deleted from database successfully')
      
      // Immediately update the local state to remove the draft
      setAllDrafts(prevDrafts => {
        const filtered = prevDrafts.filter(draft => draft.id !== draftId)
        console.log('Updated drafts list:', filtered.length, 'drafts remaining')
        return filtered
      })
      
      // Also reload drafts from database to ensure consistency
      await loadAllDrafts()
      
      console.log('Draft removed from UI successfully')
      
      // Show success message
      alert('Draft deleted successfully!')
    } catch (error) {
      console.error('Error in deleteDraft:', error)
      alert(`Failed to delete draft: ${error}`)
    }
  }

  // Load vision by ID when component mounts
  useEffect(() => {
    loadVisionById()
  }, [params])

  // Load all drafts when vision loads
  useEffect(() => {
    if (visionId && user) {
      console.log('useEffect triggered - loading drafts for vision:', visionId)
      loadAllDrafts()
    } else {
      console.log('useEffect skipped - missing visionId or user:', { visionId, user: !!user })
    }
  }, [visionId, user, loadAllDrafts])

  // Read category from URL parameters
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      // Validate that the category exists in VISION_CATEGORIES
      const validCategory = VISION_CATEGORIES.find(cat => cat.key === categoryParam)
      if (validCategory) {
        setSelectedCategory(categoryParam)
        console.log('Category selected from URL:', categoryParam)
        
        // Load any existing draft for this category
        if (user && visionId) {
          // Call loadDraftForCategory directly to avoid dependency issues
          const loadDraft = async () => {
            try {
              console.log('Loading draft for category:', categoryParam, 'user:', user.id, 'vision:', visionId)
              
              const { data, error } = await supabase
                .from('refinements')
                .select('*')
                .eq('user_id', user.id)
                .eq('vision_id', visionId)
                .eq('category', categoryParam)
                .eq('operation_type', 'refine_vision')
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

              if (error) {
                if (error.code === 'PGRST116') {
                  console.log('No draft found for category:', categoryParam)
                  // Reset to original vision content if no draft
                  const categoryValue = getCategoryValue(categoryParam)
                  setCurrentRefinement(categoryValue)
                  return
                }
                console.error('Supabase error loading draft for category:', error)
                // Reset to original vision content on error
                const categoryValue = getCategoryValue(categoryParam)
                setCurrentRefinement(categoryValue)
                return
              }

              console.log('Loaded draft for category:', categoryParam, data)
              if (data && data.output_text) {
                setCurrentRefinement(data.output_text)
                console.log('Auto-populated draft from URL for category:', categoryParam, data.output_text)
              } else {
                // Reset to original vision content if no draft text
                const categoryValue = getCategoryValue(categoryParam)
                setCurrentRefinement(categoryValue)
              }
            } catch (error) {
              console.error('Error loading draft for category:', error)
              // Reset to original vision content on error
              const categoryValue = getCategoryValue(categoryParam)
              setCurrentRefinement(categoryValue)
            }
          }
          
          loadDraft()
        }
      }
    }
  }, [searchParams, user, visionId])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Check if refinement is different from current vision (draft detection)
  useEffect(() => {
    if (!selectedCategory || !vision) return
    
    const categoryValue = getCategoryValue(selectedCategory)
    const isDifferent = currentRefinement.trim() !== categoryValue.trim() && currentRefinement.trim() !== ''
    
    if (isDifferent && draftStatus === 'none') {
      setDraftStatus('draft')
    } else if (!isDifferent && draftStatus === 'draft') {
      setDraftStatus('none')
    }
  }, [currentRefinement, selectedCategory, vision, draftStatus])

  // Auto-save draft when refinement changes
  useEffect(() => {
    if (draftStatus === 'draft' && currentRefinement.trim() !== '') {
      const timeoutId = setTimeout(() => {
        saveDraft()
      }, 2000) // Auto-save after 2 seconds of no changes
      
      return () => clearTimeout(timeoutId)
    }
  }, [currentRefinement, draftStatus])
    
  const getCategoryValue = (category: string) => {
    if (!vision) return ''
    return vision[category as keyof VisionData] as string || ''
  }

  const startConversation = async () => {
    if (!selectedCategory || !vision || !visionId) return

    const categoryValue = getCategoryValue(selectedCategory)
    const categoryInfo = VISION_CATEGORIES.find(cat => cat.key === selectedCategory)
    
    setIsTyping(true)
    
    try {
      // Call real VIVA chat API with initial greeting
      const response = await fetch('/api/viva/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'START_SESSION' }],
          context: {
            refinement: true,
            operation: 'refine_vision',
            category: selectedCategory,
            visionId: visionId,
            isInitialGreeting: true
          },
          visionBuildPhase: 'refinement'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start conversation')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessageContent = ''
      const assistantMessageId = Date.now().toString()

      // Add placeholder message for streaming
      const placeholderMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setChatMessages([placeholderMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          // AI SDK streams plain text chunks, so just append them
          assistantMessageContent += chunk
          
          // Update the message in real-time
          setChatMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: assistantMessageContent }
                : msg
            )
          )
        }
      }

      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: assistantMessageContent }
            : msg
        )
      )
      
      setConversationPhase('exploring')
    } catch (error) {
      console.error('Error starting conversation:', error)
      setError('Failed to start conversation. Please try again.')
      
      // Fallback to basic message
      const fallbackMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Hello! I'm VIVA, your intelligent vision refinement assistant. I see you want to work on your **${categoryInfo?.label}** vision. Let me help you refine this vision through thoughtful conversation.`,
        timestamp: new Date()
      }
      setChatMessages([fallbackMessage])
      setConversationPhase('exploring')
    } finally {
      setIsTyping(false)
    }
  }

  const sendMessage = async () => {
    if (!currentMessage.trim() || !selectedCategory || !visionId) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    }

    const userMessageForAI = currentMessage.trim()
    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsTyping(true)

    try {
      // Prepare conversation history for API
      const messagesForAPI = [...chatMessages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Call real VIVA chat API
      const response = await fetch('/api/viva/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForAPI,
          context: {
            refinement: true,
            operation: 'refine_vision',
            category: selectedCategory,
            visionId: visionId
          },
          visionBuildPhase: 'refinement'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessageContent = ''
      const assistantMessageId = (Date.now() + 1).toString()

      // Add placeholder message for streaming
      const placeholderMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, placeholderMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          // AI SDK streams plain text chunks, so just append them
          assistantMessageContent += chunk
          
          // Update the message in real-time
          setChatMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: assistantMessageContent }
                : msg
            )
          )
        }
      }

      // Final update with complete message
      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: assistantMessageContent }
            : msg
        )
      )

      // Check if message suggests a refined version is ready (look for keywords)
      const refinedPattern = /refined|refinement|refine|copy.*refinement|copy.*refined/i
      if (refinedPattern.test(assistantMessageContent)) {
        setLastVivaResponse(assistantMessageContent)
        // Extract refined text if provided in the response
        const refinedMatch = assistantMessageContent.match(/"([^"]+)"/)
        if (refinedMatch && refinedMatch[1]) {
          setLastVivaResponse(refinedMatch[1])
          setShowCopyPrompt(true)
        }
      }

      setConversationPhase('exploring') // Reset phase - let AI drive the conversation
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message. Please try again.')
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // generateAIResponse removed - now using real AI API

  const copyToRefinement = () => {
    // Extract refined text from last VIVA response if it contains a refined version
    // Look for quoted text or text after "Refined Vision:" or similar markers
    let refinedText = lastVivaResponse
    
    // Try to extract quoted text (most common format)
    const quotedMatch = lastVivaResponse.match(/"([^"]+)"/)
    if (quotedMatch && quotedMatch[1]) {
      refinedText = quotedMatch[1]
    } else {
      // Look for text after markers like "Refined Vision:" or "Here's a refined version:"
      const refinedMatch = lastVivaResponse.match(/(?:refined|refinement|version)[:\s]+([\s\S]+?)(?:\n\n|Would you|Can I|$)/i)
      if (refinedMatch && refinedMatch[1]) {
        refinedText = refinedMatch[1].trim()
      }
    }
    
    setCurrentRefinement(refinedText)
    setShowCopyPrompt(false)
  }

  // Draft management functions
  const saveDraft = async () => {
    if (!vision || !selectedCategory || !currentRefinement.trim()) return
    
    setIsDraftSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log('Saving draft for category:', selectedCategory, 'user:', user.id, 'vision:', vision.id)

      // Check if a draft already exists for this category
      const { data: existingDrafts, error: checkError } = await supabase
        .from('refinements')
        .select('id')
        .eq('user_id', user.id)
        .eq('vision_id', vision.id)
        .eq('category', selectedCategory)
        .eq('operation_type', 'refine_vision')

      if (checkError) {
        console.error('Error checking existing drafts:', checkError)
        return
      }

      console.log('Existing drafts found:', existingDrafts?.length || 0)

      // If draft exists, update it; otherwise create new one
      const draftData: any = {
        user_id: user.id,
        vision_id: vision.id,
        category: selectedCategory,
        output_text: currentRefinement,
        operation_type: 'refine_vision',
        created_at: new Date().toISOString()
      }

      let result
      if (existingDrafts && existingDrafts.length > 0) {
        // Update existing draft
        console.log('Updating existing draft:', existingDrafts[0].id)
        result = await supabase
          .from('refinements')
          .update({
            output_text: currentRefinement,
            created_at: new Date().toISOString()
          })
          .eq('id', existingDrafts[0].id)
      } else {
        // Create new draft
        console.log('Creating new draft')
        result = await supabase
          .from('refinements')
          .insert(draftData)
      }

      if (result.error) {
        console.error('Error saving draft:', result.error)
        console.error('Error details:', {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint
        })
        
        // If the table doesn't exist, just log and continue
        if (result.error.code === '42P01' || result.error.message.includes('does not exist')) {
          console.log('Refinements table does not exist yet, skipping save')
        } else {
          alert(`Failed to save draft: ${result.error.message}`)
        }
        return
      }

      setLastSaved(new Date())
      console.log('Draft saved successfully')
      
      // Reload drafts to show the new one
      await loadAllDrafts()
    } catch (error) {
      console.error('Error saving draft:', error)
    } finally {
      setIsDraftSaving(false)
    }
  }

  const commitDraftToVision = async () => {
    if (!vision || !selectedCategory || !currentRefinement.trim()) return
    
    setIsDraftSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create new vision version with updated category
      const updatedVision = {
        ...vision,
        [selectedCategory]: currentRefinement,
        version_number: vision.version_number + 1,
        updated_at: new Date().toISOString()
      }

      // Insert new version
      const { data: newVersion, error: versionError } = await supabase
        .from('vision_versions')
        .insert(updatedVision)
        .select()
        .single()

      if (versionError) {
        console.error('Error creating new version:', versionError)
      return
    }

      // Update refinements table to mark as committed
      const { error: refinementError } = await supabase
        .from('refinements')
        .update({
          status: 'committed',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('vision_id', vision.id)
        .eq('category', selectedCategory)

      if (refinementError) {
        console.error('Error updating refinement status:', refinementError)
        return
      }

      // Update local state
      setVision(newVersion)
      setDraftStatus('committed')
      setLastSaved(new Date())
      
      // Reset refinement to match new vision
      setTimeout(() => {
        setCurrentRefinement(currentRefinement)
        setDraftStatus('none')
      }, 1000)

      console.log('Draft committed successfully')
    } catch (error) {
      console.error('Error committing draft:', error)
    } finally {
      setIsDraftSaving(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" />
        </div>
      </PageLayout>
    )
  }

  if (error || !vision) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Sparkles className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Vision Error</h2>
            <p className="text-neutral-400 mb-6">{error || 'Vision not found'}</p>
            <Button onClick={() => router.back()} variant="primary">
              Go Back
            </Button>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Intelligent Refinement</h1>
            <Badge variant="premium" className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              VIVA AI
            </Badge>
          </div>
          <p className="text-neutral-400">
            Select a category and let VIVA help you refine your vision through intelligent conversation
          </p>
        </div>
                          </div>
                      </div>

      {/* Category Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Choose a Category to Refine</h2>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {VISION_CATEGORIES.map((category) => (
            <CategoryCard 
                      key={category.key}
              category={category} 
              selected={selectedCategory === category.key} 
                      onClick={async () => {
                        setSelectedCategory(category.key)
                        // Load any existing draft for this category
                        if (user && visionId) {
                          try {
                            console.log('Loading draft for category:', category.key, 'user:', user.id, 'vision:', visionId)
                            
                            const { data, error } = await supabase
                              .from('refinements')
                              .select('*')
                              .eq('user_id', user.id)
                              .eq('vision_id', visionId)
                              .eq('category', category.key)
                              .eq('operation_type', 'refine_vision')
                              .order('created_at', { ascending: false })
                              .limit(1)
                              .single()

                            if (error) {
                              if (error.code === 'PGRST116') {
                                console.log('No draft found for category:', category.key)
                                // Reset to original vision content if no draft
                                const categoryValue = getCategoryValue(category.key)
                                setCurrentRefinement(categoryValue)
                                return
                              }
                              console.error('Supabase error loading draft for category:', error)
                              // Reset to original vision content on error
                              const categoryValue = getCategoryValue(category.key)
                              setCurrentRefinement(categoryValue)
                              return
                            }

                            console.log('Loaded draft for category:', category.key, data)
                            if (data && data.output_text) {
                              setCurrentRefinement(data.output_text)
                              console.log('Auto-populated draft for category:', category.key, data.output_text)
                            } else {
                              // Reset to original vision content if no draft text
                              const categoryValue = getCategoryValue(category.key)
                              setCurrentRefinement(categoryValue)
                            }
                          } catch (error) {
                            console.error('Error loading draft for category:', error)
                            // Reset to original vision content on error
                            const categoryValue = getCategoryValue(category.key)
                            setCurrentRefinement(categoryValue)
                          }
                        } else {
                          // Reset to original vision content if no user/visionId
                          const categoryValue = getCategoryValue(category.key)
                          setCurrentRefinement(categoryValue)
                        }
                      }}
            />
          ))}
        </div>
      </div>

      {/* All Drafts Dropdown */}
      {allDrafts.length > 0 && (
        <div className="mb-8">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-500 text-sm font-bold">{allDrafts.length}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">All Drafts</h3>
                  <p className="text-sm text-neutral-400">
                    {allDrafts.length} draft{allDrafts.length !== 1 ? 's' : ''} ready to commit
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setShowAllDrafts(!showAllDrafts)}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-1 w-full sm:w-auto"
                >
                  {showAllDrafts ? 'Hide' : 'Show'} Drafts
                </Button>
                <Button
                  onClick={commitAllDrafts}
                  disabled={isDraftSaving}
                  variant="primary"
                  size="sm"
                  className="flex items-center justify-center gap-1 w-full sm:w-auto"
                >
                  {isDraftSaving ? (
                    <Spinner variant="primary" size="sm" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Commit All Drafts
                </Button>
              </div>
            </div>
            
            {showAllDrafts && (
              <div className="space-y-3">
                {allDrafts.map((draft) => {
                  const categoryInfo = VISION_CATEGORIES.find(cat => cat.key === draft.category)
                  return (
                    <div key={draft.id} className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                        <div className="flex items-center gap-3">
                          {categoryInfo && <categoryInfo.icon className="w-5 h-5 text-primary-500" />}
                          <span className="font-medium text-white">{categoryInfo?.label}</span>
                          <Badge variant="warning" className="text-xs">Draft</Badge>
                        </div>
                        {/* Commit, Edit and Delete buttons - responsive layout */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Button
                            onClick={() => commitSingleDraft(draft)}
                            disabled={isDraftSaving}
                            variant="primary"
                            size="sm"
                            className="flex items-center justify-center gap-1 py-2 px-4 min-h-[40px]"
                          >
                            {isDraftSaving ? (
                              <Spinner variant="primary" size="sm" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Commit
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => editDraft(draft)}
                              variant="ghost"
                              size="sm"
                              className="flex items-center justify-center gap-1 py-2 px-4 min-h-[40px] flex-1 sm:flex-none"
                            >
                              <Edit className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              onClick={() => deleteDraft(draft.id)}
                              variant="danger"
                              size="sm"
                              className="flex items-center justify-center gap-1 py-2 px-4 min-h-[40px] flex-1 sm:flex-none"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* ID and Date under the title */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-3 text-xs text-neutral-500">
                        <span className="font-mono break-all">ID: {draft.id}</span>
                        <span className="whitespace-nowrap">Created {new Date(draft.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <p className="text-sm text-neutral-300 line-clamp-2 break-words">
                        {draft.output_text || draft.refinement_text || draft.current_refinement || 'No content'}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Current Vision & Refinement Display */}
      {selectedCategory && (
        <div className="mb-8">
          {/* Mobile Toggle Button */}
          <div className="lg:hidden mb-4">
            <Button
              onClick={() => setShowCurrentVision(!showCurrentVision)}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              {showCurrentVision ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Hide Current Vision
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  Show Current Vision
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Vision Card - Hidden on mobile when toggled */}
            <div className={`${showCurrentVision ? 'block' : 'hidden lg:block'}`}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const categoryInfo = VISION_CATEGORIES.find(cat => cat.key === selectedCategory)
                      return categoryInfo && <categoryInfo.icon className="w-8 h-8 text-primary-500" />
                    })()}
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Current Vision - {VISION_CATEGORIES.find(cat => cat.key === selectedCategory)?.label}
                      </h3>
                      <p className="text-sm text-neutral-400">
                        Your existing vision for this category
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setCurrentRefinement(getCategoryValue(selectedCategory!))}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copy to Refinement
                  </Button>
                </div>
                <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
                  <div className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {getCategoryValue(selectedCategory) || "No vision content available for this category."}
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6" data-refinement-section>
              <div className="flex items-center gap-3 mb-4">
                <Wand2 className="w-8 h-8 text-purple-400" />
                <div>
                <h3 className="text-lg font-semibold text-white">
                  Refinement - {VISION_CATEGORIES.find(cat => cat.key === selectedCategory)?.label}
                </h3>
                  <p className="text-sm text-neutral-400">
                    Your refined version of this vision
                  </p>
                </div>
              </div>
              <AutoResizeTextarea
                value={currentRefinement}
                onChange={setCurrentRefinement}
                placeholder="Start refining your vision here, or let VIVA help you through conversation..."
                className="bg-neutral-800/50 border-neutral-600"
                minHeight={120}
              />
              
              {/* Draft Status & Actions */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {draftStatus === 'draft' && (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      Draft
                    </Badge>
                  )}
                  {draftStatus === 'committed' && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Committed
                    </Badge>
                  )}
                  {lastSaved && (
                    <span className="text-xs text-neutral-500">
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {draftStatus === 'draft' && (
                    <>
                  <Button
                        onClick={saveDraft}
                        disabled={isDraftSaving}
                        variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                        {isDraftSaving ? (
                      <Spinner variant="primary" size="sm" />
                  ) : (
                          <Save className="w-4 h-4" />
                  )}
                        Save Draft
                </Button>
                  <Button
                        onClick={commitDraftToVision}
                        disabled={isDraftSaving}
                        variant="primary"
                    size="sm"
                    className="flex items-center gap-1"
                      >
                        {isDraftSaving ? (
                          <Spinner variant="primary" size="sm" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Commit Draft to Life Vision
                    </Button>
                    </>
                  )}
                  </div>
                </div>
              </Card>
                    </div>
                    </div>
      )}

      {/* Chat Interface */}
      {selectedCategory && (
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
            <ChatInterface 
              chatMessages={chatMessages}
              isTyping={isTyping}
              chatEndRef={chatEndRef}
              currentMessage={currentMessage}
              setCurrentMessage={setCurrentMessage}
              sendMessage={sendMessage}
              showCopyPrompt={showCopyPrompt}
              setShowCopyPrompt={setShowCopyPrompt}
              copyToRefinement={copyToRefinement}
            />
          )}
        </div>
      )}
    </div>
  )
}