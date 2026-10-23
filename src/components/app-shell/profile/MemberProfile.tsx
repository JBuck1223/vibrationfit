'use client'

import React from 'react'
import Link from 'next/link'
import { Briefcase, Camera, Facebook, Globe, Instagram, Linkedin, Loader2, Music2, Pause, Pencil, Play, Quote, Sparkles, X, Youtube, AtSign, type LucideIcon } from 'lucide-react'
import { SOCIAL_PLATFORMS, cleanSocial, socialDisplay, socialHref, type SocialLinks, type SocialPlatform } from '@/lib/profile/social-links'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { GLASS_CARD } from '@/lib/app-shell/glass'
import { useThemeImage } from '@/components/app-shell/ThemeProvider'
import { PostCard } from '@/components/vibe-tribe/PostCard'
import { RetentionDashboard } from '@/components/retention'
import { BadgeDisplay } from '@/components/badges'
import { ProfilePictureUpload, DEFAULT_PROFILE_IMAGE_URL } from '@/app/profile/components/ProfilePictureUpload'
import { ProfilePictureClickable } from '@/components/ProfilePictureClickable'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import { formatPlayerTime } from '@/lib/design-system/components/media/global-audio/PlayerControls'
import type { AudioTrack } from '@/lib/design-system/components/media/types'
import type { ThemeSlot } from '@/lib/app-shell/theme-slots'

export interface ProfileMember {
  id: string
  full_name: string | null
  first_name: string | null
  profile_picture_url: string | null
  cover_image_url?: string | null
  created_at: string
  about_me: string | null
  favorite_quote: string | null
  role: string | null
  isOwner: boolean
  stats?: { posts: number; hearts: number }
  occupation?: string | null
  social_links?: SocialLinks
  /** Owner only: occupation from their private life profile, offered in Edit profile. */
  suggested_occupation?: string | null
}

const SOCIAL_ICONS: Record<SocialPlatform, LucideIcon> = {
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
  x: AtSign,
  website: Globe,
}

/** The member's public social links as small round icons with handles. */
function SocialRow({ links }: { links: SocialLinks }) {
  const entries = SOCIAL_PLATFORMS.filter((p) => links[p.id])
  if (entries.length === 0) return null
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {entries.map(({ id, label }) => {
        const Icon = SOCIAL_ICONS[id]
        const value = links[id]!
        return (
          <a
            key={id}
            href={socialHref(id, value)}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span className="max-w-[10rem] truncate">{socialDisplay(id, value)}</span>
          </a>
        )
      })}
    </div>
  )
}

type Tab = 'posts' | 'music' | 'about' | 'badges'

const memberSince = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

/**
 * A member's profile in the app shell: cover, photo, name, stats and their
 * posts, shared music, about and badges. On your own profile, Edit profile
 * changes your photo, cover, name, about and quote.
 */
