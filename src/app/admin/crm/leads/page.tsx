// /src/app/admin/crm/leads/page.tsx
// Lead management list page

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card, Badge, Container, Spinner, Input, Stack, PageHero } from '@/lib/design-system/components'
import { Plus, X, Search, UserPlus } from 'lucide-react'
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

interface NewLeadForm {
  first_name: string
  last_name: string
  email: string
  phone: string
  type: string
  source: string
  notes: string
}

const EMPTY_FORM: NewLeadForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  type: 'contact',
  source: 'admin_manual',
  notes: '',
}

export default function LeadsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(searchParams.get('add') === 'true')
  const [form, setForm] = useState<NewLeadForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }
      if (search.trim()) {
        params.append('search', search.trim())
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
  }, [filter, search])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchLeads()
    }, search ? 300 : 0)
    return () => clearTimeout(timeout)
  }, [fetchLeads, search])

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email.trim()) {
      toast.error('Email is required')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create lead')
      }

      const data = await response.json()
      toast.success('Lead created')
      setShowAddModal(false)
      setForm(EMPTY_FORM)
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

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Leads"
          subtitle={`${leads.length} total leads`}
        >
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Lead
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/admin/crm/leads/board')}
            >
              Kanban View
            </Button>
          </div>
        </PageHero>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
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
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : leads.length === 0 ? (
          <Card className="text-center p-8 md:p-12">
            <UserPlus className="w-10 h-10 text-neutral-600 mx-auto mb-4" />
            <p className="text-sm md:text-base text-neutral-400 mb-4">
              {search || filter !== 'all' ? 'No leads match your filters' : 'No leads yet'}
            </p>
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Your First Lead
            </Button>
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

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <Card className="relative z-10 w-full max-w-lg p-6 md:p-8 border border-[#333]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Add New Lead</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">First Name</label>
                  <Input
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Last Name</label>
                  <Input
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Email <span className="text-red-400">*</span>
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Phone</label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-4 py-2.5 text-sm text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="contact">Contact</option>
                    <option value="demo">Demo</option>
                    <option value="intensive_intake">Intensive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-4 py-2.5 text-sm text-white focus:border-primary-500 focus:outline-none"
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
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any notes about this lead..."
                  rows={3}
                  className="w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-primary-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? <Spinner size="sm" /> : 'Create Lead'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Container>
  )
}
