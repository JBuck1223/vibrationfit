'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Container, Stack, PageHero, Card, Spinner, Button } from '@/lib/design-system/components'
import { RetentionDashboard } from '@/components/retention'
import { BadgeDisplay } from '@/components/badges'
import { useAreaStats } from '@/hooks/useAreaStats'
import { DEFAULT_PROFILE_IMAGE_URL } from '@/app/profile/components/ProfilePictureUpload'
import { User, Calendar, ArrowLeft, Award, Pencil, Check, X, Quote, UsersRound, Flame, Shield, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface MemberProfile {
  id: string
  full_name: string | null
  first_name: string | null
  profile_picture_url: string | null
  created_at: string
  about_me: string | null
  favorite_quote: string | null
  role: string | null
  isOwner: boolean
}

export default function SnapshotPage() {
  const params = useParams()
  const userId = params.id as string
  
  const { stats: practiceStats } = useAreaStats('vibe-tribe')
  const [member, setMember] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingAbout, setEditingAbout] = useState(false)
  const [aboutDraft, setAboutDraft] = useState('')
  const [savingAbout, setSavingAbout] = useState(false)
  const [editingQuote, setEditingQuote] = useState(false)
  const [quoteDraft, setQuoteDraft] = useState('')
  const [savingQuote, setSavingQuote] = useState(false)
  const [vibeStats, setVibeStats] = useState({ posts: 0, comments: 0, hearts: 0 })
  const [statsExpanded, setStatsExpanded] = useState(false)
  const [freezeOpen, setFreezeOpen] = useState(false)
  const freezeRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const quoteInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!freezeOpen) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (freezeRef.current && !freezeRef.current.contains(e.target as Node)) {
        setFreezeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [freezeOpen])

  const fetchVibeStats = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [postsRes, commentsRes, heartsRes] = await Promise.all([
      supabase.from('vibe_posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_deleted', false),
      supabase.from('vibe_comments').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_deleted', false),
      supabase.from('vibe_hearts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    setVibeStats({
      posts: postsRes.count ?? 0,
      comments: commentsRes.count ?? 0,
      hearts: heartsRes.count ?? 0,
    })
  }, [])

  useEffect(() => {
    async function fetchMemberProfile() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/snapshot/${userId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Member not found')
          }
          throw new Error('Failed to load member profile')
        }
        
        const data = await response.json()
        setMember(data)
      } catch (err) {
        console.error('Error fetching member profile:', err)
        setError(err instanceof Error ? err.message : 'Failed to load member')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchMemberProfile()
    }
  }, [userId])

  useEffect(() => {
    if (member?.isOwner) {
      fetchVibeStats()
    }
  }, [member?.isOwner, fetchVibeStats])

  useEffect(() => {
    if (editingAbout && textareaRef.current) {
      textareaRef.current.focus()
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [editingAbout])

  useEffect(() => {
    if (editingQuote && quoteInputRef.current) {
      quoteInputRef.current.focus()
      const len = quoteInputRef.current.value.length
      quoteInputRef.current.setSelectionRange(len, len)
    }
  }, [editingQuote])

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const handleEditAbout = () => {
    setAboutDraft(member?.about_me || '')
    setEditingAbout(true)
  }

  const handleCancelAbout = () => {
    setEditingAbout(false)
    setAboutDraft('')
  }

  const handleSaveAbout = async () => {
    if (!member) return
    setSavingAbout(true)
    try {
      const response = await fetch(`/api/snapshot/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ about_me: aboutDraft }),
      })

      if (response.ok) {
        const data = await response.json()
        setMember(prev => prev ? { ...prev, about_me: data.about_me } : prev)
        setEditingAbout(false)
      }
    } catch (err) {
      console.error('Error saving about me:', err)
    } finally {
      setSavingAbout(false)
    }
  }

  const handleEditQuote = () => {
    setQuoteDraft(member?.favorite_quote || '')
    setEditingQuote(true)
  }

  const handleCancelQuote = () => {
    setEditingQuote(false)
    setQuoteDraft('')
  }

  const handleSaveQuote = async () => {
    if (!member) return
    setSavingQuote(true)
    try {
      const response = await fetch(`/api/snapshot/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite_quote: quoteDraft }),
      })

      if (response.ok) {
        const data = await response.json()
        setMember(prev => prev ? { ...prev, favorite_quote: data.favorite_quote } : prev)
        setEditingQuote(false)
      }
    } catch (err) {
      console.error('Error saving favorite quote:', err)
    } finally {
      setSavingQuote(false)
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (error || !member) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <Card className="p-6 md:p-8 text-center">
            <div className="text-red-400 mb-4">
              <User className="w-12 h-12 mx-auto opacity-50" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">
              {error || 'Member not found'}
            </h2>
            <p className="text-neutral-400 mb-6 text-sm md:text-base">
              This member profile could not be loaded.
            </p>
            <Link 
              href="/vibe-tribe"
              className="text-teal-400 hover:underline inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Vibe Tribe
            </Link>
          </Card>
        </Stack>
      </Container>
    )
  }

  const displayName = member.full_name || member.first_name || 'Community Member'
  const isMemberGuide = member.role === 'admin' || member.role === 'super_admin'

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* PageHero with member info */}
        <PageHero
          eyebrow="VIBE TRIBE"
          title={displayName}
          subtitle={isMemberGuide ? undefined : `Member since ${formatMemberSince(member.created_at)}`}
        >
          {isMemberGuide && (
            <div className="flex flex-col items-center gap-1 -mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#BF00FF]/15 text-[#BF00FF] text-sm font-bold tracking-wide uppercase">
                Guide
              </span>
              <span className="text-sm text-neutral-400">Member since {formatMemberSince(member.created_at)}</span>
            </div>
          )}
          {/* Profile picture */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-700">
              <img
                src={member.profile_picture_url || DEFAULT_PROFILE_IMAGE_URL}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
            
            <Button 
              variant="outline"
              size="sm"
              asChild
            >
              <Link href="/vibe-tribe">
                <UsersRound className="w-3 h-3 mr-1" />
                Vibe Tribe
              </Link>
            </Button>
          </div>
        </PageHero>

        {/* Practice Tracking (own profile only) */}
        {member.isOwner && (
          <div className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#BF00FF]/[0.04] via-[#111] to-[#111]">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top_left,_rgba(191,0,255,0.08)_0%,_transparent_50%)] pointer-events-none" />
            <div className="relative p-5 md:p-6">
              <div className="flex items-center justify-center gap-2.5 mb-4">
                <UsersRound className="w-4 h-4 text-[#BF00FF]" />
                <h3 className="text-neutral-300 font-medium text-sm tracking-wide uppercase">Vibe Tribe</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {/* Current Streak */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3">
                  <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">Current Streak</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-semibold text-lg leading-none flex items-center gap-1.5">
                      {(practiceStats?.currentStreak ?? 0) >= 1 && <Flame className="w-4 h-4 text-orange-400" />}
                      {practiceStats?.currentStreak ?? 0}
                      <span className="font-normal text-neutral-500">{(practiceStats?.currentStreak ?? 0) === 1 ? 'day' : 'days'}</span>
                    </p>
                    {(practiceStats?.streakFreezeAvailable || practiceStats?.streakFreezeUsedThisWeek) && (
                      <div className="relative ml-auto flex items-center" ref={freezeRef}>
                        <button type="button" className="flex items-center" onClick={() => setFreezeOpen(prev => !prev)}>
                          <Shield className={`w-3.5 h-3.5 cursor-help ${practiceStats?.streakFreezeUsedThisWeek ? 'text-blue-500/40' : 'text-blue-400'}`} />
                        </button>
                        <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 rounded-xl bg-neutral-900 border border-blue-500/20 p-3 shadow-xl transition-all duration-200 z-[100] ${freezeOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                          <p className="text-sm font-semibold text-blue-400 mb-1">
                            Streak Freeze <span className="font-normal text-blue-400/70">({practiceStats?.streakFreezeUsedThisWeek ? 'Used this week' : 'Available'})</span>
                          </p>
                          <p className="text-xs text-neutral-400 leading-relaxed">
                            {practiceStats?.streakFreezeUsedThisWeek
                              ? 'Your streak was saved this week. You get 1 free grace day per week for each habit.'
                              : 'You get 1 free grace day per week. If you miss a day, your streak stays alive so one off-day doesn\'t wipe out your progress.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reps this Week - always visible */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3">
                  <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">Reps this Week</p>
                  <p className="text-white font-semibold text-lg leading-none">{practiceStats?.countLast7 ?? 0}<span className="font-normal text-neutral-500">/7</span></p>
                </div>

                {/* Remaining stats: always visible on sm+, toggled on mobile */}
                {[
                  {
                    label: 'Connections this Month',
                    value: <>{practiceStats?.countLast30 ?? 0}<span className="font-normal text-neutral-500">/30</span></>,
                  },
                  {
                    label: 'Total Rep Days',
                    value: (practiceStats?.countAllTime ?? 0).toLocaleString(),
                  },
                  { label: 'Posts', value: vibeStats.posts.toLocaleString() },
                  { label: 'Comments', value: vibeStats.comments.toLocaleString() },
                  { label: 'Hearts', value: vibeStats.hearts.toLocaleString() },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3 ${statsExpanded ? '' : 'hidden'} sm:block`}>
                    <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">{stat.label}</p>
                    <p className="text-white font-semibold text-lg leading-none">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Mobile toggle */}
              <button
                type="button"
                onClick={() => setStatsExpanded(prev => !prev)}
                className="flex items-center justify-center gap-1.5 w-full mt-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-300 transition-colors sm:hidden"
              >
                {statsExpanded ? 'Show less' : 'View all stats'}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${statsExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* About Me Section */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#39FF14]" />
              <h2 className="text-lg font-semibold text-white">About</h2>
            </div>
            {member.isOwner && !editingAbout && (
              <button
                onClick={handleEditAbout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                {member.about_me ? 'Edit' : 'Add'}
              </button>
            )}
          </div>

          {editingAbout ? (
            <div className="space-y-3">
              <textarea
                ref={textareaRef}
                value={aboutDraft}
                onChange={(e) => setAboutDraft(e.target.value.slice(0, 500))}
                placeholder={"Tell the Tribe a little about yourself...\n\n📍 Living in Sarasota, FL (raised in TX)\n🥰 Wife and mom of 3\n💻 Working at Vibration Fit"}
                className="w-full bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#39FF14]/50 resize-none transition-colors"
                rows={6}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">{aboutDraft.length}/500</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelAbout}
                    disabled={savingAbout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAbout}
                    disabled={savingAbout}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#39FF14] text-black hover:bg-[#39FF14]/90 transition-colors disabled:opacity-50"
                  >
                    {savingAbout ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : member.about_me ? (
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{member.about_me}</p>
          ) : (
            <p className="text-sm text-neutral-500 italic">
              {member.isOwner ? 'Tell the Tribe a little about yourself...' : 'This member hasn\u0027t added a bio yet.'}
            </p>
          )}
        </Card>

        {/* Favorite Quote Section */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Quote className="w-5 h-5 text-[#00FFFF]" />
              <h2 className="text-lg font-semibold text-white">Favorite Quote</h2>
            </div>
            {member.isOwner && !editingQuote && (
              <button
                onClick={handleEditQuote}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                {member.favorite_quote ? 'Edit' : 'Add'}
              </button>
            )}
          </div>

          {editingQuote ? (
            <div className="space-y-3">
              <textarea
                ref={quoteInputRef}
                value={quoteDraft}
                onChange={(e) => setQuoteDraft(e.target.value.slice(0, 300))}
                placeholder="Share a quote that inspires you..."
                className="w-full bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#00FFFF]/50 resize-none transition-colors"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">{quoteDraft.length}/300</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelQuote}
                    disabled={savingQuote}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveQuote}
                    disabled={savingQuote}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#39FF14] text-black hover:bg-[#39FF14]/90 transition-colors disabled:opacity-50"
                  >
                    {savingQuote ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : member.favorite_quote ? (
            <blockquote className="border-l-2 border-[#00FFFF]/40 pl-4 py-1">
              <p className="text-sm text-neutral-300 leading-relaxed italic whitespace-pre-wrap">
                &ldquo;{member.favorite_quote}&rdquo;
              </p>
            </blockquote>
          ) : (
            <p className="text-sm text-neutral-500 italic">
              {member.isOwner ? 'Share a quote that inspires you...' : 'No favorite quote added yet.'}
            </p>
          )}
        </Card>

        {/* Retention Metrics Section */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-semibold text-white">Activity Snapshot</h2>
          </div>
          
          <RetentionDashboard userId={userId} readonly />
        </Card>

        {/* Badges Section */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Earned Badges</h2>
          </div>
          <BadgeDisplay userId={userId} compact={false} hideEmpty={false} lockUntilEarned={true} variant="engraved" />
        </Card>
      </Stack>
    </Container>
  )
}
