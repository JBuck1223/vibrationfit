'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, Sparkles, Loader2, Mic, Square, Check, RotateCcw, History, Plus, Trash2, X } from 'lucide-react'
import { Button, Card, Text } from '@/lib/design-system/components'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function VivaMasterPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [showConversations, setShowConversations] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const lastContentLengthRef = useRef<number>(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom when messages change or content length changes (streaming)
  useEffect(() => {
    const totalContentLength = messages.reduce((sum, msg) => sum + msg.content.length, 0)
    
    // Scroll if messages array changed OR if content length increased (streaming)
    if (totalContentLength !== lastContentLengthRef.current || messages.length > 0) {
      lastContentLengthRef.current = totalContentLength
      
      // Use requestAnimationFrame for smoother scrolling during streaming
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  }, [messages, isTyping])

  // Load conversation list on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Start conversation on mount - ensure it runs even after refresh
  useEffect(() => {
    if (!hasStarted && messages.length === 0) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        startConversation()
        setHasStarted(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [hasStarted, messages.length]) // Removed hasStarted from dependencies that might prevent re-run

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/viva/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.sessions || [])
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      setMessages([])
      setCurrentConversationId(conversationId)
      setHasUserInteracted(true) // Hide welcome message
      
      // Fetch messages for this conversation
      const response = await fetch(`/api/viva/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        const loadedMessages: Message[] = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.message,
          timestamp: new Date(msg.created_at)
        }))
        setMessages(loadedMessages)
        
        // Update conversation list
        await loadConversations()
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const startNewConversation = () => {
    setMessages([])
    setCurrentConversationId(null)
    setHasUserInteracted(false)
    setHasStarted(false)
    startConversation()
  }

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return
    
    try {
      const response = await fetch(`/api/viva/conversations?id=${conversationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadConversations()
        // If deleted conversation was current, start new one
        if (conversationId === currentConversationId) {
          startNewConversation()
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      alert('Failed to delete conversation')
    }
  }

  const startConversation = async () => {
    setIsTyping(true)
    
    try {
      const response = await fetch('/api/viva/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'START_SESSION' }],
          conversationId: currentConversationId,
          context: {
            masterAssistant: true,
            mode: 'master',
            isInitialGreeting: true
          },
          visionBuildPhase: 'master_assistant'
        })
      })
      
      // Extract conversation ID from response headers
      const conversationIdHeader = response.headers.get('X-Conversation-Id')
      if (conversationIdHeader && conversationIdHeader !== currentConversationId) {
        setCurrentConversationId(conversationIdHeader)
        // Refresh conversation list
        await loadConversations()
      }

      if (!response.ok) {
        throw new Error('Failed to start conversation')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessageContent = ''
      const assistantMessageId = Date.now().toString()

      // Only add placeholder if we have content or are about to receive it
      if (reader) {
        const placeholderMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date()
        }
        setMessages([placeholderMessage])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          assistantMessageContent += chunk
          
          // Only update if we have content
          if (assistantMessageContent.trim()) {
            // Update the message in real-time
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: assistantMessageContent }
                  : msg
              )
            )
            
            // Auto-scroll during streaming
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 50)
          }
        }

        // Final update - ensure we have the complete message
        if (assistantMessageContent.trim()) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: assistantMessageContent }
                : msg
            )
          )
        } else {
          // If no content received, show error message instead of empty bubble
          setMessages([{
            id: assistantMessageId,
            role: 'assistant',
            content: 'Hello! I\'m VIVA, your master guide for VibrationFit. I\'m here to help you become a master of the platform and live a powerful, vibrationally aligned life. How can I help you today?',
            timestamp: new Date()
          }])
        }
      } else {
        // If no reader, set fallback message immediately
        setMessages([{
          id: assistantMessageId,
          role: 'assistant',
          content: 'Hello! I\'m VIVA, your master guide for VibrationFit. I\'m here to help you become a master of the platform and live a powerful, vibrationally aligned life. How can I help you today?',
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Hello! I\'m VIVA, your master guide for VibrationFit. I\'m here to help you become a master of the platform and live a powerful, vibrationally aligned life. How can I help you today?',
        timestamp: new Date()
      }
      setMessages([errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const sendMessage = async () => {
    if (!currentMessage.trim()) return

    // Hide welcome message once user sends their first message
    if (!hasUserInteracted) {
      setHasUserInteracted(true)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsTyping(true)

    try {
      // Prepare conversation history for API
      const messagesForAPI = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Call real VIVA chat API with master assistant mode
      const response = await fetch('/api/viva/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForAPI,
          conversationId: currentConversationId,
          context: {
            masterAssistant: true,
            mode: 'master'
          },
          visionBuildPhase: 'master_assistant'
        })
      })
      
      // Extract conversation ID from response headers
      const conversationIdHeader = response.headers.get('X-Conversation-Id')
      if (conversationIdHeader && conversationIdHeader !== currentConversationId) {
        setCurrentConversationId(conversationIdHeader)
        // Refresh conversation list
        await loadConversations()
      }

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessageContent = ''
      const assistantMessageId = (Date.now() + 1).toString()

      // Add placeholder message for streaming
      const placeholderMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, placeholderMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          assistantMessageContent += chunk
          
          // Update the message in real-time
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: assistantMessageContent }
                : msg
            )
          )
          
          // Auto-scroll during streaming
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 50)
        }
      }

      // Final update with complete message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: assistantMessageContent }
            : msg
        )
      )
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio recording')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      setIsRecording(true)
      setRecordingDuration(0)
      setTranscript(null)

      // Determine best supported mime type
      let mimeType = ''
      const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
      for (const option of options) {
        if (MediaRecorder.isTypeSupported(option)) {
          mimeType = option
          break
        }
      }
      if (!mimeType) mimeType = 'audio/webm'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
        await transcribeAudio(blob)
      }

      mediaRecorder.start(1000)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch (err: any) {
      console.error('Error starting recording:', err)
      alert('Failed to access microphone. Please check permissions.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData()
      }
      setTimeout(() => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop()
        }
      }, 100)
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true)
    try {
      if (blob.size === 0) {
        throw new Error('Recorded audio is empty')
      }

      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Transcription failed')
      }

      const data = await response.json()
      if (!data.transcript) {
        throw new Error('No transcript received')
      }

      setTranscript(data.transcript)
    } catch (err) {
      console.error('Transcription error:', err)
      alert(err instanceof Error ? err.message : 'Failed to transcribe audio')
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleUseTranscript = () => {
    if (transcript) {
      setCurrentMessage(transcript)
      setTranscript(null)
      setRecordingDuration(0)
    }
  }

  const handleDiscardTranscript = () => {
    setTranscript(null)
    setRecordingDuration(0)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#B629D4] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                VIVA Master Assistant
              </h1>
              <Text size="sm" className="text-neutral-400">
                Your comprehensive guide to mastering VibrationFit and living a vibrationally aligned life
              </Text>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowConversations(!showConversations)}
                variant="ghost"
                size="lg"
                title="View conversation history"
              >
                <History className="w-5 h-5" />
              </Button>
              <Button
                onClick={startNewConversation}
                variant="secondary"
                size="lg"
                title="Start new conversation"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations Sidebar */}
      {showConversations && (
        <div className="fixed inset-y-0 left-0 w-80 bg-[#1F1F1F] border-r border-neutral-800 z-20 flex flex-col pt-24">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <h2 className="text-lg font-bold text-white">Conversations</h2>
            <Button
              onClick={() => setShowConversations(false)}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-neutral-400">
                <Text size="sm">No conversations yet</Text>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                      conv.id === currentConversationId
                        ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6]/30'
                        : 'bg-neutral-800/50 hover:bg-neutral-800 border border-transparent'
                    }`}
                    onClick={() => {
                      loadConversation(conv.id)
                      setShowConversations(false)
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {conv.title || 'Untitled Conversation'}
                        </h3>
                        {conv.preview_message && (
                          <Text size="xs" className="text-neutral-400 mt-1 line-clamp-2">
                            {conv.preview_message}
                          </Text>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                          <span>{conv.message_count || 0} messages</span>
                          <span>•</span>
                          <span>{new Date(conv.last_message_at || conv.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteConversation(conv.id)
                        }}
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay when sidebar is open */}
      {showConversations && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setShowConversations(false)}
        />
      )}

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col mx-auto w-full px-6 py-6 transition-all duration-300 ${
        showConversations ? 'md:ml-80 max-w-4xl' : 'max-w-4xl'
      }`}>
      {/* Welcome Intro Message - Show until user sends their first message */}
      {!hasUserInteracted && (
          <div className="mb-6 animate-in fade-in slide-in-from-top duration-500">
            <Card className="bg-gradient-to-br from-[#8B5CF6]/20 to-[#B629D4]/20 border-2 border-[#8B5CF6]/30">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#B629D4] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                      Welcome to VIVA Master Assistant
                    </h2>
                    <Text size="sm" className="text-neutral-300">
                      Your comprehensive guide to mastering VibrationFit
                    </Text>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#8B5CF6]/20">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wide">What I Can Do</h3>
                    <ul className="space-y-1.5 text-sm text-neutral-300">
                      <li className="flex items-start gap-2">
                        <span className="text-[#8B5CF6] mt-0.5">•</span>
                        <span>Answer questions about all VibrationFit tools</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#8B5CF6] mt-0.5">•</span>
                        <span>Show sections from your Life Vision</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#8B5CF6] mt-0.5">•</span>
                        <span>Guide you through your journey</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#8B5CF6] mt-0.5">•</span>
                        <span>Explain concepts and processes</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-[#B629D4] uppercase tracking-wide">Try Asking</h3>
                    <ul className="space-y-1.5 text-sm text-neutral-300">
                      <li className="flex items-start gap-2">
                        <span className="text-[#B629D4] mt-0.5">•</span>
                        <span>"Show me the money section of my vision"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#B629D4] mt-0.5">•</span>
                        <span>"How do I create a Life Vision?"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#B629D4] mt-0.5">•</span>
                        <span>"What is the Green Line?"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#B629D4] mt-0.5">•</span>
                        <span>"Help me understand my assessment"</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto space-y-6 mb-6"
        >
          {messages.length === 0 && !isTyping && (
            <div className="flex items-center justify-center">
              <div className="text-center space-y-4">
                <Sparkles className="w-12 h-12 text-[#8B5CF6] mx-auto animate-pulse" />
                <Text size="base" className="text-neutral-400">
                  Starting your conversation with VIVA...
                </Text>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <Card
                className={cn(
                  'max-w-[85%] md:max-w-[75%]',
                  message.role === 'user'
                    ? 'bg-[#601B9F] text-white border-[#601B9F]'
                    : 'bg-neutral-900 border-neutral-800'
                )}
              >
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-white leading-relaxed">
                    {message.content 
                      ? (message.role === 'assistant'
                          ? message.content.replace(/\*\*\*/g, '').replace(/\*\*/g, '').replace(/#{1,6}\s/g, '')
                          : message.content)
                      : <span className="text-transparent">...</span>
                    }
                  </div>
                </div>
              </Card>
            </div>
          ))}

          {isTyping && messages.length > 0 && (
            <div className="flex gap-4 justify-start">
              <Card className="bg-neutral-900 border-neutral-800">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#8B5CF6] animate-spin" />
                  <Text size="sm" className="text-neutral-400">
                    VIVA is thinking...
                  </Text>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Transcript Preview */}
        {transcript && (
          <div className="mb-4 animate-in fade-in slide-in-from-bottom duration-300">
            <Card className="bg-gradient-to-br from-[#14B8A6]/10 to-[#8B5CF6]/10 border-2 border-[#14B8A6]/30">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#14B8A6]" />
                  <Text size="sm" className="text-[#14B8A6] font-semibold">Transcription Ready</Text>
                </div>
                <div className="bg-black/30 rounded-lg p-3 border border-[#14B8A6]/20">
                  <p className="text-sm text-neutral-200 whitespace-pre-wrap">{transcript}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUseTranscript}
                    variant="primary"
                    size="sm"
                    className="flex-1 gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Use This
                  </Button>
                  <Button
                    onClick={handleDiscardTranscript}
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Discard
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-neutral-800 pt-6">
          {/* Recording Indicator */}
          {(isRecording || isTranscribing) && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-[#1F1F1F] border-2 border-[#D03739] rounded-2xl">
              {isRecording ? (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white font-mono text-sm">{formatDuration(recordingDuration)}</span>
                  <Button
                    onClick={stopRecording}
                    variant="danger"
                    size="sm"
                    className="ml-auto gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Stop
                  </Button>
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#14B8A6]" />
                  <span className="text-neutral-300 text-sm">Transcribing...</span>
                </>
              )}
            </div>
          )}

          <Card className="bg-neutral-900 border-neutral-800">
            <div className="flex gap-4 items-end">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask VIVA anything about VibrationFit..."
                className="flex-1 bg-transparent border-none text-white placeholder-neutral-500 resize-none focus:outline-none focus:ring-0 min-h-[60px] max-h-[200px] py-3"
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '60px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`
                }}
                disabled={isTyping || isRecording || isTranscribing}
              />
              {!isRecording && !isTranscribing && (
                <Button
                  onClick={startRecording}
                  variant={transcript ? "secondary" : "ghost"}
                  size="lg"
                  className="flex-shrink-0"
                  disabled={isTyping}
                  title="Record voice message"
                >
                  <Mic className="w-5 h-5" />
                </Button>
              )}
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isTyping || isRecording || isTranscribing}
                variant="primary"
                size="lg"
                className="flex-shrink-0"
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </Card>
          
          <Text size="xs" className="text-neutral-500 mt-3 text-center">
            VIVA has complete knowledge of all VibrationFit tools, processes, and the vibrational alignment philosophy
          </Text>
        </div>
      </div>
    </div>
  )
}
