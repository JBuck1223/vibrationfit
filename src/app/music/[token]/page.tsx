/**
 * Public song share page: /music/[token]
 *
 * Accessible without authentication. Renders a publicly shared song track
 * (song_tracks.is_shared = true) with a player, lyrics, download, and a
 * sign-up CTA that carries the sharing member's referral code.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { getSharedTrackByToken } from '@/lib/songs/public-sharing'
import { PublicSongPlayer } from '@/components/music/PublicSongPlayer'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const result = await getSharedTrackByToken(token)

  if (!result) {
    return { title: 'Song Not Found | Vibration Fit' }
  }

  const { track } = result
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'
  const title = `${track.title} by ${track.artist_name}`
  const description = `Check out "${track.title}" on VibrationFit.com — a song made with VIVA. Listen free, no account needed.`

  return {
    title: `${title} | Vibration Fit`,
    description,
    openGraph: {
      title,
      description,
      type: 'music.song',
      siteName: 'Vibration Fit',
      url: `${siteUrl}/music/${token}`,
      ...(track.cover_url
        ? { images: [{ url: track.cover_url, alt: `${track.title} cover art` }] }
        : {}),
    },
    twitter: {
      card: track.cover_url ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(track.cover_url ? { images: [track.cover_url] } : {}),
    },
  }
}

export default async function PublicSongPage({ params }: PageProps) {
  const { token } = await params
  const result = await getSharedTrackByToken(token)

  if (!result) {
    notFound()
  }

  const { track, referral_code } = result
  const ctaHref = referral_code ? `/?ref=${encodeURIComponent(referral_code)}` : '/'

  return (
    <div className="py-8 md:py-12">
      <PublicSongPlayer
        title={track.title}
        artistName={track.artist_name}
        mp3Url={track.mp3_url}
        coverUrl={track.cover_url}
        lyrics={track.lyrics}
        lyricsSections={track.lyrics_sections}
        preSyncedLyrics={track.synced_lyrics}
        genres={track.genres}
        moods={track.moods}
      />

      {/* ── Sign-up CTA ── */}
      <div className="w-full max-w-xl mx-auto mt-8">
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
            {track.artist_name} made this song on Vibration Fit — where you design
            a vision for your life and VIVA turns it into music, audios, and more.
          </p>
          <Button size="lg" asChild>
            <Link href={ctaHref}>Learn More About Vibration Fit</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
