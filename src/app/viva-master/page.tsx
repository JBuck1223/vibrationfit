'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, Sparkles, Loader2 } from 'lucide-react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const lastContentLengthRef = useRef<number>(0)

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

  // Start conversation on mount
  useEffect(() => {
    if (!hasStarted && messages.length === 0) {
      startConversation()
      setHasStarted(true)
    }
  }, [hasStarted, messages.length])

  const startConversation = async () => {
    setIsTyping(true)
    
    try {
      const response = await fetch('/api/viva/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'START_SESSION' }],
          context: {
            masterAssistant: true,
            mode: 'master',
            isInitialGreeting: true
          },
          visionBuildPhase: 'master_assistant'
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
      const placeholderMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setMessages([placeholderMessage])

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

      // Final update
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: assistantMessageContent }
            : msg
        )
      )
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
          context: {
            masterAssistant: true,
            mode: 'master'
          },
          visionBuildPhase: 'master_assistant'
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
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-6">
        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto space-y-6 mb-6"
        >
          {messages.length === 0 && !isTyping && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Sparkles className="w-16 h-16 text-[#8B5CF6] mx-auto" />
                <Text size="lg" className="text-neutral-400">
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
              {message.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#B629D4] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              )}
              
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

              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-[#601B9F] flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {isTyping && messages.length > 0 && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#B629D4] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
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

        {/* Input Area */}
        <div className="border-t border-neutral-800 pt-6">
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
              />
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isTyping}
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
