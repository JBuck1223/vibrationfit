'use client'

import { useState } from 'react'
import { Button, Input } from '@/lib/design-system/components'
import { ExternalLink, Link2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TravelReferenceLink } from '@/lib/travel/types'
import { faviconUrl, linkHost } from './travel-utils'

interface TravelLinksSectionProps {
  /** Link API base, e.g. /api/travel/trips/{id} or /api/travel/dream-destinations/{id} */
  endpoint: string
  links: TravelReferenceLink[]
  onChanged: () => void
}

export function TravelLinksSection({ endpoint, links, onChanged }: TravelLinksSectionProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const addLink = async () => {
    if (!url.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`${endpoint}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title }),
      })
      if (!res.ok) throw new Error()
      setUrl('')
      setTitle('')
      onChanged()
    } catch {
      toast.error('Failed to add link')
    } finally {
      setAdding(false)
    }
  }

  const deleteLink = async (linkId: string) => {
    const res = await fetch(`${endpoint}/links?link_id=${linkId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      onChanged()
    } else {
      toast.error('Failed to delete link')
    }
  }

  return (
    <div>
      {links.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-500">
          <Link2 className="mx-auto mb-1.5 h-5 w-5 text-neutral-600" />
          No links yet. Save itineraries, bookings, and inspiration here.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {links.map(link => {
            const favicon = faviconUrl(link.url)
            return (
              <div
                key={link.id}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-[#00FFFF]/30"
              >
                {favicon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={favicon} alt="" className="h-4 w-4 shrink-0 rounded-sm" />
                ) : (
                  <Link2 className="h-4 w-4 shrink-0 text-neutral-500" />
                )}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1"
                >
                  <span className="block truncate text-sm text-white group-hover:text-[#00FFFF]">
                    {link.title || linkHost(link.url)}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">
                    {linkHost(link.url)}
                  </span>
                </a>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-white/[0.06] hover:text-[#00FFFF]"
                  title="Open link"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => deleteLink(link.id)}
                  className="rounded-lg p-1.5 text-neutral-600 opacity-100 transition-colors hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Delete link"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.06] pt-3 sm:flex-row">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addLink()}
          placeholder="Paste a URL..."
          className="!border !border-neutral-800 bg-neutral-900/50 text-sm focus:!border-[#39FF14]/40"
        />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addLink()}
          placeholder="Title (optional)"
          className="!border !border-neutral-800 bg-neutral-900/50 text-sm focus:!border-[#39FF14]/40 sm:max-w-[220px]"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={addLink}
          disabled={adding || !url.trim()}
          className="shrink-0 sm:self-center"
        >
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  )
}
