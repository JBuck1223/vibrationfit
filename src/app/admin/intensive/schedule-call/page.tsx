'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  Container,
  Card,
  Button,
  Input,
  Badge,
  Spinner,
  Stack,
  PageHero,
  DatePicker,
  TimePicker,
} from '@/lib/design-system/components'
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  Video,
  User,
  Search,
  ChevronRight,
  ExternalLink,
  Play,
  RefreshCw,
  Phone,
  Mail,
  ArrowLeft,
  Pencil,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

interface IntensiveUser {
  id: string
  user_id: string
  intensive_id: string
  call_scheduled: boolean
  call_scheduled_time: string | null
  call_scheduled_at: string | null
  status: string
  email: string
  first_name: string
  last_name: string
  phone: string
  display_name: string
}

interface AvailableSlot {
  staff_id: string
  staff_name: string
  time: string
  date: string
}

interface StaffMember {
  id: string
  display_name: string
  default_buffer_minutes: number
  availability: Record<string, { enabled: boolean; start: string; end: string }>
  event_types: string[]
  timezone: string
}

interface Booking {
  id: string
  staff_id: string
  user_id: string
  event_type: string
  title: string
  description: string
  scheduled_at: string
  duration_minutes: number
  timezone: string
  meeting_type: string
  video_session_id: string | null
  contact_email: string
  contact_phone: string
  status: string
  staff_notes: string | null
  client_notes: string | null
  created_at: string
  user_name: string
  user_email: string
  staff_name: string
  recording_url: string | null
  session_status: string | null
}

type ActiveTab = 'schedule' | 'bookings'

function toEasternUTC(dateStr: string, timeStr: string): Date {
  const noonUtc = new Date(`${dateStr}T12:00:00Z`)
  const etNoonHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      hour12: false,
    }).format(noonUtc)
  )
  const offsetHours = etNoonHour - 12
  const [h, m] = timeStr.split(':').map(Number)
  const result = new Date(`${dateStr}T00:00:00Z`)
  result.setUTCHours(h - offsetHours, m, 0, 0)
  return result
}

