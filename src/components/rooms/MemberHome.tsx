'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UnlockCelebrationModal } from '@/components/UnlockCelebrationModal'
import {
  consumeBeginComplete,
  hasPendingBeginComplete,
  markBeginCelebrated,
} from '@/lib/life-activation/celebration'
import { RecentCreations } from './RecentCreations'
import AnnualUpgradeBanner from '@/components/billing/AnnualUpgradeBanner'
import Link from 'next/link'
import { ArrowRight, Headphones, Play, Sparkles, BookOpen } from 'lucide-react'
import { RoomFrame, ToolGrid } from './RoomFrame'
import { useMemberExperience } from './MemberExperience'
import { BeginDashboard } from '@/components/life-activation/BeginDashboard'
import { ROOM_TOOLS, toolForHref } from '@/lib/rooms/catalog'
import { rankTools } from '@/lib/rooms/continuity'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import type { DashboardServerContext } from '@/components/dashboard/DashboardContext'
import {
  useLastVivaSession,
  useRecentJournal,
} from '@/components/dashboard/widgets/queries'
export function ContinueListening() {
  const { state } = useMemberExperience()
  const checkpoint = state.playback
  if (!checkpoint)
    return (
      <Link className="room-panel room-listening" href="/listen">
        <Headphones size={29} />
        <div>
          <p className="room-eyebrow">MAKE SPACE TO LISTEN</p>
          <h3>Your sound. Your state.</h3>
          <p>Explore your vision audio, songs and meditations.</p>
        </div>
        <ArrowRight size={20} />
      </Link>
    )
  const track = checkpoint.tracks[checkpoint.currentIndex]
  return (
    <section className="room-panel room-listening">
      <Headphones size={29} />
      <div>
        <p className="room-eyebrow">CONTINUE LISTENING</p>
        <h3>{track.title}</h3>
        <p>
          {checkpoint.setName || track.artist} ·{' '}
          {Math.floor(checkpoint.currentTime / 60)}:
          {String(Math.floor(checkpoint.currentTime % 60)).padStart(2, '0')}
        </p>
      </div>
      <button
        className="room-play"
        aria-label={`Resume ${track.title}`}
        onClick={() =>
          useGlobalAudioStore
            .getState()
            .play(
              checkpoint.tracks,
              checkpoint.currentIndex,
              checkpoint.setName,
              checkpoint.setIconKey,
              checkpoint.contentCategory,
              checkpoint.currentTime,
            )
        }
      >
        <Play size={21} fill="currentColor" />
      </button>
    </section>
  )
}
export function MemberHome({
  server,
  needsBegin,
  annualUpgradeOffer,
}: {
  server: DashboardServerContext
  needsBegin: boolean
  annualUpgradeOffer?: {
    planType: 'solo' | 'household'
    trialEnd: string | null
  } | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [celebrate, setCelebrate] = useState(false)
  useEffect(() => {
    if (
      searchParams.get('welcome') === '1' ||
      searchParams.get('unlocked') === 'true' ||
      hasPendingBeginComplete()
    ) {
      setCelebrate(true)
      consumeBeginComplete()
      markBeginCelebrated()
      router.replace('/dashboard', { scroll: false })
    }
  }, [searchParams, router])
  const { state, error } = useMemberExperience()
  const viva = useLastVivaSession()
  const journal = useRecentJournal(1)
  const ids = rankTools(
    state,
    [
      'daily-paper',
      'audio',
      'journal',
      'vision',
      'map',
      'viva',
      ...ROOM_TOOLS.map((t) => t.id),
    ].filter((id, i, all) => all.indexOf(id) === i),
  ).slice(0, 6)
  const recent = [...state.visits]
    .reverse()
    .filter((v, i, all) => all.findIndex((x) => x.toolId === v.toolId) === i)
    .slice(0, 3)
  return (
    <RoomFrame
      title={
        server.firstName
          ? `Welcome home, ${server.firstName}.`
          : 'Welcome home.'
      }
      subtitle={
        needsBegin
          ? 'A little space for the life you’re creating.'
          : 'Come back to yourself. Pick up where you left off.'
      }
    >
      <UnlockCelebrationModal
        isOpen={celebrate}
        onClose={() => setCelebrate(false)}
      />
      {annualUpgradeOffer && <AnnualUpgradeBanner {...annualUpgradeOffer} />}
      {error && (
        <p className="room-notice" role="status">
          {error}
        </p>
      )}
      {needsBegin ? (
        <BeginDashboard embedded />
      ) : (
        <section className="room-panel room-feature room-home-feature">
          <p className="room-eyebrow">YOUR NEXT MOMENT</p>
          <h2>
            A life that feels
            <br />
            more like you.
          </h2>
          <p className="room-subtitle">
            A thought to capture. A vision to return to.
            <br />A small step that moves you forward.
          </p>
          <Link
            className="room-primary"
            href={recent[0]?.href ?? '/daily-paper'}
          >
            {recent[0]
              ? `Return to ${toolForHref(recent[0].href)?.name ?? 'your work'}`
              : 'Open your Daily Paper'}
            <ArrowRight size={18} />
          </Link>
        </section>
      )}
      <div className="room-section-heading">
        <h2>Your quick actions</h2>
        <Link href="/tools">
          Make it yours <ArrowRight size={15} />
        </Link>
      </div>
      <ToolGrid ids={ids} />
      <div className="room-section-heading">
        <h2>Pick up where you left off</h2>
      </div>
      <ContinueListening />
      <div className="room-return-grid">
        <Link
          className="room-panel room-return"
          href={viva.data ? `/viva?thread=${viva.data.id}` : '/viva'}
        >
          <Sparkles className="text-[#BF00FF]" size={24} />
          <p className="room-eyebrow">
            {viva.data ? 'YOUR LAST CONVERSATION' : 'MEET VIVA'}
          </p>
          <h3>{viva.data?.title || 'A little clarity goes a long way.'}</h3>
          <span>
            Open VIVA <ArrowRight size={16} />
          </span>
        </Link>
        <Link
          className="room-panel room-return"
          href={
            journal.data?.entries[0]
              ? `/journal/${journal.data.entries[0].id}`
              : '/journal/new'
          }
        >
          <BookOpen size={24} />
          <p className="room-eyebrow">
            {journal.data?.entries.length
              ? 'YOUR LAST JOURNAL ENTRY'
              : 'YOUR JOURNAL'}
          </p>
          <h3>
            {journal.data?.entries[0]?.title || 'What’s on your mind today?'}
          </h3>
          <span>
            {journal.data?.entries.length
              ? 'Return to your entry'
              : 'Capture a moment'}{' '}
            <ArrowRight size={16} />
          </span>
        </Link>
      </div>
      <RecentCreations userId={server.userId} />
      {recent.length > 0 && (
        <section className="room-panel room-recent">
          <h2>Recently visited</h2>
          {recent.map((v) => (
            <Link key={v.id} href={v.href}>
              <span>
                {toolForHref(v.href)?.name ?? 'Your work'}
                <small>
                  {new Date(v.at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </small>
              </span>
              <ArrowRight size={18} />
            </Link>
          ))}
        </section>
      )}
      <footer className="room-footer">
        <Link href="/tools">Explore every tool</Link>
        <Link href="/dashboard/widgets">Your widget dashboard</Link>
      </footer>
    </RoomFrame>
  )
}
