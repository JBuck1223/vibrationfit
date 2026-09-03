'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, Copy, ExternalLink, Presentation } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, Container, Stack } from '@/lib/design-system/components'
import { SLIDE_DECKS, type SlideDeck } from '@/lib/slide-decks/catalog'

function publicUrl(deck: SlideDeck) {
  if (typeof window === 'undefined') return deck.publicPath
  return `${window.location.origin}${deck.publicPath}`
}

async function copyPublicUrl(deck: SlideDeck) {
  try {
    await navigator.clipboard.writeText(publicUrl(deck))
    toast.success('Public URL copied')
    return true
  } catch {
    toast.error('Could not copy URL')
    return false
  }
}

export default function SlideDecksAdminPage() {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  const handleCopy = async (deck: SlideDeck) => {
    const ok = await copyPublicUrl(deck)
    if (!ok) return
    setCopiedSlug(deck.slug)
    window.setTimeout(() => setCopiedSlug(current => (current === deck.slug ? null : current)), 1600)
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <p className="text-sm text-neutral-400">
          Teaching decks served from <span className="font-mono text-neutral-300">/slide-decks</span>. Preview here, or present in a new tab.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SLIDE_DECKS.map(deck => {
            const copied = copiedSlug === deck.slug
            return (
              <Card key={deck.slug} hover className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0 w-9 h-9 rounded-xl bg-[#BF00FF]/15 border border-[#BF00FF]/30 flex items-center justify-center">
                      <Presentation className="w-4 h-4 text-[#BF00FF]" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-white leading-snug">{deck.title}</h2>
                      <p className="mt-1 text-sm text-neutral-400">{deck.description}</p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="shrink-0">
                    {deck.slideCount} slides
                  </Badge>
                </div>

                <p className="text-xs font-mono text-neutral-500 truncate">{deck.publicPath}</p>

                {deck.usedIn.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-neutral-500">Used in</span>
                    {deck.usedIn.map(usage => (
                      <Link key={usage.href} href={usage.href} className="text-xs text-[#00FFFF] hover:underline">
                        {usage.label}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="primary">
                    <Link href={`/admin/slide-decks/${deck.slug}`}>Preview</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={deck.publicPath} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      Present
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(deck)}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy URL'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </Stack>
    </Container>
  )
}
