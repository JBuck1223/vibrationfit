'use client'

import { useEffect, useState, useCallback } from 'react'
import { Container, Card, Button, Badge, Spinner, Stack } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  Users, Share2, MousePointerClick, UserPlus, DollarSign,
  RefreshCw, ArrowLeft, Trophy, Gift, ChevronDown, ChevronUp,
  Send, Eye, Clock, TrendingUp,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Participant {
  id: string
  email: string
  referral_code: string
  display_name: string | null
  total_clicks: number
  email_signups: number
  paid_conversions: number
  second_degree_signups: number
  is_active: boolean
  created_at: string
  custom_message: string | null
}

interface Invite {
  id: string
  referred_email: string
  referred_name: string | null
  personalization: string | null
  status: string
  sent_at: string
  opened_at: string | null
  clicked_at: string | null
  converted_at: string | null
  participant: { display_name: string | null; email: string; referral_code: string } | null
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
  is_active: boolean
}

interface RewardEarned {
  id: string
  is_claimed: boolean
  claimed_at: string | null
  created_at: string
  participant: { display_name: string | null; email: string } | null
  tier: { tier_name: string } | null
}

interface ReferralEvent {
  id: string
  event_type: string
  referred_email: string | null
  created_at: string
  referrer: { display_name: string | null; email: string; referral_code: string } | null
}