export default function AdminScheduleCallPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('bookings')

  // Schedule tab state
  const [users, setUsers] = useState<IntensiveUser[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<IntensiveUser | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // Bookings tab state
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'upcoming' | 'past'>('all')
  const [syncingRecordings, setSyncingRecordings] = useState(false)

  // Confirm & assign state
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null)
  const [confirmStaffId, setConfirmStaffId] = useState<string>('')
  const [confirmingSave, setConfirmingSave] = useState(false)

  // Reschedule state
  const [reschedulingBookingId, setReschedulingBookingId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleSaving, setRescheduleSaving] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadBookings()
    }
  }, [activeTab])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [usersRes, staffRes] = await Promise.all([
        fetch('/api/admin/intensive/schedule-call?section=users'),
        fetch('/api/admin/intensive/schedule-call?section=staff'),
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json()
        setStaff(staffData.staff || [])
        generateAvailableDates(staffData.staff || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const generateAvailableDates = (staffList: StaffMember[]) => {
    const dates: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

    for (let i = 1; i <= 28; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dayName = dayNames[date.getDay()]

      const hasAvailableStaff = staffList.some(
        (s) => s.availability?.[dayName]?.enabled === true
      )

      if (hasAvailableStaff) {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        dates.push(dateStr)
      }

      if (dates.length >= 10) break
    }

    setAvailableDates(dates)
  }

  const loadSlotsForDate = useCallback(async (date: string) => {
    setLoadingSlots(true)
    setSelectedTime('')
    setSelectedStaffId(null)

    try {
      const res = await fetch(`/api/admin/intensive/schedule-call?section=slots&date=${date}`)
      if (res.ok) {
        const data = await res.json()
        setAvailableSlots(data.slots || [])
      }
    } catch (error) {
      console.error('Error loading slots:', error)
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      loadSlotsForDate(selectedDate)
    }
  }, [selectedDate, loadSlotsForDate])

  const loadBookings = async () => {
    setLoadingBookings(true)
    try {
      const res = await fetch('/api/admin/intensive/schedule-call?section=bookings')
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoadingBookings(false)
    }
  }

  const syncRecordings = async () => {
    setSyncingRecordings(true)
    try {
      const res = await fetch('/api/admin/recordings/sync', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Sync failed')
      }

      if (data.synced > 0) {
        toast.success(`Synced ${data.synced} recording${data.synced !== 1 ? 's' : ''} from Daily.co to S3`)
        await loadBookings()
      } else if (data.already_synced > 0) {
        toast.info('All recordings already synced')
      } else {
        toast.info('No recordings found to sync')
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Recording sync failed: ${msg}`)
    } finally {
      setSyncingRecordings(false)
    }
  }

  const handleConfirmBooking = async (bookingId: string) => {
    if (!confirmStaffId) {
      toast.error('Please select a staff member')
      return
    }

    setConfirmingSave(true)
    try {
      const res = await fetch('/api/admin/intensive/schedule-call', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          staff_id: confirmStaffId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm booking')
      }

      toast.success(`Booking confirmed with ${data.staff_name || 'staff'}`)
      setConfirmingBookingId(null)
      setConfirmStaffId('')
      await loadBookings()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to confirm: ${msg}`)
    } finally {
      setConfirmingSave(false)
    }
  }

  const handleMarkComplete = async (bookingId: string) => {
    if (!confirm('Mark this booking as completed? This will also update the member\'s intensive checklist.')) return

    try {
      const res = await fetch('/api/admin/intensive/schedule-call', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to mark complete')
      }

      toast.success('Booking marked as completed')
      await loadBookings()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed: ${msg}`)
    }
  }

  const handleReschedule = async (bookingId: string) => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Please pick a new date and time')
      return
    }

    setRescheduleSaving(true)
    try {
      const newDateTime = toEasternUTC(rescheduleDate, rescheduleTime)

      const res = await fetch('/api/admin/intensive/schedule-call', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          booking_id: bookingId,
          scheduled_at: newDateTime.toISOString(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reschedule')
      }

      toast.success('Booking rescheduled')
      setReschedulingBookingId(null)
      setRescheduleDate('')
      setRescheduleTime('')
      await loadBookings()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to reschedule: ${msg}`)
    } finally {
      setRescheduleSaving(false)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Delete this booking? This will also reset the member\'s checklist so they can rebook.')) return

    try {
      const res = await fetch(`/api/admin/intensive/schedule-call?booking_id=${bookingId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete booking')
      }

      toast.success('Booking deleted')
      await loadBookings()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed: ${msg}`)
    }
  }

  const handleSelectUser = (user: IntensiveUser) => {
    setSelectedUser(user)
    setContactEmail(user.email || '')
    setContactPhone(user.phone || '')
    setSelectedDate('')
    setSelectedTime('')
    setSelectedStaffId(null)
  }

  const handleSchedule = async () => {
    if (!selectedUser || !selectedDate || !selectedTime || !selectedStaffId) {
      toast.error('Please select a user, date, and time')
      return
    }

    const staffMember = staff.find((s) => s.id === selectedStaffId)
    const slotMatch = availableSlots.find((s) => s.time === selectedTime)

    setSaving(true)
    try {
      const res = await fetch('/api/admin/intensive/schedule-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          intensive_id: selectedUser.intensive_id,
          staff_id: selectedStaffId,
          date: selectedDate,
          time: selectedTime,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          staff_name: staffMember?.display_name || slotMatch?.staff_name || '',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule call')
      }

      toast.success(`Call scheduled for ${selectedUser.display_name}`)

      // Reset form
      setSelectedUser(null)
      setSelectedDate('')
      setSelectedTime('')
      setSelectedStaffId(null)
      setContactEmail('')
      setContactPhone('')
      setSearchQuery('')

      // Refresh data
      await loadInitialData()
      if (activeTab === 'bookings') {
        await loadBookings()
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error scheduling call:', msg)
      toast.error(`Failed to schedule: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const formatTime12h = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Filter users by search query and scheduling status
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase()
    return (
      u.display_name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.first_name.toLowerCase().includes(query) ||
      u.last_name.toLowerCase().includes(query)
    )
  })

  const unscheduledUsers = filteredUsers.filter((u) => !u.call_scheduled)
  const scheduledUsers = filteredUsers.filter((u) => u.call_scheduled)

  const uniqueTimes = [...new Set(availableSlots.map((s) => s.time))].sort()

  // Booking filters
  const now = new Date()
  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'pending') return b.status === 'pending'
    if (bookingFilter === 'upcoming') return new Date(b.scheduled_at) >= now && b.status !== 'cancelled' && b.status !== 'pending'
    if (bookingFilter === 'past') return new Date(b.scheduled_at) < now || b.status === 'completed'
    return true
  })

  if (loading) {
    return (
      <AdminWrapper>
        <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </Container>
      </AdminWrapper>
    )
  }

  return (
    <AdminWrapper>
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            eyebrow="ADMIN"
            title="Schedule Call"
            subtitle="Schedule calibration calls for intensive users and manage existing bookings"
          />

          {/* Tabs */}
          <div className="flex gap-2 md:gap-4 border-b border-neutral-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3 md:px-4 py-2 text-sm md:text-base font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'schedule'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Schedule Call
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3 md:px-4 py-2 text-sm md:text-base font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'bookings'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Bookings ({bookings.length})
            </button>
          </div>

          {/* ──────────────── SCHEDULE TAB ──────────────── */}
          {activeTab === 'schedule' && (
            <Stack gap="lg">
              {/* Step indicator */}
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Badge variant={!selectedUser ? 'premium' : 'success'} className="text-xs">1</Badge>
                <span className={!selectedUser ? 'text-white font-medium' : 'text-neutral-500'}>Select User</span>
                <ChevronRight className="w-4 h-4" />
                <Badge variant={selectedUser && !selectedDate ? 'premium' : selectedDate ? 'success' : 'neutral'} className="text-xs">2</Badge>
                <span className={selectedUser && !selectedDate ? 'text-white font-medium' : 'text-neutral-500'}>Pick Date & Time</span>
                <ChevronRight className="w-4 h-4" />
                <Badge variant={selectedDate && selectedTime ? 'premium' : 'neutral'} className="text-xs">3</Badge>
                <span className={selectedDate && selectedTime ? 'text-white font-medium' : 'text-neutral-500'}>Confirm</span>
              </div>

              {/* ── Step 1: User Selection ── */}
              {!selectedUser ? (
                <Card>
                  <h2 className="text-lg md:text-xl font-bold mb-4">Select Intensive User</h2>

                  <div className="relative mb-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Needs Scheduling */}
                  {unscheduledUsers.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-neutral-400 mb-3 uppercase tracking-wider">
                        Needs Scheduling ({unscheduledUsers.length})
                      </h3>
                      <div className="space-y-2">
                        {unscheduledUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleSelectUser(user)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-neutral-700 hover:border-primary-500 transition-all text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-neutral-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{user.display_name}</p>
                              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                            </div>
                            <Badge variant="warning" className="text-xs flex-shrink-0">No Call</Badge>
                            <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Already Scheduled */}
                  {scheduledUsers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-400 mb-3 uppercase tracking-wider">
                        Already Scheduled ({scheduledUsers.length})
                      </h3>
                      <div className="space-y-2">
                        {scheduledUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleSelectUser(user)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-neutral-800 hover:border-neutral-600 transition-all text-left opacity-70"
                          >
                            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-neutral-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{user.display_name}</p>
                              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <Badge variant="success" className="text-xs">Scheduled</Badge>
                              {user.call_scheduled_time && (
                                <p className="text-xs text-neutral-500 mt-1">
                                  {new Date(user.call_scheduled_time).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-neutral-400 text-sm">
                      {searchQuery ? 'No users match your search.' : 'No intensive users found.'}
                    </div>
                  )}
                </Card>
              ) : (
                <>
                  {/* Selected User Banner */}
                  <Card className="bg-neutral-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-500/20 border-2 border-primary-500/40 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{selectedUser.display_name}</p>
                          <p className="text-xs text-neutral-400">{selectedUser.email}</p>
                        </div>
                        {selectedUser.call_scheduled && (
                          <Badge variant="warning" className="text-xs ml-2">Already Has a Call</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(null)
                          setSelectedDate('')
                          setSelectedTime('')
                          setSelectedStaffId(null)
                        }}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Change
                      </Button>
                    </div>
                  </Card>

                  {/* ── Step 2: Date & Time Selection ── */}
                  <Card>
                    <h2 className="text-lg md:text-xl font-bold mb-2">Select Date & Time</h2>
                    <p className="text-sm text-neutral-400 mb-6">
                      Showing available slots based on staff availability. All times are EST.
                    </p>

                    {staff.length === 0 ? (
                      <div className="text-center py-8 text-neutral-400">
                        <p>No staff members configured for calibration calls.</p>
                        <p className="text-xs mt-2">Add staff with the &quot;intensive_calibration&quot; event type.</p>
                      </div>
                    ) : (
                      <>
                        {/* Date Selection */}
                        <div className="mb-6 max-w-xs">
                          <DatePicker
                            label="Choose a Date"
                            value={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            minDate={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()}
                            helperText={availableDates.length > 0 ? `${availableDates.length} dates with staff availability in the next 4 weeks` : undefined}
                          />
                        </div>

                        {/* Time Selection */}
                        {selectedDate && (
                          <div className="mb-6">
                            <label className="block text-sm font-medium mb-3">Choose a Time (EST)</label>
                            {loadingSlots ? (
                              <div className="flex items-center justify-center py-8">
                                <Spinner size="sm" className="mr-2" />
                                <span className="text-neutral-400">Loading available times...</span>
                              </div>
                            ) : uniqueTimes.length === 0 ? (
                              <div className="text-center py-8 text-neutral-400">
                                No times available on this date. Try another date.
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {uniqueTimes.map((time) => {
                                  const isSelected = selectedTime === time
                                  const slot = availableSlots.find((s) => s.time === time)
                                  return (
                                    <button
                                      key={time}
                                      onClick={() => {
                                        setSelectedTime(time)
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
                                      {slot && (
                                        <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-black/60' : 'text-neutral-500'}`}>
                                          {slot.staff_name}
                                        </p>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </Card>

                  {/* ── Step 3: Contact Info & Confirm ── */}
                  {selectedDate && selectedTime && (
                    <Card>
                      <h2 className="text-lg md:text-xl font-bold mb-4">Confirm Booking</h2>

                      {/* Summary */}
                      <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700 mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary-500" />
                            <span className="text-neutral-400">Client:</span>
                            <span className="text-white font-medium">{selectedUser.display_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary-500" />
                            <span className="text-neutral-400">Date:</span>
                            <span className="text-white font-medium">
                              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-500" />
                            <span className="text-neutral-400">Time:</span>
                            <span className="text-white font-medium">{formatTime12h(selectedTime)} EST</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-primary-500" />
                            <span className="text-neutral-400">With:</span>
                            <span className="text-white font-medium">
                              {availableSlots.find((s) => s.time === selectedTime)?.staff_name || 'Staff'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            <Mail className="w-3 h-3 inline mr-1" />
                            Client Email
                          </label>
                          <Input
                            type="email"
                            placeholder="client@email.com"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            <Phone className="w-3 h-3 inline mr-1" />
                            Client Phone (optional)
                          </label>
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSchedule}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Scheduling...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Schedule Call for {selectedUser.display_name}
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-neutral-500 text-center mt-3">
                        This will create a video session, send an email invitation, and update their intensive checklist.
                      </p>
                    </Card>
                  )}
                </>
              )}
            </Stack>
          )}

          {/* ──────────────── BOOKINGS TAB ──────────────── */}
          {activeTab === 'bookings' && (
            <Stack gap="lg">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex gap-2">
                  {(['all', 'pending', 'upcoming', 'past'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={bookingFilter === filter ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setBookingFilter(filter)}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      {filter === 'pending' && pendingCount > 0 && (
                        <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">{pendingCount}</span>
                      )}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={loadBookings} disabled={loadingBookings}>
                    <RefreshCw className={`w-4 h-4 mr-1 ${loadingBookings ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={syncRecordings}
                    disabled={syncingRecordings}
                  >
                    <Video className={`w-4 h-4 mr-1 ${syncingRecordings ? 'animate-pulse' : ''}`} />
                    {syncingRecordings ? 'Syncing...' : 'Sync Recordings'}
                  </Button>
                </div>
              </div>

              {loadingBookings ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <Card className="text-center py-8">
                  <p className="text-neutral-400">No bookings found.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((booking) => {
                    const scheduledDate = new Date(booking.scheduled_at)
                    const isPast = scheduledDate < now
                    const isCancelled = booking.status === 'cancelled'

                    return (
                      <Card
                        key={booking.id}
                        className={`${isCancelled ? 'opacity-50' : ''}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isPast ? 'bg-neutral-800' : 'bg-primary-500/20'
                              }`}>
                                {isPast ? (
                                  <CheckCircle className="w-5 h-5 text-neutral-500" />
                                ) : (
                                  <Calendar className="w-5 h-5 text-primary-500" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {scheduledDate.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    timeZone: 'America/New_York',
                                  })}
                                </p>
                                <p className="text-xs text-neutral-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {scheduledDate.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                    timeZone: 'America/New_York',
                                  })}{' '}
                                  ET · {booking.duration_minutes} min
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400 ml-[52px]">
                              <span>
                                <User className="w-3 h-3 inline mr-1" />
                                {booking.user_name}
                              </span>
                              <span>
                                <Mail className="w-3 h-3 inline mr-1" />
                                {booking.user_email}
                              </span>
                              <span>
                                <Video className="w-3 h-3 inline mr-1" />
                                with {booking.staff_name}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 ml-[52px] md:ml-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant={
                                  booking.status === 'confirmed' ? 'success'
                                  : booking.status === 'completed' ? 'info'
                                  : booking.status === 'cancelled' ? 'neutral'
                                  : 'warning'
                                }
                                className="text-xs"
                              >
                                {booking.status}
                              </Badge>

                              {booking.recording_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(booking.recording_url!, '_blank')}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Recording
                                </Button>
                              )}

                              {booking.video_session_id && booking.status === 'confirmed' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => window.open(`/session/${booking.video_session_id}`, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Join
                                </Button>
                              )}

                              {booking.status === 'pending' && confirmingBookingId !== booking.id && (
                                <Button
                                  variant="accent"
                                  size="sm"
                                  onClick={() => {
                                    setConfirmingBookingId(booking.id)
                                    setConfirmStaffId('')
                                  }}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Confirm & Assign
                                </Button>
                              )}

                              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setReschedulingBookingId(reschedulingBookingId === booking.id ? null : booking.id)
                                      setRescheduleDate('')
                                      setRescheduleTime('')
                                    }}
                                  >
                                    <Pencil className="w-3 h-3 mr-1" />
                                    Reschedule
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkComplete(booking.id)}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Mark Complete
                                  </Button>
                                </>
                              )}

                              {booking.status !== 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  onClick={() => handleDeleteBooking(booking.id)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              )}
                            </div>

                            {booking.status === 'pending' && confirmingBookingId === booking.id && (
                              <div className="w-full border border-primary-500/30 rounded-xl p-3 bg-primary-500/5 mt-1">
                                <p className="text-xs font-medium text-primary-500 mb-2">Assign a coach to confirm this booking:</p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <select
                                    value={confirmStaffId}
                                    onChange={(e) => setConfirmStaffId(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-white focus:border-primary-500 focus:outline-none"
                                  >
                                    <option value="">Select coach...</option>
                                    {staff.map((s) => (
                                      <option key={s.id} value={s.id}>{s.display_name}</option>
                                    ))}
                                  </select>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleConfirmBooking(booking.id)}
                                      disabled={!confirmStaffId || confirmingSave}
                                    >
                                      {confirmingSave ? (
                                        <><Spinner size="sm" className="mr-1" /> Confirming...</>
                                      ) : (
                                        <><CheckCircle className="w-3 h-3 mr-1" /> Confirm</>
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setConfirmingBookingId(null)
                                        setConfirmStaffId('')
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {reschedulingBookingId === booking.id && (
                              <div className="w-full border border-neutral-600 rounded-xl p-4 bg-neutral-800/50 mt-1">
                                <p className="text-xs font-medium text-white mb-3">Pick a new date and time (Eastern):</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                  <DatePicker
                                    value={rescheduleDate}
                                    onChange={(date) => setRescheduleDate(date)}
                                    minDate={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                                    placeholder="New date..."
                                  />
                                  <TimePicker
                                    value={rescheduleTime}
                                    onChange={(time) => setRescheduleTime(time)}
                                    step={15}
                                    placeholder="New time..."
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setReschedulingBookingId(null)
                                      setRescheduleDate('')
                                      setRescheduleTime('')
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleReschedule(booking.id)}
                                    disabled={!rescheduleDate || !rescheduleTime || rescheduleSaving}
                                  >
                                    {rescheduleSaving ? (
                                      <><Spinner size="sm" className="mr-1" /> Saving...</>
                                    ) : (
                                      <><Calendar className="w-3 h-3 mr-1" /> Save</>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </Stack>
          )}
        </Stack>
      </Container>
    </AdminWrapper>
  )
}
