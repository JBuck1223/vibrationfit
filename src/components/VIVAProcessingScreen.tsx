// src/components/VIVAProcessingScreen.tsx
'use client'

import { useState, useEffect } from 'react'
import { Sparkles, CheckCircle, Loader2 } from 'lucide-react'
import { analyzeProfile, analyzeAssessment, ProfileInsights, AssessmentInsights } from '@/lib/viva/profile-analyzer'
import { generateCustomOpening, CustomConversation } from '@/lib/viva/conversation-generator'
import { createClient } from '@/lib/supabase/client'

interface VIVAProcessingScreenProps {
  userId: string
  onComplete: (conversation: CustomConversation) => void
  onError: (error: string) => void
}

export function VIVAProcessingScreen({ userId, onComplete, onError }: VIVAProcessingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(true)
  const [conversation, setConversation] = useState<CustomConversation | null>(null)
  
  const processingSteps = [
    {
      id: 'profile',
      text: "VIVA is evaluating your profile...",
      description: "Analyzing your personal details, values, and life story"
    },
    {
      id: 'assessment',
      text: "VIVA is analyzing your assessment results...",
      description: "Reviewing your vibration scores and green line status"
    },
    {
      id: 'details',
      text: "VIVA is processing your unique details...",
      description: "Connecting patterns and identifying key insights"
    },
    {
      id: 'gameplan',
      text: "VIVA is creating your custom game plan...",
      description: "Building a personalized approach for your vision"
    }
  ]
  
  // Ensure we handle all 4 steps
  const shouldShowStep = (index: number) => index < currentStep
  
  useEffect(() => {
    const processData = async () => {
      try {
        const supabase = createClient()
        
        // Show first step
        await new Promise(resolve => setTimeout(resolve, 1000))
        setCurrentStep(1)
        
        const profileInsights = await analyzeProfile(userId, supabase)
        
        // Show second step
        await new Promise(resolve => setTimeout(resolve, 800))
        setCurrentStep(2)
        
        const assessmentInsights = await analyzeAssessment(userId, supabase)
        
        // Show third step
        await new Promise(resolve => setTimeout(resolve, 800))
        setCurrentStep(3)
        
        // Show final step
        await new Promise(resolve => setTimeout(resolve, 800))
        setCurrentStep(4)
        
        // Give the 4th step time to be visible
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const customConversation = await generateCustomOpening(profileInsights, assessmentInsights)
        
        // Store conversation in state and mark processing complete
        setConversation(customConversation)
        setIsProcessing(false)
        
        // Auto-advance after 1.5 seconds to conversation
        const timer = setTimeout(() => {
          onComplete(customConversation)
        }, 1500)
        
        // Cleanup
        return () => clearTimeout(timer)
        
      } catch (error) {
        console.error('Processing error:', error)
        onError(error instanceof Error ? error.message : 'Failed to process your data')
      }
    }
    
    processData()
  }, [userId, onComplete, onError])
  
  if (conversation && !isProcessing) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center px-6">
          <div className="mb-8">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">VIVA is Ready</h2>
            <p className="text-neutral-400">Your personalized vision experience is prepared</p>
          </div>
          
          <div className="bg-neutral-800/50 rounded-2xl p-8 border border-neutral-700">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-primary-500 mb-2">VIVA</h3>
                <p className="text-neutral-300 leading-relaxed">{conversation.opening}</p>
              </div>
            </div>
            
            <div className="text-sm text-neutral-400">
              <p>Preparing your vision building experience...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-6">
        <div className="mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">VIVA is Working</h2>
          <p className="text-neutral-400">Building your personalized vision experience</p>
        </div>
        
        <div className="space-y-4">
          {processingSteps.map((step, index) => {
            const isActive = index === currentStep - 1
            const isCompleted = index < currentStep - 1
            
            return (
              <div 
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                  isCompleted
                    ? 'bg-primary-500/10 border border-primary-500/30' 
                    : isActive
                    ? 'bg-primary-500/5 border border-primary-500/20'
                    : 'bg-neutral-800/50'
                }`}
              >
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-primary-500" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-neutral-600" />
                  )}
                </div>
                
                <div className="text-left flex-1">
                  <p className={`text-sm font-medium ${
                    isActive || isCompleted ? 'text-primary-500' : 'text-neutral-400'
                  }`}>
                    {step.text}
                  </p>
                  <p className={`text-xs mt-1 ${
                    isActive || isCompleted ? 'text-neutral-300' : 'text-neutral-500'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2 text-sm text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>This usually takes 10-15 seconds</span>
          </div>
        </div>
      </div>
    </div>
  )
}
