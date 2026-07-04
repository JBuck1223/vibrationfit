'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Card, Input, Container, Stack, Badge, Spinner, PageHero } from '@/lib/design-system/components'
import { Check, Copy, Trash2, Pencil, X, ExternalLink, MousePointerClick, Link2 } from 'lucide-react'
import { toast } from 'sonner'

interface ShortLink {
  id: string
  slug: string
  destination: string
  label: string | null
  is_active: boolean
  click_count: number
  last_clicked_at: string | null
  created_at: string
}

export default function ShortLinksPage() {
  const [links, setLinks] = useState<ShortLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [origin, setOrigin] = useState('https://vibrationfit.com')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ label: '', slug: '', destination: '' })

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin)
  }, [])

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/links')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setLinks(data.links || [])
    } catch {
      toast.error('Failed to load short links')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  function resetForm() {
    setEditingId(null)
    setForm({ label: '', slug: '', destination: '' })
  }

  async function handleSubmit() {
    if (!form.slug.trim()) return toast.error('Enter a slug')
    if (!form.destination.trim()) return toast.error('Enter a destination URL')

    setSaving(true)
    try {
      const isEdit = !!editingId
      const res = await fetch(
        isEdit ? `/api/admin/links/${editingId}` : '/api/admin/links',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success(isEdit ? 'Link updated' : 'Link created')
      resetForm()
      fetchLinks()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save link')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(link: ShortLink) {
    setEditingId(link.id)
    setForm({ label: link.label || '', slug: link.slug, destination: link.destination })
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function toggleActive(link: ShortLink) {
    try {
      const res = await fetch(`/api/admin/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !link.is_active }),
      })
      if (!res.ok) throw new Error()
      setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, is_active: !l.is_active } : l)))
    } catch {
      toast.error('Failed to update')
    }
  }

  async function handleDelete(link: ShortLink) {
    if (!confirm(`Delete /go/${link.slug}? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/links/${link.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Link deleted')
      setLinks((prev) => prev.filter((l) => l.id !== link.id))
      if (editingId === link.id) resetForm()
    } catch {
      toast.error('Failed to delete')
    }
  }

  function copyShortUrl(link: ShortLink) {
    const url = `${origin}/go/${link.slug}`
    navigator.clipboard.writeText(url).then(
      () => {
        setCopiedId(link.id)
        setTimeout(() => setCopiedId(null), 1500)
      },
      () => toast.error('Copy failed')
    )
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
      <Stack gap="lg">
        <PageHero
          title="Short Links"
          subtitle="Branded vibrationfit.com/go/… links you can re-point anytime. Attribution stays intact — build the destination in the UTM Builder."
        >
          <Link href="/admin/crm/utm-builder">
            <Button variant="outline" size="sm">
              <Link2 className="w-4 h-4 mr-1" />
              UTM Builder
            </Button>
          </Link>
        </PageHero>

        {/* Create / Edit form */}
        <Card className="p-4 md:p-6">
          <Stack gap="md">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">{editingId ? 'Edit link' : 'New link'}</h3>
              {editingId && (
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Label <span className="text-neutral-500">(internal)</span></label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Vanessa IG bio - $1 offer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="ig-vanessa"
                />
                <p className="text-xs text-neutral-500 mt-1 truncate">
                  {origin}/go/{form.slug ? form.slug.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') : '…'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Destination URL</label>
                <Input
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="https://vibrationfit.com/?utm_source=instagram&utm_medium=bio&utm_campaign=dollar-offer&utm_content=vanessa"
                />
              </div>
            </div>

            <div>
              <Button variant="primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create link'}
              </Button>
            </div>
          </Stack>
        </Card>

        {/* Links table */}
        {links.length === 0 ? (
          <Card className="text-center p-8 md:p-12">
            <p className="text-sm md:text-base text-neutral-400">No short links yet. Create your first one above.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-x-auto">
            <div className="min-w-[820px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#333]">
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Short link</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Destination</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Clicks</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Status</th>
                    <th className="text-right py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id} className="border-b border-[#333] hover:bg-[#1F1F1F] transition-colors">
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyShortUrl(link)}
                            className="flex items-center gap-1.5 text-sm text-white font-medium hover:text-primary-500 transition-colors"
                            title="Copy short link"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-3.5 h-3.5 text-primary-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-neutral-500" />
                            )}
                            /go/{link.slug}
                          </button>
                        </div>
                        {link.label && (
                          <div className="text-xs text-neutral-500 mt-0.5 truncate max-w-[220px]">{link.label}</div>
                        )}
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <a
                          href={link.destination}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
                          title={link.destination}
                        >
                          <span className="truncate max-w-[320px]">{link.destination}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <span className="flex items-center gap-1 text-sm text-white font-medium">
                          <MousePointerClick className="w-3.5 h-3.5 text-neutral-500" />
                          {link.click_count}
                        </span>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <button onClick={() => toggleActive(link)} title="Toggle active">
                          {link.is_active ? (
                            <Badge className="bg-primary-500 text-black px-2 py-1 text-xs">Active</Badge>
                          ) : (
                            <Badge className="bg-[#555] text-white px-2 py-1 text-xs">Paused</Badge>
                          )}
                        </button>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(link)} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(link)} title="Delete">
                            <Trash2 className="w-4 h-4 text-[#FF0040]" />
                          </Button>
                        </div>
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
  )
}
