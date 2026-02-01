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
  TimePicker,
  Checkbox
} from '@/lib/design-system/components'
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Users, 
  Repeat, 
  CalendarRange, 
  Target, 
  MessageSquare, 
  Video, 
  GraduationCap, 
  User,
  UserPlus,
  Phone,
  Briefcase,
  Sparkles,
  Megaphone,
  Heart,
  Zap,
  Check
} from 'lucide-react'
import { toast } from 'sonner'

// Types
interface DayAvailability {
  enabled: boolean
  start: string // HH:MM format
  end: string   // HH:MM format
}

interface WeeklyAvailability {
  monday: DayAvailability
  tuesday: DayAvailability
  wednesday: DayAvailability
  thursday: DayAvailability
  friday: DayAvailability
  saturday: DayAvailability
  sunday: DayAvailability
}

const DEFAULT_AVAILABILITY: WeeklyAvailability = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '10:00', end: '14:00' },
  sunday: { enabled: false, start: '10:00', end: '14:00' }
}

const DAYS_OF_WEEK: (keyof WeeklyAvailability)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]

interface SchedulingStaff {
  id: string
  user_id: string | null
  display_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  bio: string | null
  event_types: string[]
  default_buffer_minutes: number
  timezone: string
  availability: WeeklyAvailability
  hourly_rate: number | null
  department: string | null
  is_active: boolean
  created_at: string
  // Joined from user_accounts when user_id is set
  user_account?: {
    full_name: string | null
    email: string
    role: string
  }
}

interface Schedule {
  id: string
  staff_id: string | null
  event_type: string
  meeting_type: 'one_on_one' | 'group'
  schedule_type: 'single' | 'range' | 'recurring'
  name: string | null
  max_bookings: number
  slot_length: number
  buffer_minutes: number
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
  staff?: SchedulingStaff
}

type AddMode = 'single' | 'range' | 'recurring'

// Comprehensive event types for all business needs
const EVENT_TYPE_CATEGORIES = [
  {
    category: 'Activation Intensive',
    types: [
      { value: 'intensive_calibration', label: 'Calibration Call', Icon: Target, description: '1:1 vision calibration' },
    ]
  },
  {
    category: 'Coaching & Sessions',
    types: [
      { value: 'coaching_1on1', label: '1:1 Coaching', Icon: MessageSquare, description: 'Private coaching session' },
      { value: 'coaching_group', label: 'Group Coaching', Icon: Users, description: 'Small group session' },
      { value: 'strategy_session', label: 'Strategy Session', Icon: Briefcase, description: 'Business/life strategy' },
    ]
  },
  {
    category: 'Sales & Consultations',
    types: [
      { value: 'discovery_call', label: 'Discovery Call', Icon: Phone, description: 'Initial consultation' },
      { value: 'sales_call', label: 'Sales Call', Icon: Megaphone, description: 'Sales conversation' },
      { value: 'demo_call', label: 'Demo Call', Icon: Sparkles, description: 'Product demonstration' },
    ]
  },
  {
    category: 'Events & Workshops',
    types: [
      { value: 'workshop', label: 'Workshop', Icon: GraduationCap, description: 'Interactive workshop' },
      { value: 'masterclass', label: 'Masterclass', Icon: Zap, description: 'Educational masterclass' },
      { value: 'webinar', label: 'Webinar', Icon: Video, description: 'Live webinar event' },
      { value: 'community_event', label: 'Community Event', Icon: Heart, description: 'Community gathering' },
    ]
  },
]

// Flatten for easy lookup
const ALL_EVENT_TYPES = EVENT_TYPE_CATEGORIES.flatMap(cat => cat.types)

