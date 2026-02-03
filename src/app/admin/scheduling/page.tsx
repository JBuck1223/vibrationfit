'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  Container, 
  Card, 
  Button, 
  Input,
  Spinner,
  Stack,
  PageHero,
  TimePicker,
  Checkbox,
  DeleteConfirmationDialog
} from '@/lib/design-system/components'
import { 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  UserPlus,
  Check,
  Pencil,
  X
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface StaffMember {
  id: string
  display_name: string
  email: string
  user_id?: string
  department?: string
  avatar_url?: string
  is_active: boolean
  event_types: string[]
  default_buffer_minutes: number
  availability: DayAvailability
  created_at: string
}

interface DayAvailability {
  [day: string]: {
    enabled: boolean
    start: string
    end: string
  }
}

interface UserAccount {
  id: string
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  role: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const EVENT_TYPE_OPTIONS = [
  { value: 'intensive_calibration', label: 'Calibration Call' },
  { value: 'coaching_1on1', label: '1-on-1 Coaching' },
  { value: 'group_session', label: 'Group Session' },
  { value: 'sales_call', label: 'Sales Call' },
  { value: 'workshop', label: 'Workshop' },
]

const DEFAULT_AVAILABILITY: DayAvailability = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '09:00', end: '17:00' },
  sunday: { enabled: false, start: '09:00', end: '17:00' },
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SchedulingPage() {
  const supabase = createClient()
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Staff data
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  
  // New staff form
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffDepartment, setNewStaffDepartment] = useState('')
  const [newStaffEventTypes, setNewStaffEventTypes] = useState<string[]>([])
  const [newStaffAvailability, setNewStaffAvailability] = useState<DayAvailability>(DEFAULT_AVAILABILITY)
  const [newStaffUserId, setNewStaffUserId] = useState<string | null>(null)
  
  // Edit staff
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  const [editingStaffData, setEditingStaffData] = useState<Partial<StaffMember> | null>(null)
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Available users for linking
  const [availableUsers, setAvailableUsers] = useState<UserAccount[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadStaffMembers(), loadAvailableUsers()])
    setLoading(false)
  }

  const loadStaffMembers = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('display_name')
    
    if (error) {
      console.error('Error loading staff:', error)
      toast.error('Failed to load team members')
      return
    }
    
    setStaffMembers(data || [])
  }

  const loadAvailableUsers = async () => {
    // Get users who could be staff (admins, coaches) but aren't linked yet
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('user_id')
      .not('user_id', 'is', null)
    
    const linkedUserIds = existingStaff?.map(s => s.user_id).filter(Boolean) || []
    
    let query = supabase
      .from('user_accounts')
      .select('id, email, first_name, last_name, full_name, role')
      .in('role', ['admin', 'super_admin', 'coach'])
      .order('full_name')
    
    if (linkedUserIds.length > 0) {
      query = query.not('id', 'in', `(${linkedUserIds.join(',')})`)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error loading users:', error)
      return
    }
    
    setAvailableUsers(data || [])
  }

  // ============================================================================
  // STAFF MANAGEMENT
  // ============================================================================

  const createStaffMember = async () => {
    if (!newStaffName || !newStaffEmail) {
      toast.error('Please enter name and email')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('staff')
        .insert({
          display_name: newStaffName,
          email: newStaffEmail,
          department: newStaffDepartment || null,
          event_types: newStaffEventTypes,
          availability: newStaffAvailability,
          user_id: newStaffUserId,
          is_active: true,
          default_buffer_minutes: 15
        })

      if (error) throw error

      toast.success('Team member added')
      resetStaffForm()
      await loadData()
    } catch (error) {
      console.error('Error creating staff:', error)
      toast.error('Failed to add team member')
    } finally {
      setSaving(false)
    }
  }

  const createStaffFromUser = () => {
    if (!selectedUserId) return
    
    const user = availableUsers.find(u => u.id === selectedUserId)
    if (!user) return
    
    setNewStaffName(user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '')
    setNewStaffEmail(user.email)
    setNewStaffUserId(user.id)
    setSelectedUserId('')
    
    toast.success('User details loaded. Fill in availability and event types, then save.')
  }

  const resetStaffForm = () => {
    setNewStaffName('')
    setNewStaffEmail('')
    setNewStaffDepartment('')
    setNewStaffEventTypes([])
    setNewStaffAvailability(DEFAULT_AVAILABILITY)
    setNewStaffUserId(null)
    setSelectedUserId('')
  }

  const confirmDeleteStaff = (staff: StaffMember) => {
    setStaffToDelete(staff)
    setShowDeleteConfirm(true)
  }

  const deleteStaffMember = async () => {
    if (!staffToDelete) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffToDelete.id)

      if (error) throw error

      toast.success('Team member removed')
      setShowDeleteConfirm(false)
      setStaffToDelete(null)
      await loadData()
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast.error('Failed to remove team member')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setStaffToDelete(null)
  }

  const toggleStaffActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      toast.success(currentStatus ? 'Team member deactivated' : 'Team member activated')
      await loadStaffMembers()
    } catch (error) {
      console.error('Error toggling staff status:', error)
      toast.error('Failed to update status')
    }
  }

  // ============================================================================
  // EDIT STAFF
  // ============================================================================

  const startEditingStaff = (staff: StaffMember) => {
    setEditingStaffId(staff.id)
    setEditingStaffData({
      display_name: staff.display_name,
      email: staff.email,
      department: staff.department || '',
      event_types: staff.event_types || [],
      default_buffer_minutes: staff.default_buffer_minutes || 15,
      availability: staff.availability || DEFAULT_AVAILABILITY
    })
  }

  const cancelEditingStaff = () => {
    setEditingStaffId(null)
    setEditingStaffData(null)
  }

  const saveStaffEdit = async () => {
    if (!editingStaffId || !editingStaffData) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('staff')
        .update({
          display_name: editingStaffData.display_name,
          email: editingStaffData.email,
          department: editingStaffData.department || null,
          event_types: editingStaffData.event_types || [],
          default_buffer_minutes: editingStaffData.default_buffer_minutes || 15,
          availability: editingStaffData.availability
        })
        .eq('id', editingStaffId)

      if (error) throw error

      toast.success('Team member updated')
      setEditingStaffId(null)
      setEditingStaffData(null)
      await loadStaffMembers()
    } catch (error) {
      console.error('Error updating staff:', error)
      toast.error('Failed to update team member')
    } finally {
      setSaving(false)
    }
  }

  const updateEditingStaffDayAvailability = (
    day: string, 
    field: 'enabled' | 'start' | 'end', 
    value: boolean | string
  ) => {
    if (!editingStaffData?.availability) return
    
    setEditingStaffData({
      ...editingStaffData,
      availability: {
        ...editingStaffData.availability,
        [day]: {
          ...editingStaffData.availability[day],
          [field]: value
        }
      }
    })
  }

  const toggleEditingStaffEventType = (eventType: string) => {
    if (!editingStaffData) return
    
    const current = editingStaffData.event_types || []
    const updated = current.includes(eventType)
      ? current.filter(t => t !== eventType)
      : [...current, eventType]
    
    setEditingStaffData({ ...editingStaffData, event_types: updated })
  }

  // ============================================================================
  // NEW STAFF FORM HELPERS
  // ============================================================================

  const updateNewStaffDayAvailability = (
    day: string, 
    field: 'enabled' | 'start' | 'end', 
    value: boolean | string
  ) => {
    setNewStaffAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const toggleNewStaffEventType = (eventType: string) => {
    setNewStaffEventTypes(prev => 
      prev.includes(eventType)
        ? prev.filter(t => t !== eventType)
        : [...prev, eventType]
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero 
          eyebrow="ADMIN" 
          title="Team Management" 
          subtitle="Set team availability and event types. Bookings are calculated automatically."
        />

        {/* Team Members */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Team Members
            </h2>
          </div>

          {/* Quick Add from User Account */}
          {availableUsers.length > 0 && (
            <div className="mb-6 p-4 bg-neutral-800/50 rounded-xl">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-500" />
                Quick Add from User Account
              </h3>
              <div className="flex gap-3">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-xl text-sm"
                >
                  <option value="">Select a user account...</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email} ({user.role})
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={createStaffFromUser}
                  disabled={!selectedUserId}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Load
                </Button>
              </div>
            </div>
          )}

          {/* Add New Staff Form */}
          <div className="mb-6 p-4 border-2 border-dashed border-neutral-700 rounded-xl">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Team Member
              {newStaffUserId && (
                <span className="text-xs text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-full">
                  Linked to user account
                </span>
              )}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                placeholder="Display Name"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
              />
              <Input
                placeholder="Department (optional)"
                value={newStaffDepartment}
                onChange={(e) => setNewStaffDepartment(e.target.value)}
              />
            </div>

            {/* Event Types */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Event Types</label>
              <div className="flex flex-wrap gap-3">
                {EVENT_TYPE_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={newStaffEventTypes.includes(opt.value)}
                      onCheckedChange={() => toggleNewStaffEventType(opt.value)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Weekly Availability</label>
              <div className="space-y-2">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="flex items-center gap-4">
                    <label className="flex items-center gap-2 w-28 cursor-pointer">
                      <Checkbox
                        checked={newStaffAvailability[day]?.enabled || false}
                        onCheckedChange={(checked) => updateNewStaffDayAvailability(day, 'enabled', checked as boolean)}
                      />
                      <span className="text-sm capitalize">{day}</span>
                    </label>
                    {newStaffAvailability[day]?.enabled && (
                      <div className="flex items-center gap-2">
                        <TimePicker
                          value={newStaffAvailability[day]?.start || '09:00'}
                          onChange={(val) => updateNewStaffDayAvailability(day, 'start', val)}
                          className="w-32"
                        />
                        <span className="text-neutral-500">to</span>
                        <TimePicker
                          value={newStaffAvailability[day]?.end || '17:00'}
                          onChange={(val) => updateNewStaffDayAvailability(day, 'end', val)}
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={createStaffMember}
              disabled={saving || !newStaffName || !newStaffEmail}
            >
              {saving ? <Spinner size="sm" className="mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Team Member
            </Button>
          </div>

          {/* Staff List */}
          <div className="space-y-4">
            {staffMembers.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No team members yet</p>
            ) : (
              staffMembers.map(staff => (
                <div 
                  key={staff.id} 
                  className={`p-4 rounded-xl border-2 transition-all ${
                    staff.is_active 
                      ? 'border-neutral-700 bg-neutral-800/30' 
                      : 'border-neutral-800 bg-neutral-900/50 opacity-60'
                  }`}
                >
                  {editingStaffId === staff.id && editingStaffData ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">Editing: {staff.display_name}</h4>
                        <Button variant="ghost" size="sm" onClick={cancelEditingStaff}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          placeholder="Display Name"
                          value={editingStaffData.display_name || ''}
                          onChange={(e) => setEditingStaffData({ ...editingStaffData, display_name: e.target.value })}
                        />
                        <Input
                          type="email"
                          placeholder="Email"
                          value={editingStaffData.email || ''}
                          onChange={(e) => setEditingStaffData({ ...editingStaffData, email: e.target.value })}
                        />
                        <Input
                          placeholder="Department"
                          value={editingStaffData.department || ''}
                          onChange={(e) => setEditingStaffData({ ...editingStaffData, department: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Buffer Between Meetings (minutes)</label>
                        <Input
                          type="number"
                          value={editingStaffData.default_buffer_minutes || 15}
                          onChange={(e) => setEditingStaffData({ ...editingStaffData, default_buffer_minutes: parseInt(e.target.value) || 15 })}
                          className="w-32"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Event Types</label>
                        <div className="flex flex-wrap gap-3">
                          {EVENT_TYPE_OPTIONS.map(opt => (
                            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={(editingStaffData.event_types || []).includes(opt.value)}
                                onCheckedChange={() => toggleEditingStaffEventType(opt.value)}
                              />
                              <span className="text-sm">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Weekly Availability</label>
                        <div className="space-y-2">
                          {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="flex items-center gap-4">
                              <label className="flex items-center gap-2 w-28 cursor-pointer">
                                <Checkbox
                                  checked={editingStaffData.availability?.[day]?.enabled || false}
                                  onCheckedChange={(checked) => updateEditingStaffDayAvailability(day, 'enabled', checked as boolean)}
                                />
                                <span className="text-sm capitalize">{day}</span>
                              </label>
                              {editingStaffData.availability?.[day]?.enabled && (
                                <div className="flex items-center gap-2">
                                  <TimePicker
                                    value={editingStaffData.availability[day]?.start || '09:00'}
                                    onChange={(val) => updateEditingStaffDayAvailability(day, 'start', val)}
                                    className="w-32"
                                  />
                                  <span className="text-neutral-500">to</span>
                                  <TimePicker
                                    value={editingStaffData.availability[day]?.end || '17:00'}
                                    onChange={(val) => updateEditingStaffDayAvailability(day, 'end', val)}
                                    className="w-32"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={saveStaffEdit} disabled={saving}>
                          {saving ? <Spinner size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Changes
                        </Button>
                        <Button variant="ghost" onClick={cancelEditingStaff}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{staff.display_name}</h4>
                          {staff.user_id && (
                            <span className="text-xs text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-full">
                              Linked Account
                            </span>
                          )}
                          {!staff.is_active && (
                            <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-400 mb-2">{staff.email}</p>
                        
                        {/* Event Types */}
                        {staff.event_types && staff.event_types.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {staff.event_types.map(type => {
                              const opt = EVENT_TYPE_OPTIONS.find(o => o.value === type)
                              return (
                                <span 
                                  key={type}
                                  className="text-xs px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded-full"
                                >
                                  {opt?.label || type}
                                </span>
                              )
                            })}
                          </div>
                        )}

                        {/* Availability Summary */}
                        {staff.availability && (
                          <div className="text-xs text-neutral-500">
                            Available: {DAYS_OF_WEEK
                              .filter(day => staff.availability[day]?.enabled)
                              .map(day => day.slice(0, 3))
                              .join(', ') || 'No days set'}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => startEditingStaff(staff)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleStaffActive(staff.id, staff.is_active)}
                        >
                          {staff.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => confirmDeleteStaff(staff)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* How It Works */}
        <Card className="bg-neutral-900/50">
          <h3 className="text-lg font-semibold mb-4">How Dynamic Scheduling Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-neutral-400">
            <div>
              <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center mb-2">
                <span className="text-primary-500 font-bold">1</span>
              </div>
              <p><strong className="text-white">Set Availability</strong> — Configure each team member&apos;s weekly hours and the event types they handle.</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center mb-2">
                <span className="text-primary-500 font-bold">2</span>
              </div>
              <p><strong className="text-white">Auto-Calculate</strong> — When users visit booking pages, available times are calculated from availability minus existing bookings.</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center mb-2">
                <span className="text-primary-500 font-bold">3</span>
              </div>
              <p><strong className="text-white">Auto-Assign</strong> — When someone books, they&apos;re automatically assigned to an available team member.</p>
            </div>
          </div>
        </Card>
      </Stack>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={cancelDelete}
        onConfirm={deleteStaffMember}
        title="Remove Team Member"
        message="Are you sure you want to remove this team member? This action cannot be undone."
        itemName={staffToDelete?.display_name}
        itemType="team member"
        isDeleting={isDeleting}
      />
    </Container>
  )
}
