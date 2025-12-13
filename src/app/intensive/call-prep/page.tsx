'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Video, CheckCircle, ArrowRight } from 'lucide-react'

import { 
  Container, 
  Card, 
  Button,
  Badge,
  Spinner,
  Stack,
  PageHero
} from '@/lib/design-system/components'

export default function CallPrepPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [callTime, setCallTime] = useState<string | null>(null)

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

      // Get intensive and checklist
      const { data: intensiveData } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_status', 'pending')
        .single()

      if (intensiveData) {
        setIntensiveId(intensiveData.id)

        const { data: checklistData } = await supabase
          .from('intensive_checklist')
          .select('*')
          .eq('intensive_id', intensiveData.id)
          .single()

        if (checklistData?.call_scheduled_time) {
          setCallTime(checklistData.call_scheduled_time)
        }
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async () => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('intensive_checklist')
        .update({
          calibration_call_completed: true,
          calibration_call_completed_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId)

      if (error) throw error

      router.push('/intensive/dashboard')
    } catch (error) {
      console.error('Error updating checklist:', error)
    }
  }

  if (loading) {
    return (
      <Container size="lg" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="lg">
        
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
            <Video className="w-4 h-4 inline mr-2" />
            Step 9 of 10
          </Badge>
          
          <h1 className="text-4xl font-bold mb-4">
            Calibration Call Preparation
          </h1>
          <p className="text-xl text-neutral-400">
            Get ready for your 1-on-1 vision calibration session
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Call Details */}
          <Card>
            <h2 className="text-2xl font-bold mb-6">Your Scheduled Call</h2>
            
            {callTime && (
              <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl mb-6">
                <p className="text-sm text-neutral-400 mb-1">Scheduled for:</p>
                <p className="text-xl font-bold text-primary-500">
                  {new Date(callTime).toLocaleString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Join via Zoom</h3>
                <p className="text-sm text-neutral-400 mb-3">
                  You should have received a Zoom link in your confirmation email. Check your inbox!
                </p>
                <Button variant="secondary" size="sm">
                  Open Zoom Link
                </Button>
              </div>

              <div className="pt-4 border-t border-neutral-700">
                <h3 className="font-semibold mb-2">Duration</h3>
                <p className="text-sm text-neutral-400">45 minutes</p>
              </div>
            </div>
          </Card>

          {/* Preparation Checklist */}
          <Card>
            <h2 className="text-2xl font-bold mb-6">Before Your Call</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Review Your Vision</h3>
                  <p className="text-sm text-neutral-400">
                    Take a few minutes to read through your life vision document
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Prepare Questions</h3>
                  <p className="text-sm text-neutral-400">
                    Write down any questions or areas where you need clarity
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Test Your Tech</h3>
                  <p className="text-sm text-neutral-400">
                    Make sure your camera and microphone are working
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Find a Quiet Space</h3>
                  <p className="text-sm text-neutral-400">
                    Choose a private location where you can speak freely
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Have Pen & Paper Ready</h3>
                  <p className="text-sm text-neutral-400">
                    Take notes on insights and action items
                  </p>
                </div>
              </div>
            </div>
          </Card>

        </div>

        {/* After Call Button */}
        <Card className="mt-8 text-center">
          <h3 className="text-xl font-bold mb-4">After Your Call</h3>
          <p className="text-neutral-400 mb-6">
            Once you've completed your calibration call, mark it as complete to continue to the final step.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleMarkComplete}
          >
            Mark Call as Complete
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Card>
    </Container>
  )
}

