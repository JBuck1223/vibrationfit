'use client'

import Link from 'next/link'
import { use, useState } from 'react'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Container, Stack } from '@/lib/design-system/components'
import { getSlideDeck } from '@/lib/slide-decks/catalog'

export default function SlideDeckPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const deck = getSlideDeck(slug)
  const [copied, setCopied] = useState(false)

  if (!deck) notFound()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${deck.publicPath}`)
      toast.success('Public URL copied')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Could not copy URL')
    }
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-neutral-400">{deck.description}</p>
            <p className="mt-1 text-xs font-mono text-neutral-500">{deck.publicPath}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/slide-decks">
                <ArrowLeft className="w-4 h-4" />
                All decks
              </Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy URL'}
            </Button>
            <Button asChild size="sm" variant="primary">
              <a href={deck.publicPath} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Present
              </a>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border-2 border-[#333] bg-black min-h-[70vh]">
          <iframe
            src={deck.publicPath}
            title={deck.title}
            className="w-full h-[70vh] border-0"
            allow="fullscreen"
          />
        </div>
      </Stack>
    </Container>
  )
}
