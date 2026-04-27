'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import * as Diff from 'diff'
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
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Gem,
  X,
  RotateCcw
} from 'lucide-react'
import { 
   
  Card, 
  Button, 
  Badge, 
  Spinner,
  SaveButton,
  Textarea,
  AutoResizeTextarea,
  Icon,
  VIVAButton,
  CategoryGrid,
  Container,
  Stack
} from '@/lib/design-system'
import { VISION_CATEGORIES, getVisionCategoryLabel } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { VivaChatInput } from '@/components/viva/VivaChatInput'
import { colors } from '@/lib/design-system/tokens'
import { 
  ensureDraftExists,
  getDraftVision,
  updateDraftCategory,
  commitDraft,
  getDraftCategories
} from '@/lib/life-vision/draft-helpers'
import { calculateVersionNumber } from '@/lib/life-vision/version-helpers'
import { RecordingTextarea } from '@/components/RecordingTextarea'

interface VisionData {
  id: string
  user_id: string
  household_id?: string | null
  title?: string | null
  perspective?: string | null
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
  is_draft: boolean
  is_active: boolean
  completion_percent?: number
  version_number: number
  refined_categories?: string[]
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
    <Card>
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
  const [draftVision, setDraftVision] = useState<VisionData | null>(null)
  const [refinedCategories, setRefinedCategories] = useState<string[]>([])
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
  const [user, setUser] = useState<any>(null)
  const [visionId, setVisionId] = useState<string | null>(null)
  const [showCurrentVision, setShowCurrentVision] = useState(false)
  const [showRefinement, setShowRefinement] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isInitializingChat, setIsInitializingChat] = useState(false)
  const [initializationStep, setInitializationStep] = useState<string>('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const previousCategoryRef = useRef<string | null>(null)
  const categoryGridRef = useRef<HTMLDivElement>(null)

  const [availableConversations, setAvailableConversations] = useState<any[]>([])
  const [showConversationSelector, setShowConversationSelector] = useState(false)
  const isLoadingConversationRef = useRef(false)
  const [isNonDraft, setIsNonDraft] = useState(false)
  const [nonDraftVision, setNonDraftVision] = useState<VisionData | null>(null)
  const [isCloning, setIsCloning] = useState(false)

  // VIVA Refine (Refine + Weave) state
  const [vivaRevision, setVivaRevision] = useState('')
  const [isVivaRefining, setIsVivaRefining] = useState(false)
  const [currentRefinementId, setCurrentRefinementId] = useState<string | null>(null)
  const [refinementNotes, setRefinementNotes] = useState('')
  const [viewMode, setViewMode] = useState<'edit' | 'highlight'>('edit')
  const [originalVisionText, setOriginalVisionText] = useState('')
  const [previousRefinement, setPreviousRefinement] = useState<string | null>(null)
  const [refineFromRevision, setRefineFromRevision] = useState(false)

  const supabase = createClient()

  // Load draft vision for this user
  const loadDraftVision = useCallback(async () => {
    if (!user) {
      console.log('Skipping loadDraftVision - missing user')
      return
    }

    try {
      console.log('Loading draft vision for user:', user.id)
      
      const draft = await getDraftVision(user.id)
      
      if (draft) {
        // Calculate the actual version number based on creation order
        const calculatedVersion = await calculateVersionNumber(draft.id)
        const draftWithVersion = { ...draft, version_number: calculatedVersion }
        console.log('Draft vision loaded:', draftWithVersion.id, 'Version:', calculatedVersion, 'Refined categories:', draftWithVersion.refined_categories)
        setDraftVision(draftWithVersion)
      } else {
        console.log('No draft vision found for user')
        setDraftVision(null)
      }
    } catch (error) {
      console.error('Error loading draft vision:', error)
      setDraftVision(null)
    }
  }, [user])

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

      // Check if this is actually a draft
      if (visionData.is_draft !== true) {
        console.log('Vision is not a draft, checking for existing draft...')
        
        // Check if a draft already exists for this vision
        const { data: existingDraft } = await supabase
          .from('vision_versions')
          .select('id')
          .eq('parent_id', visionData.id)
          .eq('is_draft', true)
          .eq('is_active', false)
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (existingDraft) {
          console.log('Found existing draft, redirecting...')
          router.push(`/life-vision/${existingDraft.id}/refine`)
          return
        }
        
        // No existing draft, show clone option
        console.log('No existing draft, showing clone option')
        setIsNonDraft(true)
        setNonDraftVision(visionData)
        setLoading(false)
        return
      }

      // It's a draft, calculate version number and set it as draft
      const calculatedVersion = await calculateVersionNumber(visionData.id)
      const visionWithVersion = { ...visionData, version_number: calculatedVersion }
      setDraftVision(visionWithVersion)
      console.log('Draft vision loaded successfully:', visionWithVersion.id, 'Version:', calculatedVersion)
      
      // Fetch the active vision for comparison
      const { data: activeVisionData } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_draft', false)
        .maybeSingle()
      
      if (activeVisionData) {
        const activeVersion = await calculateVersionNumber(activeVisionData.id)
        setVision({ ...activeVisionData, version_number: activeVersion })
        console.log('Active vision loaded for comparison:', activeVisionData.id, 'Version:', activeVersion)
      } else if (visionData.parent_id) {
        // No active vision but draft has a parent — fetch the parent as baseline
        const { data: parentVision } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('id', visionData.parent_id)
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (parentVision) {
          const parentVersion = await calculateVersionNumber(parentVision.id)
          setVision({ ...parentVision, version_number: parentVersion })
          console.log('Parent vision loaded for comparison:', parentVision.id, 'Version:', parentVersion)
        } else {
          console.log('Parent vision not found, no baseline available')
          setVision(null)
        }
      } else {
        console.log('No active or parent vision, no baseline available')
        setVision(null)
      }
      
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

  // Commit draft vision as new active
  const commitDraftVision = useCallback(async () => {
    if (!draftVision) {
      console.log('No draft vision to commit')
      return
    }

    try {
      setIsDraftSaving(true)

      // Use the commitDraft helper to commit the draft
      const newActive = await commitDraft(draftVision.id)
      
      console.log('Draft committed successfully:', newActive.id)
      
      // Update vision to the newly committed one
      setVision(newActive)
      setDraftVision(null)
      
      setDraftStatus('committed')
      setTimeout(() => setDraftStatus('none'), 2000)

      // Redirect to the new active vision
      router.push(`/life-vision/${newActive.id}`)
    } catch (error) {
      console.error('Error committing draft:', error)
      alert(`Failed to commit draft: ${error}`)
    } finally {
      setIsDraftSaving(false)
    }
  }, [draftVision, router])


  // Initialize user auth state first (before loading vision)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        const authUser = session?.user
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

  // Load draft vision when user is available
  useEffect(() => {
    if (user) {
      console.log('useEffect triggered - loading draft vision for user:', user.id)
      loadDraftVision()
    } else {
      console.log('useEffect skipped - missing user')
    }
  }, [user, loadDraftVision])

  // Calculate refined categories when both visions are loaded
  useEffect(() => {
    if (draftVision && vision && !vision.is_draft) {
      // Compare draft to active vision to calculate refined categories
      const calculated = getDraftCategories(draftVision, vision)
      setRefinedCategories(calculated)
      console.log('Calculated refined categories:', calculated)
    } else if (draftVision && draftVision.refined_categories) {
      // Fallback to DB refined_categories if active not loaded
      setRefinedCategories(draftVision.refined_categories)
    }
  }, [draftVision, vision])

  // Read category from URL parameters
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      // Validate that the category exists in VISION_CATEGORIES
      const validCategory = VISION_CATEGORIES.find(cat => cat.key === categoryParam)
      if (validCategory) {
        setSelectedCategory(categoryParam)
        console.log('Category selected from URL:', categoryParam)
        
        // Set original vision text from active vision for diff comparison
        if (vision) {
          const activeValue = getCategoryValue(categoryParam)
          setOriginalVisionText(activeValue)
        }
        
        // Load content from draft vision for this category
        if (draftVision) {
          console.log('Loading category from draft vision:', categoryParam)
          const draftValue = draftVision[categoryParam as keyof VisionData] as string
          setCurrentRefinement(draftValue || '')
        } else if (vision) {
          // Fallback to active vision if no draft yet
          const categoryValue = getCategoryValue(categoryParam)
          setCurrentRefinement(categoryValue)
        }
      }
    }
  }, [searchParams, draftVision, vision])


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
    if (!draftVision || !selectedCategory || !currentRefinement.trim()) return
    
    // Save current scroll position and active element
    const scrollPosition = window.scrollY
    const activeElement = document.activeElement as HTMLElement
    
    setIsDraftSaving(true)
    try {
      console.log('Saving draft for category:', selectedCategory, 'draft:', draftVision.id)

      // Use the updateDraftCategory helper
      const updatedDraft = await updateDraftCategory(
        draftVision.id,
        selectedCategory,
        currentRefinement
      )

      setDraftVision(updatedDraft)
      setLastSaved(new Date())
      console.log('Draft saved successfully, refined categories:', updatedDraft.refined_categories)
      
      // Mark refinement as applied if there's a current refinement ID
      if (currentRefinementId) {
        try {
          await supabase
            .from('vision_refinements')
            .update({
              applied: true,
              applied_at: new Date().toISOString(),
            })
            .eq('id', currentRefinementId)
          
          console.log('Refinement marked as applied:', currentRefinementId)
          setCurrentRefinementId(null) // Clear the ID after applying
        } catch (refinementError) {
          console.error('Error marking refinement as applied:', refinementError)
          // Don't fail the save if this fails
        }
      }
      
      // Restore scroll position and focus after React re-renders
      setTimeout(() => {
        window.scrollTo({ top: scrollPosition, behavior: 'instant' })
        if (activeElement && activeElement.focus) {
          activeElement.focus()
        }
      }, 0)
    } catch (error) {
      console.error('Error saving draft:', error)
      alert(`Failed to save draft: ${error}`)
    } finally {
      setIsDraftSaving(false)
    }
  }

  // VIVA Refine (Refine + Weave) handler
  const handleVivaRefine = async () => {
    if (!selectedCategory || !draftVision || !vision) return
    
    const activeVisionText = getCategoryValue(selectedCategory)
    const inputText = refineFromRevision && currentRefinement.trim()
      ? currentRefinement
      : activeVisionText
    if (!inputText.trim()) return
    
    if (currentRefinement.trim()) {
      setPreviousRefinement(currentRefinement)
    }
    
    setIsVivaRefining(true)
    setOriginalVisionText(activeVisionText)
    setCurrentRefinement('')
    setShowCurrentVision(true)
    setShowRefinement(true)
    setViewMode('edit')
    
    try {
      const refinement = {
        notes: refinementNotes.trim() || undefined
      }
      const weave = { enabled: false as const }
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('perspective')
        .eq('user_id', user.id)
        .single()
      
      const perspective = profile?.perspective || 'singular'
      
      const response = await fetch('/api/viva/refine-category-weave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionId: draftVision.id,
          category: selectedCategory,
          currentVisionText: inputText,
          refinement,
          weave,
          perspective
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to refine category')
      }
      
      if (!response.body) {
        throw new Error('No response body')
      }
      
      // Stream the response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            
            if (data.error) {
              throw new Error(data.error)
            }
            
            if (data.content) {
              fullText += data.content
              setCurrentRefinement(fullText) // Stream into refinement field
            }
            
            if (data.done) {
              console.log('VIVA Refine complete')
              if (data.refinementId) {
                setCurrentRefinementId(data.refinementId)
                console.log('Refinement saved with ID:', data.refinementId)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('VIVA Refine error:', error)
      alert(`Failed to refine: ${error}`)
    } finally {
      setIsVivaRefining(false)
    }
  }
  
  // Copy VIVA revision to refinement field
  const copyVivaRevisionToRefinement = () => {
    setCurrentRefinement(vivaRevision)
    setVivaRevision('')
  }

  // Render diff with highlights
  const renderDiff = (oldText: string, newText: string) => {
    const diff = Diff.diffWords(oldText, newText)
    
    return (
      <div className="prose prose-invert max-w-none p-4 bg-neutral-800/50 rounded-lg border-2 min-h-[120px] whitespace-pre-wrap text-sm" style={{ borderColor: colors.accent[500] }}>
        {diff.map((part, index) => {
          if (part.added) {
            return (
              <span
                key={index}
                className="bg-green-500/30 text-green-200 px-1 rounded"
                style={{ textDecoration: 'none' }}
              >
                {part.value}
              </span>
            )
          }
          if (part.removed) {
            return (
              <span
                key={index}
                className="bg-red-500/30 text-red-300 px-1 rounded line-through"
              >
                {part.value}
              </span>
            )
          }
          return <span key={index}>{part.value}</span>
        })}
      </div>
    )
  }


  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  // Handle non-draft vision - clone it to create a new draft
  const handleCloneToDraft = async () => {
    if (!nonDraftVision) return
    
    setIsCloning(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const authUser = session?.user
      if (!authUser) throw new Error('Not authenticated')

      // Delete ALL existing drafts using API route (bypasses RLS recursion issues)
      const { data: existingDrafts, error: draftsFetchError } = await supabase
        .from('vision_versions')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('is_draft', true)
        .eq('is_active', false)

      if (draftsFetchError) {
        console.error('Error fetching existing drafts:', draftsFetchError)
        // Continue anyway - might not be any drafts
      } else if (existingDrafts && existingDrafts.length > 0) {
        console.log(`Found ${existingDrafts.length} existing draft(s) to delete`)
        // Delete each draft using the API route (bypasses RLS)
        for (const draft of existingDrafts) {
          try {
            const deleteResponse = await fetch(`/api/vision?id=${draft.id}`, {
              method: 'DELETE',
            })
            if (!deleteResponse.ok) {
              const errorData = await deleteResponse.json()
              console.error(`Failed to delete draft ${draft.id}:`, errorData.error)
            } else {
              console.log(`Deleted draft ${draft.id}`)
            }
          } catch (err) {
            console.error(`Error deleting draft ${draft.id}:`, err)
          }
        }
      }

      // Clone the vision as a draft
      const { data: newDraft, error: insertError } = await supabase
        .from('vision_versions')
        .insert({
          user_id: authUser.id,
          parent_id: nonDraftVision.id, // Track where this draft came from
          title: nonDraftVision.title || 'Vision Draft',
          perspective: nonDraftVision.perspective || 'singular',
          forward: nonDraftVision.forward,
          fun: nonDraftVision.fun,
          travel: nonDraftVision.travel,
          home: nonDraftVision.home,
          family: nonDraftVision.family,
          love: nonDraftVision.love,
          health: nonDraftVision.health,
          money: nonDraftVision.money,
          work: nonDraftVision.work,
          social: nonDraftVision.social,
          stuff: nonDraftVision.stuff,
          giving: nonDraftVision.giving,
          spirituality: nonDraftVision.spirituality,
          conclusion: nonDraftVision.conclusion,
          is_draft: true,
          is_active: false
        })
        .select()
        .single()

      if (insertError) {
        console.error('Clone insert error:', insertError)
        throw insertError
      }

      // Redirect to the new draft refine page
      router.push(`/life-vision/${newDraft.id}/refine`)
      // Don't set isCloning(false) - keep loading overlay visible during navigation
    } catch (err) {
      console.error('Error cloning to draft:', err)
      alert('Failed to create draft. Please try again.')
      setIsCloning(false)
    }
  }

  if (isNonDraft && nonDraftVision) {
    return (
      <>
        <Card className="text-center py-16 max-w-2xl mx-auto">
          <div className="text-yellow-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">This Life Vision ID is not a draft</h2>
          <p className="text-neutral-400 mb-6">
            This is an active or completed vision. The refine feature is only available for draft visions.
          </p>
          <p className="text-neutral-300 mb-8">
            Would you like to create a draft from this vision to refine it?
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => router.push('/life-vision')} 
              variant="outline"
              disabled={isCloning}
            >
              Back to Visions
            </Button>
            <Button 
              onClick={handleCloneToDraft} 
              variant="primary"
              disabled={isCloning}
              loading={isCloning}
            >
              {isCloning ? 'Creating Draft...' : 'Create Draft'}
            </Button>
          </div>
        </Card>
      </>
    )
  }

  if (error) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Sparkles className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Vision Error</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <Button onClick={() => router.back()} variant="primary">
            Go Back
          </Button>
        </div>
      </Container>
    )
  }

  if (!vision) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  // Category navigation helpers (mirrors /profile/[id]/edit pattern)
  const getCurrentCategoryIndex = () => {
    if (!selectedCategory) return 0
    const idx = VISION_CATEGORIES.findIndex(c => c.key === selectedCategory)
    return idx >= 0 ? idx : 0
  }

  const isFirstCategory = () => getCurrentCategoryIndex() === 0
  const isLastCategory = () => getCurrentCategoryIndex() === VISION_CATEGORIES.length - 1
  const canReviewFromLast = isLastCategory() && !!draftVision && refinedCategories.length > 0

  const currentCategoryLabel = selectedCategory
    ? (VISION_CATEGORIES.find(c => c.key === selectedCategory)?.label ?? '')
    : ''

  const applyCategorySelection = (key: string) => {
    setSelectedCategory(key)
    setPreviousRefinement(null)
    setRefineFromRevision(false)

    const currentPath = window.location.pathname
    router.replace(`${currentPath}?category=${key}`, { scroll: false })

    if (vision) {
      const activeValue = getCategoryValue(key)
      setOriginalVisionText(activeValue)
    }

    if (draftVision) {
      const draftValue = draftVision[key as keyof VisionData] as string
      setCurrentRefinement(draftValue || '')
    } else if (vision) {
      const categoryValue = getCategoryValue(key)
      setCurrentRefinement(categoryValue)
    }
  }

  const handleCategoryChange = (key: string) => {
    applyCategorySelection(key)
    requestAnimationFrame(() => {
      categoryGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const goToPreviousCategory = () => {
    const idx = getCurrentCategoryIndex()
    if (idx > 0) handleCategoryChange(VISION_CATEGORIES[idx - 1].key)
  }

  const goToNextCategory = () => {
    const idx = getCurrentCategoryIndex()
    if (idx < VISION_CATEGORIES.length - 1) {
      handleCategoryChange(VISION_CATEGORIES[idx + 1].key)
      return
    }
    if (canReviewFromLast && draftVision) {
      router.push(`/life-vision/${draftVision.id}/draft`)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Category Selection */}
        <div ref={categoryGridRef}>
          <CategoryGrid
            categories={VISION_CATEGORIES}
            activeCategory={selectedCategory || undefined}
            refinedCategories={refinedCategories}
            onCategoryClick={(key) => handleCategoryChange(key)}
            mode="draft"
            fillWidth
            title="Choose a Category to Update"
            bleedClassName="max-md:-mx-4"
            pillLabel="scroll"
          />
        </div>

      {/* Overarching Category Card — wraps VIVA tool + compare view */}
      {selectedCategory && (() => {
        const categoryInfo = VISION_CATEGORIES.find(cat => cat.key === selectedCategory)
        const categoryLabel = categoryInfo?.label ?? ''
        const hasExistingRevision = !!(
          currentRefinement.trim() &&
          currentRefinement.trim() !== getCategoryValue(selectedCategory).trim()
        )

        return (
          <Card>
            {/* Card Header — Category identifier */}
            <div className="mb-2 flex flex-row items-center justify-center gap-2 md:gap-3">
              {categoryInfo && (
                <>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500 md:h-8 md:w-8">
                    <Icon icon={categoryInfo.icon} size="xs" color="#000000" />
                  </div>
                  <h3 className="max-w-full text-sm font-medium uppercase tracking-[0.25em] text-neutral-400">
                    {categoryInfo.label}
                  </h3>
                </>
              )}
            </div>
            <div className="mb-6 border-b border-neutral-800" />

            {/* Section 1: Update with VIVA */}
            <section className="mb-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-center text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
                    Update Notes
                  </label>
                  <RecordingTextarea
                    value={refinementNotes}
                    onChange={setRefinementNotes}
                    placeholder="Tell VIVA how to update this category..."
                    className="min-h-[100px] w-full !bg-[#101010] !border-neutral-800 focus-within:!border-accent-500"
                    rows={4}
                    storageFolder="lifeVision"
                    recordingPurpose="quick"
                    category={selectedCategory ? `refine-${selectedCategory}` : 'refine'}
                    instanceId="refinement-notes"
                  />
                </div>

                {hasExistingRevision && (
                  <label className="flex items-center justify-center gap-2 pt-1 cursor-pointer select-none">
                    <div
                      role="switch"
                      aria-checked={refineFromRevision}
                      onClick={() => setRefineFromRevision(!refineFromRevision)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                        refineFromRevision ? 'bg-accent-500' : 'bg-neutral-600'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ${
                        refineFromRevision ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      }`} />
                    </div>
                    <span className="text-sm text-neutral-300">
                      Update from current revision
                    </span>
                  </label>
                )}

                <div className="flex justify-center pt-2">
                  <Button
                    onClick={handleVivaRefine}
                    disabled={isVivaRefining || !selectedCategory || !getCategoryValue(selectedCategory).trim()}
                    variant="accent"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    {isVivaRefining ? (
                      <>
                        <Spinner variant="secondary" size="sm" />
                        Updating with VIVA...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        {refineFromRevision && hasExistingRevision
                          ? `Update ${categoryLabel} Revision`
                          : `Update ${categoryLabel} With VIVA`}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </section>

            {/* Section 2: Compare */}
            <section className="border-t border-neutral-800 pt-6">
              <div className="mb-5 text-center">
                <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
                  Compare
                </h4>
              </div>

              {/* Toggle switches — replace Show/Hide buttons */}
              <div className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    role="switch"
                    aria-checked={showCurrentVision}
                    onClick={() => setShowCurrentVision(!showCurrentVision)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                      showCurrentVision ? 'bg-primary-500' : 'bg-neutral-600'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ${
                      showCurrentVision ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`} />
                  </div>
                  <span className="text-sm text-neutral-300">Show Current Vision</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    role="switch"
                    aria-checked={showRefinement}
                    onClick={() => setShowRefinement(!showRefinement)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                      showRefinement ? 'bg-accent-500' : 'bg-neutral-600'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ${
                      showRefinement ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`} />
                  </div>
                  <span className="text-sm text-neutral-300">Show Update</span>
                </label>
              </div>

              <div className={`space-y-6 ${showCurrentVision && showRefinement ? 'lg:grid lg:grid-cols-2' : ''} lg:gap-6 lg:space-y-0`}>
                {/* Current Vision Panel */}
                <div className={`${showCurrentVision ? 'block' : 'hidden'}`}>
                  <div className="rounded-2xl border border-primary-500/30 bg-[#1A1A1A] p-4 md:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h5 className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500">
                        Current Vision
                      </h5>
                      {vision && (
                        <span className="text-[11px] text-neutral-400">
                          Active V{vision.version_number ?? 1} · {new Date(vision.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>

                    <AutoResizeTextarea
                      value={getCategoryValue(selectedCategory) || "No vision content available for this category."}
                      onChange={() => {}}
                      readOnly
                      className="!bg-[#101010] !border-neutral-800 text-sm cursor-default !rounded-lg !px-4 !py-3 scroll-mt-24"
                      minHeight={120}
                    />

                    <div className="mt-4 flex justify-center">
                      <Button
                        onClick={() => setCurrentRefinement(getCategoryValue(selectedCategory!))}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy to Update
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Update (Refinement) Panel */}
                <div className={`${showRefinement ? 'block' : 'hidden'}`} style={{ overflowAnchor: 'none' } as React.CSSProperties}>
                  <div className="rounded-2xl border border-accent-500/30 bg-[#1A1A1A] p-4 md:p-5" data-refinement-section>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h5 className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: colors.accent[500] }}>
                        Update {categoryLabel} With VIVA
                      </h5>

                      {/* Edit / Highlight Toggle */}
                      <div className="inline-flex self-center sm:self-auto rounded-lg border border-accent-500/40 bg-[#101010] p-1">
                        <button
                          onClick={() => setViewMode('edit')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                            viewMode === 'edit'
                              ? 'bg-accent-500 text-white'
                              : 'text-neutral-300 hover:text-white'
                          }`}
                        >
                          <Edit className="w-3.5 h-3.5 inline mr-1.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => setViewMode('highlight')}
                          disabled={!originalVisionText || !currentRefinement}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                            viewMode === 'highlight'
                              ? 'bg-accent-500 text-white'
                              : 'text-neutral-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                          Highlight
                        </button>
                      </div>
                    </div>

                    {viewMode === 'highlight' && originalVisionText && currentRefinement && !isVivaRefining ? (
                      renderDiff(originalVisionText, currentRefinement)
                    ) : (
                      <AutoResizeTextarea
                        value={currentRefinement}
                        onChange={setCurrentRefinement}
                        placeholder="Your updated vision will stream here..."
                        className="!bg-[#101010] !border-neutral-800 text-sm !rounded-lg !px-4 !py-3"
                        style={{ overflowAnchor: 'none' } as React.CSSProperties}
                        minHeight={120}
                      />
                    )}

                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                      {previousRefinement && !isVivaRefining && (
                        <Button
                          onClick={() => {
                            setCurrentRefinement(previousRefinement)
                            setPreviousRefinement(null)
                            setShowRefinement(true)
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Revert to Previous
                        </Button>
                      )}
                      <SaveButton
                        saveLabel="Save Update"
                        hasUnsavedChanges={
                          !!(
                            selectedCategory &&
                            draftVision &&
                            currentRefinement.trim() !==
                              ((draftVision[selectedCategory as keyof VisionData] as string) || '').trim()
                          )
                        }
                        isSaving={isDraftSaving}
                        onClick={saveDraft}
                        disabled={!selectedCategory || !draftVision || !currentRefinement.trim()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Card>
        )
      })()}

      {/* Chat Interface - REMOVED */}
      {false && selectedCategory && (
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
              <Card>
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

      {/* Previous / Progress / Next Footer (mirrors /profile/[id]/edit pattern) */}
      {selectedCategory && (
        <div className="flex items-center justify-between px-4 md:px-0">
          <div className="flex-1 flex justify-start">
            <Button
              onClick={goToPreviousCategory}
              disabled={isFirstCategory()}
              variant="outline"
              size="sm"
              className="w-24 md:w-auto"
            >
              <ChevronsLeft className="w-4 h-4 flex-shrink-0 md:hidden" />
              <ChevronLeft className="w-4 h-4 flex-shrink-0 hidden md:block" />
              <span className="hidden md:inline">Previous</span>
            </Button>
          </div>

          <div className="flex flex-col items-center gap-0.5 text-sm text-neutral-400 md:flex-row md:gap-2">
            <div className="flex items-center gap-2">
              <span>{getCurrentCategoryIndex() + 1} of {VISION_CATEGORIES.length}</span>
              <span>•</span>
              <span>{currentCategoryLabel}</span>
            </div>
            {refinedCategories.includes(selectedCategory) && (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline">•</span>
                <span className="text-primary-500">Updated</span>
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-end">
            <Button
              onClick={goToNextCategory}
              disabled={isLastCategory() && !canReviewFromLast}
              variant={canReviewFromLast ? 'primary' : 'outline'}
              size="sm"
              className="w-24 md:w-auto"
            >
              <span className="hidden md:inline">{canReviewFromLast ? 'Review' : 'Next'}</span>
              <ChevronsRight className="w-4 h-4 flex-shrink-0 md:hidden" />
              <ChevronRight className="w-4 h-4 flex-shrink-0 hidden md:block" />
            </Button>
          </div>
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
            
            <div className="p-4 sm:p-6 border-t border-neutral-700 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <Button
                onClick={() => {
                  setShowCombinePreview(false)
                  setCombinedText('')
                }}
                variant="outline"
                className="w-full sm:w-auto"
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
                className="w-full sm:w-auto"
              >
                {isTyping ? 'Regenerating...' : 'Try Again'}
              </Button>
              <Button
                onClick={acceptCombinedPreview}
                variant="primary"
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Check className="w-4 h-4" />
                Accept & Update
              </Button>
            </div>
          </Card>
        </div>
      )}
      </Stack>
    </Container>
  )
}