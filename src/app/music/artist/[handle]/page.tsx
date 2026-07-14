/**
 * Public artist page: /music/artist/[handle]
 *
 * Accessible without authentication. Shows all music credited to a member
 * (member-library songs + official catalog songs assigned to them). The
 * handle is the member's referral code (their app-wide username); old codes
 * and raw user ids redirect to the current handle. The sign-up CTA carries
 * the artist's referral code.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Music, Sparkles } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { resolveArtistHandle, getPublicArtist } from '@/lib/songs/public-artist'
import { PublicTrackGrid } from '@/components/music/PublicTrackGrid'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params
  const resolved = await resolveArtistHandle(decodeURIComponent(handle))
  if (!resolved) return { title: 'Artist Not Found' }

  const artist = await getPublicArtist(resolved.userId)
  if (!artist) return { title: 'Artist Not Found' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'
  const title = `${artist.name} — Music`
  const description = `Listen to ${artist.tracks.length} song${artist.tracks.length === 1 ? '' : 's'} by ${artist.name} on VibrationFit.com — made with VIVA. Free to listen, no account needed.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      siteName: 'Vibration Fit',
      url: `${siteUrl}/music/artist/${resolved.canonicalHandle}`,
      ...(artist.avatarUrl ? { images: [{ url: artist.avatarUrl, alt: artist.name }] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
      ...(artist.avatarUrl ? { images: [artist.avatarUrl] } : {}),
    },
  }
}

export default async function PublicArtistPage({ params }: PageProps) {
  const { handle } = await params
  const decoded = decodeURIComponent(handle)
  const resolved = await resolveArtistHandle(decoded)

  if (!resolved) {
    notFound()
  }
  if (resolved.isStale) {
    redirect(`/music/artist/${encodeURIComponent(resolved.canonicalHandle)}`)
  }

  const artist = await getPublicArtist(resolved.userId)
  if (!artist || artist.tracks.length === 0) {
    notFound()
  }

  const ctaHref = artist.referralCode ? `/?ref=${encodeURIComponent(artist.referralCode)}` : '/'

  return (
    <div className="py-8 md:py-12">
      {/* ── Artist header ── */}
      <div className="flex flex-col items-center text-center mb-10">
        {artist.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.avatarUrl}
            alt={artist.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-[#333] mb-4"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-[#333] flex items-center justify-center mb-4">
            <Music className="w-10 h-10 text-neutral-500" />
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{artist.name}</h1>
        <p className="text-neutral-400">
          {artist.tracks.length} song{artist.tracks.length === 1 ? '' : 's'} on Vibration Fit
        </p>
      </div>

      <PublicTrackGrid tracks={artist.tracks} />

      {/* ── Sign-up CTA ── */}
      <div className="w-full max-w-xl mx-auto mt-14">
        <div className="rounded-2xl border-2 border-[#333] bg-neutral-900 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-[#BF00FF]/15 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#BF00FF]" />
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            Create your own songs with VIVA
          </h2>
          <p className="text-sm md:text-base text-neutral-400 mb-6 max-w-md mx-auto">
            {artist.name} makes music on Vibration Fit — where you design a
            vision for your life and VIVA turns it into music, audios, and more.
          </p>
          <Button size="lg" asChild>
            <Link href={ctaHref}>Learn More About Vibration Fit</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
