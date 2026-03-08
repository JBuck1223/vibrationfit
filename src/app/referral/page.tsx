'use client'

import { useState, useEffect, useCallback } from 'react'
import { Container, Stack, PageHero, Card, Button, Input, Badge, ProgressBar, Spinner } from '@/lib/design-system/components'
import {
  Copy, Check, Share2, Mail, MessageCircle, Send,
  Users, Zap, Target, Crown, Link2, Edit3, Gift, ChevronRight,
} from 'lucide-react'

interface Participant {
  id: string
  email: string
  referral_code: string
  display_name: string | null
  total_clicks: number
  email_signups: number
  paid_conversions: number
  second_degree_signups: number
}

interface Tier {
  id: string
  tier_name: string
  tier_order: number
  min_email_signups: number
  min_paid_conversions: number
  reward_type: string
  reward_value: Record<string, number>
  description: string
}

interface Invite {
  id: string
  referred_email: string
  referred_name: string | null
  personalization: string | null
  status: string
  sent_at: string
}

interface RewardEarned {
  id: string
  tier_id: string
  is_claimed: boolean
  created_at: string
  tier: Tier
}

interface DashboardData {
  participant: Participant
  referralLink: string
  stats: { totalClicks: number; emailSignups: number; paidConversions: number; secondDegreeSignups: number }
  currentTier: Tier | null
  nextTier: Tier | null
  tiers: Tier[]
  rewardsEarned: RewardEarned[]
  invites: Invite[]
}

const INTEREST_OPTIONS = [
  'Vision', 'Growth', 'Universal Law', 'Manifestation',
  'Mindset', 'Personal Development', 'Wellness',
]

const TIER_ICONS = [Zap, Target, Crown, Gift]