export function MemberProfile({ member, onChange }: { member: ProfileMember; onChange: (next: ProfileMember) => void }) {
  const [tab, setTab] = React.useState<Tab>('posts')
  const [editOpen, setEditOpen] = React.useState(false)
  const themeCover = useThemeImage('tribe.hero' as ThemeSlot)
  const name = member.full_name || member.first_name || 'Tribe member'
  const isGuide = member.role === 'admin' || member.role === 'super_admin'
  const cover = member.cover_image_url || themeCover
  const photo = member.profile_picture_url || DEFAULT_PROFILE_IMAGE_URL

  return (
    <div className="mx-auto w-full max-w-[772px] space-y-4">
      <section className={cn(GLASS_CARD, 'overflow-hidden')}>
        <div className="relative h-32 bg-[linear-gradient(135deg,#4a3566,#1e1630)] md:h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {cover ? <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        </div>
        <div className="px-4 pb-4 md:px-6 md:pb-5">
          <div className="-mt-11 flex items-end justify-between gap-3">
            <div className="relative">
              <ProfilePictureClickable src={photo} alt={name} className="block h-[88px] w-[88px] overflow-hidden rounded-full border-4 border-[#1c1626]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="h-full w-full object-cover" />
              </ProfilePictureClickable>
              {member.isOwner && (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  aria-label="Change photo"
                  className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1c1626] bg-[#39FF14] text-black"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            {member.isOwner && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="mb-1 flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white hover:border-white/35"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit profile
              </button>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-white">{name}</h1>
          {member.occupation ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/80">
              <Briefcase className="h-3.5 w-3.5 text-white/55" aria-hidden /> {member.occupation}
            </p>
          ) : null}
          <p className="text-sm text-white/55">
            Member since {memberSince(member.created_at)}
            {isGuide ? <span className="text-[#d68bff]"> · Guide</span> : null}
          </p>
          {member.about_me ? <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-white/85">{member.about_me}</p> : null}
          <SocialRow links={member.social_links ?? {}} />

          <div className="mt-4 grid grid-cols-2 gap-2 md:max-w-sm">
            {[
              { label: 'Posts', value: member.stats?.posts ?? 0 },
              { label: 'Hearts received', value: member.stats?.hearts ?? 0 },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/[0.10] bg-white/[0.05] px-3 py-2 text-center">
                <p className="text-lg font-semibold tabular-nums text-white">{s.value.toLocaleString()}</p>
                <p className="text-xs text-white/55">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex justify-center">
        <TabSwitch tab={tab} onChange={setTab} />
      </div>

      {tab === 'posts' && <ProfilePosts memberId={member.id} />}
      {tab === 'music' && <ProfileMusic memberId={member.id} name={name} />}
      {tab === 'about' && <ProfileAbout member={member} onEdit={() => setEditOpen(true)} />}
      {tab === 'badges' && (
        <section className={cn(GLASS_CARD, 'p-4 md:p-6')}>
          <BadgeDisplay userId={member.id} compact={false} hideEmpty={false} lockUntilEarned={true} variant="engraved" />
        </section>
      )}

      {editOpen && member.isOwner ? (
        <EditProfileSheet member={member} onClose={() => setEditOpen(false)} onSaved={(next) => onChange(next)} />
      ) : null}
    </div>
  )
}

function TabSwitch({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  // StudioToggle navigates by link; tabs here are in-page, so the same look as buttons.
  const tabs: { id: Tab; label: string }[] = [
    { id: 'posts', label: 'Posts' },
    { id: 'music', label: 'Music' },
    { id: 'about', label: 'About' },
    { id: 'badges', label: 'Badges' },
  ]
  return (
    <div role="tablist" aria-label="Profile" className="grid w-full grid-cols-4 rounded-full border border-white/15 bg-white/[0.05] p-1 md:w-[440px]">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={tab === t.id}
          onClick={() => onChange(t.id)}
          className={cn('rounded-full py-2 text-center text-sm font-semibold transition-colors', tab === t.id ? 'bg-[#39FF14] text-black' : 'text-white/75 hover:text-white')}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** The member's Vibe Tribe posts, newest first. */
function ProfilePosts({ memberId }: { memberId: string }) {
  const [posts, setPosts] = React.useState<any[] | null>(null)
  const [viewerId, setViewerId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    void createClient().auth.getUser().then(({ data }) => !cancelled && setViewerId(data.user?.id ?? null))
    void fetch(`/api/vibe-tribe/posts?user_id=${encodeURIComponent(memberId)}&limit=30`)
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((d) => !cancelled && setPosts(d.posts ?? []))
      .catch(() => !cancelled && setPosts([]))
    return () => {
      cancelled = true
    }
  }, [memberId])

  if (posts === null) return <Loading />
  if (posts.length === 0) return <Empty text="No posts yet." />
  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={viewerId ?? ''}
          isAdmin={false}
          mentionedUsers={post.mentioned_users || []}
          onDelete={(id: string) => setPosts((prev) => (prev ?? []).filter((p) => p.id !== id))}
        />
      ))}
    </div>
  )
}

/** Songs the member created and shared, playable right here. */
function ProfileMusic({ memberId, name }: { memberId: string; name: string }) {
  const [tracks, setTracks] = React.useState<AudioTrack[] | null>(null)
  const play = useGlobalAudioStore((s) => s.play)
  const togglePlayPause = useGlobalAudioStore((s) => s.togglePlayPause)
  const setName = useGlobalAudioStore((s) => s.setName)
  const currentIndex = useGlobalAudioStore((s) => s.currentIndex)
  const isPlaying = useGlobalAudioStore((s) => s.isPlaying)
  const key = `profile-music:${memberId}`

  React.useEffect(() => {
    let cancelled = false
    void fetch(`/api/music/artists/${encodeURIComponent(memberId)}/tracks?limit=100`)
      .then((r) => (r.ok ? r.json() : { tracks: [] }))
      .then((d: { tracks?: AudioTrack[] }) => !cancelled && setTracks(d.tracks ?? []))
      .catch(() => !cancelled && setTracks([]))
    return () => {
      cancelled = true
    }
  }, [memberId])

  if (tracks === null) return <Loading />
  if (tracks.length === 0) return <Empty text={`${name.split(' ')[0]} hasn't shared any music yet.`} />
  return (
    <section className={cn(GLASS_CARD, 'overflow-hidden')}>
      <ul>
        {tracks.map((t, i) => {
          const current = setName === key && currentIndex === i
          return (
            <li key={t.id} className={cn(i > 0 && 'border-t border-white/[0.07]')}>
              <button
                type="button"
                onClick={() => (current ? togglePlayPause() : play(tracks, i, key, 'music', 'music'))}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[rgba(57,255,20,0.12)]">
                  {t.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Music2 className="absolute inset-0 m-auto h-5 w-5 text-[#39FF14]" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
                    {current && isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" />}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-[15px] font-medium', current ? 'text-[#39FF14]' : 'text-white')}>{t.title}</span>
                  <span className="block truncate text-xs text-white/50">{t.artist}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-white/45">{t.duration ? formatPlayerTime(t.duration) : ''}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ProfileAbout({ member, onEdit }: { member: ProfileMember; onEdit: () => void }) {
  const first = (member.full_name || member.first_name || 'This member').split(' ')[0]
  return (
    <div className="space-y-3">
      <section className={cn(GLASS_CARD, 'p-4 md:p-6')}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">About</h2>
          {member.isOwner && (
            <button type="button" onClick={onEdit} className="text-sm text-white/60 hover:text-white">
              Edit
            </button>
          )}
        </div>
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/85">
          {member.about_me || (member.isOwner ? 'Tell the Tribe a little about yourself.' : `${first} hasn't added an about yet.`)}
        </p>
      </section>
      <section className={cn(GLASS_CARD, 'p-4 md:p-6')}>
        <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-white">
          <Quote className="h-4 w-4 text-[#d68bff]" /> Favorite quote
        </h2>
        <p className="text-[15px] italic leading-relaxed text-white/85">
          {member.favorite_quote || (member.isOwner ? 'Add a quote that inspires you.' : 'No favorite quote yet.')}
        </p>
      </section>
      <section className={cn(GLASS_CARD, 'p-4 md:p-6')}>
        <h2 className="mb-3 text-base font-semibold text-white">Activity</h2>
        <RetentionDashboard userId={member.id} readonly />
      </section>
    </div>
  )
}

function EditProfileSheet({ member, onClose, onSaved }: { member: ProfileMember; onClose: () => void; onSaved: (next: ProfileMember) => void }) {
  const [name, setName] = React.useState(member.full_name || '')
  const [about, setAbout] = React.useState(member.about_me || '')
  const [quote, setQuote] = React.useState(member.favorite_quote || '')
  const [photo, setPhoto] = React.useState(member.profile_picture_url || '')
  const [cover, setCover] = React.useState(member.cover_image_url || '')
  const [occupation, setOccupation] = React.useState(member.occupation || '')
  const [socials, setSocials] = React.useState<Record<string, string>>(() => {
    const out: Record<string, string> = {}
    for (const p of SOCIAL_PLATFORMS) {
      const v = member.social_links?.[p.id]
      out[p.id] = v ? (p.id === 'website' ? v : `${p.id === 'facebook' || p.id === 'linkedin' ? '' : '@'}${v}`) : ''
    }
    return out
  })
  const [uploadingCover, setUploadingCover] = React.useState(false)
  const [drafting, setDrafting] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const uploadCover = async (file: File) => {
    setUploadingCover(true)
    try {
      const result = await uploadUserFile('profile', file, member.id)
      setCover(result.url)
    } catch {
      toast.error('Could not upload that image')
    } finally {
      setUploadingCover(false)
    }
  }

  const draftAbout = async () => {
    setDrafting(true)
    try {
      const res = await fetch('/api/viva/snapshot-about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingAbout: about }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || typeof data.about_me !== 'string') throw new Error(data.error || 'VIVA could not draft it')
      setAbout(data.about_me.slice(0, 500))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'VIVA could not draft it')
    } finally {
      setDrafting(false)
    }
  }

  const save = async () => {
    if (!name.trim()) {
      toast.error('Your name can’t be empty')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/snapshot/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          about_me: about,
          favorite_quote: quote,
          profile_picture_url: photo || null,
          cover_image_url: cover || null,
          occupation,
          social_links: socials,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not save your profile')
      onSaved({
        ...member,
        full_name: data.full_name ?? name.trim(),
        first_name: (data.full_name ?? name.trim()).split(' ')[0],
        about_me: data.about_me ?? null,
        favorite_quote: data.favorite_quote ?? null,
        profile_picture_url: data.profile_picture_url ?? null,
        cover_image_url: data.cover_image_url ?? null,
        occupation: data.occupation ?? null,
        social_links: data.social_links ?? {},
        suggested_occupation: null,
      })
      toast.success('Profile saved')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save your profile')
    } finally {
      setSaving(false)
    }
  }

  const field = 'w-full rounded-2xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[15px] text-white placeholder:text-white/40 focus:border-[#39FF14]/40 focus:outline-none'

  if (typeof document === 'undefined') return null
  // Portaled to <body>: a blurred (glass) parent would otherwise trap the fixed sheet.
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Edit profile"
        onClick={(e) => e.stopPropagation()}
        className="vf-glass max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[26px] border border-white/[0.14] bg-[rgba(28,22,38,0.98)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] backdrop-blur-2xl md:rounded-[26px]"
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/25 md:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Edit profile</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-white/55">Photo</p>
            <ProfilePictureUpload
              currentImageUrl={photo || null}
              onImageChange={(url) => setPhoto(url || '')}
              onError={(msg) => toast.error(msg)}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-white/55">Cover</p>
            <label className="relative block h-24 cursor-pointer overflow-hidden rounded-2xl border border-dashed border-white/25 bg-[linear-gradient(135deg,#4a3566,#1e1630)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {cover ? <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
              <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/35 text-sm text-white">
                {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {cover ? 'Change cover' : 'Add a cover image'}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && void uploadCover(e.target.files[0])} />
            </label>
            {cover ? (
              <button type="button" onClick={() => setCover('')} className="mt-1 text-xs text-white/55 hover:text-white">
                Use the theme image instead
              </button>
            ) : null}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/55">Name shown in the Tribe</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={field} />
          </label>

          <div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/55">Occupation (optional)</span>
              <input value={occupation} onChange={(e) => setOccupation(e.target.value)} maxLength={80} placeholder="What you do" className={field} />
            </label>
            {!occupation && member.suggested_occupation ? (
              <button type="button" onClick={() => setOccupation(member.suggested_occupation!)} className="mt-1.5 text-xs text-[#d68bff] hover:text-[#e8b8ff]">
                Use “{member.suggested_occupation}” from your profile
              </button>
            ) : null}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-white/55">About me</span>
              <button type="button" onClick={() => void draftAbout()} disabled={drafting} className="flex items-center gap-1 text-xs text-[#d68bff] hover:text-[#e8b8ff] disabled:opacity-60">
                {drafting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                VIVA, draft it for me
              </button>
            </div>
            <textarea value={about} onChange={(e) => setAbout(e.target.value)} maxLength={500} rows={4} placeholder="Tell the Tribe a little about yourself" className={cn(field, 'resize-none')} />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-white/55">Favorite quote</span>
            <textarea value={quote} onChange={(e) => setQuote(e.target.value)} maxLength={300} rows={2} placeholder="A quote that inspires you" className={cn(field, 'resize-none')} />
          </label>

          <div>
            <p className="mb-1.5 text-xs font-medium text-white/55">Social (optional) · shown on your profile</p>
            <div className="space-y-2">
              {SOCIAL_PLATFORMS.map(({ id, label, placeholder }) => {
                const Icon = SOCIAL_ICONS[id]
                const invalid = !!socials[id]?.trim() && !cleanSocial(id, socials[id])
                return (
                  <label key={id} className="flex items-center gap-2">
                    <span className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-white/70">
                      <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
                    </span>
                    <input
                      value={socials[id] ?? ''}
                      onChange={(e) => setSocials((prev) => ({ ...prev, [id]: e.target.value }))}
                      placeholder={placeholder}
                      autoCapitalize="off"
                      autoCorrect="off"
                      className={cn(field, 'rounded-full py-2 text-sm', invalid && 'border-[#FF0040]/60')}
                    />
                  </label>
                )
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-white/40">Type a handle or paste a link. Leave any blank to hide it.</p>
          </div>

          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || uploadingCover}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#39FF14] text-[15px] font-semibold text-black disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save'}
          </button>
          <p className="text-center text-xs text-white/45">
            More details live in your <Link href="/profile" className="underline-offset-2 hover:underline">full profile</Link>.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Loading() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-white/50" />
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className={cn(GLASS_CARD, 'px-5 py-8 text-center text-sm text-white/60')}>{text}</p>
}
