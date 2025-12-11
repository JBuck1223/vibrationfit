'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  Checkbox
} from '@/lib/design-system/components'
import { Calendar, Clock, Plus, X, Trash2, Users, CheckCircle, Repeat, CalendarRange, Edit2, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'

interface Schedule {
  id: string
  event_type: string // e.g., 'intensive_calibration', 'group_workshop', 'coaching_session'
  meeting_type: 'one_on_one' | 'group'
  schedule_type: 'single' | 'range' | 'recurring'
  name: string | null
  max_bookings: number
  slot_length: number
  single_date: string | null
  single_time: string | null
  start_date: string | null
  end_date: string | null
  start_time: string | null
  end_time: string | null
  exclude_weekends: boolean | null
  recurring_start_date: string | null
  recurring_end_date: string | null
  recurring_start_time: string | null
  recurring_end_time: string | null
  days_of_week: number[] | null
  is_active: boolean
  created_at: string
  slot_count?: number
}

interface Appointment {
  id: string
  user_id: string
  intensive_id: string
  scheduled_date: string
  scheduled_time: string
  scheduled_datetime: string
  user_email: string
  user_name: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
}

type AddMode = 'single' | 'range' | 'recurring'

export default function AdminScheduleCallPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'schedules' | 'slots' | 'appointments'>('schedules')
  
  // Schedules management
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedScheduleType, setSelectedScheduleType] = useState<'all' | 'single' | 'range' | 'recurring'>('all')
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  
  // Event types
  const eventTypes = [
    { value: 'intensive_calibration', label: 'Intensive Calibration', icon: '🎯' },
    { value: 'group_workshop', label: 'Group Workshop', icon: '👥' },
    { value: 'coaching_session', label: 'Coaching Session', icon: '💬' },
    { value: 'webinar', label: 'Webinar', icon: '📹' },
    { value: 'masterclass', label: 'Masterclass', icon: '🎓' },
  ]
  
  // Add schedule modes
  const [addMode, setAddMode] = useState<AddMode>('single')
  const [scheduleName, setScheduleName] = useState('')
  const [eventType, setEventType] = useState('intensive_calibration')
  const [meetingType, setMeetingType] = useState<'one_on_one' | 'group'>('one_on_one')
  const [singleSchedule, setSingleSchedule] = useState({ date: '', time: '', max_bookings: 1, slot_length: 30 })
  const [rangeSchedule, setRangeSchedule] = useState({ 
    startDate: '', 
    endDate: '', 
    startTime: '', 
    endTime: '',
    slotLength: 30,
    max_bookings: 1,
    excludeWeekends: true 
  })
  const [recurringSchedule, setRecurringSchedule] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    slotLength: 30,
    daysOfWeek: [] as number[],
    max_bookings: 1
  })
  
  // Appointments view
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filterDate, setFilterDate] = useState<string>('')

  const daysOfWeekOptions = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadSchedules(),
        loadAppointments()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadSchedules = async () => {
    try {
      // Try generic schedules table first, fallback to intensive_schedules
      let data, error
      
      const { data: genericData, error: genericError } = await supabase
        .from('schedules')
        .select('*')
        .order('created_at', { ascending: false })

      if (!genericError && genericData) {
        data = genericData
        error = null
      } else {
        // Fallback to intensive_schedules
        const { data: intensiveData, error: intensiveError } = await supabase
          .from('intensive_schedules')
          .select('*')
          .order('created_at', { ascending: false })
        
        data = intensiveData
        error = intensiveError
      }

      if (error && error.code === '42P01') {
        console.log('Schedules table does not exist yet')
        setSchedules([])
        return
      }

      if (data) {
        // Get slot counts for each schedule
        const schedulesWithCounts = await Promise.all(
          data.map(async (schedule) => {
            // Try generic time_slots first, fallback to intensive_time_slots
            let count = 0
            
            const { count: genericCount } = await supabase
              .from('time_slots')
              .select('*', { count: 'exact', head: true })
              .eq('schedule_id', schedule.id)
            
            if (genericCount !== null) {
              count = genericCount
            } else {
              const { count: intensiveCount } = await supabase
                .from('intensive_time_slots')
                .select('*', { count: 'exact', head: true })
                .eq('schedule_id', schedule.id)
              
              count = intensiveCount || 0
            }

            return {
              ...schedule,
              event_type: schedule.event_type || 'intensive_calibration',
              meeting_type: schedule.meeting_type || (schedule.max_bookings > 1 ? 'group' : 'one_on_one'),
              slot_count: count
            }
          })
        )
        setSchedules(schedulesWithCounts)
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
      setSchedules([])
    }
  }

  const loadAppointments = async () => {
    try {
      const response = await fetch('/api/admin/intensive/appointments')
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
        return
      }

      const { data: checklistData, error } = await supabase
        .from('intensive_checklist')
        .select(`
          id,
          intensive_id,
          user_id,
          call_scheduled_time,
          call_scheduled_at
        `)
        .eq('call_scheduled', true)
        .not('call_scheduled_time', 'is', null)
        .order('call_scheduled_time', { ascending: true })

      if (error || !checklistData) return

      const appointmentsWithUsers = await Promise.all(
        checklistData.map(async (item) => {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('email, first_name, last_name')
            .eq('user_id', item.user_id)
            .single()

          const scheduledDateTime = new Date(item.call_scheduled_time)
          const dateStr = scheduledDateTime.toISOString().split('T')[0]
          const timeStr = scheduledDateTime.toTimeString().split(' ')[0].slice(0, 5)

          return {
            id: item.id,
            user_id: item.user_id,
            intensive_id: item.intensive_id,
            scheduled_date: dateStr,
            scheduled_time: timeStr,
            scheduled_datetime: item.call_scheduled_time,
            user_email: profileData?.email || 'Unknown',
            user_name: profileData ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() : 'Unknown',
            status: 'scheduled' as const,
            created_at: item.call_scheduled_at || ''
          }
        })
      )

      setAppointments(appointmentsWithUsers)
    } catch (error) {
      console.error('Error loading appointments:', error)
      toast.error('Failed to load appointments')
    }
  }

  // Generate time slots within a time range based on slot length
  const generateTimeSlots = (startTime: string, endTime: string, slotLength: number): string[] => {
    const slots: string[] = []
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotLength) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
      slots.push(timeStr)
    }
    
    return slots
  }

  const generateSlotsFromSchedule = async (schedule: Schedule): Promise<TimeSlot[]> => {
    const slots: TimeSlot[] = []

    if (schedule.schedule_type === 'single' && schedule.single_date && schedule.single_time) {
      slots.push({
        date: schedule.single_date,
        time: schedule.single_time,
        available: schedule.is_active,
        max_bookings: schedule.max_bookings,
        current_bookings: 0
      })
    } else if (schedule.schedule_type === 'range' && schedule.start_date && schedule.end_date && schedule.start_time && schedule.end_time) {
      const start = new Date(schedule.start_date)
      const end = new Date(schedule.end_date)
      const timeSlots = generateTimeSlots(schedule.start_time, schedule.end_time, schedule.slot_length)
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (schedule.exclude_weekends && (d.getDay() === 0 || d.getDay() === 6)) continue
        
        const dateStr = d.toISOString().split('T')[0]
        timeSlots.forEach(time => {
          slots.push({
            date: dateStr,
            time: time,
            available: schedule.is_active,
            max_bookings: schedule.max_bookings,
            current_bookings: 0
          })
        })
      }
    } else if (schedule.schedule_type === 'recurring' && schedule.recurring_start_date && schedule.recurring_end_date && schedule.recurring_start_time && schedule.recurring_end_time && schedule.days_of_week) {
      const start = new Date(schedule.recurring_start_date)
      const end = new Date(schedule.recurring_end_date)
      const timeSlots = generateTimeSlots(schedule.recurring_start_time, schedule.recurring_end_time, schedule.slot_length)
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (schedule.days_of_week.includes(d.getDay())) {
          const dateStr = d.toISOString().split('T')[0]
          timeSlots.forEach(time => {
            slots.push({
              date: dateStr,
              time: time,
              available: schedule.is_active,
              max_bookings: schedule.max_bookings,
              current_bookings: 0
            })
          })
        }
      }
    }

    return slots
  }

  interface TimeSlot {
    date: string
    time: string
    available: boolean
    max_bookings: number
    current_bookings: number
  }

  const createSchedule = async () => {
    setSaving(true)
    try {
      // Determine max_bookings based on meeting type
      const baseMaxBookings = addMode === 'single' 
        ? singleSchedule.max_bookings 
        : addMode === 'range' 
          ? rangeSchedule.max_bookings 
          : recurringSchedule.max_bookings
      
      const finalMaxBookings = meetingType === 'one_on_one' ? 1 : baseMaxBookings

      let scheduleData: any = {
        event_type: eventType,
        meeting_type: meetingType,
        schedule_type: addMode,
        name: scheduleName || null,
        max_bookings: finalMaxBookings,
        slot_length: addMode === 'single' ? singleSchedule.slot_length : addMode === 'range' ? rangeSchedule.slotLength : recurringSchedule.slotLength,
        is_active: true
      }

      if (addMode === 'single') {
        if (!singleSchedule.date || !singleSchedule.time) {
          toast.error('Please fill in all required fields')
          setSaving(false)
          return
        }
        scheduleData.single_date = singleSchedule.date
        scheduleData.single_time = singleSchedule.time
      } else if (addMode === 'range') {
        if (!rangeSchedule.startDate || !rangeSchedule.endDate || !rangeSchedule.startTime || !rangeSchedule.endTime) {
          toast.error('Please fill in all required fields')
          setSaving(false)
          return
        }
        if (new Date(rangeSchedule.startDate) > new Date(rangeSchedule.endDate)) {
          toast.error('End date must be after start date')
          setSaving(false)
          return
        }
        if (rangeSchedule.startTime >= rangeSchedule.endTime) {
          toast.error('End time must be after start time')
          setSaving(false)
          return
        }
        scheduleData.start_date = rangeSchedule.startDate
        scheduleData.end_date = rangeSchedule.endDate
        scheduleData.start_time = rangeSchedule.startTime
        scheduleData.end_time = rangeSchedule.endTime
        scheduleData.exclude_weekends = rangeSchedule.excludeWeekends
      } else if (addMode === 'recurring') {
        if (!recurringSchedule.startDate || !recurringSchedule.endDate || !recurringSchedule.startTime || !recurringSchedule.endTime || recurringSchedule.daysOfWeek.length === 0) {
          toast.error('Please fill in all required fields and select at least one day')
          setSaving(false)
          return
        }
        if (new Date(recurringSchedule.startDate) > new Date(recurringSchedule.endDate)) {
          toast.error('End date must be after start date')
          setSaving(false)
          return
        }
        if (recurringSchedule.startTime >= recurringSchedule.endTime) {
          toast.error('End time must be after start time')
          setSaving(false)
          return
        }
        scheduleData.recurring_start_date = recurringSchedule.startDate
        scheduleData.recurring_end_date = recurringSchedule.endDate
        scheduleData.recurring_start_time = recurringSchedule.startTime
        scheduleData.recurring_end_time = recurringSchedule.endTime
        scheduleData.days_of_week = recurringSchedule.daysOfWeek
      }

      // Create schedule - try generic table first, fallback to intensive_schedules
      let newSchedule, scheduleError
      
      const { data: genericSchedule, error: genericError } = await supabase
        .from('schedules')
        .insert(scheduleData)
        .select()
        .single()

      if (!genericError && genericSchedule) {
        newSchedule = genericSchedule
        scheduleError = null
      } else {
        // Fallback to intensive_schedules (remove event_type and meeting_type for compatibility)
        const { event_type, meeting_type, ...intensiveData } = scheduleData
        const { data: intensiveSchedule, error: intensiveError } = await supabase
          .from('intensive_schedules')
          .insert(intensiveData)
          .select()
          .single()
        
        newSchedule = intensiveSchedule
        scheduleError = intensiveError
      }

      if (scheduleError) {
        console.error('Error creating schedule:', scheduleError)
        toast.error('Failed to create schedule')
        setSaving(false)
        return
      }

      // Generate slots from schedule
      const slots = await generateSlotsFromSchedule(newSchedule)

      if (slots.length > 0) {
        // Insert slots with schedule_id - try generic table first
        const slotData = slots.map(slot => ({
          ...slot,
          schedule_id: newSchedule.id,
          event_type: eventType,
          meeting_type: meetingType
        }))

        const { error: genericSlotsError } = await supabase
          .from('time_slots')
          .insert(slotData)

        let slotsError = genericSlotsError

        // If generic table doesn't exist, try intensive_time_slots
        if (slotsError && slotsError.code === '42P01') {
          const { error: intensiveSlotsError } = await supabase
            .from('intensive_time_slots')
            .insert(slots.map(slot => ({
              ...slot,
              schedule_id: newSchedule.id
            })))
          
          slotsError = intensiveSlotsError
        }

        if (slotsError) {
          console.error('Error creating slots:', slotsError)
          // Delete schedule if slots failed
          const deleteFromGeneric = await supabase.from('schedules').delete().eq('id', newSchedule.id)
          if (deleteFromGeneric.error) {
            await supabase.from('intensive_schedules').delete().eq('id', newSchedule.id)
          }
          toast.error('Failed to create time slots')
          setSaving(false)
          return
        }
      }

      toast.success(`Created ${addMode} schedule with ${slots.length} time slot${slots.length !== 1 ? 's' : ''}`)
      
      // Reset forms
      setScheduleName('')
      setEventType('intensive_calibration')
      setMeetingType('one_on_one')
      setSingleSchedule({ date: '', time: '', max_bookings: 1, slot_length: 30 })
      setRangeSchedule({ startDate: '', endDate: '', startTime: '', endTime: '', slotLength: 30, max_bookings: 1, excludeWeekends: true })
      setRecurringSchedule({ startDate: '', endDate: '', startTime: '', endTime: '', slotLength: 30, daysOfWeek: [], max_bookings: 1 })
      
      // Reload schedules
      await loadSchedules()
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast.error('Failed to create schedule')
    } finally {
      setSaving(false)
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule? This will delete all associated time slots.')) return

    setSaving(true)
    try {
      // Delete schedule (slots will cascade delete) - try generic table first
      const { error: genericError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId)

      let error = genericError

      // If generic table doesn't exist or schedule not found, try intensive_schedules
      if (error && error.code === '42P01') {
        const { error: intensiveError } = await supabase
          .from('intensive_schedules')
          .delete()
          .eq('id', scheduleId)
        error = intensiveError
      }

      if (error) throw error

      toast.success('Schedule deleted successfully')
      await loadSchedules()
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast.error('Failed to delete schedule')
    } finally {
      setSaving(false)
    }
  }

  const toggleScheduleActive = async (schedule: Schedule) => {
    setSaving(true)
    try {
      // Update schedule - try generic table first
      const { error: genericError } = await supabase
        .from('schedules')
        .update({ is_active: !schedule.is_active })
        .eq('id', schedule.id)

      let error = genericError

      if (error && error.code === '42P01') {
        const { error: intensiveError } = await supabase
          .from('intensive_schedules')
          .update({ is_active: !schedule.is_active })
          .eq('id', schedule.id)
        error = intensiveError
      }

      if (error) throw error

      // Update all slots for this schedule
      const { error: genericSlotsError } = await supabase
        .from('time_slots')
        .update({ available: !schedule.is_active })
        .eq('schedule_id', schedule.id)

      if (genericSlotsError && genericSlotsError.code === '42P01') {
        await supabase
          .from('intensive_time_slots')
          .update({ available: !schedule.is_active })
          .eq('schedule_id', schedule.id)
      }

      toast.success(`Schedule ${!schedule.is_active ? 'activated' : 'deactivated'}`)
      await loadSchedules()
    } catch (error) {
      console.error('Error updating schedule:', error)
      toast.error('Failed to update schedule')
    } finally {
      setSaving(false)
    }
  }

  const toggleDayOfWeek = (day: number) => {
    setRecurringSchedule(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort()
    }))
  }

  const formatScheduleDescription = (schedule: Schedule): string => {
    if (schedule.schedule_type === 'single') {
      if (schedule.single_date && schedule.single_time) {
        const date = new Date(schedule.single_date)
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${schedule.single_time}`
      }
      return 'Single slot'
    } else if (schedule.schedule_type === 'range') {
      if (schedule.start_date && schedule.end_date && schedule.start_time && schedule.end_time) {
        const start = new Date(schedule.start_date)
        const end = new Date(schedule.end_date)
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${schedule.start_time}-${schedule.end_time}${schedule.exclude_weekends ? ' (weekdays only)' : ''}`
      }
      return 'Date range'
    } else if (schedule.schedule_type === 'recurring') {
      if (schedule.recurring_start_date && schedule.recurring_end_date && schedule.recurring_start_time && schedule.recurring_end_time && schedule.days_of_week) {
        const start = new Date(schedule.recurring_start_date)
        const end = new Date(schedule.recurring_end_date)
        const dayNames = schedule.days_of_week.map(d => daysOfWeekOptions[d].short).join(', ')
        return `${dayNames}, ${schedule.recurring_start_time}-${schedule.recurring_end_time} (${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`
      }
      return 'Recurring schedule'
    }
    return 'Unknown schedule'
  }

  const filteredSchedules = schedules.filter(s => {
    const matchesScheduleType = selectedScheduleType === 'all' || s.schedule_type === selectedScheduleType
    const matchesEventType = selectedEventType === 'all' || s.event_type === selectedEventType
    return matchesScheduleType && matchesEventType
  })

  // Filter appointments by date
  const filteredAppointments = filterDate
    ? appointments.filter(a => a.scheduled_date === filterDate)
    : appointments

  if (loading) {
    return (
      <AdminWrapper>
        <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Stack gap="lg">
            <PageHero eyebrow="ADMIN" title="Admin Page" subtitle="" />
          <Spinner size="lg" />
          </Stack>
        </Container>
      </AdminWrapper>
    )
  }

  return (
    <AdminWrapper>
      <Container size="xl">
        <Stack gap="lg">
          <PageHero eyebrow="ADMIN" title="Admin Page" subtitle="" />
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Schedule Call Admin</h1>
            <p className="text-sm md:text-base text-neutral-400">Manage schedules and view booked appointments</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 border-b border-neutral-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('schedules')}
              className={`px-3 md:px-4 py-2 text-sm md:text-base font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'schedules'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Schedules ({schedules.length})
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-3 md:px-4 py-2 text-sm md:text-base font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'appointments'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Appointments ({appointments.length})
            </button>
          </div>

          {/* Schedules Tab */}
          {activeTab === 'schedules' && (
            <Stack gap="lg">
              {/* Create New Schedule */}
              <Card>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-4">Create New Schedule</h2>
                
                {/* Event Type and Meeting Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                    >
                      {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Meeting Type</label>
                    <select
                      value={meetingType}
                      onChange={(e) => {
                        const newType = e.target.value as 'one_on_one' | 'group'
                        setMeetingType(newType)
                        // Auto-set max_bookings for one_on_one
                        if (newType === 'one_on_one') {
                          setSingleSchedule(prev => ({ ...prev, max_bookings: 1 }))
                          setRangeSchedule(prev => ({ ...prev, max_bookings: 1 }))
                          setRecurringSchedule(prev => ({ ...prev, max_bookings: 1 }))
                        }
                      }}
                      className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                    >
                      <option value="one_on_one">👤 One-on-One</option>
                      <option value="group">👥 Group Meeting</option>
                    </select>
                    {meetingType === 'one_on_one' && (
                      <p className="text-xs text-neutral-400 mt-1">Max bookings will be set to 1</p>
                    )}
                  </div>
                </div>
                
                {/* Schedule Name */}
                <div className="mb-4">
                  <Input
                    label="Schedule Name (Optional)"
                    placeholder="e.g., 'Monday-Thursday Afternoons'"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                {/* Mode Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <Button
                    variant={addMode === 'single' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setAddMode('single')}
                  >
                    Single
                  </Button>
                  <Button
                    variant={addMode === 'range' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setAddMode('range')}
                  >
                    <CalendarRange className="w-4 h-4 mr-2" />
                    Date Range
                  </Button>
                  <Button
                    variant={addMode === 'recurring' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setAddMode('recurring')}
                  >
                    <Repeat className="w-4 h-4 mr-2" />
                    Recurring
                  </Button>
                </div>

                {/* Single Schedule Form */}
                {addMode === 'single' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <DatePicker
                      label="Date"
                      value={singleSchedule.date}
                      onChange={(dateString) => setSingleSchedule({ ...singleSchedule, date: dateString })}
                      minDate={new Date().toISOString().split('T')[0]}
                    />
                    <Input
                      label="Time"
                      type="time"
                      value={singleSchedule.time}
                      onChange={(e) => setSingleSchedule({ ...singleSchedule, time: e.target.value })}
                    />
                    <Input
                      label={meetingType === 'one_on_one' ? 'Max Bookings (1 for one-on-one)' : 'Max Attendees'}
                      type="number"
                      value={singleSchedule.max_bookings}
                      onChange={(e) => setSingleSchedule({ ...singleSchedule, max_bookings: Math.max(1, parseInt(e.target.value) || 1) })}
                      min={1}
                      disabled={meetingType === 'one_on_one'}
                    />
                    <div className="flex items-end">
                      <Button
                        onClick={createSchedule}
                        disabled={saving || !singleSchedule.date || !singleSchedule.time}
                        className="w-full"
                        size="md"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Schedule
                      </Button>
                    </div>
                  </div>
                )}

                {/* Range Schedule Form */}
                {addMode === 'range' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <DatePicker
                        label="Start Date"
                        value={rangeSchedule.startDate}
                        onChange={(dateString) => setRangeSchedule({ ...rangeSchedule, startDate: dateString })}
                        minDate={new Date().toISOString().split('T')[0]}
                      />
                      <DatePicker
                        label="End Date"
                        value={rangeSchedule.endDate}
                        onChange={(dateString) => setRangeSchedule({ ...rangeSchedule, endDate: dateString })}
                        minDate={rangeSchedule.startDate || new Date().toISOString().split('T')[0]}
                      />
                      <Input
                        label={meetingType === 'one_on_one' ? 'Max Bookings (1 for one-on-one)' : 'Max Attendees'}
                        type="number"
                        value={rangeSchedule.max_bookings}
                        onChange={(e) => setRangeSchedule({ ...rangeSchedule, max_bookings: Math.max(1, parseInt(e.target.value) || 1) })}
                        min={1}
                        disabled={meetingType === 'one_on_one'}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <Input
                        label="Start Time"
                        type="time"
                        value={rangeSchedule.startTime}
                        onChange={(e) => setRangeSchedule({ ...rangeSchedule, startTime: e.target.value })}
                      />
                      <Input
                        label="End Time"
                        type="time"
                        value={rangeSchedule.endTime}
                        onChange={(e) => setRangeSchedule({ ...rangeSchedule, endTime: e.target.value })}
                      />
                      <div>
                        <label className="block text-sm font-medium mb-2">Slot Length (minutes)</label>
                        <select
                          value={rangeSchedule.slotLength}
                          onChange={(e) => setRangeSchedule({ ...rangeSchedule, slotLength: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={45}>45 minutes</option>
                          <option value={60}>60 minutes</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="excludeWeekends"
                        label="Exclude weekends"
                        checked={rangeSchedule.excludeWeekends}
                        onChange={(e) => setRangeSchedule({ ...rangeSchedule, excludeWeekends: e.target.checked })}
                      />
                    </div>
                    <Button
                      onClick={createSchedule}
                      disabled={saving || !rangeSchedule.startDate || !rangeSchedule.endDate || !rangeSchedule.startTime || !rangeSchedule.endTime}
                      className="w-full sm:w-auto"
                      size="md"
                    >
                      <CalendarRange className="w-4 h-4 mr-2" />
                      Create Schedule
                    </Button>
                  </div>
                )}

                {/* Recurring Schedule Form */}
                {addMode === 'recurring' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <DatePicker
                        label="Start Date"
                        value={recurringSchedule.startDate}
                        onChange={(dateString) => setRecurringSchedule({ ...recurringSchedule, startDate: dateString })}
                        minDate={new Date().toISOString().split('T')[0]}
                      />
                      <DatePicker
                        label="End Date"
                        value={recurringSchedule.endDate}
                        onChange={(dateString) => setRecurringSchedule({ ...recurringSchedule, endDate: dateString })}
                        minDate={recurringSchedule.startDate || new Date().toISOString().split('T')[0]}
                      />
                      <Input
                        label={meetingType === 'one_on_one' ? 'Max Bookings (1 for one-on-one)' : 'Max Attendees'}
                        type="number"
                        value={recurringSchedule.max_bookings}
                        onChange={(e) => setRecurringSchedule({ ...recurringSchedule, max_bookings: Math.max(1, parseInt(e.target.value) || 1) })}
                        min={1}
                        disabled={meetingType === 'one_on_one'}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <Input
                        label="Start Time"
                        type="time"
                        value={recurringSchedule.startTime}
                        onChange={(e) => setRecurringSchedule({ ...recurringSchedule, startTime: e.target.value })}
                      />
                      <Input
                        label="End Time"
                        type="time"
                        value={recurringSchedule.endTime}
                        onChange={(e) => setRecurringSchedule({ ...recurringSchedule, endTime: e.target.value })}
                      />
                      <div>
                        <label className="block text-sm font-medium mb-2">Slot Length (minutes)</label>
                        <select
                          value={recurringSchedule.slotLength}
                          onChange={(e) => setRecurringSchedule({ ...recurringSchedule, slotLength: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={45}>45 minutes</option>
                          <option value={60}>60 minutes</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Days of Week</label>
                      <div className="flex flex-wrap gap-2">
                        {daysOfWeekOptions.map(day => (
                          <button
                            key={day.value}
                            onClick={() => toggleDayOfWeek(day.value)}
                            className={`
                              px-3 py-2 rounded-lg border-2 text-sm transition-all
                              ${recurringSchedule.daysOfWeek.includes(day.value)
                                ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                                : 'border-neutral-700 hover:border-neutral-600 text-neutral-300'
                              }
                            `}
                          >
                            {day.short}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={createSchedule}
                      disabled={saving || !recurringSchedule.startDate || !recurringSchedule.endDate || !recurringSchedule.startTime || !recurringSchedule.endTime || recurringSchedule.daysOfWeek.length === 0}
                      className="w-full sm:w-auto"
                      size="md"
                    >
                      <Repeat className="w-4 h-4 mr-2" />
                      Create Schedule
                    </Button>
                  </div>
                )}
              </Card>

              {/* Existing Schedules */}
              <Card>
                <div className="flex flex-col gap-4 mb-4">
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold">Existing Schedules</h2>
                  
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Event Type Filter */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">Filter by Event Type</label>
                      <select
                        value={selectedEventType}
                        onChange={(e) => setSelectedEventType(e.target.value)}
                        className="w-full px-4 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all text-sm"
                      >
                        <option value="all">All Event Types</option>
                        {eventTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Schedule Type Filter */}
                    <div className="flex flex-wrap gap-2 items-end">
                      <Button
                        variant={selectedScheduleType === 'all' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedScheduleType('all')}
                      >
                        All ({schedules.length})
                      </Button>
                      <Button
                        variant={selectedScheduleType === 'single' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedScheduleType('single')}
                      >
                        Single ({schedules.filter(s => s.schedule_type === 'single').length})
                      </Button>
                      <Button
                        variant={selectedScheduleType === 'range' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedScheduleType('range')}
                      >
                        Range ({schedules.filter(s => s.schedule_type === 'range').length})
                      </Button>
                      <Button
                        variant={selectedScheduleType === 'recurring' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedScheduleType('recurring')}
                      >
                        Recurring ({schedules.filter(s => s.schedule_type === 'recurring').length})
                      </Button>
                    </div>
                  </div>
                </div>

                {filteredSchedules.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 text-sm md:text-base">
                    No schedules found. Create one using the form above.
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {filteredSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`
                          p-4 rounded-xl border-2 transition-all
                          ${schedule.is_active
                            ? 'border-neutral-700 hover:border-primary-500'
                            : 'border-neutral-800 bg-neutral-900/50 opacity-60'
                          }
                        `}
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {schedule.schedule_type === 'single' && <Calendar className="w-5 h-5 text-primary-500" />}
                              {schedule.schedule_type === 'range' && <CalendarRange className="w-5 h-5 text-secondary-500" />}
                              {schedule.schedule_type === 'recurring' && <Repeat className="w-5 h-5 text-accent-500" />}
                              <div>
                                <h3 className="text-base md:text-lg font-semibold text-white">
                                  {schedule.name || `${schedule.schedule_type.charAt(0).toUpperCase() + schedule.schedule_type.slice(1)} Schedule`}
                                </h3>
                                <p className="text-xs md:text-sm text-neutral-400 mt-1">
                                  {formatScheduleDescription(schedule)}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant={schedule.is_active ? 'success' : 'neutral'} className="text-xs">
                                {schedule.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="premium" className="text-xs">
                                {eventTypes.find(e => e.value === schedule.event_type)?.icon || '📅'} {eventTypes.find(e => e.value === schedule.event_type)?.label || schedule.event_type}
                              </Badge>
                              <Badge variant={schedule.meeting_type === 'group' ? 'accent' : 'neutral'} className="text-xs">
                                {schedule.meeting_type === 'group' ? '👥 Group' : '👤 One-on-One'}
                              </Badge>
                              <Badge variant="info" className="text-xs">
                                {schedule.slot_count || 0} slots
                              </Badge>
                              <Badge variant="neutral" className="text-xs">
                                {schedule.max_bookings} max {schedule.meeting_type === 'group' ? 'attendees' : 'booking'}{schedule.max_bookings !== 1 ? 's' : ''}
                              </Badge>
                              <Badge variant="neutral" className="text-xs">
                                {schedule.slot_length} min slots
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleScheduleActive(schedule)}
                              disabled={saving}
                            >
                              {schedule.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => deleteSchedule(schedule.id)}
                              disabled={saving}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Stack>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <Stack gap="lg">
              {/* Filter */}
              <Card>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <DatePicker
                    label="Filter by Date"
                    value={filterDate}
                    onChange={(dateString) => setFilterDate(dateString)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => setFilterDate('')}
                    size="md"
                  >
                    Clear Filter
                  </Button>
                </div>
              </Card>

              {/* Appointments List */}
              <Card>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-4">
                  Booked Appointments ({filteredAppointments.length})
                </h2>

                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 text-sm md:text-base">
                    No appointments found{filterDate ? ` for ${filterDate}` : ''}.
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {filteredAppointments.map((appointment) => {
                      const appointmentDate = new Date(appointment.scheduled_datetime)
                      const isPast = appointmentDate < new Date()

                      return (
                        <div
                          key={appointment.id}
                          className={`
                            p-3 md:p-4 rounded-xl border-2 transition-all
                            ${isPast
                              ? 'border-neutral-800 bg-neutral-900/50'
                              : 'border-neutral-700 hover:border-primary-500'
                            }
                          `}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 md:gap-3 mb-2">
                                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary-500 flex-shrink-0" />
                                <div>
                                  <p className="text-sm md:text-base font-semibold text-white">
                                    {appointmentDate.toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                  <p className="text-xs md:text-sm text-neutral-400 flex items-center gap-2">
                                    <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                    {appointment.scheduled_time} EST
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2">
                                <p className="text-xs md:text-sm text-neutral-300">
                                  <strong>Client:</strong> {appointment.user_name || 'Unknown'}
                                </p>
                                <p className="text-xs text-neutral-400 truncate">
                                  {appointment.user_email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={isPast ? 'neutral' : 'success'} className="text-xs">
                                {isPast ? 'Past' : 'Upcoming'}
                              </Badge>
                              <Badge variant="info" className="text-xs">
                                {appointment.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </Stack>
          )}
        </Stack>
      </Container>
    </AdminWrapper>
  )
}
