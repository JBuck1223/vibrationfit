// src/components/VisionBuilder.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { FORWARD_WARMUP_MD } from '@/lib/viva/forward-warmup'
import ReactMarkdown from 'react-markdown'

interface VisionBuilderProps {
  userId: string
  onComplete: (visionData: Record<string, string>) => void
}

interface Message {
  role: 'viva' | 'user'
  content: string
  isWarmup?: boolean
}

export function VisionBuilder({ userId, onComplete }: VisionBuilderProps) {
  const [currentCategory, setCurrentCategory] = useState(0)
  const [messages, setMessages] = useState<Message[]>([{
    role: 'viva',
    content: 'Hey! I\'m VIVA, and I\'m here to help you build your life vision. We\'ll work through each category together, capturing what you want and helping you articulate your dreams. Ready to get started?'
  }])
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [visionParagraph, setVisionParagraph] = useState<string | null>(null)
  const [hasStartedCategory, setHasStartedCategory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const currentCategoryData = VISION_CATEGORIES[currentCategory]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (messages.length === 1 && currentCategory === 0 && !hasStartedCategory) {
      setTimeout(() => {
        startCategory()
        setHasStartedCategory(true)
      }, 1500)
    }
  }, [])

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  useEffect(() => {
    adjustHeight()
  }, [userInput])

  const startCategory = () => {
    const prompts = getCategoryPrompts(currentCategoryData.key)
    
    // For Forward category, show the warmup first
    if (currentCategoryData.key === 'forward') {
      setMessages(prev => {
        // Check if warmup already exists to prevent duplicates
        const hasWarmup = prev.some(m => m.isWarmup)
        if (hasWarmup) return prev
        
        return [...prev, {
          role: 'viva',
          content: FORWARD_WARMUP_MD,
          isWarmup: true
        }]
      })
    } else {
      setMessages(prev => [...prev, {
        role: 'viva',
        content: prompts.intro
      }])
    }
  }

  const getCategoryPrompts = (categoryKey: string) => {
    const prompts: Record<string, { intro: string; questions: string[] }> = {
      forward: {
        intro: "Let's start with your Forward section - this sets the tone for your entire vision. What's calling you forward in life right now? What feels like it wants to emerge?",
        questions: []
      },
      fun: {
        intro: 'Now let\'s talk about FUN! What do you enjoy doing? What activities bring you joy and recharge your energy?',
        questions: ['What do you do for fun?', 'What would you like to learn?']
      },
      travel: {
        intro: 'Tell me about your ideal travel and adventure life. Where do you dream of going?',
        questions: ['Where do you want to travel?', 'What experiences excite you?']
      },
      home: {
        intro: 'Let\'s talk about your home and environment. Where do you want to live?',
        questions: ['What does your ideal home look like?', 'Where in the world do you want to be?']
      },
      family: {
        intro: 'Now, let\'s explore your family life. What does your ideal family dynamic look like?',
        questions: ['What kind of family experiences do you want?', 'How do you want to feel in your family?']
      },
      romance: {
        intro: 'Let\'s dive into love and romance. What does your ideal partnership look and feel like?',
        questions: ['What does your ideal relationship feel like?', 'How do you want to connect with your partner?']
      },
      health: {
        intro: 'Your health is your foundation. What does your ideal health and wellness look like?',
        questions: ['How do you want to feel in your body?', 'What health habits energize you?']
      },
      money: {
        intro: 'Let\'s talk about money and abundance. What does financial freedom look like to you?',
        questions: ['What does wealth mean to you?', 'How do you want money to serve you?']
      },
      business: {
        intro: 'Now let\'s explore your career and work life. What lights you up professionally?',
        questions: ['What kind of work energizes you?', 'How do you want to contribute?']
      },
      social: {
        intro: 'Let\'s talk about your social life and friendships. What kind of connections do you want?',
        questions: ['What kind of friends do you want?', 'How do you want to connect with others?']
      },
      possessions: {
        intro: 'What material things would support and enhance your ideal life?',
        questions: ['What possessions would enhance your life?', 'What would make you feel abundant?']
      },
      giving: {
        intro: 'How do you want to contribute to others? What impact do you want to make?',
        questions: ['How do you want to give back?', 'What impact excites you?']
      },
      spirituality: {
        intro: 'Let\'s explore your spirituality and connection to something greater. What does that look like for you?',
        questions: ['How do you want to feel connected?', 'What spiritual practices light you up?']
      },
      conclusion: {
        intro: 'Finally, let\'s wrap up your vision with a conclusion. How do you want to feel about your life overall?',
        questions: []
      }
    }
    
    return prompts[categoryKey] || prompts.forward
  }

  const handleSend = async () => {
    if (!userInput.trim() || loading) return

    const newMessages = [...messages, { role: 'user' as const, content: userInput }]
    setMessages(newMessages)
    setUserInput('')
    setLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    setTimeout(() => {
      const prompts = getCategoryPrompts(currentCategoryData.key)
      const randomResponse = prompts.questions.length > 0 
        ? prompts.questions[Math.floor(Math.random() * prompts.questions.length)]
        : 'That\'s really insightful! Are you ready to move to the next category, or would you like to add more?'

      setMessages(prev => [...prev, {
        role: 'viva',
        content: randomResponse
      }])
      setLoading(false)
    }, 1000)
  }

  const generateVision = async () => {
    setLoading(true)
    try {
      const categoryMessages = messages.filter(m => m.role === 'user')
      const wants = categoryMessages.map(m => m.content)
      
      const res = await fetch('/api/viva/vision/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          category: currentCategoryData.key,
          inputs: {
            wants,
            not_wants: [],
            vent: ''
          }
        })
      })

      const data = await res.json()
      if (data.paragraph) {
        setVisionParagraph(data.paragraph)
        setMessages(prev => [...prev, {
          role: 'viva',
          content: `Great! Here's your vision for ${currentCategoryData.label}:\n\n"${data.paragraph}"\n\nDoes this capture what you want? Ready to move to the next category?`
        }])
      }
    } catch (e: any) {
      alert(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const nextCategory = () => {
    if (currentCategory < VISION_CATEGORIES.length - 1) {
      setCurrentCategory(currentCategory + 1)
      setVisionParagraph(null)
      setMessages([{
        role: 'viva',
        content: `Great job! Let's move to ${VISION_CATEGORIES[currentCategory + 1].label}.`
      }])
      setTimeout(() => {
        startCategory()
      }, 1500)
    } else {
      onComplete({})
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className="flex flex-col gap-6 flex-1 overflow-y-auto pt-6 pb-40"
      >
        {messages.map((message, index) => (
          <div 
            key={index} 
            className="w-full mx-auto max-w-3xl px-4 group/message"
            data-role={message.role}
          >
            <div className="flex gap-4 w-full">
              {message.role === 'viva' && (
                <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
                  <div className="text-lg">✨</div>
                </div>
              )}

              <div className="flex flex-col gap-2 w-full">
                <div 
                  className={`flex flex-col gap-2 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground px-3 py-2 rounded-xl' 
                      : ''
                  }`}
                >
                  {message.isWarmup ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
                  <div className="text-xs font-semibold">You</div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="w-full mx-auto max-w-3xl px-4 group/message">
            <div className="flex gap-4">
              <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
                <div className="text-lg">✨</div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-col gap-2 text-muted-foreground">
                  <p className="text-sm italic">Thinking...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          ref={messagesEndRef}
          className="shrink-0 min-w-[24px] min-h-[24px]"
        />
      </div>

      {/* Next Category Button */}
      {visionParagraph && (
        <div className="border-t border-border bg-background/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <button
              onClick={nextCategory}
              className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-medium hover:bg-primary/90 transition-colors"
            >
              Next Category
            </button>
          </div>
        </div>
      )}
      
      {/* Input area - Fixed at bottom */}
      {!visionParagraph && (
        <div className="border-t border-border bg-background/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="relative w-full flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value)
                  adjustHeight()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Send a message..."
                className="min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-background border border-border pb-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={2}
                autoFocus
              />
              
              <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!userInput.trim() || loading}
                  className="rounded-full p-1.5 h-fit border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
