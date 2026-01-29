'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CheckCircle, ArrowLeft, Video } from 'lucide-react'
import { checkSuperAdminAccess } from '@/lib/intensive/admin-access'
import { ReadOnlySection } from '@/components/IntensiveStepCompletedBanner'
import { IntensiveCompletionBanner } from '@/lib/design-system/components'
import { getStepInfo, getNextStep } from '@/lib/intensive/step-mapping'

import { 
  Container, 
  Card, 
  Button, 
  Input,
  Spinner,
  Stack,
  PageHero
} from '@/lib/design-system/components'

interface TimeSlot {
  id?: string
  date: string
  time: string
  available: boolean
  max_bookings?: number
  current_bookings?: number
  event_type?: string
}

export default function ScheduleCallPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    timezone: 'America/New_York'
  })
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  
  // Completion states
  const [isAlreadyScheduled, setIsAlreadyScheduled] = useState(false)
  const [justScheduled, setJustScheduled] = useState(false)
  const [scheduledTime, setScheduledTime] = useState<string | null>(null)
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
  
  // Step info for banners
  const currentStep = getStepInfo('schedule_call')
  const nextStep = getNextStep('schedule_call')

  useEffect(() => {
    loadIntensiveData()
    loadAvailableSlots()
  }, [])

  const loadIntensiveData = async () => {
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check for super_admin access
      const { isSuperAdmin } = await checkSuperAdminAccess(supabase)

      // Get active intensive
      const { data: intensiveData, error: intensiveError } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_status', 'pending')
        .single()

      if (intensiveError || !intensiveData) {
        // Allow super_admin to access without enrollment
        if (isSuperAdmin) {
          setIntensiveId('super-admin-test-mode')
        } else {
          router.push('/#pricing')
          return
        }
      } else {
        setIntensiveId(intensiveData.id)
      }

      // Check if call is already scheduled
      const { data: checklistData } = await supabase
        .from('intensive_checklist')
        .select('call_scheduled, call_scheduled_at, call_scheduled_time')
        .eq('intensive_id', intensiveData?.id || 'super-admin-test-mode')
        .single()
      
      if (checklistData?.call_scheduled) {
        setIsAlreadyScheduled(true)
        setScheduledAt(checklistData.call_scheduled_at)
        setScheduledTime(checklistData.call_scheduled_time)
      }

      // Get user profile for contact info
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('email, phone, first_name, last_name')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.log('Profile error:', profileError)
      }

      if (profileData) {
        setContactInfo(prev => ({
          ...prev,
          email: profileData.email || user.email || '',
          phone: profileData.phone || prev.phone || ''
        }))
      } else {
        // Fallback to auth user email
        setContactInfo(prev => ({
          ...prev,
          email: user.email || prev.email || ''
        }))
      }
    } catch (error) {
      console.error('Error loading intensive:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    try {
      const supabase = createClient()
      
      // Try generic time_slots table first, fallback to intensive_time_slots
      const { data: genericSlots, error: genericError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('event_type', 'intensive_calibration')
        .eq('available', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (!genericError && genericSlots) {
        const formattedSlots: TimeSlot[] = genericSlots.map(slot => ({
          id: slot.id,
          date: slot.date,
          time: slot.time,
          available: slot.available && (slot.current_bookings || 0) < (slot.max_bookings || 1),
          max_bookings: slot.max_bookings,
          current_bookings: slot.current_bookings,
          event_type: slot.event_type
        }))
        setAvailableSlots(formattedSlots)
        return
      }

      // Fallback to intensive_time_slots
      const { data: intensiveSlots, error: intensiveError } = await supabase
        .from('intensive_time_slots')
        .select('*')
        .eq('available', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (!intensiveError && intensiveSlots) {
        const formattedSlots: TimeSlot[] = intensiveSlots.map(slot => ({
          id: slot.id,
          date: slot.date,
          time: slot.time,
          available: slot.available && (slot.current_bookings || 0) < (slot.max_bookings || 1),
          max_bookings: slot.max_bookings,
          current_bookings: slot.current_bookings
        }))
        setAvailableSlots(formattedSlots)
        return
      }

      // If both fail, generate client-side slots as fallback
      console.warn('Could not load slots from database, using fallback')
      generateTimeSlotsFallback()
    } catch (error) {
      console.error('Error loading available slots:', error)
      generateTimeSlotsFallback()
    }
  }

  const generateTimeSlotsFallback = () => {
    const slots: TimeSlot[] = []
    const now = new Date()
    
    // Generate slots for next 14 days
    for (let i = 1; i <= 14; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + i)
      
      // Skip weekends for now (simple version)
      if (date.getDay() === 0 || date.getDay() === 6) continue
      
      const dateStr = date.toISOString().split('T')[0]
      
      // Available times: 9am-5pm EST in 1-hour blocks
      const times = [
        '09:00', '10:00', '11:00', '12:00', 
        '13:00', '14:00', '15:00', '16:00', '17:00'
      ]
      
      times.forEach(time => {
        slots.push({
          date: dateStr,
          time: time,
          available: true
        })
      })
    }
    
    setAvailableSlots(slots)
  }

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !contactInfo.email || !contactInfo.phone) {
      alert('Please fill in all fields')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Combine date and time
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`)

      // Find the selected slot and update its booking count
      const selectedSlot = availableSlots.find(
        slot => slot.date === selectedDate && slot.time === selectedTime && slot.available
      )

      if (!selectedSlot) {
        alert('This time slot is no longer available. Please select another.')
        setSaving(false)
        return
      }

      // Update time slot booking count (try generic table first)
      if (selectedSlot.id) {
        // Try to update generic time_slots
        const { data: genericSlot } = await supabase
          .from('time_slots')
          .select('current_bookings, max_bookings')
          .eq('id', selectedSlot.id)
          .single()

        if (genericSlot) {
          const newCount = (genericSlot.current_bookings || 0) + 1
          if (newCount >= (genericSlot.max_bookings || 1)) {
            await supabase
              .from('time_slots')
              .update({ available: false, current_bookings: newCount })
              .eq('id', selectedSlot.id)
          } else {
            await supabase
              .from('time_slots')
              .update({ current_bookings: newCount })
              .eq('id', selectedSlot.id)
          }
        } else {
          // Try intensive_time_slots
          const { data: intensiveSlot } = await supabase
            .from('intensive_time_slots')
            .select('current_bookings, max_bookings')
            .eq('id', selectedSlot.id)
            .single()

          if (intensiveSlot) {
            const newCount = (intensiveSlot.current_bookings || 0) + 1
            if (newCount >= (intensiveSlot.max_bookings || 1)) {
              await supabase
                .from('intensive_time_slots')
                .update({ available: false, current_bookings: newCount })
                .eq('id', selectedSlot.id)
            } else {
              await supabase
                .from('intensive_time_slots')
                .update({ current_bookings: newCount })
                .eq('id', selectedSlot.id)
            }
          }
        }
      }

      // Create video session via API
      const sessionResponse = await fetch('/api/video/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Activation Intensive - Calibration Call',
          description: 'Your personalized 1-on-1 vision calibration session',
          session_type: 'one_on_one',
          scheduled_at: scheduledDateTime.toISOString(),
          scheduled_duration_minutes: 45,
          participant_email: contactInfo.email,
          enable_recording: true,
          enable_waiting_room: true,
        }),
      })

      if (!sessionResponse.ok) {
        const sessionError = await sessionResponse.json()
        throw new Error(sessionError.error || 'Failed to create video session')
      }

      const sessionData = await sessionResponse.json()

      // Update checklist with session info
      const { error } = await supabase
        .from('intensive_checklist')
        .update({
          call_scheduled: true,
          call_scheduled_at: new Date().toISOString(),
          call_scheduled_time: scheduledDateTime.toISOString(),
          video_session_id: sessionData.session.id
        })
        .eq('intensive_id', intensiveId)

      if (error) throw error

      // TODO: Send calendar invite and confirmation email
      // This would integrate with email service

      // Redirect to dashboard to show progress with completion toast
      router.push('/intensive/dashboard?completed=schedule_call')
    } catch (error) {
      console.error('Error scheduling call:', error)
      alert('Failed to schedule call. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container size="lg" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  // Group slots by date
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = []
    acc[slot.date].push(slot)
    return acc
  }, {} as Record<string, TimeSlot[]>)

  const dates = Object.keys(slotsByDate).slice(0, 7) // Show next 7 available days

  // Format scheduled time for display
  const formatScheduledTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // SCENARIO B: User is revisiting - call already scheduled
  if (isAlreadyScheduled && !justScheduled && scheduledAt) {
    return (
      <Container size="lg">
        <Stack gap="lg">
          {/* Completion Banner */}
          <IntensiveCompletionBanner 
            stepTitle="Book Calibration Call"
            completedAt={scheduledAt}
          />

          {/* Page Hero - Normal page title */}
          <PageHero
            eyebrow="ACTIVATION INTENSIVE • STEP 12 OF 14"
            title="Book Calibration Call"
            subtitle="Schedule your 1-on-1 vision calibration session"
          />
          
          <ReadOnlySection
            title="Your Scheduled Call"
            helperText="This booking is confirmed. Check your email for the calendar invite."
          >
            <Card className="p-6 bg-neutral-800/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-500/20 border-2 border-primary-500/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    {scheduledTime ? formatScheduledTime(scheduledTime) : 'Scheduled'}
                  </p>
                  <p className="text-sm text-neutral-400">45-minute video call</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                <div className="p-3 bg-neutral-900/50 rounded-lg">
                  <p className="text-neutral-500 mb-1">Email</p>
                  <p className="text-neutral-300">{contactInfo.email}</p>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-lg">
                  <p className="text-neutral-500 mb-1">Phone</p>
                  <p className="text-neutral-300">{contactInfo.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-center">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/sessions')}
                >
                  <Video className="w-4 h-4 mr-2" />
                  View My Meetings
                </Button>
              </div>
            </Card>
          </ReadOnlySection>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        <PageHero
          title="Schedule Your Calibration Call"
          subtitle="Book your personalized 1-on-1 session to activate your transformation"
        />

        {/* What to Expect - 2x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div className="flex items-start gap-3 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
            <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-1">45-Minute Deep Dive</h3>
              <p className="text-xs md:text-sm text-neutral-400">
                Review your profile, assessment results, and vision in detail
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
            <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-1">Personalized Guidance</h3>
              <p className="text-xs md:text-sm text-neutral-400">
                Expert insights on how to refine and actualize your vision
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
            <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-1">Custom Action Plan</h3>
              <p className="text-xs md:text-sm text-neutral-400">
                Leave with a clear roadmap for the next phase of your journey
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
            <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-1">Private Video Call</h3>
              <p className="text-xs md:text-sm text-neutral-400">
                Join directly from your dashboard when it&apos;s time
              </p>
            </div>
          </div>
        </div>

        {/* Scheduling Card - Full Width Below */}
        <Card>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-4 md:mb-6">Select Date & Time</h2>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Choose a Date</label>
                <div className="grid grid-cols-2 gap-3">
                  {dates.map(date => {
                    const dateObj = new Date(date)
                    const isSelected = selectedDate === date
                    return (
                      <button
                        key={date}
                        onClick={() => {
                          setSelectedDate(date)
                          setSelectedTime('') // Reset time when date changes
                        }}
                        className={`
                          p-4 rounded-xl border-2 transition-all
                          ${isSelected 
                            ? 'border-primary-500 bg-primary-500/10' 
                            : 'border-neutral-700 hover:border-neutral-600'
                          }
                        `}
                      >
                        <p className="text-sm text-neutral-400">
                          {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-lg font-semibold">
                          {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">Choose a Time (EST)</label>
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {slotsByDate[selectedDate]?.map(slot => {
                      const isSelected = selectedTime === slot.time
                      return (
                        <button
                          key={slot.time}
                          onClick={() => setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`
                            px-3 py-2 rounded-lg border transition-all text-sm
                            ${isSelected 
                              ? 'border-primary-500 bg-primary-500 text-white' 
                              : slot.available
                                ? 'border-neutral-700 hover:border-primary-500'
                                : 'border-neutral-800 opacity-50 cursor-not-allowed'
                            }
                          `}
                        >
                          {slot.time}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Timezone</label>
                  <select
                    value={contactInfo.timezone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                  >
                    <option value="America/New_York">Eastern (EST)</option>
                    <option value="America/Chicago">Central (CST)</option>
                    <option value="America/Denver">Mountain (MST)</option>
                    <option value="America/Los_Angeles">Pacific (PST)</option>
                  </select>
                </div>
              </div>

              {/* Schedule Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={handleSchedule}
                disabled={!selectedDate || !selectedTime || !contactInfo.email || !contactInfo.phone || saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5 mr-2" />
                    Schedule Call
                  </>
                )}
              </Button>

              <p className="text-xs text-neutral-500 text-center mt-4">
                You&apos;ll receive a calendar invite via email
              </p>
        </Card>
      </Stack>
    </Container>
  )
}

