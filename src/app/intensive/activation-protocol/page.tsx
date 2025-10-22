'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Rocket, CheckCircle, Music, ImageIcon, BookOpen, Calendar } from 'lucide-react'

import { 
  PageLayout, 
  Container, 
  Card, 
  Button,
  Badge,
  Spinner
} from '@/lib/design-system/components'

export default function ActivationProtocolPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: intensiveData } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_status', 'pending')
        .single()

      if (intensiveData) {
        setIntensiveId(intensiveData.id)
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      const supabase = createClient()
      
      // Mark activation protocol complete
      await supabase
        .from('intensive_checklist')
        .update({
          activation_protocol_completed: true,
          activation_protocol_completed_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId)

      // Mark intensive as complete
      await supabase
        .from('intensive_purchases')
        .update({
          completion_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', intensiveId)

      // TODO: Activate their membership tier here
      // This would trigger the continuity billing to start

      router.push('/intensive/dashboard')
    } catch (error) {
      console.error('Error completing intensive:', error)
      alert('Failed to complete intensive. Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </Container>
      </>
    )
  }

  return (
    <>
      <Container size="lg" className="py-16">
        
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/intensive/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Badge variant="premium" className="mb-4">
            <Rocket className="w-4 h-4 inline mr-2" />
            Step 10 of 10 - Final Step!
          </Badge>
          
          <h1 className="text-4xl font-bold mb-4">
            Your Activation Protocol
          </h1>
          <p className="text-xl text-neutral-400">
            Daily rituals to bring your vision to life
          </p>
        </div>

        {/* Hero Card */}
        <Card variant="elevated" className="mb-8 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30">
          <div className="text-center py-8">
            <Rocket className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Congratulations! 🎉</h2>
            <p className="text-xl text-neutral-300 mb-2">
              You've completed all the foundation steps. Now it's time to activate!
            </p>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          
          {/* Daily Rituals */}
          <Card>
            <h2 className="text-2xl font-bold mb-6">Your Daily Practice</h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Morning Audio (15 min)</h3>
                </div>
                <p className="text-sm text-neutral-400 ml-13">
                  Listen to your vision audio first thing in the morning. This programs your subconscious mind and sets your vibration for the day.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-secondary-500 rounded-xl flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Vision Board Review (5 min)</h3>
                </div>
                <p className="text-sm text-neutral-400 ml-13">
                  View your vision board and feel the emotions of already living your vision. This activates the law of attraction.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Evening Journal (10 min)</h3>
                </div>
                <p className="text-sm text-neutral-400 ml-13">
                  Write about your day, progress, insights, and synchronicities. Track your journey above the Green Line.
                </p>
              </div>
            </div>
          </Card>

          {/* Weekly & Monthly */}
          <Card>
            <h2 className="text-2xl font-bold mb-6">Ongoing Practices</h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Weekly Check-In</h3>
                </div>
                <p className="text-sm text-neutral-400 ml-13">
                  Every Sunday, review your progress, celebrate wins, and adjust your approach. Use VIVA for guidance.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Monthly Vision Refresh</h3>
                </div>
                <p className="text-sm text-neutral-400 ml-13">
                  Update your vision as you evolve. Add new images to your board, refine your audio, capture new insights.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-energy-500 rounded-xl flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Conscious Creations</h3>
                </div>
                <p className="text-sm text-neutral-400 ml-13">
                  Use the platform to track your conscious creations - tangible manifestations of your vision coming to life.
                </p>
              </div>
            </div>
          </Card>

        </div>

        {/* Resources */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Activation Tools</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="ghost" onClick={() => router.push('/life-vision')} className="justify-start">
              <Music className="w-5 h-5 mr-3" />
              Your Vision Audio
            </Button>
            <Button variant="ghost" onClick={() => router.push('/vision-board')} className="justify-start">
              <ImageIcon className="w-5 h-5 mr-3" />
              Your Vision Board
            </Button>
            <Button variant="ghost" onClick={() => router.push('/journal')} className="justify-start">
              <BookOpen className="w-5 h-5 mr-3" />
              Your Journal
            </Button>
          </div>
        </Card>

        {/* Complete Button */}
        <Card className="text-center bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
          <div className="py-8">
            <h2 className="text-3xl font-bold mb-4">Ready to Launch? 🚀</h2>
            <p className="text-xl mb-8">
              Complete your intensive and activate your full membership!
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleComplete}
              disabled={completing}
              className="bg-white text-black hover:bg-gray-100"
            >
              {completing ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Completing...
                </>
              ) : (
                <>
                  Complete Intensive & Activate
                  <Rocket className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>

      </Container>
    </>
  )
}

