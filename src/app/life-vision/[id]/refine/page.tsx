'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  ChevronRight,
  Clock,
  Eye
} from 'lucide-react'
import { 
   
  Card, 
  Button, 
  Badge, 
  Spinner,
  Textarea,
  AutoResizeTextarea,
  Icon,
  VIVAButton,
  CategoryCard
} from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { VivaChatInput } from '@/components/viva/VivaChatInput'
import { colors } from '@/lib/design-system/tokens'

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
  copyToRefinement,
  generateRefinementFromConversation,
  userProfile
}: { 
  chatMessages: ChatMessage[], 
  isTyping: boolean, 
  chatEndRef: React.RefObject<HTMLDivElement | null>, 
  currentMessage: string, 
  setCurrentMessage: (value: string) => void, 
  sendMessage: () => void, 
  showCopyPrompt: boolean, 
  setShowCopyPrompt: (value: boolean) => void, 
  copyToRefinement: () => void,
  generateRefinementFromConversation: () => void,
  userProfile?: any
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
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'bg-neutral-800 text-neutral-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {userProfile?.profile_picture_url ? (
                  <Image
                    src={userProfile.profile_picture_url}
                    alt="You"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#06B6D4] flex items-center justify-center text-white text-xs font-semibold">
                    {userProfile?.first_name?.charAt(0).toUpperCase() || 'Y'}
                  </div>
                )}
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
      <div className="space-y-3">
        <VivaChatInput
          value={currentMessage}
          onChange={setCurrentMessage}
          onSubmit={sendMessage}
          placeholder="Type your response..."
          disabled={isTyping}
          isLoading={isTyping}
          multiline={true}
        />
        
        {/* Generate Refinement Button - Show after some conversation */}
        {chatMessages.length >= 2 && (
          <Button
            onClick={generateRefinementFromConversation}
            disabled={isTyping}
            variant="accent"
            className="w-full"
          >
            <Sparkles className="w-4 h-4" />
            Generate Refinement from Conversation
          </Button>
        )}
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
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [currentRefinement, setCurrentRefinement] = useState('')
  const [showCopyPrompt, setShowCopyPrompt] = useState(false)
  const [lastVivaResponse, setLastVivaResponse] = useState('')
  const [vivaSections, setVivaSections] = useState<Array<{ id: string, content: string, timestamp: Date }>>([]) // New: collect VIVA sections
  const [showCombinePreview, setShowCombinePreview] = useState(false) // New: show combined preview
  const [combinedText, setCombinedText] = useState('') // New: preview combined text
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
  const [showRefinement, setShowRefinement] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isInitializingChat, setIsInitializingChat] = useState(false)
  const [initializationStep, setInitializationStep] = useState<string>('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const previousCategoryRef = useRef<string | null>(null)
  const [availableConversations, setAvailableConversations] = useState<any[]>([])
  const [showConversationSelector, setShowConversationSelector] = useState(false)
  const isLoadingConversationRef = useRef(false)

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
        
      if (!user) {
        console.log('loadVisionById: No user available yet')
        return
      }

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
      
      // Also fetch user profile for avatar
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, profile_picture_url')
        .eq('user_id', user.id)
        .single()
      
      if (profile) {
        setUserProfile(profile)
      }
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

  // Initialize user auth state first (before loading vision)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        if (authError) {
          console.error('Auth error in refine page:', authError)
          setError('Please log in to access this page')
          return
        }
        if (authUser) {
          console.log('Refine page: User authenticated:', authUser.id)
          setUser(authUser)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        setError('Failed to authenticate')
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        console.log('Refine page: Auth state changed - user:', session.user.id)
        setUser(session.user)
      } else {
        console.log('Refine page: Auth state changed - no user')
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Load vision by ID when component mounts and user is available
  useEffect(() => {
    if (user) {
      loadVisionById()
    }
  }, [params, user])

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

  // Reset chat when category changes AND look up existing conversation
  useEffect(() => {
    if (previousCategoryRef.current !== null && previousCategoryRef.current !== selectedCategory && !isLoadingConversationRef.current) {
      console.log('Category changed from', previousCategoryRef.current, 'to', selectedCategory, '- resetting chat')
      setChatMessages([])
      setConversationPhase('initial')
      setIsInitializingChat(false)
      setCurrentMessage('')
      setConversationId(null) // Clear conversation ID for new category
    }
    previousCategoryRef.current = selectedCategory

    // Look up existing conversations for this category when it's selected
    if (selectedCategory && user && visionId && !isInitializingChat && !isLoadingConversationRef.current) {
      const lookupConversations = async () => {
        try {
          console.log('[LOOKUP] Starting for category:', selectedCategory, 'vision:', visionId)
          
          // Try direct lookup first (for new sessions with category/vision_id fields)
          let { data: sessions, error } = await supabase
            .from('conversation_sessions')
            .select('id, created_at, message_count, updated_at, preview_message, category, vision_id')
            .eq('user_id', user.id)
            .eq('mode', 'refinement')
            .eq('category', selectedCategory)
            .eq('vision_id', visionId)
            .order('updated_at', { ascending: false })
            .limit(10)

          console.log('[LOOKUP] Direct query results:', sessions?.length || 0, 'error:', error)

          // Fallback for old sessions without category/vision_id fields
          if (!sessions || sessions.length === 0) {
            console.log('[LOOKUP] No direct matches, checking old format sessions...')
            const { data: allRefinementSessions } = await supabase
              .from('conversation_sessions')
              .select('id, created_at, message_count, updated_at, preview_message, category, vision_id')
              .eq('user_id', user.id)
              .eq('mode', 'refinement')
              .order('updated_at', { ascending: false })
              .limit(50) // Check more sessions for old format

            console.log('[LOOKUP] Found', allRefinementSessions?.length || 0, 'total refinement sessions')

            if (allRefinementSessions && allRefinementSessions.length > 0) {
              // Filter by checking ai_conversations context for category/visionId match
              const matchingSessions = []
              for (const session of allRefinementSessions) {
                const { data: messages } = await supabase
                  .from('ai_conversations')
                  .select('*')
                  .eq('conversation_id', session.id)
                  .limit(1)

                if (messages && messages.length > 0) {
                  const context = messages[0]?.context as any
                  console.log('[LOOKUP] Session', session.id, 'context:', { category: context?.category, visionId: context?.visionId })
                  if (context?.category === selectedCategory && context?.visionId === visionId) {
                    console.log('[LOOKUP] Match found!', session.id)
                    matchingSessions.push(session)
                  }
                }
              }
              console.log('[LOOKUP] Total matching sessions:', matchingSessions.length)
              sessions = matchingSessions
            }
          }

          if (sessions && sessions.length > 0) {
            console.log('[LOOKUP] Processing', sessions.length, 'sessions to get message counts')
            
            // Get the last message and count from each session for preview
            const sessionsWithPreviews = await Promise.all(
              sessions.map(async (session) => {
                // Get count first
                const { count } = await supabase
                  .from('ai_conversations')
                  .select('*', { count: 'exact', head: true })
                  .eq('conversation_id', session.id)

                // Then get last message
                const { data: messages } = await supabase
                  .from('ai_conversations')
                  .select('*')
                  .eq('conversation_id', session.id)
                  .order('created_at', { ascending: false })
                  .limit(1)

                console.log('[LOOKUP] Session', session.id, 'count:', count, 'lastMessage:', !!messages?.[0])

                return {
                  ...session,
                  lastMessage: messages?.[0]?.message || null,
                  preview: session.preview_message,
                  message_count: count || session.message_count || 0 // Use actual count or fallback
                }
              })
            )

            console.log('[LOOKUP] Final sessions:', sessionsWithPreviews.map(s => ({ id: s.id, count: s.message_count })))

            setAvailableConversations(sessionsWithPreviews)
            // Auto-select most recent conversation
            const mostRecentConvId = sessionsWithPreviews[0].id
            setConversationId(mostRecentConvId)
            console.log('[LOOKUP] Found', sessionsWithPreviews.length, 'conversations for category:', selectedCategory, 'auto-selected:', mostRecentConvId)
          } else {
            console.log('[LOOKUP] No conversations found for category:', selectedCategory)
          }
        } catch (error) {
          console.error('Error looking up existing conversations:', error)
        }
      }
      lookupConversations()
    }
  }, [selectedCategory, user, visionId, isInitializingChat])

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

  // Load existing conversation messages
  const loadConversation = async (conversationIdToLoad: string) => {
    console.log('[LOAD] Loading conversation:', conversationIdToLoad)
    isLoadingConversationRef.current = true
    setIsTyping(true)
    
    try {
      const { data: messages, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('conversation_id', conversationIdToLoad)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error loading conversation:', error)
        throw error
      }
      
      console.log('[LOAD] Loaded', messages?.length || 0, 'messages')
      
      if (messages && messages.length > 0) {
        // Convert database messages to ChatMessage format
        const chatMessagesData: ChatMessage[] = messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.message,
          timestamp: new Date(msg.created_at)
        }))
        
        console.log('[LOAD] About to set', chatMessagesData.length, 'messages')
        setChatMessages(chatMessagesData)
        setConversationPhase('exploring')
        console.log('[LOAD] Conversation loaded successfully')
      } else {
        console.log('[LOAD] No messages found, starting new conversation')
        // No messages, treat as new conversation
        await startConversation(conversationIdToLoad)
      }
    } catch (error) {
      console.error('Failed to load conversation, starting new one:', error)
      await startConversation(conversationIdToLoad)
    } finally {
      setIsTyping(false)
      isLoadingConversationRef.current = false
    }
  }

  const startConversation = async (explicitConversationId?: string | null) => {
    if (!selectedCategory || !vision || !visionId) return

    const categoryValue = getCategoryValue(selectedCategory)
    const categoryInfo = VISION_CATEGORIES.find(cat => cat.key === selectedCategory)
    
    setIsTyping(true)
    setIsInitializingChat(true)
    setInitializationStep('Loading your vision...')
    
    try {
      // Brief delay to show first step
      await new Promise(resolve => setTimeout(resolve, 500))
      setInitializationStep('Analyzing refinement data...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Use explicit ID if provided, otherwise use state value
      const conversationIdToUse = explicitConversationId !== undefined ? explicitConversationId : conversationId
      console.log('[REFINE] startConversation - explicitConversationId:', explicitConversationId, 'state conversationId:', conversationId, 'using:', conversationIdToUse)
      
      // Call real VIVA chat API with initial greeting
      setInitializationStep('Connecting with VIVA...')
      const requestBody = {
        messages: [{ role: 'user', content: 'START_SESSION' }],
        context: {
          refinement: true,
          operation: 'refine_vision',
          category: selectedCategory,
          visionId: visionId,
          isInitialGreeting: true
        },
        visionBuildPhase: 'refinement',
        conversationId: conversationIdToUse || undefined // Pass existing conversation ID if found
      }
      console.log('[REFINE] Calling VIVA chat with conversationId:', conversationIdToUse, 'body:', requestBody)
      const response = await fetch('/api/viva/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        cache: 'no-store' // Prevent turbopack caching issues in dev
      })
      console.log('[REFINE] Response status:', response.status, response.statusText)
      
      setIsInitializingChat(false)

      // Check for JSON error responses
      const ct = response.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const json = await response.json()
        console.error('API returned JSON error:', json)
        throw new Error(json?.error || 'AI route returned JSON instead of a stream')
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API response not OK:', response.status, errorText)
        throw new Error('Failed to start conversation')
      }

      if (!response.body) {
        console.error('No response body - stream was not created')
        throw new Error('No response body - stream was not created')
      }

      console.log('Response OK, starting to read stream...')

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessageContent = ''
      const assistantMessageId = Date.now().toString()

      console.log('Reader created, starting to read...')

      // Add placeholder message for streaming
      const placeholderMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setChatMessages([placeholderMessage])
      setIsTyping(false) // Hide typing indicator once placeholder is shown

      let chunkCount = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('Stream done, total chunks:', chunkCount, 'final content length:', assistantMessageContent.length)
          break
        }

        const chunk = decoder.decode(value)
        chunkCount++
        if (chunkCount <= 3) { // Log first 3 chunks
          console.log(`Chunk ${chunkCount}:`, chunk)
        }
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

      if (assistantMessageContent.length === 0) {
        console.error('No content received from stream - throwing error')
        throw new Error('Stream produced no chunks')
      }

      // Update with received content
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
      setIsInitializingChat(false)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(`Failed to start conversation: ${errorMessage}`)
      
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
          visionBuildPhase: 'refinement',
          conversationId: conversationId || undefined
        }),
        cache: 'no-store' // Prevent turbopack caching issues in dev
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
      setIsTyping(false) // Hide typing indicator once placeholder is shown

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
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

  // Generate refinement from conversation
  const generateRefinementFromConversation = async () => {
    if (!selectedCategory || !visionId || chatMessages.length === 0) return
    
    setIsTyping(true)
    try {
      // Prepare conversation history
      const conversationHistory = chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      // Call refine-category API
      const response = await fetch('/api/viva/refine-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionId,
          category: selectedCategory,
          currentRefinement: currentRefinement || getCategoryValue(selectedCategory),
          conversationHistory,
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate refinement')
      }
      
      if (data.success && data.refinedText) {
        setCombinedText(data.refinedText)
        setShowCombinePreview(true)
      }
    } catch (error) {
      console.error('Error generating refinement:', error)
      setError('Failed to generate refinement. Please try again.')
    } finally {
      setIsTyping(false)
    }
  }
  
  // Accept combined preview
  const acceptCombinedPreview = () => {
    setCurrentRefinement(combinedText)
    setShowCombinePreview(false)
    setCombinedText('')
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
      <>
        <div className="flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" />
        </div>
      </>
    )
  }

  if (error || !vision) {
    return (
      <>
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
      </>
    )
  }

  return (
    <div>
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
        <div className={`grid grid-cols-4 md:grid-cols-6 gap-2 ${
          VISION_CATEGORIES.some(cat => cat.key === 'forward' || cat.key === 'conclusion')
            ? 'lg:grid-cols-[repeat(14,minmax(0,1fr))]'
            : 'lg:grid-cols-[repeat(12,minmax(0,1fr))]'
        }`}>
          {VISION_CATEGORIES.map((category) => (
            <CategoryCard 
                      key={category.key}
              category={category} 
              selected={selectedCategory === category.key} 
                      variant="outlined"
                      selectionStyle="border"
                      iconColor="#14B8A6"
                      selectedIconColor="#39FF14"
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                  asChild
                  variant="primary"
                  size="sm"
                  className="flex items-center justify-center gap-1 w-full sm:w-auto font-semibold"
                  style={{
                    backgroundColor: colors.energy.yellow[500],
                    color: '#000000',
                    border: `2px solid ${colors.energy.yellow[500]}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${colors.energy.yellow[500]}E6`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.energy.yellow[500]
                  }}
                >
                  <Link href={`/life-vision/${visionId}/refine/draft`}>
                    <Eye className="w-4 h-4" />
                    View Draft Vision
                  </Link>
                </Button>
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
              <div className="mt-4 space-y-3">
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
                        {/* View button with primary styling in neon yellow */}
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => editDraft(draft)}
                            variant="primary"
                            size="sm"
                            className="flex items-center justify-center gap-1 py-2 px-4 min-h-[40px] flex-1 sm:flex-none font-semibold"
                            style={{
                              backgroundColor: colors.energy.yellow[500],
                              color: '#000000',
                              border: `2px solid ${colors.energy.yellow[500]}`
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${colors.energy.yellow[500]}E6`
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = colors.energy.yellow[500]
                            }}
                          >
                            <Eye className="w-4 h-4" />
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
          {/* Mobile Toggle Buttons */}
          <div className="lg:hidden mb-4 space-y-2">
            <Button
              onClick={() => setShowCurrentVision(!showCurrentVision)}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              {showCurrentVision ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {showCurrentVision ? 'Hide' : 'Show'} Current Vision
            </Button>
            <Button
              onClick={() => setShowRefinement(!showRefinement)}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              {showRefinement ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {showRefinement ? 'Hide' : 'Show'} Refinement
            </Button>
          </div>

          {/* Desktop Toggle Buttons - Above the grid */}
          <div className="hidden lg:flex gap-4 mb-4">
            <Button
              onClick={() => setShowCurrentVision(!showCurrentVision)}
              variant={showCurrentVision ? "primary" : "outline"}
              size="sm"
              className="flex-1 flex items-center justify-center gap-2"
            >
              {showCurrentVision ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {showCurrentVision ? 'Hide' : 'Show'} Current Vision
            </Button>
            <Button
              onClick={() => setShowRefinement(!showRefinement)}
              variant={showRefinement ? "accent" : "outline"}
              size="sm"
              className="flex-1 flex items-center justify-center gap-2"
            >
              {showRefinement ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {showRefinement ? 'Hide' : 'Show'} Refinement
            </Button>
          </div>

          <div className={`space-y-6 ${showCurrentVision && showRefinement ? 'lg:grid lg:grid-cols-2' : ''} lg:gap-6 lg:space-y-0`}>
            {/* Current Vision Card - Toggle visibility */}
            <div className={`${showCurrentVision ? 'block' : 'hidden'}`}>
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
                <AutoResizeTextarea
                  value={getCategoryValue(selectedCategory) || "No vision content available for this category."}
                  onChange={() => {}}
                  readOnly
                  className="!bg-neutral-800/50 !border-neutral-600 text-sm cursor-default !rounded-lg !px-4 !py-3"
                  minHeight={120}
                />
              </Card>
            </div>

            {/* Refinement Card - Toggle visibility */}
            <div className={`${showRefinement ? 'block' : 'hidden'}`}>
              <Card className="p-6" data-refinement-section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
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
                </div>
                <AutoResizeTextarea
                  value={currentRefinement}
                  onChange={setCurrentRefinement}
                  placeholder="Start refining your vision here, or let VIVA help you through conversation..."
                  className="!bg-neutral-800/50 !border-neutral-600 text-sm !rounded-lg !px-4 !py-3"
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
        </div>
      )}

      {/* Chat Interface */}
      {selectedCategory && (
        <div className="space-y-6">
          {isInitializingChat ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center mx-auto mb-4">
                <Spinner variant="accent" size="lg" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Preparing VIVA...</h3>
              <p className="text-neutral-400 mb-6">
                {initializationStep || 'Getting ready to help you refine your vision'}
              </p>
            </div>
          ) : chatMessages.length === 0 ? (
            availableConversations.length > 0 ? (
              <Card className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Continue or Start Fresh?</h3>
                  <p className="text-neutral-400">
                    You have {availableConversations.length} previous conversation{availableConversations.length > 1 ? 's' : ''} for this category.
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {availableConversations.map((conv, idx) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setConversationId(conv.id)
                        setShowConversationSelector(false)
                        loadConversation(conv.id)
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        conversationId === conv.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-neutral-700 hover:border-neutral-600 bg-neutral-800/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-400">
                            {new Date(conv.updated_at).toLocaleDateString()} at {new Date(conv.updated_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <Badge variant="info" className="text-xs">
                          {conv.message_count} messages
                        </Badge>
                      </div>
                      {conv.lastMessage && (
                        <p className="text-sm text-neutral-300 line-clamp-2">
                          {conv.lastMessage.substring(0, 120)}...
                        </p>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      if (availableConversations[0]) {
                        loadConversation(availableConversations[0].id)
                      } else {
                        void startConversation()
                      }
                    }}
                    variant="primary"
                    className="flex-1"
                    size="lg"
                  >
                    Continue Previous
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('[REFINE] Start Fresh clicked')
                      setAvailableConversations([])
                      // Pass explicit null to ensure fresh start
                      void startConversation(null)
                    }}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    Start Fresh
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Ready to Start?</h3>
                <p className="text-neutral-400 mb-6">
                  VIVA will help you refine your {VISION_CATEGORIES.find(cat => cat.key === selectedCategory)?.label.toLowerCase()} vision through intelligent conversation.
                </p>
                <VIVAButton
                  onClick={() => void startConversation()}
                  size="lg"
                >
                  Start Conversation with VIVA
                </VIVAButton>
              </div>
            )
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
              generateRefinementFromConversation={generateRefinementFromConversation}
              userProfile={userProfile}
            />
          )}
        </div>
      )}

      {/* Combine Preview Modal */}
      {showCombinePreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-700">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">Preview Combined Refinement</h3>
              </div>
              <p className="text-sm text-neutral-400">
                Generated from your conversation with VIVA
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <AutoResizeTextarea
                value={combinedText}
                onChange={setCombinedText}
                className="bg-neutral-800/50 border-neutral-600 min-h-[300px]"
                readOnly={false}
              />
            </div>
            
            <div className="p-6 border-t border-neutral-700 flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowCombinePreview(false)
                  setCombinedText('')
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowCombinePreview(false)
                  generateRefinementFromConversation()
                }}
                variant="secondary"
                disabled={isTyping}
              >
                {isTyping ? 'Regenerating...' : 'Try Again'}
              </Button>
              <Button
                onClick={acceptCombinedPreview}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Accept & Update
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}