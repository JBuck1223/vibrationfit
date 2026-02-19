'use client'

import { useState } from 'react'
import { Container, Card, Button } from '@/lib/design-system/components'
import { Rocket, Sparkles, TrendingUp } from 'lucide-react'

interface IntensiveCompletionScreenProps {
  onComplete: () => Promise<void>
  completionTimeHours?: number
  startedAt?: string
}

export function IntensiveCompletionScreen({ 
  onComplete, 
  completionTimeHours,
  startedAt 
}: IntensiveCompletionScreenProps) {
  const [completing, setCompleting] = useState(false)

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await onComplete()
    } catch (error) {
      console.error('Error completing intensive:', error)
      setCompleting(false)
    }
  }

  // Calculate if they finished within 72 hours
  const finishedOnTime = completionTimeHours && completionTimeHours <= 72

  return (
    <Container size="xl">
      <Card 
        variant="elevated" 
        className="p-12 text-center bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30"
      >
        
        {/* Celebration Icons */}
        <div className="flex justify-center gap-4 mb-6 text-5xl">
          <span className="animate-bounce">🎉</span>
          <span className="animate-bounce delay-100">🎊</span>
          <span className="animate-bounce delay-200">✨</span>
        </div>

        {/* Main Message */}
        <Rocket className="w-16 h-16 mx-auto mb-4 text-primary-500" />
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Intensive Complete!
        </h1>
        
        <p className="text-xl md:text-2xl text-neutral-300 mb-8">
          {completionTimeHours ? (
            finishedOnTime ? (
              <>You activated your vision in <span className="text-primary-500 font-bold">{Math.round(completionTimeHours)} hours</span>!</>
            ) : (
              <>You completed your activation journey!</>
            )
          ) : (
            <>You&apos;ve completed your activation journey!</>
          )}
        </p>

        {/* Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
          <Card variant="outlined" className="p-6">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-lg font-semibold mb-1">10 Steps</div>
            <div className="text-sm text-neutral-400">All Complete</div>
          </Card>
          
          <Card variant="outlined" className="p-6">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-lg font-semibold mb-1">Vision Activated</div>
            <div className="text-sm text-neutral-400">12 Categories</div>
          </Card>
          
          <Card variant="outlined" className="p-6">
            <div className="text-4xl mb-2">🚀</div>
            <div className="text-lg font-semibold mb-1">Ready to Launch</div>
            <div className="text-sm text-neutral-400">Full Access</div>
          </Card>
        </div>

        {/* Message */}
        <div className="mb-8 max-w-2xl mx-auto">
          <p className="text-lg text-neutral-300 mb-4">
            You're now ready to live in your vision. Your full Vibration Fit platform access is unlocked.
          </p>
          <p className="text-base text-neutral-400">
            Continue your journey with vision boards, audio tracks, daily journaling, and more.
          </p>
        </div>

        {/* CTA */}
        <Button 
          variant="primary"
          size="lg"
          onClick={handleComplete}
          disabled={completing}
          className="text-xl px-12 py-6"
        >
          {completing ? 'Unlocking...' : 'Enter Your Dashboard →'}
        </Button>

        {/* Footer Message */}
        <div className="mt-8 pt-8 border-t border-neutral-700">
          <div className="flex items-center justify-center gap-2 text-primary-500">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">You're Above the Green Line</span>
          </div>
        </div>

      </Card>
    </Container>
  )
}

