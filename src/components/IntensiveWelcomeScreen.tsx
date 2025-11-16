'use client'

import { useState } from 'react'
import { Container, Card, Button, Badge } from '@/lib/design-system/components'
import { 
  User, 
  ClipboardCheck, 
  Calendar, 
  Sparkles, 
  Wand2, 
  Music, 
  ImageIcon, 
  BookOpen, 
  Video, 
  Rocket 
} from 'lucide-react'

interface IntensiveWelcomeScreenProps {
  onStart: () => Promise<void>
}

export function IntensiveWelcomeScreen({ onStart }: IntensiveWelcomeScreenProps) {
  const [starting, setStarting] = useState(false)

  const handleStart = async () => {
    setStarting(true)
    try {
      await onStart()
    } catch (error) {
      console.error('Error starting intensive:', error)
      setStarting(false)
    }
  }

  const phases = [
    {
      title: 'Phase 1: Foundation',
      icon: User,
      items: [
        'Complete your profile',
        'Take vibration assessment',
        'Book calibration call'
      ]
    },
    {
      title: 'Phase 2: Vision Creation',
      icon: Sparkles,
      items: [
        'Build your life vision',
        'Refine with VIVA'
      ]
    },
    {
      title: 'Phase 3: Activation Tools',
      icon: Music,
      items: [
        'Generate vision audio',
        'Create vision board',
        'First journal entry'
      ]
    },
    {
      title: 'Phase 4: Launch',
      icon: Rocket,
      items: [
        'Attend calibration call',
        'Complete activation protocol'
      ]
    }
  ]

  return (
    <Container size="xl">
      <Card variant="elevated" className="p-6 md:p-12">
        
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <Badge variant="premium" className="mb-4">
            72-Hour Vision Activation
          </Badge>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Welcome to Your Transformation
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-400 max-w-3xl mx-auto">
            You&apos;re about to embark on a focused 72-hour journey to activate your life vision. 
            When you&apos;re ready, click below to begin.
          </p>
        </div>

        {/* What's Included */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-2xl font-bold text-center mb-6 md:mb-8">
            Your Activation Journey
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {phases.map((phase, index) => {
              const Icon = phase.icon
              return (
                <Card key={index} variant="outlined" className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold">{phase.title}</h3>
                  </div>
                  
                  <ul className="space-y-2">
                    {phase.items.map((item, i) => (
                      <li key={i} className="text-sm md:text-base text-neutral-400 flex items-start gap-2">
                        <span className="text-primary-500 mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )
            })}
          </div>
        </div>

        {/* What You'll Get */}
        <Card variant="outlined" className="p-6 md:p-8 mb-8 md:mb-12 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 border-primary-500/20">
          <h3 className="text-xl md:text-2xl font-bold text-center mb-6">
            What You'll Accomplish
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-500 mb-2">12</div>
              <div className="text-sm md:text-base text-neutral-400">Life Categories<br/>Completed</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-secondary-500 mb-2">2</div>
              <div className="text-sm md:text-base text-neutral-400">Personalized<br/>Audio Tracks</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent-500 mb-2">1</div>
              <div className="text-sm md:text-base text-neutral-400">Complete<br/>Vision Board</div>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <Button 
            variant="primary"
            size="lg"
            onClick={handleStart}
            disabled={starting}
            className="text-lg md:text-xl px-8 md:px-12 py-4 md:py-6 w-full sm:w-auto"
          >
            {starting ? 'Starting Your Intensive...' : 'Start My 72-Hour Intensive 🚀'}
          </Button>
          
          <p className="text-xs md:text-sm text-neutral-500 mt-4 max-w-2xl mx-auto">
            Your 72-hour timer will begin when you click above. Take your time to prepare—start when you&apos;re ready to focus.
          </p>
        </div>

        {/* Bonus: Testimonial or Encouragement */}
        <div className="mt-8 md:mt-12 pt-8 border-t border-neutral-800 text-center">
          <p className="text-base md:text-lg text-neutral-400 italic">
            &quot;Most people complete their activation in 72 hours. You&apos;re about to join them.&quot;
          </p>
        </div>

      </Card>
    </Container>
  )
}

