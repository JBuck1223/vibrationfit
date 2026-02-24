'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getActiveIntensiveClient } from '@/lib/intensive/utils-client'
import { Calendar, CheckCircle, Video, Loader2 } from 'lucide-react'
import { checkSuperAdminAccess } from '@/lib/intensive/admin-access'
import { ReadOnlySection } from '@/components/IntensiveStepCompletedBanner'
import { IntensiveCompletionBanner } from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'

import { 
  Container, 
  Card, 
  Button, 
  Input,
  Spinner,
  Stack,
  PageHero
} from '@/lib/design-system/components'

const CALIBRATION_CALL_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/12-book-a-call-1080p.mp4'
const CALIBRATION_CALL_POSTER =
  'https://media.vibrationfit.com/site-assets/video/intensive/12-book-a-call-thumb.0000000.jpg'

// Types
interface AvailableSlot {
  staff_id: string
  staff_name: string
  time: string
  date: string
}

interface AvailableStaff {
  id: string
  display_name: string
  default_buffer_minutes: number
  availability: {
    [day: string]: {
      enabled: boolean
      start: string
      end: string
    }
  }
}

interface CalendarEvent {
  staff_id: string
  scheduled_at: string
  end_at: string
}

const EVENT_TYPE = 'intensive_calibration'
const SLOT_DURATION = 45 // minutes
const MEETING_TYPE = 'video' as const

