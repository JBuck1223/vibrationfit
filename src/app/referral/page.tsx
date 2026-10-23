'use client'

import { useInShell } from '@/lib/app-shell/shell-context'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Container, Stack, Card, Button, Input, Badge, Spinner } from '@/lib/design-system/components'
import {
  Copy, Check, Share2, Mail, MessageCircle, Send,
  Link2, Edit3, ChevronRight,
  Save, Pen, Smartphone,
} from 'lucide-react'
import { keys } from '@/lib/query/keys'
import { useReferralDashboard } from '@/hooks/useReferralDashboard'
import { EarningNotice, StatBox } from '@/components/referral/ReferralPartnerCards'

const INTEREST_OPTIONS = [
  'Vision', 'Growth', 'Universal Law', 'Manifestation',
  'Mindset', 'Personal Development', 'Wellness',
]

export default function ReferralPage() {
  const queryClient = useQueryClient()
  // Signed-out visitors look themselves up by email after joining
  const [lookupEmail, setLookupEmail] = useState<string | null>(null)
  const { data: dashboard, isLoading: loading } = useReferralDashboard(lookupEmail)
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

  // My Message
  const [myMessage, setMyMessage] = useState('')
  const [editingMessage, setEditingMessage] = useState(false)
  const [messageSaving, setMessageSaving] = useState(false)
  const [messageSaved, setMessageSaved] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [messageCopied, setMessageCopied] = useState(false)

  // Warm intro
  const [activeTab, setActiveTab] = useState<'message' | 'share' | 'intro'>('message')
  const inShell = useInShell()
  // In the app shell the inner tabs are small pills; otherwise underlined tabs.
  const innerTabClass = (active: boolean) =>
    inShell
      ? `shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
          active ? 'border-[#39FF14] bg-[rgba(57,255,20,0.14)] text-[#39FF14]' : 'border-white/15 text-white/75 hover:text-white'
        }`
      : `px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
          active ? 'border-[#39FF14] text-[#39FF14]' : 'border-transparent text-neutral-400 hover:text-white'
        }`
  const [introName, setIntroName] = useState('')
  const [introEmail, setIntroEmail] = useState('')
  const [introInterest, setIntroInterest] = useState(INTEREST_OPTIONS[0])
  const [introStep, setIntroStep] = useState<1 | 2>(1)
  const [introCopied, setIntroCopied] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const refreshDashboard = () => queryClient.invalidateQueries({ queryKey: keys.referralDashboard })

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
      setLookupEmail(email.trim().toLowerCase())
      await refreshDashboard()
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
    const text = encodeURIComponent('I have been using Vibration Fit to create and live my life vision. Thought you would love it.')

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
      await refreshDashboard()
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
      await refreshDashboard()
    } catch {
      setSendError('Something went wrong')
    } finally {
      setSendLoading(false)
    }
  }

  const defaultMessage = dashboard
    ? `Hey! I've been using Vibration Fit and thought you'd love it. You write a clear vision for your life across 12 areas, turn it into audios you listen to morning and night, build a vision board, and follow a simple daily plan that keeps you aligned with it. VIVA guides you through all of it. Check it out here: ${dashboard.referralLink}`
    : ''

  const activeMessage = myMessage || defaultMessage

  useEffect(() => {
    if (dashboard?.participant.custom_message) {
      setMyMessage(dashboard.participant.custom_message)
    }
  }, [dashboard?.participant.custom_message])

  const handleSaveMessage = async () => {
    setMessageSaving(true)
    setMessageError(null)
    setMessageSaved(false)

    try {
      const res = await fetch('/api/referral/message', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customMessage: myMessage.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessageError(data.error || 'Failed to save')
        return
      }
      setMessageSaved(true)
      setEditingMessage(false)
      await refreshDashboard()
      setTimeout(() => setMessageSaved(false), 3000)
    } catch {
      setMessageError('Something went wrong')
    } finally {
      setMessageSaving(false)
    }
  }

  const copyMyMessage = async () => {
    await navigator.clipboard.writeText(activeMessage)
    setMessageCopied(true)
    setTimeout(() => setMessageCopied(false), 2000)
  }

  const shareMessageVia = (platform: 'sms' | 'email' | 'dm') => {
    const encoded = encodeURIComponent(activeMessage)

    if (platform === 'sms') {
      window.open(`sms:?body=${encoded}`, '_blank')
    } else if (platform === 'email') {
      const subject = encodeURIComponent('Something I thought you might love')
      window.open(`mailto:?subject=${subject}&body=${encoded}`, '_blank')
    } else {
      copyMyMessage()
    }
  }

  const handleResetMessage = () => {
    setMyMessage('')
    setEditingMessage(true)
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
  if (!dashboard) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <Card className="p-4 md:p-6 lg:p-8 max-w-lg mx-auto w-full">
            <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
              Become a Referral Partner
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
        </Stack>
      </Container>
    )
  }

  const { participant, stats, partners } = dashboard

  return (
    <Container size="xl">
      <Stack gap="lg">
        {partners ? <EarningNotice partners={partners} /> : null}
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
          <div className="mt-4 space-y-1">
            <div className="flex flex-row flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xs text-neutral-500 inline-flex items-center gap-1 min-w-0">
                <span className="shrink-0">Code:</span>
                <span className="text-neutral-300 font-mono truncate">{participant.referral_code}</span>
              </span>
              {!editingCode ? (
                <button
                  type="button"
                  onClick={() => { setEditingCode(true); setNewCode(participant.referral_code) }}
                  className="text-xs text-[#00FFFF] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <Edit3 className="w-3 h-3 shrink-0" /> Customize
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm text-white w-40 font-mono min-w-0"
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
            </div>
            {codeError && <p className="text-[#FF0040] text-xs w-full">{codeError}</p>}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 md:gap-6 w-full">
            <StatBox label="Active referrals" value={partners ? partners.activeReferrals : stats.paidConversions} />
            <StatBox label="Signups" value={stats.emailSignups} />
            <StatBox label="Clicks" value={stats.totalClicks} />
          </div>
          <p className="text-xs text-neutral-500 mt-3 leading-relaxed">
            Active referrals are people who joined through your link and hold a paid membership right now. Signups left their email after clicking. Clicks are visits to your link.
          </p>
        </Card>

        {/* My Message / Share / Warm Intro */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className={inShell ? 'mb-5 flex gap-2 overflow-x-auto [scrollbar-width:none]' : 'flex gap-1 mb-6 border-b border-[#333] overflow-x-auto'}>
            <button
              onClick={() => setActiveTab('message')}
              className={innerTabClass(activeTab === 'message')}
            >
              <Pen className="w-4 h-4 inline mr-1.5" />
              My Message
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={innerTabClass(activeTab === 'share')}
            >
              <Share2 className="w-4 h-4 inline mr-1.5" />
              Quick Share
            </button>
            <button
              onClick={() => setActiveTab('intro')}
              className={innerTabClass(activeTab === 'intro')}
            >
              <Send className="w-4 h-4 inline mr-1.5" />
              Warm Intro
            </button>
          </div>

          {activeTab === 'message' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-neutral-400">
                    {editingMessage
                      ? 'Edit your personal referral message below'
                      : 'Your saved message to send directly to friends'}
                  </p>
                  {!editingMessage && (
                    <button
                      onClick={() => setEditingMessage(true)}
                      className="text-xs text-[#00FFFF] hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>

                {editingMessage ? (
                  <div className="space-y-3">
                    <textarea
                      value={myMessage || defaultMessage}
                      onChange={(e) => setMyMessage(e.target.value)}
                      rows={6}
                      maxLength={2000}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white focus:border-[#39FF14] focus:outline-none resize-y"
                      placeholder="Write your personal referral message..."
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap sm:gap-0">
                      <span className="text-xs text-neutral-500">
                        {(myMessage || defaultMessage).length}/2000
                      </span>
                      <div className="flex flex-wrap justify-end gap-2 sm:flex-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setMyMessage(dashboard?.participant.custom_message || '')
                          setEditingMessage(false)
                          setMessageError(null)
                        }}>
                          Cancel
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleResetMessage}>
                          Reset to Default
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSaveMessage} disabled={messageSaving}>
                          {messageSaving ? <Spinner size="sm" /> : <><Save className="w-4 h-4 mr-1" /> Save</>}
                        </Button>
                      </div>
                    </div>
                    {messageError && <p className="text-[#FF0040] text-sm">{messageError}</p>}
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-sm text-neutral-300 whitespace-pre-wrap">
                    {activeMessage}
                  </div>
                )}

                {messageSaved && (
                  <div className="flex items-center gap-2 text-[#39FF14] text-sm">
                    <Check className="w-4 h-4" /> Message saved
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-neutral-500 mb-3">Send your message directly to a friend</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm" onClick={() => shareMessageVia('sms')} className="flex-1">
                    <Smartphone className="w-4 h-4 mr-1.5" /> Text
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => shareMessageVia('email')} className="flex-1">
                    <Mail className="w-4 h-4 mr-1.5" /> Email
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => shareMessageVia('dm')} className="flex-1">
                    {messageCopied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                    {messageCopied ? 'Copied' : 'Copy for DM'}
                  </Button>
                </div>
              </div>
            </div>
          )}

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
      </Stack>
    </Container>
  )
}