export default function ReferralPage() {
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [email, setEmail] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Share section
  const [copied, setCopied] = useState(false)

  // Code editing
  const [editingCode, setEditingCode] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  // Warm intro
  const [activeTab, setActiveTab] = useState<'share' | 'intro'>('share')
  const [introName, setIntroName] = useState('')
  const [introEmail, setIntroEmail] = useState('')
  const [introInterest, setIntroInterest] = useState(INTEREST_OPTIONS[0])
  const [introStep, setIntroStep] = useState<1 | 2>(1)
  const [introCopied, setIntroCopied] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const loadDashboard = useCallback(async (participantEmail?: string) => {
    try {
      const params = new URLSearchParams()
      if (participantEmail) params.set('email', participantEmail)
      const res = await fetch(`/api/referral/dashboard?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDashboard(data)
        setEnrolled(true)
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleJoin = async () => {
    if (!email.trim()) return
    setJoinLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/referral/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to join')
        return
      }
      await loadDashboard(email.trim())
    } catch {
      setError('Something went wrong')
    } finally {
      setJoinLoading(false)
    }
  }

  const copyLink = async () => {
    if (!dashboard) return
    await navigator.clipboard.writeText(dashboard.referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareVia = (platform: string) => {
    if (!dashboard) return
    const link = encodeURIComponent(dashboard.referralLink)
    const text = encodeURIComponent('Check out VibrationFit - a 72-hour life vision activation experience')

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${link}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${link}`,
      sms: `sms:?body=${text}%20${link}`,
      email: `mailto:?subject=${encodeURIComponent('Something I thought you might like')}&body=${text}%0A%0A${link}`,
    }

    if (urls[platform]) window.open(urls[platform], '_blank')
  }

  const handleCodeUpdate = async () => {
    if (!newCode.trim()) return
    setCodeLoading(true)
    setCodeError(null)

    try {
      const res = await fetch('/api/referral/code', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newCode: newCode.trim().toLowerCase(), email: dashboard?.participant.email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCodeError(data.error || 'Failed to update')
        return
      }
      setEditingCode(false)
      setNewCode('')
      await loadDashboard(dashboard?.participant.email)
    } catch {
      setCodeError('Something went wrong')
    } finally {
      setCodeLoading(false)
    }
  }

  const introMessage = introName.trim()
    ? `Hey ${introName.trim()}, my friend Jordan built something I thought you'd really like. Mind if I intro you two?`
    : 'Hey [Friend], my friend Jordan built something I thought you\'d really like. Mind if I intro you two?'

  const copyIntroMessage = async () => {
    await navigator.clipboard.writeText(introMessage)
    setIntroCopied(true)
    setTimeout(() => setIntroCopied(false), 2000)
  }

  const handleSendIntro = async () => {
    if (!introName.trim() || !introEmail.trim()) return
    setSendLoading(true)
    setSendError(null)
    setSendSuccess(false)

    try {
      const res = await fetch('/api/referral/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referredName: introName.trim(),
          referredEmail: introEmail.trim(),
          personalization: introInterest,
          referrerName: dashboard?.participant.display_name,
          email: dashboard?.participant.email,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSendError(data.error || 'Failed to send')
        return
      }
      setSendSuccess(true)
      setIntroName('')
      setIntroEmail('')
      setIntroStep(1)
      await loadDashboard(dashboard?.participant.email)
    } catch {
      setSendError('Something went wrong')
    } finally {
      setSendLoading(false)
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

  // Not enrolled - show join form
  if (!enrolled || !dashboard) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            eyebrow="SHARE THE VIBE"
            title="Referral Program"
            subtitle="Share VibrationFit with your friends and earn rewards as they join the movement"
          />

          <Card className="p-4 md:p-6 lg:p-8 max-w-lg mx-auto w-full">
            <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
              Join the Referral Program
            </h2>
            <p className="text-sm md:text-base text-neutral-400 text-center mb-6">
              Enter your email to get your unique referral link
            </p>

            <div className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
              {error && <p className="text-[#FF0040] text-sm">{error}</p>}
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={handleJoin}
                disabled={joinLoading || !email.trim()}
              >
                {joinLoading ? <Spinner size="sm" /> : 'Get My Referral Link'}
              </Button>
            </div>
          </Card>

          {/* Tier preview */}
          <TierPreview />
        </Stack>
      </Container>
    )
  }

  const { participant, stats, tiers, currentTier, nextTier, rewardsEarned, invites } = dashboard

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="SHARE THE VIBE"
          title="Your Referral Dashboard"
          subtitle={`Welcome back, ${participant.display_name || participant.email.split('@')[0]}`}
        >
          <Badge variant="primary">
            {stats.emailSignups} signup{stats.emailSignups !== 1 ? 's' : ''} / {stats.paidConversions} conversion{stats.paidConversions !== 1 ? 's' : ''}
          </Badge>
        </PageHero>

        {/* Your Referral Link */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-[#39FF14]" />
            <h2 className="text-lg md:text-xl font-bold text-white">Your Referral Link</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-full px-4 py-2.5 text-sm text-neutral-300 truncate">
              {dashboard.referralLink}
            </div>
            <Button variant="primary" size="sm" onClick={copyLink} className="shrink-0">
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          {/* Editable code */}
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-xs text-neutral-500">
              Code: <span className="text-neutral-300 font-mono">{participant.referral_code}</span>
            </span>
            {!editingCode ? (
              <button
                onClick={() => { setEditingCode(true); setNewCode(participant.referral_code) }}
                className="text-xs text-[#00FFFF] hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Customize
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm text-white w-40 font-mono"
                  maxLength={20}
                />
                <Button variant="primary" size="sm" onClick={handleCodeUpdate} disabled={codeLoading}>
                  {codeLoading ? <Spinner size="sm" /> : 'Save'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditingCode(false); setCodeError(null) }}>
                  Cancel
                </Button>
              </div>
            )}
            {codeError && <p className="text-[#FF0040] text-xs">{codeError}</p>}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <StatBox label="Clicks" value={stats.totalClicks} />
            <StatBox label="Signups" value={stats.emailSignups} />
            <StatBox label="Conversions" value={stats.paidConversions} />
            <StatBox label="2nd Degree" value={stats.secondDegreeSignups} />
          </div>
        </Card>

        {/* Share / Warm Intro */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex gap-1 mb-6 border-b border-[#333]">
            <button
              onClick={() => setActiveTab('share')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'share'
                  ? 'border-[#39FF14] text-[#39FF14]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Share2 className="w-4 h-4 inline mr-1.5" />
              Share Your Link
            </button>
            <button
              onClick={() => setActiveTab('intro')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'intro'
                  ? 'border-[#39FF14] text-[#39FF14]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Send className="w-4 h-4 inline mr-1.5" />
              Send a Personal Intro
            </button>
          </div>

          {activeTab === 'share' && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-400">
                Share your link via social media, email, or text
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={() => shareVia('twitter')} className="flex-1">
                  <span className="mr-1.5">X</span> Post
                </Button>
                <Button variant="outline" size="sm" onClick={() => shareVia('facebook')} className="flex-1">
                  Facebook
                </Button>
                <Button variant="outline" size="sm" onClick={() => shareVia('email')} className="flex-1">
                  <Mail className="w-4 h-4 mr-1.5" /> Email
                </Button>
                <Button variant="outline" size="sm" onClick={() => shareVia('sms')} className="flex-1">
                  <MessageCircle className="w-4 h-4 mr-1.5" /> Text
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'intro' && (
            <div className="space-y-5">
              {/* Step 1: Copy intro message */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={introStep >= 1 ? 'primary' : 'neutral'}>Step 1</Badge>
                  <span className="text-sm font-medium text-white">Ask your friend for permission</span>
                </div>
                <p className="text-xs text-neutral-400 mb-3">
                  Send this to your friend via text or email first
                </p>
                <div className="mb-3">
                  <Input
                    type="text"
                    placeholder="Friend's first name"
                    value={introName}
                    onChange={(e) => setIntroName(e.target.value)}
                  />
                </div>
                <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 text-sm text-neutral-300 italic">
                  {introMessage}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={copyIntroMessage}>
                    {introCopied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {introCopied ? 'Copied' : 'Copy Message'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIntroStep(2)}
                    disabled={!introName.trim()}
                  >
                    They said yes <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Step 2: Send the email */}
              {introStep === 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="primary">Step 2</Badge>
                    <span className="text-sm font-medium text-white">Send the intro email</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-3">
                    We will send a personal email from Jordan on your behalf
                  </p>
                  <div className="space-y-3">
                    <Input
                      type="email"
                      placeholder="Friend's email"
                      value={introEmail}
                      onChange={(e) => setIntroEmail(e.target.value)}
                    />
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">What are they into?</label>
                      <select
                        value={introInterest}
                        onChange={(e) => setIntroInterest(e.target.value)}
                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[#39FF14] focus:outline-none"
                      >
                        {INTEREST_OPTIONS.map(opt => (
                          <option key={opt} value={opt.toLowerCase()}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    {sendError && <p className="text-[#FF0040] text-sm">{sendError}</p>}
                    {sendSuccess && (
                      <div className="flex items-center gap-2 text-[#39FF14] text-sm">
                        <Check className="w-4 h-4" /> Intro email sent successfully
                      </div>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={handleSendIntro}
                      disabled={sendLoading || !introEmail.trim() || !introName.trim()}
                    >
                      {sendLoading ? <Spinner size="sm" /> : <><Send className="w-4 h-4 mr-1.5" /> Send Intro Email</>}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Progress Tracker */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-[#39FF14]" />
            <h2 className="text-lg md:text-xl font-bold text-white">Your Progress</h2>
            {currentTier && <Badge variant="success">{currentTier.tier_name}</Badge>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {tiers.map((tier, i) => {
              const Icon = TIER_ICONS[i] || Gift
              const earned = stats.emailSignups >= tier.min_email_signups &&
                             stats.paidConversions >= tier.min_paid_conversions
              const signupProgress = tier.min_email_signups > 0
                ? Math.min((stats.emailSignups / tier.min_email_signups) * 100, 100) : 100
              const conversionProgress = tier.min_paid_conversions > 0
                ? Math.min((stats.paidConversions / tier.min_paid_conversions) * 100, 100) : 100

              return (
                <div
                  key={tier.id}
                  className={`rounded-xl border p-4 transition-all ${
                    earned
                      ? 'border-[#39FF14]/50 bg-[#39FF14]/5'
                      : 'border-[#333] bg-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-5 h-5 ${earned ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                    <span className={`text-sm font-semibold ${earned ? 'text-[#39FF14]' : 'text-white'}`}>
                      {tier.tier_name}
                    </span>
                  </div>

                  {tier.min_email_signups > 0 && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Signups</span>
                        <span>{Math.min(stats.emailSignups, tier.min_email_signups)}/{tier.min_email_signups}</span>
                      </div>
                      <ProgressBar value={signupProgress} size="sm" variant={earned ? 'primary' : 'secondary'} />
                    </div>
                  )}

                  {tier.min_paid_conversions > 0 && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Paid</span>
                        <span>{Math.min(stats.paidConversions, tier.min_paid_conversions)}/{tier.min_paid_conversions}</span>
                      </div>
                      <ProgressBar value={conversionProgress} size="sm" variant={earned ? 'primary' : 'accent'} />
                    </div>
                  )}

                  <p className="text-xs text-neutral-400 mt-2">{tier.description}</p>
                  {earned && <Badge variant="success" className="mt-2">Earned</Badge>}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Your Referrals */}
        {invites.length > 0 && (
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#00FFFF]" />
              <h2 className="text-lg md:text-xl font-bold text-white">Your Referrals</h2>
            </div>

            <div className="space-y-2">
              {invites.map(invite => (
                <div key={invite.id} className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-4 py-3 border border-[#333]">
                  <div>
                    <span className="text-sm text-white">{invite.referred_name || invite.referred_email}</span>
                    <span className="text-xs text-neutral-500 ml-2">{invite.referred_email}</span>
                  </div>
                  <Badge
                    variant={
                      invite.status === 'converted' ? 'success' :
                      invite.status === 'clicked' ? 'secondary' :
                      'neutral'
                    }
                  >
                    {invite.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Rewards Earned */}
        {rewardsEarned.length > 0 && (
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-[#BF00FF]" />
              <h2 className="text-lg md:text-xl font-bold text-white">Rewards Earned</h2>
            </div>

            <div className="space-y-2">
              {rewardsEarned.map(reward => (
                <div key={reward.id} className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-4 py-3 border border-[#333]">
                  <div>
                    <span className="text-sm text-white font-medium">{reward.tier?.tier_name}</span>
                    <span className="text-xs text-neutral-400 ml-2">{reward.tier?.description}</span>
                  </div>
                  <Badge variant={reward.is_claimed ? 'neutral' : 'premium'}>
                    {reward.is_claimed ? 'Claimed' : 'Available'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Stack>
    </Container>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 text-center">
      <div className="text-xl md:text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-neutral-400">{label}</div>
    </div>
  )
}

function TierPreview() {
  const [tiers, setTiers] = useState<Tier[]>([])

  useEffect(() => {
    fetch('/api/referral/tiers')
      .then(r => r.json())
      .then(d => setTiers(d.tiers || []))
      .catch(() => {})
  }, [])

  if (!tiers.length) return null

  return (
    <Card className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-2 mb-6">
        <Gift className="w-5 h-5 text-[#BF00FF]" />
        <h2 className="text-lg md:text-xl font-bold text-white">Reward Tiers</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {tiers.map((tier, i) => {
          const Icon = TIER_ICONS[i] || Gift
          return (
            <div key={tier.id} className="rounded-xl border border-[#333] bg-[#1a1a1a] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-neutral-400" />
                <span className="text-sm font-semibold text-white">{tier.tier_name}</span>
              </div>
              <p className="text-xs text-neutral-400">{tier.description}</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