interface DashboardData {
  stats: {
    totalParticipants: number
    activeParticipants: number
    totalClicks: number
    totalSignups: number
    totalConversions: number
  }
  participants: Participant[]
  invites: Invite[]
  tiers: Tier[]
  rewardsEarned: RewardEarned[]
  recentEvents: ReferralEvent[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function shortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const statusColors: Record<string, string> = {
  sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  opened: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  clicked: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  converted: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
}

const eventTypeLabels: Record<string, { label: string; color: string }> = {
  click: { label: 'Click', color: 'text-cyan-400' },
  signup: { label: 'Signup', color: 'text-yellow-400' },
  conversion: { label: 'Conversion', color: 'text-green-400' },
  page_view: { label: 'Page View', color: 'text-neutral-400' },
}

export default function AdminReferralsPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'participants' | 'invites' | 'events' | 'tiers'>('participants')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/referrals')
      if (!res.ok) throw new Error('Failed to fetch referral data')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const stats = data?.stats

  return (
    <AdminWrapper>
      <Container size="xl" className="py-8">
        <Stack gap="lg">
          {/* Header */}
          <div>
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Share2 className="w-7 h-7 text-primary-500" />
                  Referral Program
                </h1>
                <p className="text-neutral-400 mt-1">
                  Track referral performance, participants, and rewards
                </p>
              </div>
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="p-4 text-center">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalParticipants}</div>
                <div className="text-xs text-neutral-400 mt-1">Participants</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-cyan-400">{stats.activeParticipants}</div>
                <div className="text-xs text-neutral-400 mt-1">Active</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                  <MousePointerClick className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-blue-400">{stats.totalClicks}</div>
                <div className="text-xs text-neutral-400 mt-1">Total Clicks</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-2">
                  <UserPlus className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-yellow-400">{stats.totalSignups}</div>
                <div className="text-xs text-neutral-400 mt-1">Signups</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-400">{stats.totalConversions}</div>
                <div className="text-xs text-neutral-400 mt-1">Conversions</div>
              </Card>
            </div>
          )}

          {/* Error */}
          {error && (
            <Card className="p-4 border-red-500/30 bg-red-500/10">
              <p className="text-red-400 text-sm">{error}</p>
            </Card>
          )}

          {/* Loading */}
          {loading && !data && (
            <div className="flex justify-center py-12">
              <Spinner variant="primary" size="lg" />
            </div>
          )}

          {/* Tabs */}
          {data && (
            <>
              <div className="flex gap-1 border-b border-[#333] overflow-x-auto">
                {([
                  { key: 'participants' as const, label: 'Participants', icon: Users, count: data.participants.length },
                  { key: 'invites' as const, label: 'Invites Sent', icon: Send, count: data.invites.length },
                  { key: 'events' as const, label: 'Recent Events', icon: Eye, count: data.recentEvents.length },
                  { key: 'tiers' as const, label: 'Reward Tiers', icon: Trophy, count: data.tiers.length },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                      activeTab === tab.key
                        ? 'border-[#39FF14] text-[#39FF14]'
                        : 'border-transparent text-neutral-400 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'bg-neutral-800 text-neutral-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Participants Tab */}
              {activeTab === 'participants' && (
                <div className="space-y-3">
                  {data.participants.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-neutral-400">No participants enrolled yet</p>
                    </Card>
                  ) : (
                    data.participants.map(p => {
                      const isExpanded = expandedParticipant === p.id
                      const hasActivity = (p.total_clicks || 0) > 0

                      return (
                        <Card key={p.id} className="overflow-hidden">
                          <button
                            onClick={() => setExpandedParticipant(isExpanded ? null : p.id)}
                            className="w-full p-4 flex items-center gap-4 text-left hover:bg-neutral-800/50 transition-colors"
                          >
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              hasActivity ? 'bg-green-500/20' : 'bg-neutral-500/20'
                            }`}>
                              <Users className={`w-5 h-5 ${hasActivity ? 'text-green-400' : 'text-neutral-500'}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium truncate">
                                  {p.display_name || p.email.split('@')[0]}
                                </span>
                                <span className="text-xs font-mono text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">
                                  {p.referral_code}
                                </span>
                                {p.paid_conversions > 0 && (
                                  <Badge variant="success">{p.paid_conversions} conversion{p.paid_conversions !== 1 ? 's' : ''}</Badge>
                                )}
                              </div>
                              <div className="text-xs text-neutral-500 mt-1">{p.email}</div>
                            </div>

                            <div className="hidden sm:flex items-center gap-4 text-xs text-neutral-400">
                              <div className="text-center">
                                <div className="text-sm font-semibold text-blue-400">{p.total_clicks}</div>
                                <div>clicks</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-semibold text-yellow-400">{p.email_signups}</div>
                                <div>signups</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-semibold text-green-400">{p.paid_conversions}</div>
                                <div>paid</div>
                              </div>
                            </div>

                            <div className="flex-shrink-0 text-neutral-500">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-neutral-800 p-4 bg-neutral-900/50 space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-neutral-500 text-xs block mb-1">Total Clicks</span>
                                  <span className="text-blue-400 font-semibold">{p.total_clicks}</span>
                                </div>
                                <div>
                                  <span className="text-neutral-500 text-xs block mb-1">Email Signups</span>
                                  <span className="text-yellow-400 font-semibold">{p.email_signups}</span>
                                </div>
                                <div>
                                  <span className="text-neutral-500 text-xs block mb-1">Paid Conversions</span>
                                  <span className="text-green-400 font-semibold">{p.paid_conversions}</span>
                                </div>
                                <div>
                                  <span className="text-neutral-500 text-xs block mb-1">2nd Degree Signups</span>
                                  <span className="text-purple-400 font-semibold">{p.second_degree_signups}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div>
                                  <span className="text-neutral-500 text-xs block mb-1">Enrolled</span>
                                  <span className="text-neutral-300">{formatDate(p.created_at)}</span>
                                </div>
                                <div>
                                  <span className="text-neutral-500 text-xs block mb-1">Status</span>
                                  <Badge variant={p.is_active ? 'success' : 'neutral'}>
                                    {p.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                {p.custom_message && (
                                  <div className="col-span-2 md:col-span-1">
                                    <span className="text-neutral-500 text-xs block mb-1">Custom Message</span>
                                    <span className="text-neutral-300 text-xs line-clamp-2">{p.custom_message}</span>
                                  </div>
                                )}
                              </div>

                              {/* Invites from this participant */}
                              {(() => {
                                const participantInvites = data.invites.filter(
                                  i => i.participant?.email === p.email
                                )
                                if (participantInvites.length === 0) return null
                                return (
                                  <div>
                                    <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                                      Invites Sent ({participantInvites.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {participantInvites.map(invite => (
                                        <div key={invite.id} className="bg-neutral-800 rounded-lg px-3 py-2 flex items-center justify-between text-sm">
                                          <div>
                                            <span className="text-neutral-200">{invite.referred_name || invite.referred_email}</span>
                                            {invite.referred_name && (
                                              <span className="text-neutral-500 text-xs ml-2">{invite.referred_email}</span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-neutral-500">{shortDate(invite.sent_at)}</span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[invite.status] || statusColors.pending}`}>
                                              {invite.status}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          )}
                        </Card>
                      )
                    })
                  )}
                </div>
              )}

              {/* Invites Tab */}
              {activeTab === 'invites' && (
                <Card className="overflow-hidden">
                  {data.invites.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-neutral-400">No invites sent yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-800">
                      {data.invites.map(invite => (
                        <div key={invite.id} className="p-4 flex items-center gap-4 hover:bg-neutral-800/30 transition-colors">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Send className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-medium">
                                {invite.referred_name || invite.referred_email}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[invite.status] || statusColors.pending}`}>
                                {invite.status}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              Referred by {invite.participant?.display_name || invite.participant?.email || 'unknown'}
                              {invite.personalization && (
                                <span className="text-neutral-600 ml-2">({invite.personalization})</span>
                              )}
                            </div>
                          </div>
                          <div className="hidden sm:flex flex-col items-end gap-1 text-xs text-neutral-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(invite.sent_at)}
                            </div>
                            {invite.converted_at && (
                              <span className="text-green-400">Converted {shortDate(invite.converted_at)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <Card className="overflow-hidden">
                  {data.recentEvents.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-neutral-400">No referral events recorded yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-800">
                      {data.recentEvents.map(event => {
                        const eventMeta = eventTypeLabels[event.event_type] || { label: event.event_type, color: 'text-neutral-400' }
                        return (
                          <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-neutral-800/30 transition-colors">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                              <Eye className="w-4 h-4 text-neutral-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${eventMeta.color}`}>
                                  {eventMeta.label}
                                </span>
                                {event.referred_email && (
                                  <span className="text-xs text-neutral-400">{event.referred_email}</span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-500 mt-0.5">
                                Via {event.referrer?.display_name || event.referrer?.email || 'unknown'}
                                <span className="text-neutral-600 ml-1">({event.referrer?.referral_code})</span>
                              </div>
                            </div>
                            <div className="text-xs text-neutral-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(event.created_at)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              )}

              {/* Tiers Tab */}
              {activeTab === 'tiers' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.tiers.map(tier => (
                      <Card key={tier.id} className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Trophy className={`w-5 h-5 ${tier.is_active ? 'text-[#39FF14]' : 'text-neutral-500'}`} />
                            <h3 className="text-lg font-bold text-white">{tier.tier_name}</h3>
                          </div>
                          <Badge variant={tier.is_active ? 'success' : 'neutral'}>
                            {tier.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-400 mb-3">{tier.description}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-neutral-800 rounded-lg p-2.5">
                            <div className="text-xs text-neutral-500 mb-0.5">Min Signups</div>
                            <div className="text-white font-medium">{tier.min_email_signups}</div>
                          </div>
                          <div className="bg-neutral-800 rounded-lg p-2.5">
                            <div className="text-xs text-neutral-500 mb-0.5">Min Conversions</div>
                            <div className="text-white font-medium">{tier.min_paid_conversions}</div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-neutral-500">
                          Reward: <span className="text-neutral-300">{tier.reward_type}</span>
                          {tier.reward_value && Object.keys(tier.reward_value).length > 0 && (
                            <span className="text-neutral-400 ml-1">
                              ({Object.entries(tier.reward_value).map(([k, v]) => `${k}: ${v}`).join(', ')})
                            </span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Rewards earned section */}
                  {data.rewardsEarned.length > 0 && (
                    <Card className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Gift className="w-5 h-5 text-[#BF00FF]" />
                        <h3 className="text-lg font-bold text-white">Rewards Earned</h3>
                        <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
                          {data.rewardsEarned.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {data.rewardsEarned.map(reward => (
                          <div key={reward.id} className="bg-neutral-800 rounded-lg px-4 py-3 flex items-center justify-between">
                            <div>
                              <span className="text-sm text-white font-medium">
                                {reward.participant?.display_name || reward.participant?.email || 'Unknown'}
                              </span>
                              <span className="text-xs text-neutral-500 ml-2">
                                earned {reward.tier?.tier_name || 'Unknown Tier'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-neutral-500">{formatDate(reward.created_at)}</span>
                              <Badge variant={reward.is_claimed ? 'neutral' : 'premium'}>
                                {reward.is_claimed ? 'Claimed' : 'Available'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </Stack>
      </Container>
    </AdminWrapper>
  )
}
