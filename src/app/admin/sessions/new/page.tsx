'use client'

/**
 * Create New Session Page
 *
 * Form for scheduling a new video session with:
 * - User lookup for participant (or manual name/email/phone)
 * - Session types including Calibration Call
 * - Admin selection (who hosts the meeting)
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Video,
  Users,
  User,
  Mail,
  Phone,
  CheckCircle,
  ChevronDown,
  Dumbbell,
  Search,
  X,
  PhoneCall,
  Repeat,
  Calendar,
  Minus,
  Plus,
  FlaskConical,
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

interface LookupUser {
  id: string
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  phone?: string
}

type SessionTypeKey = VideoSessionType | 'calibration_call'

interface FormData {
  title: string
  description: string
  session_type: SessionTypeKey
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  participant_user_id: string
  participant_email: string
  participant_name: string
  participant_phone: string
  host_admin_id: string
  host_email: string
  enable_recording: boolean
  enable_waiting_room: boolean
}

const SESSION_TYPE_DEFAULTS: Record<SessionTypeKey, { title: string; description: string; apiType: VideoSessionType; duration?: number }> = {
  one_on_one: {
    title: 'Discovery Session',
    description: 'A personalized 1:1 session to explore your goals and how VibrationFit can support your journey.',
    apiType: 'one_on_one',
  },
  calibration_call: {
    title: 'Calibration Call',
    description: 'Your Activation Intensive calibration call to get aligned and set up for success.',
    apiType: 'one_on_one',
    duration: 45,
  },
  group: {
    title: 'Group Session',
    description: 'Join us for a collaborative group session focused on growth and alignment.',
    apiType: 'group',
  },
  alignment_gym: {
    title: 'The Alignment Gym',
    description: 'Weekly live group coaching to keep you calibrated and moving toward your vision. Open to all members.',
    apiType: 'alignment_gym',
  },
  workshop: {
    title: 'Activation Workshop',
    description: 'An intensive workshop session to activate your vision and accelerate your progress.',
    apiType: 'workshop',
  },
  webinar: {
    title: 'Live Event',
    description: 'Join our live event to learn, connect, and elevate together.',
    apiType: 'webinar',
  },
  test_1on1: {
    title: 'Test 1:1 Session',
    description: 'Admin-only test session using 1:1 flow (recording, controls). Not visible to members.',
    apiType: 'test_1on1',
  },
  test_group: {
    title: 'Test Group Session',
    description: 'Admin-only test session using group flow (recording, controls). Not visible to members.',
    apiType: 'test_group',
  },
}

function NewSessionContent() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null)
  const [createdCount, setCreatedCount] = useState(1)
  
  const [repeatWeekly, setRepeatWeekly] = useState(false)
  const [repeatWeeks, setRepeatWeeks] = useState(8)
  const [testMode, setTestMode] = useState(false)
  
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
    participant_user_id: '',
    participant_email: '',
    participant_name: '',
    participant_phone: '',
    host_admin_id: '',
    host_email: '',
    enable_recording: true,
    enable_waiting_room: true,
  })

  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<LookupUser[]>([])
  const [userSearchLoading, setUserSearchLoading] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [selectedLookupUser, setSelectedLookupUser] = useState<LookupUser | null>(null)

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
            const defaultHost = data.users.find((a: AdminUser) => a.email === 'jordan@vibrationfit.com') || data.users[0]
            setFormData(prev => ({
              ...prev,
              host_admin_id: defaultHost.id,
              host_email: defaultHost.email,
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

  // User search (debounced)
  useEffect(() => {
    if (!userSearchQuery || userSearchQuery.length < 2) {
      setUserSearchResults([])
      setShowUserDropdown(false)
      return
    }
    const t = setTimeout(async () => {
      setUserSearchLoading(true)
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearchQuery)}`)
        const data = await res.json()
        if (res.ok && Array.isArray(data.users)) {
          setUserSearchResults(data.users)
          setShowUserDropdown(true)
        } else {
          setUserSearchResults([])
        }
      } catch {
        setUserSearchResults([])
      } finally {
        setUserSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [userSearchQuery])

  const handleSelectUser = useCallback((u: LookupUser) => {
    const name = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
    setFormData(prev => ({
      ...prev,
      participant_user_id: u.id,
      participant_name: name,
      participant_email: u.email || '',
      participant_phone: u.phone || '',
    }))
    setSelectedLookupUser(u)
    setUserSearchQuery('')
    setShowUserDropdown(false)
    setUserSearchResults([])
  }, [])

  const handleClearUser = useCallback(() => {
    setSelectedLookupUser(null)
    setFormData(prev => ({
      ...prev,
      participant_user_id: '',
      participant_name: '',
      participant_email: '',
      participant_phone: '',
    }))
  }, [])

  const handleSessionTypeChange = (type: SessionTypeKey) => {
    const defaults = SESSION_TYPE_DEFAULTS[type]
    setFormData(prev => ({
      ...prev,
      session_type: type,
      title: defaults.title,
      description: defaults.description,
      ...(defaults.duration != null && { duration_minutes: defaults.duration }),
    }))
    if (type !== 'alignment_gym') setTestMode(false)
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
      
      const isTestSession = formData.session_type === 'test_1on1' || formData.session_type === 'test_group'
      if (!isTestSession && scheduledAt <= new Date()) {
        throw new Error('Please select a future date and time')
      }

      const sessionTypeConfig = SESSION_TYPE_DEFAULTS[formData.session_type]
      const apiSessionType = sessionTypeConfig.apiType

      const response = await fetch('/api/video/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          session_type: apiSessionType,
          scheduled_at: scheduledAt.toISOString(),
          scheduled_duration_minutes: formData.duration_minutes,
          participant_user_id: formData.participant_user_id || undefined,
          participant_email: formData.participant_email.trim() || undefined,
          participant_name: formData.participant_name.trim() || undefined,
          participant_phone: formData.participant_phone.trim() || undefined,
          host_admin_id: formData.host_admin_id || undefined,
          enable_recording: formData.enable_recording,
          enable_waiting_room: formData.enable_waiting_room,
          ...(repeatWeekly && repeatWeeks > 1 && { repeat_weekly_count: repeatWeeks }),
          ...(testMode && { test_mode: true }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session')
      }

      setCreatedSessionId(data.session.id)
      setCreatedCount(data.sessions ? data.sessions.length : 1)
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
    const isMultiple = createdCount > 1
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Card className="bg-neutral-900 border-green-500/30 p-6 md:p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              {isMultiple ? `${createdCount} Sessions Created!` : 'Session Created!'}
            </h2>
            <p className="text-neutral-400 mb-6">
              {isMultiple
                ? `${createdCount} weekly sessions have been scheduled.${testMode ? ' Test mode — only you will receive notifications.' : ' Reminders will be sent before each session.'}`
                : testMode
                  ? 'Session scheduled in test mode — only you will receive notifications.'
                  : 'Your video session has been scheduled and invitation sent.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin/sessions')}
              >
                {isMultiple ? 'View All Sessions' : 'View Session'}
              </Button>
              {!isMultiple && (
                <Button
                  variant="primary"
                  onClick={() => router.push(`/session/${createdSessionId}`)}
                >
                  Join Now
                </Button>
              )}
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  onClick={() => handleSessionTypeChange('calibration_call')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.session_type === 'calibration_call'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <PhoneCall className={`w-6 h-6 mx-auto mb-2 ${
                    formData.session_type === 'calibration_call' ? 'text-primary-500' : 'text-neutral-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.session_type === 'calibration_call' ? 'text-white' : 'text-neutral-400'
                  }`}>
                    Calibration Call
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

              {/* Test Session Types */}
              <div className="mt-3 pt-3 border-t border-neutral-700/50">
                <p className="text-xs text-amber-500/70 font-medium mb-2 flex items-center gap-1.5">
                  <FlaskConical className="w-3 h-3" />
                  Test Sessions (admin only, invisible to members)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSessionTypeChange('test_1on1')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.session_type === 'test_1on1'
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-neutral-700/50 hover:border-neutral-600'
                    }`}
                  >
                    <FlaskConical className={`w-5 h-5 mx-auto mb-1.5 ${
                      formData.session_type === 'test_1on1' ? 'text-amber-500' : 'text-neutral-500'
                    }`} />
                    <p className={`text-sm font-medium ${
                      formData.session_type === 'test_1on1' ? 'text-white' : 'text-neutral-500'
                    }`}>
                      Test 1:1
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSessionTypeChange('test_group')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.session_type === 'test_group'
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-neutral-700/50 hover:border-neutral-600'
                    }`}
                  >
                    <FlaskConical className={`w-5 h-5 mx-auto mb-1.5 ${
                      formData.session_type === 'test_group' ? 'text-amber-500' : 'text-neutral-500'
                    }`} />
                    <p className={`text-sm font-medium ${
                      formData.session_type === 'test_group' ? 'text-white' : 'text-neutral-500'
                    }`}>
                      Test Group
                    </p>
                  </button>
                </div>
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

                {/* User lookup */}
                <div className="relative">
                  <label className="block text-xs text-neutral-500 mb-1">
                    <Search className="w-3 h-3 inline mr-1" />
                    Look up user (name or email)
                  </label>
                  {selectedLookupUser ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-800 border border-neutral-700">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {selectedLookupUser.full_name || [selectedLookupUser.first_name, selectedLookupUser.last_name].filter(Boolean).join(' ') || selectedLookupUser.email}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">{selectedLookupUser.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearUser}
                        className="p-1.5 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white"
                        title="Clear and enter manually"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        onFocus={() => userSearchResults.length > 0 && setShowUserDropdown(true)}
                        onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                        placeholder="Type to search..."
                        className="bg-neutral-800 border-neutral-700"
                      />
                      {showUserDropdown && (userSearchResults.length > 0 || userSearchLoading) && (
                        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl z-10 max-h-48 overflow-y-auto">
                          {userSearchLoading ? (
                            <div className="p-3 text-center text-neutral-400 text-sm">Searching...</div>
                          ) : (
                            userSearchResults.map((u) => {
                              const name = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => handleSelectUser(u)}
                                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex flex-col"
                                >
                                  <span className="text-sm text-white truncate">{name}</span>
                                  <span className="text-xs text-neutral-500 truncate">{u.email}</span>
                                </button>
                              )
                            })
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Name</label>
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
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DatePicker
                  label="Date *"
                  value={formData.scheduled_date}
                  onChange={(date) => handleChange('scheduled_date', date)}
                  minDate={new Date().toISOString().split('T')[0]}
                />
                <TimePicker
                  label="Time (ET) *"
                  value={formData.scheduled_time}
                  onChange={(time) => handleChange('scheduled_time', time)}
                  step={15}
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1.5">All times are in Eastern Time (ET)</p>
            </div>

            {/* Repeat Weekly */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatWeekly}
                  onChange={(e) => setRepeatWeekly(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-primary-500 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <p className="text-sm text-white flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-secondary-500" />
                    Repeat Weekly
                  </p>
                  <p className="text-xs text-neutral-500">Create multiple sessions on the same day and time each week</p>
                </div>
              </label>

              {repeatWeekly && (
                <div className="ml-7 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-300">Number of weeks:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRepeatWeeks(w => Math.max(2, w - 1))}
                        className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-lg font-semibold text-white">{repeatWeeks}</span>
                      <button
                        type="button"
                        onClick={() => setRepeatWeeks(w => Math.min(52, w + 1))}
                        className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {formData.scheduled_date && formData.scheduled_time && (
                    <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-700">
                      <p className="text-xs font-medium text-neutral-400 mb-2 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {repeatWeeks} sessions will be created (ET):
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1">
                        {Array.from({ length: repeatWeeks }, (_, i) => {
                          const d = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`)
                          d.setDate(d.getDate() + i * 7)
                          return (
                            <p key={i} className="text-xs text-neutral-300 py-0.5">
                              <span className="text-neutral-500 mr-1.5">{i + 1}.</span>
                              {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' })}
                              {' at '}
                              {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })}
                              {' ET'}
                            </p>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
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

              {formData.session_type === 'alignment_gym' && (
                <label className="flex items-center gap-3 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testMode}
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-amber-500 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-amber-500" />
                      Test Mode
                    </p>
                    <p className="text-xs text-neutral-400">All notifications (reminders, going live) go to you only — members will not be notified</p>
                  </div>
                </label>
              )}
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
                    {repeatWeekly && repeatWeeks > 1 ? `Creating ${repeatWeeks} Sessions...` : 'Creating...'}
                  </>
                ) : (
                  <>
                    {repeatWeekly && repeatWeeks > 1 ? (
                      <>
                        <Repeat className="w-4 h-4 mr-2" />
                        Create {repeatWeeks} Weekly Sessions
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Create Session
                      </>
                    )}
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
