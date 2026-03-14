'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Video, CheckCircle, ArrowRight, Clock, Calendar, ExternalLink } from 'lucide-react'
import { checkSuperAdminAccess } from '@/lib/intensive/admin-access'

import { 
  Container, 
  Card, 
  Button,
  Spinner,
  PageHero
} from '@/lib/design-system/components'

export default function CallPrepPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [callTime, setCallTime] = useState<string | null>(null)
  const [meetingLink, setMeetingLink] = useState<string | null>(null)

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

      const { data: checklistRow } = await supabase
        .from('intensive_checklist')
        .select('intensive_id, call_scheduled_time')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checklistRow) {
        setIntensiveId(checklistRow.intensive_id)
        if (checklistRow.call_scheduled_time) {
          setCallTime(checklistRow.call_scheduled_time)
        }

        const { data: calibrationRow } = await supabase
          .from('intensive_calibration')
          .select('meeting_link, scheduled_at')
          .eq('intensive_id', checklistRow.intensive_id)
          .maybeSingle()

        if (calibrationRow) {
          if (calibrationRow.meeting_link) {
            setMeetingLink(calibrationRow.meeting_link)
          }
          if (!checklistRow.call_scheduled_time && calibrationRow.scheduled_at) {
            setCallTime(calibrationRow.scheduled_at)
          }
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
        <PageHero
          eyebrow="CALIBRATION CALL"
          title="Calibration Call Preparation"
          subtitle="Get ready for your 1-on-1 vision calibration session"
        >
          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/intensive/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </PageHero>

        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          
          {/* Call Details - Redesigned */}
          <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/40 via-[#00FFFF]/20 to-[#BF00FF]/30">
            <div className="rounded-2xl bg-neutral-900 p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#39FF14]/15 border border-[#39FF14]/30 flex items-center justify-center">
                  <Video className="w-5 h-5 text-[#39FF14]" />
                </div>
                <h2 className="text-2xl font-bold">Your Scheduled Call</h2>
              </div>
              
              {callTime && (
                <div className="relative mb-6 p-5 rounded-xl bg-gradient-to-br from-[#39FF14]/10 via-transparent to-[#00FFFF]/5 border border-[#39FF14]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-[#39FF14]/70" />
                    <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">Scheduled for</p>
                  </div>
                  <p className="text-xl font-bold text-white">
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

              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold mb-2 text-white">Join Video Session</h3>
                  <p className="text-sm text-neutral-400 mb-3">
                    You should have received a link in your confirmation email. Check your inbox!
                  </p>
                  {meetingLink ? (
                    <a href={meetingLink} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Join Video Session
                      </Button>
                    </a>
                  ) : (
                    <Button variant="secondary" size="sm" disabled>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Link Not Yet Available
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-neutral-700/50">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider">Duration</p>
                    <p className="text-sm font-medium text-neutral-200">45 minutes</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-700/50">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleMarkComplete}
                >
                  Mark Call as Complete
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>

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

        {/* After Call */}
        <Card className="mt-8 text-center">
          <h3 className="text-xl font-bold mb-4">After Your Call</h3>
          <p className="text-neutral-400 mb-6">
            Your calibration call will be marked complete automatically when the session ends. If it wasn't updated, you can mark it manually below.
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleMarkComplete}
          >
            Mark Call as Complete Manually
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Card>
    </Container>
  )
}