export default function AdminSchedulingPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'schedules' | 'team' | 'slots'>('schedules')
  
  // Team/Staff management
  const [staff, setStaff] = useState<SchedulingStaff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  
  // Available admin users (not yet staff)
  const [availableUsers, setAvailableUsers] = useState<{id: string, full_name: string, email: string, role: string}[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  
  // New staff form
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffUserId, setNewStaffUserId] = useState<string | null>(null)
  const [newStaffEventTypes, setNewStaffEventTypes] = useState<string[]>([])
  const [newStaffBuffer, setNewStaffBuffer] = useState(15)
  const [newStaffDepartment, setNewStaffDepartment] = useState('')
  const [newStaffAvailability, setNewStaffAvailability] = useState<WeeklyAvailability>(DEFAULT_AVAILABILITY)
  
  // Availability editing
  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null)
  const [editingAvailability, setEditingAvailability] = useState<WeeklyAvailability>(DEFAULT_AVAILABILITY)
  
  // Schedules management
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedScheduleType, setSelectedScheduleType] = useState<'all' | 'single' | 'range' | 'recurring'>('all')
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [filterStaffId, setFilterStaffId] = useState<string>('all')
  
  // Add schedule modes
  const [addMode, setAddMode] = useState<AddMode>('single')
  const [scheduleName, setScheduleName] = useState('')
  const [eventType, setEventType] = useState('coaching_1on1')
  const [meetingType, setMeetingType] = useState<'one_on_one' | 'group'>('one_on_one')
  const [bufferMinutes, setBufferMinutes] = useState(15)
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
      await Promise.all([loadStaff(), loadSchedules(), loadAvailableUsers()])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      // Get all admin/coach/super_admin users
      const { data: adminUsers, error: usersError } = await supabase
        .from('user_accounts')
        .select('id, full_name, email, role')
        .in('role', ['admin', 'super_admin', 'coach'])
        .order('full_name', { ascending: true })

      if (usersError) throw usersError

      // Get existing staff user_ids
      const { data: existingStaff } = await supabase
        .from('staff')
        .select('user_id')
        .not('user_id', 'is', null)

      const existingUserIds = new Set((existingStaff || []).map(s => s.user_id))

      // Filter out users who already have staff records
      const available = (adminUsers || []).filter(u => !existingUserIds.has(u.id))
      setAvailableUsers(available)
    } catch (error) {
      console.error('Error loading available users:', error)
      setAvailableUsers([])
    }
  }

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          user_account:user_accounts(full_name, email, role)
        `)
        .order('display_name', { ascending: true })

      if (error && error.code === '42P01') {
        console.log('staff table does not exist yet - run the migration')
        setStaff([])
        return
      }

      if (error) throw error
      setStaff(data || [])
    } catch (error) {
      console.error('Error loading staff:', error)
      setStaff([])
    }
  }

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          staff:staff(id, display_name, email, event_types, default_buffer_minutes, department)
        `)
        .order('created_at', { ascending: false })

      if (error && error.code === '42P01') {
        console.log('Schedules table does not exist yet - run the migration')
        toast.error('Schedules table not found. Please run the database migration.')
        setSchedules([])
        return
      }

      if (error) throw error

      if (data) {
        // Get slot counts for each schedule
        const schedulesWithCounts = await Promise.all(
          data.map(async (schedule) => {
            const { count } = await supabase
              .from('schedule_time_slots')
              .select('*', { count: 'exact', head: true })
              .eq('schedule_id', schedule.id)

            return {
              ...schedule,
              slot_count: count || 0
            }
          })
        )
        setSchedules(schedulesWithCounts)
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
      toast.error('Failed to load schedules')
      setSchedules([])
    }
  }

  // Staff management functions
  const createStaffMember = async () => {
    if (!newStaffName) {
      toast.error('Please enter a name')
      return
    }
    if (newStaffEventTypes.length === 0) {
      toast.error('Please select at least one event type')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('staff')
        .insert({
          user_id: newStaffUserId || null,
          display_name: newStaffName,
          email: newStaffEmail || null,
          event_types: newStaffEventTypes,
          default_buffer_minutes: newStaffBuffer,
          department: newStaffDepartment || null,
          availability: newStaffAvailability,
          is_active: true
        })

      if (error) throw error

      toast.success(`Added ${newStaffName} to the team`)
      resetStaffForm()
      await loadData() // Reload all data including available users
    } catch (error) {
      console.error('Error creating staff:', error)
      toast.error('Failed to add team member')
    } finally {
      setSaving(false)
    }
  }

  const createStaffFromUser = (user: {id: string, full_name: string, email: string, role: string}) => {
    setNewStaffUserId(user.id)
    setNewStaffName(user.full_name || user.email)
    setNewStaffEmail(user.email)
    setSelectedUserId('')
    toast.success(`Pre-filled from ${user.full_name || user.email}. Select event types and save.`)
  }

  const resetStaffForm = () => {
    setNewStaffName('')
    setNewStaffEmail('')
    setNewStaffUserId(null)
    setNewStaffEventTypes([])
    setNewStaffBuffer(15)
    setNewStaffDepartment('')
    setNewStaffAvailability(DEFAULT_AVAILABILITY)
    setSelectedUserId('')
  }

  const startEditingAvailability = (member: SchedulingStaff) => {
    setEditingAvailabilityId(member.id)
    setEditingAvailability(member.availability || DEFAULT_AVAILABILITY)
  }

  const cancelEditingAvailability = () => {
    setEditingAvailabilityId(null)
    setEditingAvailability(DEFAULT_AVAILABILITY)
  }

  const saveAvailability = async (memberId: string) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('staff')
        .update({ availability: editingAvailability })
        .eq('id', memberId)

      if (error) throw error

      toast.success('Availability updated')
      setEditingAvailabilityId(null)
      await loadStaff()
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  const updateEditingDayAvailability = (day: keyof WeeklyAvailability, field: keyof DayAvailability, value: boolean | string) => {
    setEditingAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const updateNewStaffDayAvailability = (day: keyof WeeklyAvailability, field: keyof DayAvailability, value: boolean | string) => {
    setNewStaffAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const toggleStaffActive = async (staffMember: SchedulingStaff) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: !staffMember.is_active })
        .eq('id', staffMember.id)

      if (error) throw error
      toast.success(`${staffMember.display_name} ${!staffMember.is_active ? 'activated' : 'deactivated'}`)
      await loadStaff()
    } catch (error) {
      console.error('Error updating staff:', error)
      toast.error('Failed to update team member')
    } finally {
      setSaving(false)
    }
  }

  const deleteStaffMember = async (staffId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}? This will delete all their schedules.`)) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId)

      if (error) throw error
      toast.success(`Removed ${name} from the team`)
      await loadData()
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast.error('Failed to remove team member')
    } finally {
      setSaving(false)
    }
  }

  const toggleStaffEventType = (eventTypeValue: string) => {
    setNewStaffEventTypes(prev => 
      prev.includes(eventTypeValue)
        ? prev.filter(e => e !== eventTypeValue)
        : [...prev, eventTypeValue]
    )
  }

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

  interface TimeSlot {
    date: string
    time: string
    available: boolean
    max_bookings: number
    current_bookings: number
    duration_minutes: number
    buffer_minutes: number
    staff_id: string | null
  }

  const generateSlotsFromSchedule = (schedule: Schedule, staffId: string | null, slotLength: number, buffer: number): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const baseSlot = {
      available: schedule.is_active,
      max_bookings: schedule.max_bookings,
      current_bookings: 0,
      duration_minutes: slotLength,
      buffer_minutes: buffer,
      staff_id: staffId
    }

    if (schedule.schedule_type === 'single' && schedule.single_date && schedule.single_time) {
      slots.push({
        ...baseSlot,
        date: schedule.single_date,
        time: schedule.single_time,
      })
    } else if (schedule.schedule_type === 'range' && schedule.start_date && schedule.end_date && schedule.start_time && schedule.end_time) {
      const start = new Date(schedule.start_date)
      const end = new Date(schedule.end_date)
      const timeSlots = generateTimeSlots(schedule.start_time, schedule.end_time, slotLength)
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (schedule.exclude_weekends && (d.getDay() === 0 || d.getDay() === 6)) continue
        
        const dateStr = d.toISOString().split('T')[0]
        timeSlots.forEach(time => {
          slots.push({
            ...baseSlot,
            date: dateStr,
            time: time,
          })
        })
      }
    } else if (schedule.schedule_type === 'recurring' && schedule.recurring_start_date && schedule.recurring_end_date && schedule.recurring_start_time && schedule.recurring_end_time && schedule.days_of_week) {
      const start = new Date(schedule.recurring_start_date)
      const end = new Date(schedule.recurring_end_date)
      const timeSlots = generateTimeSlots(schedule.recurring_start_time, schedule.recurring_end_time, slotLength)
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (schedule.days_of_week.includes(d.getDay())) {
          const dateStr = d.toISOString().split('T')[0]
          timeSlots.forEach(time => {
            slots.push({
              ...baseSlot,
              date: dateStr,
              time: time,
            })
          })
        }
      }
    }

    return slots
  }

  const createSchedule = async () => {
    // Validate staff selection for non-group events
    if (!selectedStaffId && meetingType === 'one_on_one') {
      toast.error('Please select a team member for 1:1 scheduling')
      return
    }

    setSaving(true)
    try {
      const baseMaxBookings = addMode === 'single' 
        ? singleSchedule.max_bookings 
        : addMode === 'range' 
          ? rangeSchedule.max_bookings 
          : recurringSchedule.max_bookings
      
      const finalMaxBookings = meetingType === 'one_on_one' ? 1 : baseMaxBookings
      const slotLength = addMode === 'single' ? singleSchedule.slot_length : addMode === 'range' ? rangeSchedule.slotLength : recurringSchedule.slotLength

      const scheduleData: Record<string, unknown> = {
        staff_id: selectedStaffId || null,
        event_type: eventType,
        meeting_type: meetingType,
        schedule_type: addMode,
        name: scheduleName || null,
        max_bookings: finalMaxBookings,
        slot_length: slotLength,
        buffer_minutes: bufferMinutes,
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

      const { data: newSchedule, error: scheduleError } = await supabase
        .from('schedules')
        .insert(scheduleData)
        .select()
        .single()

      if (scheduleError) {
        console.error('Error creating schedule:', scheduleError.message || scheduleError.code)
        toast.error(`Failed to create schedule: ${scheduleError.message || 'Database error'}`)
        setSaving(false)
        return
      }

      // Generate slots from schedule
      const slots = generateSlotsFromSchedule(
        newSchedule as Schedule, 
        selectedStaffId || null, 
        slotLength, 
        bufferMinutes
      )

      if (slots.length > 0) {
        const slotData = slots.map(slot => ({
          ...slot,
          schedule_id: newSchedule.id,
          staff_id: selectedStaffId || null,
          event_type: eventType,
          meeting_type: meetingType
        }))

        const { error: slotsError } = await supabase
          .from('schedule_time_slots')
          .insert(slotData)

        if (slotsError) {
          console.error('Error creating slots:', slotsError)
          await supabase.from('schedules').delete().eq('id', newSchedule.id)
          toast.error('Failed to create time slots')
          setSaving(false)
          return
        }
      }

      toast.success(`Created ${addMode} schedule with ${slots.length} time slot${slots.length !== 1 ? 's' : ''}`)
      
      // Reset forms
      setScheduleName('')
      setSelectedStaffId('')
      setEventType('coaching_1on1')
      setMeetingType('one_on_one')
      setBufferMinutes(15)
      setSingleSchedule({ date: '', time: '', max_bookings: 1, slot_length: 30 })
      setRangeSchedule({ startDate: '', endDate: '', startTime: '', endTime: '', slotLength: 30, max_bookings: 1, excludeWeekends: true })
      setRecurringSchedule({ startDate: '', endDate: '', startTime: '', endTime: '', slotLength: 30, daysOfWeek: [], max_bookings: 1 })
      
      await loadSchedules()
    } catch (error) {
      console.error('Error creating schedule:', error instanceof Error ? error.message : JSON.stringify(error))
      toast.error(`Failed to create schedule: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule? This will delete all associated time slots.')) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId)

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
      const { error } = await supabase
        .from('schedules')
        .update({ is_active: !schedule.is_active })
        .eq('id', schedule.id)

      if (error) throw error

      // Update all slots for this schedule
      await supabase
        .from('schedule_time_slots')
        .update({ available: !schedule.is_active })
        .eq('schedule_id', schedule.id)

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

  const getEventTypeCategory = (eventTypeValue: string): string => {
    for (const cat of EVENT_TYPE_CATEGORIES) {
      if (cat.types.some(t => t.value === eventTypeValue)) {
        return cat.category
      }
    }
    return 'Other'
  }

  const filteredSchedules = schedules.filter(s => {
    const matchesScheduleType = selectedScheduleType === 'all' || s.schedule_type === selectedScheduleType
    const matchesEventType = selectedEventType === 'all' || s.event_type === selectedEventType
    const matchesCategory = selectedCategory === 'all' || getEventTypeCategory(s.event_type) === selectedCategory
    const matchesStaff = filterStaffId === 'all' || s.staff_id === filterStaffId
    return matchesScheduleType && matchesEventType && matchesCategory && matchesStaff
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
            title="Scheduling" 
            subtitle="Manage availability for all event types: coaching, sales, workshops, and more"
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-neutral-900 border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{staff.filter(s => s.is_active).length}</p>
                  <p className="text-xs text-neutral-500">Team Members</p>
                </div>
              </div>
            </Card>
            <Card className="bg-neutral-900 border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{schedules.length}</p>
                  <p className="text-xs text-neutral-500">Schedules</p>
                </div>
              </div>
            </Card>
            <Card className="bg-neutral-900 border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{schedules.reduce((acc, s) => acc + (s.slot_count || 0), 0)}</p>
                  <p className="text-xs text-neutral-500">Total Slots</p>
                </div>
              </div>
            </Card>
            <Card className="bg-neutral-900 border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Repeat className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{schedules.filter(s => s.is_active).length}</p>
                  <p className="text-xs text-neutral-500">Active</p>
                </div>
              </div>
            </Card>
            <Card className="bg-neutral-900 border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{bufferMinutes}m</p>
                  <p className="text-xs text-neutral-500">Buffer Time</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 md:gap-4 border-b border-neutral-800 overflow-x-auto">
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
              onClick={() => setActiveTab('team')}
              className={`px-3 md:px-4 py-2 text-sm md:text-base font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'team'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Team ({staff.length})
            </button>
          </div>

          {/* Team Tab */}
          {activeTab === 'team' && (
            <Stack gap="lg">
              {/* Add Team Member */}
              <Card>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-4">Add Team Member</h2>
                
                {/* Quick Create from User Account */}
                {availableUsers.length > 0 && (
                  <div className="mb-6 p-4 bg-primary-500/10 border-2 border-primary-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <UserPlus className="w-5 h-5 text-primary-500" />
                      <h3 className="font-semibold text-primary-400">Quick Add from User Account</h3>
                    </div>
                    <p className="text-sm text-neutral-400 mb-3">
                      Select an existing admin/coach user to auto-fill their details:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => createStaffFromUser(user)}
                          className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-primary-500 rounded-lg transition-all"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-500">
                              {(user.full_name || user.email)?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">{user.full_name || user.email}</p>
                            <p className="text-xs text-neutral-500">{user.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked User Indicator */}
                {newStaffUserId && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-400">
                        Will be linked to user account
                      </span>
                    </div>
                    <button
                      onClick={resetStaffForm}
                      className="text-xs text-neutral-400 hover:text-neutral-200"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Input
                    label="Display Name *"
                    placeholder="e.g., Jordan Smith"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                  />
                  <Input
                    label="Email (Optional)"
                    type="email"
                    placeholder="jordan@example.com"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Department (Optional)</label>
                    <select
                      value={newStaffDepartment}
                      onChange={(e) => setNewStaffDepartment(e.target.value)}
                      className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                    >
                      <option value="">No department</option>
                      <option value="Coaching">Coaching</option>
                      <option value="Sales">Sales</option>
                      <option value="Support">Support</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Default Buffer Between Meetings</label>
                  <select
                    value={newStaffBuffer}
                    onChange={(e) => setNewStaffBuffer(parseInt(e.target.value))}
                    className="w-full max-w-xs px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                  >
                    <option value={0}>No buffer</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Event Types This Person Can Handle</label>
                  <div className="space-y-3">
                    {EVENT_TYPE_CATEGORIES.map(category => (
                      <div key={category.category}>
                        <p className="text-xs text-neutral-400 mb-2">{category.category}</p>
                        <div className="flex flex-wrap gap-2">
                          {category.types.map(type => (
                            <button
                              key={type.value}
                              onClick={() => toggleStaffEventType(type.value)}
                              className={`
                                px-3 py-1.5 rounded-lg border text-xs transition-all
                                ${newStaffEventTypes.includes(type.value)
                                  ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                                  : 'border-neutral-700 hover:border-neutral-600 text-neutral-300'
                                }
                              `}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Availability */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Weekly Availability</label>
                  <div className="bg-neutral-900/50 rounded-xl p-4 space-y-3">
                    {DAYS_OF_WEEK.map(day => (
                      <div key={day} className="flex items-center gap-6">
                        <div className="w-32">
                          <Checkbox
                            checked={newStaffAvailability[day].enabled}
                            onChange={(e) => updateNewStaffDayAvailability(day, 'enabled', e.target.checked)}
                            label={day.charAt(0).toUpperCase() + day.slice(1)}
                          />
                        </div>
                        {newStaffAvailability[day].enabled && (
                          <div className="flex items-center gap-3">
                            <TimePicker
                              value={newStaffAvailability[day].start}
                              onChange={(time) => updateNewStaffDayAvailability(day, 'start', time)}
                              step={30}
                              size="sm"
                              className="w-[110px]"
                            />
                            <span className="text-neutral-400">to</span>
                            <TimePicker
                              value={newStaffAvailability[day].end}
                              onChange={(time) => updateNewStaffDayAvailability(day, 'end', time)}
                              step={30}
                              size="sm"
                              className="w-[110px]"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={createStaffMember}
                  disabled={saving || !newStaffName}
                  size="md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              </Card>

              {/* Team Members List */}
              <Card>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-4">Team Members ({staff.length})</h2>
                {staff.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400">
                    No team members yet. Add one above to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {staff.map((member) => (
                      <div
                        key={member.id}
                        className={`
                          p-4 rounded-xl border-2 transition-all
                          ${member.is_active
                            ? 'border-neutral-700 hover:border-primary-500'
                            : 'border-neutral-800 bg-neutral-900/50 opacity-60'
                          }
                        `}
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary-500" />
                              </div>
                              <div>
                                <h3 className="text-base md:text-lg font-semibold text-white">
                                  {member.display_name}
                                </h3>
                                {member.email && (
                                  <p className="text-xs text-neutral-400">{member.email}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant={member.is_active ? 'success' : 'neutral'} className="text-xs">
                                {member.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              {member.user_id && (
                                <Badge variant="success" className="text-xs flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Linked Account
                                </Badge>
                              )}
                              {member.department && (
                                <Badge variant="accent" className="text-xs">
                                  {member.department}
                                </Badge>
                              )}
                              <Badge variant="info" className="text-xs">
                                {member.default_buffer_minutes}m buffer
                              </Badge>
                              {member.event_types.slice(0, 3).map(et => {
                                const eventType = ALL_EVENT_TYPES.find(t => t.value === et)
                                return (
                                  <Badge key={et} variant="neutral" className="text-xs">
                                    {eventType?.label || et}
                                  </Badge>
                                )
                              })}
                              {member.event_types.length > 3 && (
                                <Badge variant="neutral" className="text-xs">
                                  +{member.event_types.length - 3} more
                                </Badge>
                              )}
                              {/* Availability Summary */}
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 text-neutral-500" />
                                <span className="text-xs text-neutral-500">
                                  {member.availability 
                                    ? DAYS_OF_WEEK.filter(d => member.availability[d]?.enabled).map(d => d.slice(0, 3)).join(', ') || 'No days set'
                                    : 'Mon-Fri (default)'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editingAvailabilityId === member.id 
                                ? cancelEditingAvailability() 
                                : startEditingAvailability(member)
                              }
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              {editingAvailabilityId === member.id ? 'Cancel' : 'Hours'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStaffActive(member)}
                              disabled={saving}
                            >
                              {member.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => deleteStaffMember(member.id, member.display_name)}
                              disabled={saving}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Expandable Availability Editor */}
                        {editingAvailabilityId === member.id && (
                          <div className="mt-4 pt-4 border-t border-neutral-700">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary-500" />
                              Edit Weekly Availability
                            </h4>
                            <div className="bg-neutral-900/50 rounded-xl p-4 space-y-3">
                              {DAYS_OF_WEEK.map(day => (
                                <div key={day} className="flex items-center gap-6">
                                  <div className="w-32">
                                    <Checkbox
                                      checked={editingAvailability[day].enabled}
                                      onChange={(e) => updateEditingDayAvailability(day, 'enabled', e.target.checked)}
                                      label={day.charAt(0).toUpperCase() + day.slice(1)}
                                    />
                                  </div>
                                  {editingAvailability[day].enabled && (
                                    <div className="flex items-center gap-3">
                                      <TimePicker
                                        value={editingAvailability[day].start}
                                        onChange={(time) => updateEditingDayAvailability(day, 'start', time)}
                                        step={30}
                                        size="sm"
                                        className="w-[110px]"
                                      />
                                      <span className="text-neutral-400">to</span>
                                      <TimePicker
                                        value={editingAvailability[day].end}
                                        onChange={(time) => updateEditingDayAvailability(day, 'end', time)}
                                        step={30}
                                        size="sm"
                                        className="w-[110px]"
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => saveAvailability(member.id)}
                                disabled={saving}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Save Availability
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditingAvailability}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Stack>
          )}

          {/* Schedules Tab - Create New Schedule */}
          {activeTab === 'schedules' && (
            <Stack gap="lg">
          <Card>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-4">Create New Schedule</h2>
            
            {/* Team Member Selection */}
            <div className="mb-4 p-4 bg-neutral-800/50 rounded-xl border border-neutral-700">
              <label className="block text-sm font-medium mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Assign to Team Member
              </label>
              {staff.length === 0 ? (
                <div className="text-sm text-neutral-400">
                  No team members yet.{' '}
                  <button 
                    onClick={() => setActiveTab('team')} 
                    className="text-primary-500 hover:underline"
                  >
                    Add team members first
                  </button>
                </div>
              ) : (
                <select
                  value={selectedStaffId}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value)
                    // Set buffer to staff default
                    const staffMember = staff.find(s => s.id === e.target.value)
                    if (staffMember) {
                      setBufferMinutes(staffMember.default_buffer_minutes)
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                >
                  <option value="">Select team member...</option>
                  {staff.filter(s => s.is_active).map(member => (
                    <option key={member.id} value={member.id}>
                      {member.display_name} ({member.event_types.length} event types, {member.default_buffer_minutes}m buffer)
                    </option>
                  ))}
                </select>
              )}
              {selectedStaffId && (
                <div className="mt-3 flex items-center gap-4">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Buffer between meetings</label>
                    <select
                      value={bufferMinutes}
                      onChange={(e) => setBufferMinutes(parseInt(e.target.value))}
                      className="px-3 py-2 bg-[#1F1F1F] border border-[#333] rounded-lg text-sm focus:border-primary-500 focus:outline-none"
                    >
                      <option value={0}>No buffer</option>
                      <option value={5}>5 min</option>
                      <option value={10}>10 min</option>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                    </select>
                  </div>
                  <p className="text-xs text-neutral-500 mt-4">
                    Prevents scheduling conflicts with {bufferMinutes}min gap between meetings
                  </p>
                </div>
              )}
            </div>

            {/* Event Type Selection - Grouped by Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value)
                  // Auto-set meeting type based on event
                  const type = ALL_EVENT_TYPES.find(t => t.value === e.target.value)
                  if (type?.value.includes('1on1') || type?.value === 'discovery_call' || type?.value === 'sales_call' || type?.value === 'demo_call' || type?.value === 'intensive_calibration' || type?.value === 'strategy_session') {
                    setMeetingType('one_on_one')
                  } else if (type?.value.includes('group') || type?.value === 'workshop' || type?.value === 'masterclass' || type?.value === 'webinar' || type?.value === 'community_event') {
                    setMeetingType('group')
                  }
                }}
                className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all"
              >
                {EVENT_TYPE_CATEGORIES.map(category => (
                  <optgroup key={category.category} label={category.category}>
                    {category.types.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Meeting Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Meeting Type</label>
                <select
                  value={meetingType}
                  onChange={(e) => {
                    const newType = e.target.value as 'one_on_one' | 'group'
                    setMeetingType(newType)
                    if (newType === 'one_on_one') {
                      setSingleSchedule(prev => ({ ...prev, max_bookings: 1 }))
                      setRangeSchedule(prev => ({ ...prev, max_bookings: 1 }))
                      setRecurringSchedule(prev => ({ ...prev, max_bookings: 1 }))
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                >
                  <option value="one_on_one">One-on-One (1 booking per slot)</option>
                  <option value="group">Group (multiple bookings per slot)</option>
                </select>
              </div>
              <div>
                <Input
                  label="Schedule Name (Optional)"
                  placeholder="e.g., 'Q1 Coaching Availability'"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                />
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={addMode === 'single' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setAddMode('single')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Single Slot
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
                  onChange={(dateString: string) => setSingleSchedule({ ...singleSchedule, date: dateString })}
                  minDate={new Date().toISOString().split('T')[0]}
                />
                <TimePicker
                  label="Time"
                  value={singleSchedule.time}
                  onChange={(time) => setSingleSchedule({ ...singleSchedule, time })}
                  step={15}
                />
                <Input
                  label={meetingType === 'one_on_one' ? 'Max Bookings (1)' : 'Max Attendees'}
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
                    Create
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
                    onChange={(dateString: string) => setRangeSchedule({ ...rangeSchedule, startDate: dateString })}
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                  <DatePicker
                    label="End Date"
                    value={rangeSchedule.endDate}
                    onChange={(dateString: string) => setRangeSchedule({ ...rangeSchedule, endDate: dateString })}
                    minDate={rangeSchedule.startDate || new Date().toISOString().split('T')[0]}
                  />
                  <Input
                    label={meetingType === 'one_on_one' ? 'Max Bookings (1)' : 'Max Attendees'}
                    type="number"
                    value={rangeSchedule.max_bookings}
                    onChange={(e) => setRangeSchedule({ ...rangeSchedule, max_bookings: Math.max(1, parseInt(e.target.value) || 1) })}
                    min={1}
                    disabled={meetingType === 'one_on_one'}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <TimePicker
                    label="Start Time"
                    value={rangeSchedule.startTime}
                    onChange={(time) => setRangeSchedule({ ...rangeSchedule, startTime: time })}
                    step={15}
                  />
                  <TimePicker
                    label="End Time"
                    value={rangeSchedule.endTime}
                    onChange={(time) => setRangeSchedule({ ...rangeSchedule, endTime: time })}
                    step={15}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Slot Duration</label>
                    <select
                      value={rangeSchedule.slotLength}
                      onChange={(e) => setRangeSchedule({ ...rangeSchedule, slotLength: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                      <option value={120}>2 hours</option>
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
                    onChange={(dateString: string) => setRecurringSchedule({ ...recurringSchedule, startDate: dateString })}
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                  <DatePicker
                    label="End Date"
                    value={recurringSchedule.endDate}
                    onChange={(dateString: string) => setRecurringSchedule({ ...recurringSchedule, endDate: dateString })}
                    minDate={recurringSchedule.startDate || new Date().toISOString().split('T')[0]}
                  />
                  <Input
                    label={meetingType === 'one_on_one' ? 'Max Bookings (1)' : 'Max Attendees'}
                    type="number"
                    value={recurringSchedule.max_bookings}
                    onChange={(e) => setRecurringSchedule({ ...recurringSchedule, max_bookings: Math.max(1, parseInt(e.target.value) || 1) })}
                    min={1}
                    disabled={meetingType === 'one_on_one'}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <TimePicker
                    label="Start Time"
                    value={recurringSchedule.startTime}
                    onChange={(time) => setRecurringSchedule({ ...recurringSchedule, startTime: time })}
                    step={15}
                  />
                  <TimePicker
                    label="End Time"
                    value={recurringSchedule.endTime}
                    onChange={(time) => setRecurringSchedule({ ...recurringSchedule, endTime: time })}
                    step={15}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Slot Duration</label>
                    <select
                      value={recurringSchedule.slotLength}
                      onChange={(e) => setRecurringSchedule({ ...recurringSchedule, slotLength: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                      <option value={120}>2 hours</option>
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
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Team Member Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Team Member</label>
                  <select
                    value={filterStaffId}
                    onChange={(e) => setFilterStaffId(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all text-sm"
                  >
                    <option value="all">All Team Members</option>
                    {staff.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value)
                      setSelectedEventType('all') // Reset event type when category changes
                    }}
                    className="w-full px-4 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all text-sm"
                  >
                    <option value="all">All Categories</option>
                    {EVENT_TYPE_CATEGORIES.map(cat => (
                      <option key={cat.category} value={cat.category}>
                        {cat.category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Type Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Event Type</label>
                  <select
                    value={selectedEventType}
                    onChange={(e) => setSelectedEventType(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-xl focus:border-primary-500 focus:outline-none transition-all text-sm"
                  >
                    <option value="all">All Types</option>
                    {(selectedCategory === 'all' 
                      ? ALL_EVENT_TYPES 
                      : EVENT_TYPE_CATEGORIES.find(c => c.category === selectedCategory)?.types || []
                    ).map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
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
                    All
                  </Button>
                  <Button
                    variant={selectedScheduleType === 'single' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedScheduleType('single')}
                  >
                    Single
                  </Button>
                  <Button
                    variant={selectedScheduleType === 'range' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedScheduleType('range')}
                  >
                    Range
                  </Button>
                  <Button
                    variant={selectedScheduleType === 'recurring' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedScheduleType('recurring')}
                  >
                    Recurring
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
                {filteredSchedules.map((schedule) => {
                  const eventTypeInfo = ALL_EVENT_TYPES.find(e => e.value === schedule.event_type)
                  const EventIcon = eventTypeInfo?.Icon || Calendar
                  
                  return (
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
                            {schedule.staff && (
                              <Badge variant="accent" className="text-xs">
                                <User className="w-3 h-3 inline mr-1" />
                                {schedule.staff.display_name}
                              </Badge>
                            )}
                            <Badge variant="premium" className="text-xs">
                              <EventIcon className="w-3 h-3 inline mr-1" />
                              {eventTypeInfo?.label || schedule.event_type}
                            </Badge>
                            <Badge variant={schedule.meeting_type === 'group' ? 'accent' : 'neutral'} className="text-xs">
                              {schedule.meeting_type === 'group' ? (
                                <><Users className="w-3 h-3 inline mr-1" />Group</>
                              ) : (
                                <><User className="w-3 h-3 inline mr-1" />1:1</>
                              )}
                            </Badge>
                            <Badge variant="info" className="text-xs">
                              {schedule.slot_count || 0} slots
                            </Badge>
                            <Badge variant="neutral" className="text-xs">
                              {schedule.slot_length} min
                            </Badge>
                            {schedule.buffer_minutes > 0 && (
                              <Badge variant="neutral" className="text-xs">
                                {schedule.buffer_minutes}m buffer
                              </Badge>
                            )}
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
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
