'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  ArrowRight,
  Calendar, 
  Clock, 
  Video, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Mail
} from 'lucide-react'
import { checkSuperAdminAccess } from '@/lib/intensive/admin-access'

import { 
  Card, 
  Button, 
  Badge,
  Input,
  Textarea,
  Spinner,
  Container,
  Stack,
  PageHero
} from '@/lib/design-system/components'

interface CalibrationData {
  id: string
  intensive_id: string
  user_id: string
  scheduled_at: string | null
  status: 'pending' | 'scheduled' | 'completed' | 'no_show'
  meeting_link: string | null
  notes: string | null
  created_at: string
}

interface TimeSlot {
  id: string
  date: string
  time: string
  available: boolean
  timezone: string
}

export default function IntensiveCalibration() {
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [loading, setLoading] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    timezone: 'America/New_York'
  })

  const router = useRouter()
  const supabase = createClient()

  // Generate available time slots (next 7 days) - client-side only to avoid hydration mismatch
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = []
    const now = new Date()
    
    for (let day = 1; day <= 7; day++) {
      const date = new Date(now)
      date.setDate(now.getDate() + day)
      
      // Skip weekends for now (you can adjust this)
      if (date.getDay() === 0 || date.getDay() === 6) continue
      
      // Generate slots for each day (9 AM - 5 PM EST)
      const daySlots = [
        '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'
      ]
      
      daySlots.forEach((time, index) => {
        // Use deterministic availability based on index instead of Math.random()
        // to avoid hydration mismatch. Pattern: 70% available
        const isAvailable = (day + index) % 10 < 7
        
        slots.push({
          id: `${date.toISOString().split('T')[0]}-${time}`,
          date: date.toISOString().split('T')[0],
          time: time,
          available: isAvailable,
          timezone: 'America/New_York'
        })
      })
    }
    
    return slots
  }

  useEffect(() => {
    loadCalibrationData()
    setTimeSlots(generateTimeSlots())
  }, [])

  useEffect(() => {
    if (intensiveId) {
      const interval = setInterval(updateTimeRemaining, 1000)
      return () => clearInterval(interval)
    }
  }, [intensiveId])

  const loadCalibrationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check for super_admin access
      const { isSuperAdmin } = await checkSuperAdminAccess(supabase)

      // Get intensive purchase
      const { data: intensiveData, error } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_status', 'pending')
        .single()

      if (error || !intensiveData) {
        // Allow super_admin to access without enrollment
        if (isSuperAdmin) {
          setIntensiveId('super-admin-test-mode')
          setLoading(false)
          return
        }
        router.push('/#pricing')
        return
      }

      setIntensiveId(intensiveData.id)

      // Check if builder is completed
      const { data: checklistData } = await supabase
        .from('intensive_checklist')
        .select('builder_completed')
        .eq('intensive_id', intensiveData.id)
        .single()

      if (!checklistData?.builder_completed) {
        router.push('/intensive/builder')
        return
      }

      // Load or create calibration record
      let { data: calibrationRecord, error: calibrationError } = await supabase
        .from('intensive_calibration') // You might need to create this table
        .select('*')
        .eq('intensive_id', intensiveData.id)
        .single()

      if (calibrationError && calibrationError.code === 'PGRST116') {
        // Create new calibration record
        const { data: newRecord, error: createError } = await supabase
          .from('intensive_calibration')
          .insert({
            intensive_id: intensiveData.id,
            user_id: user.id,
            status: 'pending'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating calibration record:', createError)
        } else {
          setCalibrationData(newRecord)
        }
      } else if (calibrationRecord) {
        setCalibrationData(calibrationRecord)
      }

      // Load user info
      setUserInfo(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || '',
        email: user.email || ''
      }))

    } catch (error) {
      console.error('Error loading calibration data:', error)
    }
  }

  const updateTimeRemaining = async () => {
    if (!intensiveId) return

    try {
      const { data: intensiveData } = await supabase
        .from('intensive_purchases')
        .select('activation_deadline')
        .eq('id', intensiveId)
        .single()

      if (intensiveData?.activation_deadline) {
        const deadline = new Date(intensiveData.activation_deadline)
        const now = new Date()
        const diff = deadline.getTime() - now.getTime()

        if (diff <= 0) {
          setTimeRemaining('Time\'s up!')
          return
        }

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeRemaining(`${hours}h ${minutes}m`)
      }
    } catch (error) {
      console.error('Error updating time:', error)
    }
  }

  const scheduleCalibration = async () => {
    if (!selectedSlot || !calibrationData) return

    setLoading(true)
    try {
      const scheduledDateTime = new Date(`${selectedSlot.date}T${selectedSlot.time}:00`)
      const meetingLink = `https://meet.vibrationfit.com/calibration-${calibrationData.id}`

      // Update calibration record
      const { error: updateError } = await supabase
        .from('intensive_calibration')
        .update({
          scheduled_at: scheduledDateTime.toISOString(),
          status: 'scheduled',
          meeting_link: meetingLink
        })
        .eq('id', calibrationData.id)

      if (updateError) {
        console.error('Error scheduling calibration:', updateError)
        return
      }

      // Update checklist
      await supabase
        .from('intensive_checklist')
        .update({
          calibration_scheduled: true,
          calibration_scheduled_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId!)

      // Send confirmation email (you can integrate with your email service)
      console.log('Calibration scheduled!', {
        date: selectedSlot.date,
        time: selectedSlot.time,
        meetingLink
      })

      setCalibrationData(prev => prev ? {
        ...prev,
        scheduled_at: scheduledDateTime.toISOString(),
        status: 'scheduled',
        meeting_link: meetingLink
      } : null)

    } catch (error) {
      console.error('Error scheduling calibration:', error)
    } finally {
      setLoading(false)
    }
  }

  const completeCalibration = async () => {
    if (!calibrationData) return

    setLoading(true)
    try {
      // Update calibration record
      const { error: updateError } = await supabase
        .from('intensive_calibration')
        .update({
          status: 'completed'
        })
        .eq('id', calibrationData.id)

      if (updateError) {
        console.error('Error completing calibration:', updateError)
        return
      }

      // Update checklist
      await supabase
        .from('intensive_checklist')
        .update({
          calibration_attended: true,
          calibration_attended_at: new Date().toISOString(),
          audios_generated: true,
          audios_generated_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId!)

      // Redirect to activation
      router.push('/intensive/activate')

    } catch (error) {
      console.error('Error completing calibration:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (!calibrationData) {
    return (
      <>
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-6" />
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">Loading Calibration</h1>
          <p className="text-sm md:text-base text-neutral-400">Setting up your calibration session...</p>
        </div>
      </>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Calibration Session"
          subtitle="Schedule your 1:1 calibration call to personalize your activation audios and finalize your vision."
        >
          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/intensive/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            {timeRemaining && (
              <Badge variant="warning">
                <Clock className="w-4 h-4 mr-2" />
                {timeRemaining} remaining
              </Badge>
            )}
          </div>
        </PageHero>

        {/* Status Overview */}
        <Card className="max-w-4xl mx-auto p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Session Status</h2>
            
            {calibrationData.status === 'pending' && (
              <div className="space-y-4">
                <AlertCircle className="w-16 h-16 text-energy-500 mx-auto" />
                <p className="text-neutral-300">
                  Ready to schedule your calibration call. Choose a time that works for you.
                </p>
              </div>
            )}

            {calibrationData.status === 'scheduled' && (
              <div className="space-y-4">
                <Calendar className="w-16 h-16 text-primary-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Calibration Scheduled!</h3>
                  <p className="text-neutral-300 mb-4">
                    {formatDate(calibrationData.scheduled_at!)} at {formatTime(calibrationData.scheduled_at!.split('T')[1].substring(0, 5))}
                  </p>
                  <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 mb-4">
                    <p className="text-sm text-neutral-300 mb-2">
                      <strong>Meeting Link:</strong> {calibrationData.meeting_link}
                    </p>
                    <p className="text-sm text-neutral-400">
                      We'll send you a calendar invite and reminder emails.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {calibrationData.status === 'completed' && (
              <div className="space-y-4">
                <CheckCircle className="w-16 h-16 text-primary-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Calibration Complete!</h3>
                  <p className="text-neutral-300 mb-4">
                    Your personalized audios are being generated. You're ready to activate!
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Scheduling Interface */}
        {calibrationData.status === 'pending' && (
          <>
            {/* User Info */}
            <Card className="max-w-4xl mx-auto p-8 mb-8">
              <h3 className="text-xl font-bold text-white mb-6">Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Full Name *
                  </label>
                  <Input
                    value={userInfo.name}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Phone Number
                  </label>
                  <Input
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Timezone
                  </label>
                  <select 
                    value={userInfo.timezone}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Time Slots */}
            <Card className="max-w-4xl mx-auto p-8 mb-8">
              <h3 className="text-xl font-bold text-white mb-6">Available Times</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      !slot.available
                        ? 'border-neutral-700 bg-neutral-800 opacity-50 cursor-not-allowed'
                        : selectedSlot?.id === slot.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-neutral-700 hover:border-primary-500 hover:bg-primary-500/5'
                    }`}
                    onClick={() => slot.available && setSelectedSlot(slot)}
                  >
                    <div className="text-center">
                      <div className="font-semibold text-white">{formatDate(slot.date)}</div>
                      <div className="text-primary-500">{formatTime(slot.time)}</div>
                      <div className="text-xs text-neutral-400">{slot.timezone}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Schedule Button */}
            <div className="max-w-4xl mx-auto text-center">
              <Button 
                variant="primary" 
                size="lg"
                onClick={scheduleCalibration}
                disabled={!selectedSlot || !userInfo.name || !userInfo.email || loading}
              >
                <Calendar className="w-5 h-5 mr-2" />
                {loading ? 'Scheduling...' : 'Schedule Calibration Call'}
              </Button>
            </div>
          </>
        )}

        {/* Action Buttons */}
        {calibrationData.status === 'scheduled' && (
          <div className="max-w-4xl mx-auto text-center">
            <Button 
              variant="primary" 
              size="lg"
              onClick={completeCalibration}
              disabled={loading}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {loading ? 'Processing...' : 'Complete Calibration'}
            </Button>
          </div>
        )}

        {calibrationData.status === 'completed' && (
          <div className="max-w-4xl mx-auto text-center">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => router.push('/intensive/activate')}
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Start Activation Protocol
            </Button>
          </div>
        )}

        {/* What to Expect */}
        <Card className="max-w-4xl mx-auto p-8 mt-8 border-2 border-secondary-500 bg-gradient-to-br from-secondary-500/10 to-primary-500/10">
          <h3 className="text-xl font-bold text-white mb-6">What to Expect</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">During the Call:</h4>
              <ul className="text-sm text-neutral-300 space-y-1">
                <li>• Review your vision and goals</li>
                <li>• Discuss any challenges or concerns</li>
                <li>• Customize your activation approach</li>
                <li>• Answer questions about the process</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">After the Call:</h4>
              <ul className="text-sm text-neutral-300 space-y-1">
                <li>• Personalized activation audios created</li>
                <li>• Custom affirmation scripts generated</li>
                <li>• Activation protocol finalized</li>
                <li>• Ready to start your 7-day activation</li>
              </ul>
            </div>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
