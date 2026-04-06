// /src/app/admin/crm/support/board/page.tsx
// Support tickets Kanban board

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  Badge,
  Container,
  Spinner,
  Stack,
  PageHero,
  Modal,
  Input,
  Textarea,
  Select,
} from '@/lib/design-system/components'
import { Kanban, KanbanColumn, KanbanItem } from '@/components/crm/Kanban'
import { Plus, Search, User } from 'lucide-react'
import { toast } from 'sonner'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  status: string
  priority: string
  category: string
  user_id: string
  guest_email: string
  created_at: string
}

interface MemberResult {
  id: string
  email: string
  full_name: string | null
  profile_picture_url: string | null
}

const COLUMNS: KanbanColumn[] = [
  { id: 'open', title: 'Open', color: 'bg-[#8B5CF6]' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-[#FFB701]' },
  { id: 'waiting_reply', title: 'Waiting Reply', color: 'bg-secondary-500' },
  { id: 'resolved', title: 'Resolved', color: 'bg-primary-500' },
  { id: 'closed', title: 'Closed', color: 'bg-[#666666]' },
]

const CATEGORY_OPTIONS = [
  { value: 'guide', label: 'Guide' },
  { value: 'account', label: 'Account Help' },
  { value: 'technical', label: 'Technical Assistance' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'billing', label: 'Billing' },
  { value: 'other', label: 'Other' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export default function SupportBoardPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  // Create ticket modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState<MemberResult[]>([])
  const [searchingMembers, setSearchingMembers] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberResult | null>(null)
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const memberDropdownRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'guide',
    priority: 'normal',
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  // Close member dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(e.target as Node)) {
        setShowMemberDropdown(false)
      }
    }
    if (showMemberDropdown) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMemberDropdown])

  async function fetchTickets() {
    try {
      const response = await fetch('/api/support/tickets')
      if (!response.ok) throw new Error('Failed to fetch tickets')

      const data = await response.json()
      setTickets(data.tickets)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchMembers = useCallback(async (term: string) => {
    if (term.length < 2) {
      setMemberResults([])
      setShowMemberDropdown(false)
      return
    }
    setSearchingMembers(true)
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(term)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMemberResults(data.users || [])
      setShowMemberDropdown(true)
    } catch {
      setMemberResults([])
    } finally {
      setSearchingMembers(false)
    }
  }, [])

  function handleMemberSearchChange(value: string) {
    setMemberSearch(value)
    setSelectedMember(null)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => searchMembers(value), 300)
  }

  function selectMember(member: MemberResult) {
    setSelectedMember(member)
    setMemberSearch(member.full_name || member.email)
    setShowMemberDropdown(false)
  }

  function resetCreateModal() {
    setNewTicket({ subject: '', description: '', category: 'guide', priority: 'normal' })
    setSelectedMember(null)
    setMemberSearch('')
    setMemberResults([])
    setShowMemberDropdown(false)
  }

  async function handleCreateTicket() {
    setCreating(true)
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          on_behalf_of_user_id: selectedMember?.id || undefined,
          subject: newTicket.subject.trim() || 'Support ticket',
          description: '',
          category: newTicket.category,
          priority: newTicket.priority,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to create ticket')
      }

      const { ticket } = await response.json()
      toast.success(`Ticket ${ticket.ticket_number} created`)
      setShowCreateModal(false)
      resetCreateModal()
      router.push(`/admin/crm/support/${ticket.id}`)
    } catch (error: any) {
      console.error('Error creating ticket:', error)
      toast.error(error.message || 'Failed to create ticket')
    } finally {
      setCreating(false)
    }
  }

  async function handleItemMove(itemId: string, newColumnId: string) {
    const oldTicket = tickets.find(t => t.id === itemId)
    if (!oldTicket) return
    
    const oldStatus = oldTicket.status

    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === itemId ? { ...ticket, status: newColumnId } : ticket
      )
    )

    try {
      const response = await fetch(`/api/support/tickets/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newColumnId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to update ticket:', {
          status: response.status,
          error: errorData,
          itemId,
          newStatus: newColumnId
        })
        
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === itemId ? { ...ticket, status: oldStatus } : ticket
          )
        )
        
        throw new Error(errorData.error || 'Failed to update ticket')
      }
    } catch (error) {
      console.error('Error updating ticket:', error)
      toast.error('Failed to update ticket status')
    }
  }

  function handleItemClick(item: KanbanItem) {
    router.push(`/admin/crm/support/${item.id}`)
  }

  function renderTicketCard(item: KanbanItem) {
    const ticket = item as unknown as Ticket

    return (
      <Card className="p-3 md:p-4 hover:border-primary-500 transition-colors">
        <div className="mb-2">
          <div className="text-xs md:text-sm text-neutral-500 mb-1">{ticket.ticket_number}</div>
          <div className="font-semibold text-sm md:text-base line-clamp-2">{ticket.subject}</div>
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge className={`px-2 py-1 text-xs ${
            ticket.priority === 'urgent' ? 'bg-[#D03739] text-white' :
            ticket.priority === 'high' ? 'bg-[#FFB701] text-black' :
            'bg-[#404040] text-white'
          }`}>
            {ticket.priority}
          </Badge>
          <Badge className="bg-[#1F1F1F] text-neutral-400 px-2 py-1 text-xs truncate max-w-[100px]">
            {ticket.category}
          </Badge>
        </div>

        <div className="text-xs text-neutral-500">
          {new Date(ticket.created_at).toLocaleDateString()}
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  const kanbanItems: KanbanItem[] = tickets.map((ticket) => ({
    ...ticket,
    columnId: ticket.status,
  }))

  return (
    <Container size="full">
      <Stack gap="lg">
        <PageHero 
          title="Support Board" 
          subtitle={`${tickets.length} total tickets`}
        >
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Ticket
          </Button>
        </PageHero>

        <Kanban
          columns={COLUMNS}
          items={kanbanItems}
          onItemMove={handleItemMove}
          onItemClick={handleItemClick}
          renderItem={renderTicketCard}
        />
      </Stack>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetCreateModal() }}
        title="Create Ticket on Behalf of Member"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setShowCreateModal(false); resetCreateModal() }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateTicket}
              disabled={creating}
              className="flex items-center gap-2"
            >
              {creating ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Member search */}
          <div ref={memberDropdownRef} className="relative">
            <label className="block text-sm font-medium text-neutral-300 mb-2">Member</label>
            <div className="relative">
              {/* Hidden dummy fields to absorb Chrome autofill */}
              <input type="text" name="fake-chrome-autofill" autoComplete="username" className="sr-only" tabIndex={-1} aria-hidden="true" />
              <input type="password" name="fake-chrome-password" autoComplete="new-password" className="sr-only" tabIndex={-1} aria-hidden="true" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 z-10" />
              <input
                type="search"
                value={memberSearch}
                onChange={(e) => handleMemberSearchChange(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#404040] border-2 border-[#666666] hover:border-primary-500 focus:border-primary-500 focus:outline-none text-white placeholder:text-[#9CA3AF] transition-colors"
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showMemberDropdown}
              />
              {searchingMembers && (
                <Spinner size="sm" className="absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Selected member badge */}
            {selectedMember && (
              <div className="mt-2 flex items-center gap-3 p-3 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                  <span className="text-black text-sm font-bold">
                    {(selectedMember.full_name || selectedMember.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {selectedMember.full_name || 'No name'}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">{selectedMember.email}</p>
                </div>
              </div>
            )}

            {/* Search results dropdown */}
            {showMemberDropdown && memberResults.length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-60 overflow-y-auto py-2">
                {memberResults.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => selectMember(member)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#333] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-neutral-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {member.full_name || 'No name'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{member.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showMemberDropdown && memberResults.length === 0 && memberSearch.length >= 2 && !searchingMembers && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl py-4 px-4 text-center text-sm text-neutral-500">
                No members found
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Subject</label>
            <Input
              value={newTicket.subject}
              onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief description of the issue or outreach reason"
            />
          </div>

          {/* Category + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Category</label>
              <Select
                value={newTicket.category}
                onChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
                options={CATEGORY_OPTIONS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Priority</label>
              <Select
                value={newTicket.priority}
                onChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}
                options={PRIORITY_OPTIONS}
              />
            </div>
          </div>

        </div>
      </Modal>
    </Container>
  )
}

