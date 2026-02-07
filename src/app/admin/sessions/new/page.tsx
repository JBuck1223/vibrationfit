'use client'

/**
 * Create New Session Page
 * 
 * Form for scheduling a new video session with:
 * - Admin selection (who hosts the meeting)
 * - Participant details (name, email, phone)
 * - Auto-populated title/description based on session type
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Video, 
  Users, 
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle,
  ChevronDown,
  Dumbbell
} from 'lucide-react'
import { 
  PageHero, 
  Container, 
  Button, 
  Card,
  Input,
  Textarea,
  Spinner,
  Stack,
  DatePicker,
  TimePicker
} from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import type { VideoSessionType } from '@/lib/video/types'

interface AdminUser {
  id: string
  email: string
  full_name: string
}

interface FormData {
  title: string
  description: string
  session_type: VideoSessionType
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  // Participant (left side)
  participant_email: string
  participant_name: string
  participant_phone: string
  // Host/Admin (right side)
  host_admin_id: string
  host_email: string
  // Settings
  enable_recording: boolean
  enable_waiting_room: boolean
}

// Session type configurations for auto-populating title/description
const SESSION_TYPE_DEFAULTS: Record<VideoSessionType, { title: string; description: string }> = {
  one_on_one: {
    title: 'Discovery Session',
    description: 'A personalized 1:1 session to explore your goals and how VibrationFit can support your journey.',
  },
  group: {
    title: 'Group Session',
    description: 'Join us for a collaborative group session focused on growth and alignment.',
  },
  alignment_gym: {
    title: 'The Alignment Gym',
    description: 'Weekly live group coaching to keep you calibrated and moving toward your vision. Open to all members.',
  },
  workshop: {
    title: 'Activation Workshop',
    description: 'An intensive workshop session to activate your vision and accelerate your progress.',
  },
  webinar: {
    title: 'Live Event',
    description: 'Join our live event to learn, connect, and elevate together.',
  },
}

function NewSessionContent() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null)
  
  // Admin users list
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  
  const [formData, setFormData] = useState<FormData>({
    title: SESSION_TYPE_DEFAULTS.one_on_one.title,
    description: SESSION_TYPE_DEFAULTS.one_on_one.description,
    session_type: 'one_on_one',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    participant_email: '',
    participant_name: '',
    participant_phone: '',
    host_admin_id: '',
    host_email: '',
    enable_recording: true,
    enable_waiting_room: true,
  })

  // Fetch admin users
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await fetch('/api/admin/users?role=admin')
        if (response.ok) {
          const data = await response.json()
          setAdmins(data.users || [])
          // Set default to first admin
          if (data.users?.length > 0) {
            setFormData(prev => ({
              ...prev,
              host_admin_id: data.users[0].id,
              host_email: data.users[0].email,
            }))
          }
        }
      } catch (err) {
        console.error('Error fetching admins:', err)
      } finally {
        setLoadingAdmins(false)
      }
    }
    
    fetchAdmins()
  }, [])

  // Get default date/time (next hour)
  useEffect(() => {
    const now = new Date()
    now.setHours(now.getHours() + 1, 0, 0, 0)
    
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().slice(0, 5)
    
    setFormData(prev => ({
      ...prev,
      scheduled_date: date,
      scheduled_time: time,
    }))
  }, [])

  // Handle input change
  const handleChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  // Handle session type change - auto-populate title/description
  const handleSessionTypeChange = (type: VideoSessionType) => {
    const defaults = SESSION_TYPE_DEFAULTS[type]
    setFormData(prev => ({
      ...prev,
      session_type: type,
      title: defaults.title,
      description: defaults.description,
    }))
  }

  // Handle admin selection - auto-populate email
  const handleAdminChange = (adminId: string) => {
    const admin = admins.find(a => a.id === adminId)
    setFormData(prev => ({
      ...prev,
      host_admin_id: adminId,
      host_email: admin?.email || '',
    }))
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Please enter a session title')
      }
      if (!formData.scheduled_date || !formData.scheduled_time) {
        throw new Error('Please select a date and time')
      }

      // Combine date and time
      const scheduledAt = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`)
      
      if (scheduledAt <= new Date()) {
        throw new Error('Please select a future date and time')
      }

      // Create session
      const response = await fetch('/api/video/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          session_type: formData.session_type,
          scheduled_at: scheduledAt.toISOString(),
          scheduled_duration_minutes: formData.duration_minutes,
          participant_email: formData.participant_email.trim() || undefined,
          participant_name: formData.participant_name.trim() || undefined,
          participant_phone: formData.participant_phone.trim() || undefined,
          host_admin_id: formData.host_admin_id || undefined,
          enable_recording: formData.enable_recording,
          enable_waiting_room: formData.enable_waiting_room,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session')
      }

      setCreatedSessionId(data.session.id)
      setSuccess(true)
    } catch (err) {
      console.error('Error creating session:', err)
      setError(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (success && createdSessionId) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Card className="bg-neutral-900 border-green-500/30 p-6 md:p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Session Created!</h2>
            <p className="text-neutral-400 mb-6">
              Your video session has been scheduled and invitation sent.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/admin/sessions/${createdSessionId}`)}
              >
                View Session
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push(`/session/${createdSessionId}`)}
              >
                Join Now
              </Button>
            </div>
          </Card>
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="VIDEO SESSIONS"
          title="Schedule a Session"
          subtitle="Create a new video session and invite a participant"
        />

        <Card className="p-4 md:p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Session Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">
                Session Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                  type="button"
                  onClick={() => handleSessionTypeChange('one_on_one')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.session_type === 'one_on_one'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <User className={`w-6 h-6 mx-auto mb-2 ${
                    formData.session_type === 'one_on_one' ? 'text-primary-500' : 'text-neutral-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.session_type === 'one_on_one' ? 'text-white' : 'text-neutral-400'
                  }`}>
                    1:1 Session
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleSessionTypeChange('group')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.session_type === 'group'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <Users className={`w-6 h-6 mx-auto mb-2 ${
                    formData.session_type === 'group' ? 'text-primary-500' : 'text-neutral-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.session_type === 'group' ? 'text-white' : 'text-neutral-400'
                  }`}>
                    Group
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleSessionTypeChange('alignment_gym')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.session_type === 'alignment_gym'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <Dumbbell className={`w-6 h-6 mx-auto mb-2 ${
                    formData.session_type === 'alignment_gym' ? 'text-primary-500' : 'text-neutral-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.session_type === 'alignment_gym' ? 'text-white' : 'text-neutral-400'
                  }`}>
                    Alignment Gym
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleSessionTypeChange('workshop')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.session_type === 'workshop'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <Video className={`w-6 h-6 mx-auto mb-2 ${
                    formData.session_type === 'workshop' ? 'text-primary-500' : 'text-neutral-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.session_type === 'workshop' ? 'text-white' : 'text-neutral-400'
                  }`}>
                    Workshop
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleSessionTypeChange('webinar')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.session_type === 'webinar'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <Users className={`w-6 h-6 mx-auto mb-2 ${
                    formData.session_type === 'webinar' ? 'text-primary-500' : 'text-neutral-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.session_type === 'webinar' ? 'text-white' : 'text-neutral-400'
                  }`}>
                    Webinar
                  </p>
                </button>
              </div>
            </div>

            {/* Two-Column: Participant (Left) & Host/Admin (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT: Invite Participant */}
              <div className="space-y-4 p-4 bg-neutral-800/50 rounded-xl">
                <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-secondary-500" />
                  Invite Participant
                </h3>
                
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">
                    Name
                  </label>
                  <Input
                    type="text"
                    value={formData.participant_name}
                    onChange={(e) => handleChange('participant_name', e.target.value)}
                    placeholder="Participant name"
                    className="bg-neutral-800 border-neutral-700"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">
                    <Mail className="w-3 h-3 inline mr-1" />
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.participant_email}
                    onChange={(e) => handleChange('participant_email', e.target.value)}
                    placeholder="participant@email.com"
                    className="bg-neutral-800 border-neutral-700"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">
                    <Phone className="w-3 h-3 inline mr-1" />
                    Phone (for SMS reminders)
                  </label>
                  <Input
                    type="tel"
                    value={formData.participant_phone}
                    onChange={(e) => handleChange('participant_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="bg-neutral-800 border-neutral-700"
                  />
                </div>
              </div>

              {/* RIGHT: Host/Admin Selection */}
              <div className="space-y-4 p-4 bg-primary-500/5 rounded-xl border border-primary-500/20">
                <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-500" />
                  Session Host (Admin)
                </h3>
                
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">
                    Select Admin
                  </label>
                  <div className="relative">
                    <select
                      value={formData.host_admin_id}
                      onChange={(e) => handleAdminChange(e.target.value)}
                      disabled={loadingAdmins}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {loadingAdmins ? (
                        <option>Loading admins...</option>
                      ) : admins.length === 0 ? (
                        <option>No admins found</option>
                      ) : (
                        admins.map(admin => (
                          <option key={admin.id} value={admin.id}>
                            {admin.full_name || admin.email}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">
                    <Mail className="w-3 h-3 inline mr-1" />
                    Host Email
                  </label>
                  <Input
                    type="email"
                    value={formData.host_email}
                    readOnly
                    className="bg-neutral-900 border-neutral-700 text-neutral-400"
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Session Title *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Discovery Session, Life Vision Review"
                className="bg-neutral-800 border-neutral-700"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Add any notes or agenda for this session..."
                rows={3}
                className="bg-neutral-800 border-neutral-700"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DatePicker
                label="Date *"
                value={formData.scheduled_date}
                onChange={(date) => handleChange('scheduled_date', date)}
                minDate={new Date().toISOString().split('T')[0]}
              />
              <TimePicker
                label="Time *"
                value={formData.scheduled_time}
                onChange={(time) => handleChange('scheduled_time', time)}
                step={15}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Duration
              </label>
              <div className="flex gap-2">
                {[30, 45, 60, 90].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleChange('duration_minutes', mins)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      formData.duration_minutes === mins
                        ? 'bg-primary-500 text-black'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-300">Settings</h3>
              
              <label className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_recording}
                  onChange={(e) => handleChange('enable_recording', e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <p className="text-sm text-white">Enable Recording</p>
                  <p className="text-xs text-neutral-500">Recording will be saved to your resources</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_waiting_room}
                  onChange={(e) => handleChange('enable_waiting_room', e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <p className="text-sm text-white">Enable Waiting Room</p>
                  <p className="text-xs text-neutral-500">Participants wait until you let them in</p>
                </div>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Create Session
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </Stack>
    </Container>
  )
}

export default function NewSessionPageWrapper() {
  return (
    <AdminWrapper>
      <NewSessionContent />
    </AdminWrapper>
  )
}