export default function ScheduleCallPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  
  // Date/time selection
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  
  // Available data
  const [availableStaff, setAvailableStaff] = useState<AvailableStaff[]>([])
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([])
  
  // Contact info
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    timezone: 'America/New_York'
  })

  // Format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (value: string): string => {
    if (!value) return ''
    const cleaned = value.replace(/\D/g, '')
    const limited = cleaned.slice(0, 10)
    
    if (limited.length <= 3) {
      return limited
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
    }
  }
  
  // Completion states
  const [isAlreadyScheduled, setIsAlreadyScheduled] = useState(false)
  const [scheduledTime, setScheduledTime] = useState<string | null>(null)
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      loadSlotsForDate(selectedDate)
    }
  }, [selectedDate])

  const loadInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { isSuperAdmin } = await checkSuperAdminAccess(supabase)

      // Use centralized intensive check (source of truth: intensive_checklist.status)
      const intensiveData = await getActiveIntensiveClient()

      if (!intensiveData) {
        if (isSuperAdmin) {
          setIntensiveId('super-admin-test-mode')
        } else {
          router.push('/#pricing')
          return
        }
      } else {
        setIntensiveId(intensiveData.intensive_id)
      }

      // Check if call is already scheduled (data is in intensiveData)
      if (intensiveData?.call_scheduled) {
        setIsAlreadyScheduled(true)
        setScheduledAt(intensiveData.call_scheduled_at || intensiveData.created_at)
        if (intensiveData.call_scheduled_time) {
          setScheduledTime(intensiveData.call_scheduled_time)
        }
      }

      // Get user account for contact info (primary source)
      const { data: accountData } = await supabase
        .from('user_accounts')
        .select('email, phone')
        .eq('id', user.id)
        .single()

      // Priority: user_accounts > auth user
      const rawPhone = accountData?.phone || ''
      setContactInfo(prev => ({
        ...prev,
        email: accountData?.email || user.email || '',
        phone: formatPhoneNumber(rawPhone)
      }))

      await loadAvailableStaff()
      
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableStaff = async () => {
    try {
      const { data: staffData, error } = await supabase
        .from('staff')
        .select('id, display_name, default_buffer_minutes, availability, event_types')
        .eq('is_active', true)
        .contains('event_types', [EVENT_TYPE])

      if (error) throw error

      setAvailableStaff(staffData || [])
      const dates = generateAvailableDates(staffData || [])
      setAvailableDates(dates)
      
    } catch (error) {
      console.error('Error loading staff:', error)
    }
  }

  const generateAvailableDates = (staffList: AvailableStaff[]): string[] => {
    const dates: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    
    for (let i = 1; i <= 28; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dayName = dayNames[date.getDay()]
      
      const hasAvailableStaff = staffList.some(staff => 
        staff.availability?.[dayName]?.enabled === true
      )
      
      if (hasAvailableStaff) {
        dates.push(date.toISOString().split('T')[0])
      }
      
      if (dates.length >= 7) break
    }
    
    return dates
  }

  const loadSlotsForDate = async (date: string) => {
    setLoadingSlots(true)
    setSelectedTime('')
    setSelectedStaffId(null)
    
    try {
      const dateObj = new Date(date + 'T00:00:00')
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[dateObj.getDay()]
      
      // Get ALL blocking calendar events for this date (bookings + personal + travel)
      const { data: blockingEvents } = await supabase
        .from('calendar_events')
        .select('staff_id, scheduled_at, end_at')
        .gte('scheduled_at', `${date}T00:00:00`)
        .lt('end_at', `${date}T23:59:59`)
        .eq('blocks_availability', true)
        .neq('status', 'cancelled')

      // Build map of blocked times per staff
      const blockedByStaff = new Map<string, Array<{ start: number, end: number }>>()
      
      blockingEvents?.forEach((event: CalendarEvent) => {
        if (!event.staff_id) return
        const startTime = new Date(event.scheduled_at)
        const endTime = new Date(event.end_at)
        
        // Only consider events on this specific date
        if (startTime.toISOString().split('T')[0] !== date) return
        
        const startMinutes = startTime.getHours() * 60 + startTime.getMinutes()
        const endMinutes = endTime.getHours() * 60 + endTime.getMinutes()
        
        if (!blockedByStaff.has(event.staff_id)) {
          blockedByStaff.set(event.staff_id, [])
        }
        blockedByStaff.get(event.staff_id)!.push({ start: startMinutes, end: endMinutes })
      })

      // Generate available slots for each staff member
      const slots: AvailableSlot[] = []
      
      for (const staff of availableStaff) {
        const dayAvail = staff.availability?.[dayName]
        if (!dayAvail?.enabled) continue
        
        const [startH, startM] = dayAvail.start.split(':').map(Number)
        const [endH, endM] = dayAvail.end.split(':').map(Number)
        
        let currentMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM
        const staffBlocked = blockedByStaff.get(staff.id) || []
        const buffer = staff.default_buffer_minutes || 15
        
        while (currentMinutes + SLOT_DURATION <= endMinutes) {
          const slotEnd = currentMinutes + SLOT_DURATION
          
          // Check if this slot conflicts with any blocked time
          const hasConflict = staffBlocked.some(blocked => 
            (currentMinutes < blocked.end && slotEnd > blocked.start)
          )
          
          if (!hasConflict) {
            const hours = Math.floor(currentMinutes / 60)
            const mins = currentMinutes % 60
            const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
            
            slots.push({
              staff_id: staff.id,
              staff_name: staff.display_name,
              time: timeStr,
              date: date
            })
          }
          
          currentMinutes += SLOT_DURATION + buffer
        }
      }
      
      slots.sort((a, b) => a.time.localeCompare(b.time))
      setAvailableSlots(slots)
      
    } catch (error) {
      console.error('Error loading slots:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

  const formatTime12h = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
  }

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !contactInfo.email || !contactInfo.phone) {
      alert('Please fill in all fields')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`)
      
      // Find staff for this slot
      let assignedStaffId = selectedStaffId
      let assignedStaffName = ''
      
      if (!assignedStaffId) {
        const availableSlot = availableSlots.find(s => s.time === selectedTime)
        if (availableSlot) {
          assignedStaffId = availableSlot.staff_id
          assignedStaffName = availableSlot.staff_name
        } else {
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, display_name')
            .eq('is_active', true)
            .contains('event_types', [EVENT_TYPE])
            .limit(1)
            .single()
          
          if (staffData) {
            assignedStaffId = staffData.id
            assignedStaffName = staffData.display_name
          }
        }
      } else {
        const staffMember = availableStaff.find(s => s.id === assignedStaffId)
        assignedStaffName = staffMember?.display_name || ''
      }

      // Create video session (only if meeting type is video)
      let videoSessionId = null
      if (MEETING_TYPE === 'video') {
        const sessionResponse = await fetch('/api/video/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: assignedStaffName 
              ? `Calibration Call with ${assignedStaffName}`
              : 'Activation Intensive - Calibration Call',
            description: 'Your personalized 1-on-1 vision calibration session',
            session_type: 'one_on_one',
            scheduled_at: scheduledDateTime.toISOString(),
            scheduled_duration_minutes: SLOT_DURATION,
            participant_email: contactInfo.email,
            enable_recording: true,
            enable_waiting_room: true,
            staff_id: assignedStaffId,
            event_type: EVENT_TYPE
          }),
        })

        if (!sessionResponse.ok) {
          const sessionError = await sessionResponse.json()
          throw new Error(sessionError.error || 'Failed to create video session')
        }

        const sessionData = await sessionResponse.json()
        videoSessionId = sessionData.session.id
        console.log('Video session created:', videoSessionId, sessionData.session.daily_room_url)
      }

      // Create booking (this auto-creates calendar_event via trigger)
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          staff_id: assignedStaffId,
          user_id: user.id,
          event_type: EVENT_TYPE,
          title: assignedStaffName 
            ? `Calibration Call with ${assignedStaffName}`
            : 'Activation Intensive - Calibration Call',
          description: 'Your personalized 1-on-1 vision calibration session',
          scheduled_at: scheduledDateTime.toISOString(),
          duration_minutes: SLOT_DURATION,
          timezone: contactInfo.timezone,
          meeting_type: MEETING_TYPE,
          video_session_id: videoSessionId,
          contact_email: contactInfo.email,
          contact_phone: contactInfo.phone,
          status: 'confirmed'
        })
        .select()
        .single()

      if (bookingError) {
        console.error('Booking insert error:', bookingError)
        throw new Error(`Booking failed: ${bookingError.message}`)
      }
      
      console.log('Booking created:', booking.id, 'with video_session_id:', booking.video_session_id)

      // Update intensive checklist
      const { error: checklistError } = await supabase
        .from('intensive_checklist')
        .update({
          call_scheduled: true,
          call_scheduled_at: new Date().toISOString(),
          call_scheduled_time: scheduledDateTime.toISOString()
        })
        .eq('intensive_id', intensiveId)

      if (checklistError) {
        console.error('Checklist update error:', checklistError)
        throw new Error(`Checklist update failed: ${checklistError.message}`)
      }

      router.push('/intensive/dashboard?completed=schedule_call')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('Error scheduling call:', errorMessage, error)
      alert(`Failed to schedule call: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const uniqueTimes = [...new Set(availableSlots.map(s => s.time))].sort()

  if (loading) {
    return (
      <Container size="lg" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

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

  if (isAlreadyScheduled && scheduledAt) {
    return (
      <Container size="lg">
        <Stack gap="lg">
          <IntensiveCompletionBanner 
            stepTitle="Schedule Your Calibration Call"
            completedAt={scheduledAt}
          />

          <PageHero
            eyebrow="ACTIVATION INTENSIVE • STEP 12 OF 14"
            title="Schedule Your Calibration Call"
            subtitle="Book your 1‑on‑1 Graduate session to lock in your gains and design your next 28 days with MAP."
          >
            <div className="mx-auto w-full max-w-3xl mb-6">
              <OptimizedVideo
                url={CALIBRATION_CALL_VIDEO}
                thumbnailUrl={CALIBRATION_CALL_POSTER}
                context="single"
                className="w-full"
              />
            </div>
          </PageHero>
          
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
                  <p className="text-sm text-neutral-400">{SLOT_DURATION}-minute video call</p>
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
          eyebrow="ACTIVATION INTENSIVE • STEP 12 OF 14"
          title="Schedule Your Calibration Call"
          subtitle="Book your 1‑on‑1 Graduate session to lock in your gains and design your next 28 days with MAP."
        >
          <div className="mx-auto w-full max-w-3xl mb-6">
            <OptimizedVideo
              url={CALIBRATION_CALL_VIDEO}
              thumbnailUrl={CALIBRATION_CALL_POSTER}
              context="single"
              className="w-full"
            />
          </div>
        </PageHero>

        {/* What to Expect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div className="flex items-start gap-3 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
            <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-1">45-Minute Private Video Call</h3>
              <p className="text-xs md:text-sm text-neutral-400">
                Join directly from your dashboard when it&apos;s time
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
            <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-1">Graduate Review</h3>
              <p className="text-xs md:text-sm text-neutral-400">
                Reflect on your 72‑hour journey and biggest shifts.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
            <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-1">MAP Setup</h3>
              <p className="text-xs md:text-sm text-neutral-400">
                Customize your 28‑Day My Activation Plan so it fits your real life.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
            <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-1">Badge Roadmap</h3>
              <p className="text-xs md:text-sm text-neutral-400">
                See exactly which milestones you can hit and how to earn them.
              </p>
            </div>
          </div>
        </div>

        {/* Scheduling Card */}
        <Card>
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-2 text-center">Select Date & Time</h2>
          <p className="text-sm text-neutral-400 mb-6 text-center">
            Within 7 days is ideal. Pick a date and time that you can fully protect, like you would a meeting with your future self.
          </p>

          {availableStaff.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <p>No availability found. Please check back later or contact support.</p>
            </div>
          ) : (
            <>
              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Choose a Date</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {availableDates.map(date => {
                    const dateObj = new Date(date + 'T00:00:00')
                    const isSelected = selectedDate === date
                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
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
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                      <span className="ml-2 text-neutral-400">Loading available times...</span>
                    </div>
                  ) : uniqueTimes.length === 0 ? (
                    <div className="text-center py-8 text-neutral-400">
                      No times available on this date. Please select another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {uniqueTimes.map(time => {
                        const isSelected = selectedTime === time
                        return (
                          <button
                            key={time}
                            onClick={() => {
                              setSelectedTime(time)
                              const slot = availableSlots.find(s => s.time === time)
                              setSelectedStaffId(slot?.staff_id || null)
                            }}
                            className={`
                              px-3 py-2 rounded-lg border transition-all text-sm
                              ${isSelected 
                                ? 'border-primary-500 bg-primary-500 text-black font-semibold' 
                                : 'border-neutral-700 hover:border-primary-500'
                              }
                            `}
                          >
                            {formatTime12h(time)}
                          </button>
                        )
                      })}
                    </div>
                  )}
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
                    placeholder="(555) 123-4567"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                  />
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
            </>
          )}
        </Card>
      </Stack>
    </Container>
  )
}
