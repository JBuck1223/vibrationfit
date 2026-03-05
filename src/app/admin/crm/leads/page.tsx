// /src/app/admin/crm/leads/page.tsx
// Lead management list page

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner, Input, Stack, PageHero } from '@/lib/design-system/components'
import { Plus, X, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface Lead {
  id: string
  type: string
  status: string
  first_name: string
  last_name: string
  email: string
  phone: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  created_at: string
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [leadType, setLeadType] = useState('contact')
  const [source, setSource] = useState('admin_manual')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchLeads()
  }, [filter])

  async function fetchLeads() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }

      const response = await fetch(`/api/crm/leads?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch leads')

      const data = await response.json()
      setLeads(data.leads)
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setLeadType('contact')
    setSource('admin_manual')
    setNotes('')
  }

  function openModal() {
    setShowAddModal(true)
  }

  function closeModal() {
    setShowAddModal(false)
    resetForm()
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Email is required')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          type: leadType,
          source,
          notes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create lead')
      }

      const data = await response.json()
      toast.success('Lead created')
      closeModal()
      router.push(`/admin/crm/leads/${data.lead.id}`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create lead'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'converted':
        return 'bg-primary-500 text-black'
      case 'qualified':
        return 'bg-secondary-500 text-black'
      case 'contacted':
        return 'bg-[#FFB701] text-black'
      case 'new':
        return 'bg-[#8B5CF6] text-white'
      case 'lost':
        return 'bg-[#666666] text-white'
      default:
        return 'bg-[#666666] text-white'
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'contact':
        return 'Contact'
      case 'demo':
        return 'Demo'
      case 'intensive_intake':
        return 'Intensive'
      default:
        return type
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
    <>
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            title="Leads"
            subtitle={`${leads.length} total leads`}
          >
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openModal}
                className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold rounded-full bg-[#39FF14] text-black border-2 border-transparent hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] hover:border-[rgba(57,255,20,0.2)] transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Add Lead
              </button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/admin/crm/leads/board')}
              >
                Kanban View
              </Button>
            </div>
          </PageHero>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {['all', 'new', 'contacted', 'qualified', 'converted', 'lost'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>

          {/* Lead list */}
          {leads.length === 0 ? (
            <Card className="text-center p-8 md:p-12">
              <UserPlus className="w-10 h-10 text-neutral-600 mx-auto mb-4" />
              <p className="text-sm md:text-base text-neutral-400 mb-4">
                {filter !== 'all' ? 'No leads match this filter' : 'No leads yet'}
              </p>
              <button
                type="button"
                onClick={openModal}
                className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold rounded-full bg-[#39FF14] text-black border-2 border-transparent hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] hover:border-[rgba(57,255,20,0.2)] transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Add Your First Lead
              </button>
            </Card>
          ) : (
            <Card className="p-0 overflow-x-auto">
              <div className="min-w-[600px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#333]">
                      <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Name</th>
                      <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Email</th>
                      <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden lg:table-cell">Phone</th>
                      <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Type</th>
                      <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden md:table-cell">Source</th>
                      <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Status</th>
                      <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm hidden lg:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b border-[#333] hover:bg-[#1F1F1F] cursor-pointer transition-colors"
                        onClick={() => router.push(`/admin/crm/leads/${lead.id}`)}
                      >
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <div className="font-medium text-xs md:text-sm truncate max-w-[150px]">
                            {lead.first_name} {lead.last_name}
                          </div>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm">
                          <div className="truncate max-w-[200px]">{lead.email}</div>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden lg:table-cell">
                          {lead.phone || '\u2014'}
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <Badge className="bg-[#404040] text-white px-2 py-1 text-xs">
                            {getTypeLabel(lead.type)}
                          </Badge>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden md:table-cell">
                          <div className="truncate max-w-[100px]">
                            {lead.utm_source || lead.utm_campaign || '\u2014'}
                          </div>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <Badge className={`${getStatusColor(lead.status)} px-2 py-1 text-xs`}>
                            {lead.status}
                          </Badge>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4 text-neutral-400 text-xs md:text-sm hidden lg:table-cell">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </Stack>
      </Container>

      {/* Add Lead Modal - rendered outside Container to avoid z-index issues */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={closeModal}
          />
          <div className="relative z-[10000] w-full max-w-lg bg-[#1A1A1A] rounded-2xl border-2 border-[#333] p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Add New Lead</h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-neutral-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-4 py-3 text-base bg-[#404040] border-2 border-[#666666] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-4 py-3 text-base bg-[#404040] border-2 border-[#666666] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  className="w-full px-4 py-3 text-base bg-[#404040] border-2 border-[#666666] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 text-base bg-[#404040] border-2 border-[#666666] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Type</label>
                  <select
                    value={leadType}
                    onChange={(e) => setLeadType(e.target.value)}
                    className="w-full px-4 py-3 text-base bg-[#404040] border-2 border-[#666666] rounded-xl text-white focus:outline-none focus:border-[#39FF14] transition-all duration-200"
                  >
                    <option value="contact">Contact</option>
                    <option value="demo">Demo</option>
                    <option value="intensive_intake">Intensive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-4 py-3 text-base bg-[#404040] border-2 border-[#666666] rounded-xl text-white focus:outline-none focus:border-[#39FF14] transition-all duration-200"
                  >
                    <option value="admin_manual">Manual Entry</option>
                    <option value="referral">Referral</option>
                    <option value="phone_call">Phone Call</option>
                    <option value="social_media">Social Media</option>
                    <option value="event">Event</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about this lead..."
                  rows={3}
                  className="w-full px-4 py-3 text-base bg-[#404040] border-2 border-[#666666] rounded-xl text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] transition-all duration-200 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-5 py-3 text-sm font-semibold rounded-full bg-transparent border-2 border-[#39FF14] text-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-5 py-3 text-sm font-semibold rounded-full bg-[#39FF14] text-black border-2 border-transparent hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] hover:border-[rgba(57,255,20,0.2)] transition-all duration-300 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
