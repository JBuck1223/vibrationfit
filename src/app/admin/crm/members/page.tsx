// /src/app/admin/crm/members/page.tsx
// Member list page

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner, Input, Textarea } from '@/lib/design-system/components'

interface Member {
  user_id: string
  email: string
  full_name: string
  phone: string
  subscription_tier: string
  engagement_status: string
  health_status: string
  vision_count: number
  journal_entry_count: number
  last_login_at: string
  days_since_last_login: number
  mrr: number
  created_at: string
}

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  
  // Bulk messaging state
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkType, setBulkType] = useState<'sms' | 'email'>('email')
  const [bulkSubject, setBulkSubject] = useState('')
  const [bulkMessage, setBulkMessage] = useState('')
  const [sendingBulk, setSendingBulk] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [filter])

  async function fetchMembers() {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('engagement_status', filter)
      }

      const response = await fetch(`/api/crm/members?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch members')

      const data = await response.json()
      setMembers(data.members)
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  function toggleMember(userId: string) {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  function toggleSelectAll() {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(members.map(m => m.user_id))
    }
  }

  async function handleBulkSend() {
    if (!bulkMessage.trim()) return
    if (bulkType === 'email' && !bulkSubject.trim()) return

    setSendingBulk(true)
    try {
      const response = await fetch('/api/crm/members/bulk-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedMembers,
          type: bulkType,
          message: bulkMessage,
          subject: bulkType === 'email' ? bulkSubject : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send messages')
      }

      const data = await response.json()
      alert(`✅ Sent to ${data.results.success} members\n❌ Failed: ${data.results.failed}`)

      // Clear
      setBulkSubject('')
      setBulkMessage('')
      setSelectedMembers([])
      setShowBulkModal(false)
    } catch (error: any) {
      alert(error.message || 'Failed to send bulk message')
    } finally {
      setSendingBulk(false)
    }
  }

  function getStatusColor(status: string) {
    if (!status) return 'bg-[#666666]'
    
    switch (status.toLowerCase()) {
      case 'active':
      case 'champion':
        return 'bg-primary-500'
      case 'healthy':
        return 'bg-secondary-500'
      case 'at_risk':
      case 'needs_attention':
        return 'bg-[#FFB701]'
      case 'inactive':
      case 'churned':
        return 'bg-[#D03739]'
      default:
        return 'bg-[#666666]'
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      {/* Header */}
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Members</h1>
          <p className="text-sm md:text-base text-neutral-400">
            {members.length} total members
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => router.push('/admin/crm/members/board')}
          >
            Kanban View
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['all', 'active', 'at_risk', 'champion', 'inactive'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedMembers.length > 0 && (
        <div className="mb-4 p-4 bg-primary-500/10 border border-primary-500 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-sm text-neutral-300">
            {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMembers([])}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowBulkModal(true)}
            >
              📨 Send Message
            </Button>
          </div>
        </div>
      )}

      {/* Member list */}
      {members.length === 0 ? (
        <Card className="text-center p-8 md:p-12">
          <p className="text-sm md:text-base text-neutral-400">No members yet</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="py-3 md:py-4 px-3 md:px-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedMembers.length === members.length && members.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-[#333] bg-[#1F1F1F] text-primary-500 focus:ring-primary-500"
                    />
                  </th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Name</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Email</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden lg:table-cell">Tier</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Status</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden md:table-cell">Visions</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden md:table-cell">Last Login</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden lg:table-cell">MRR</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.user_id}
                    className="border-b border-[#333] hover:bg-[#1F1F1F] cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/crm/members/${member.user_id}`)}
                  >
                    <td className="py-3 md:py-4 px-3 md:px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.user_id)}
                        onChange={() => toggleMember(member.user_id)}
                        className="w-4 h-4 rounded border-[#333] bg-[#1F1F1F] text-primary-500 focus:ring-primary-500"
                      />
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4">
                      <div className="font-medium text-xs md:text-sm truncate max-w-[150px]">
                        {member.full_name || 'No name'}
                      </div>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm">
                      <div className="truncate max-w-[200px]">{member.email}</div>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden lg:table-cell">
                      {member.subscription_tier || 'Free'}
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4">
                      <Badge className={`${getStatusColor(member.engagement_status)} text-white px-2 py-1 text-xs`}>
                        {member.engagement_status || 'New'}
                      </Badge>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden md:table-cell">
                      {member.vision_count || 0}
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden md:table-cell">
                      {member.days_since_last_login !== null
                        ? `${member.days_since_last_login}d ago`
                        : 'Never'}
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden lg:table-cell">
                      ${member.mrr?.toFixed(0) || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bulk Message Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-xl font-semibold">
                Send to {selectedMembers.length} Member{selectedMembers.length !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-neutral-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Type Selector */}
            <div className="mb-6 flex gap-2">
              <Button
                variant={bulkType === 'email' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setBulkType('email')}
              >
                ✉️ Email
              </Button>
              <Button
                variant={bulkType === 'sms' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setBulkType('sms')}
              >
                📱 SMS
              </Button>
            </div>

            <div className="space-y-4">
              {bulkType === 'email' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-300">
                    Subject:
                  </label>
                  <Input
                    value={bulkSubject}
                    onChange={(e) => setBulkSubject(e.target.value)}
                    placeholder="Enter subject..."
                    disabled={sendingBulk}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-300">
                  Message:
                </label>
                <Textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder={bulkType === 'sms' ? 'Type SMS message...' : 'Type email message...'}
                  rows={8}
                  disabled={sendingBulk}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkModal(false)}
                  disabled={sendingBulk}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBulkSend}
                  disabled={
                    !bulkMessage.trim() ||
                    (bulkType === 'email' && !bulkSubject.trim()) ||
                    sendingBulk
                  }
                  loading={sendingBulk}
                >
                  {sendingBulk ? 'Sending...' : `Send ${bulkType === 'sms' ? 'SMS' : 'Email'}`}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Container>
  )
}

