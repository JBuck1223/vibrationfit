'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Target,
  Zap,
  Save,
  Edit,
  Trash2
} from 'lucide-react'
import { 
  PageLayout, 
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
    setSelectedCategory(draft.category)
    setCurrentRefinement(draft.output_text || draft.refinement_text || draft.current_refinement || '')
    setEditingDraft(draft.id)
    // Scroll to refinement section
    setTimeout(() => {
      const refinementSection = document.querySelector('[data-refinement-section]')
      if (refinementSection) {
        refinementSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  // Delete a draft
  const deleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return

    try {
      const { error } = await supabase
        .from('refinements')
        .delete()
        .eq('id', draftId)

      if (error) {
        console.error('Error deleting draft:', error)
        return
      }

      // Reload drafts
      await loadAllDrafts()
      console.log('Draft deleted successfully')
    } catch (error) {
      console.error('Error in deleteDraft:', error)
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
      }
    }
  }, [searchParams])

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

  // Draft management functions
  const saveDraft = async () => {
    if (!vision || !selectedCategory || !currentRefinement.trim()) return
    
    setIsDraftSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Save draft to refinements table
      const draftData: any = {
        user_id: user.id,
        vision_id: vision.id,
        category: selectedCategory,
        output_text: currentRefinement, // Use output_text (the actual column name)
        operation_type: 'refine_vision',
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('refinements')
        .upsert(draftData, {
          onConflict: 'user_id,vision_id,category'
        })

      if (error) {
        console.error('Error saving draft:', error)
        // If the table doesn't exist, just log and continue
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.log('Refinements table does not exist yet, skipping save')
        }
        return
      }

      setLastSaved(new Date())
      console.log('Draft saved successfully')
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

  const ChatInterface = () => (
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
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
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
                      onClick={() => setSelectedCategory(category.key)}
            />
          ))}
        </div>
      </div>

      {/* All Drafts Dropdown */}
      {allDrafts.length > 0 && (
        <div className="mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
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
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowAllDrafts(!showAllDrafts)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {showAllDrafts ? 'Hide' : 'Show'} Drafts
                </Button>
                <Button
                  onClick={commitAllDrafts}
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
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {categoryInfo && <categoryInfo.icon className="w-5 h-5 text-primary-500" />}
                          <span className="font-medium text-white">{categoryInfo?.label}</span>
                          <Badge variant="warning" className="text-xs">Draft</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => editDraft(draft)}
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-neutral-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => deleteDraft(draft.id)}
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-neutral-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-300 line-clamp-2">
                        {draft.output_text || draft.refinement_text || draft.current_refinement || 'No content'}
                      </p>
                      <p className="text-xs text-neutral-500 mt-2">
                        Created {new Date(draft.created_at).toLocaleDateString()}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
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
              <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
                <div className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {getCategoryValue(selectedCategory) || "No vision content available for this category."}
                </div>
                <div className="mt-3 flex justify-end">
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
              </div>
            </Card>

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
              <Textarea
                value={currentRefinement}
                onChange={(e) => setCurrentRefinement(e.target.value)}
                placeholder="Start refining your vision here, or let VIVA help you through conversation..."
                className="min-h-[120px] bg-neutral-800/50 border-neutral-600"
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
            <ChatInterface />
          )}
        </div>
      )}
    </div>
  )
}