'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Input, Stack, PageHero, Spinner } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { BadgeWithProgress as BadgeWithProgressComponent } from '@/components/badges'
import {
  BadgeType,
  BadgeCategory,
  BADGE_DEFINITIONS,
  BADGE_CATEGORY_INFO,
  BADGE_CATEGORY_COLORS,
  getAllBadgeTypes,
  getBadgesByCategory,
  BadgeWithProgress,
} from '@/lib/badges/types'
import { Search, Award, Users, Gift, Trash2, ChevronDown, ChevronUp, Target, Flame, Sparkles, Info } from 'lucide-react'

// Helper to format requirement text
function getRequirementText(definition: typeof BADGE_DEFINITIONS[keyof typeof BADGE_DEFINITIONS]): string {
  if (definition.threshold) {
    return `${definition.threshold} required`
  }
  if (definition.streakDays) {
    return `${definition.streakDays}-day streak`
  }
  if (definition.special) {
    switch (definition.special) {
      case 'checklist_72h':
        return 'Complete checklist in 72h'
      case 'challenge_28d':
        return 'Complete 28-day challenge'
      case 'full_12_vision':
        return 'All 12 vision categories'
    }
  }
  return 'Custom requirement'
}

// Helper to get requirement type icon and label
function getRequirementType(definition: typeof BADGE_DEFINITIONS[keyof typeof BADGE_DEFINITIONS]): {
  icon: typeof Target
  label: string
  color: string
} {
  if (definition.threshold) {
    return { icon: Target, label: 'Threshold', color: 'text-blue-400' }
  }
  if (definition.streakDays) {
    return { icon: Flame, label: 'Streak', color: 'text-orange-400' }
  }
  if (definition.special) {
    return { icon: Sparkles, label: 'Special', color: 'text-purple-400' }
  }
  return { icon: Target, label: 'Custom', color: 'text-neutral-400' }
}

interface UserWithBadges {
  id: string
  email: string
  full_name: string | null
  badges: string[]
}

interface BadgeStats {
  type: BadgeType
  label: string
  earnedCount: number
  users: Array<{
    id: string
    full_name: string | null
    email: string
    earned_at: string
  }>
}

function BadgesAdminContent() {
  const [loading, setLoading] = useState(true)
  const [badgeStats, setBadgeStats] = useState<BadgeStats[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<UserWithBadges[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithBadges | null>(null)
  const [expandedBadge, setExpandedBadge] = useState<BadgeType | null>(null)
  const [awardingBadge, setAwardingBadge] = useState<BadgeType | null>(null)
  const [revokingBadge, setRevokingBadge] = useState<{ userId: string; badgeType: BadgeType } | null>(null)

  useEffect(() => {
    fetchBadgeStats()
  }, [])

  const fetchBadgeStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/badges')
      if (response.ok) {
        const data = await response.json()
        setBadgeStats(data.badges || [])
      }
    } catch (error) {
      console.error('Failed to fetch badge stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/admin/badges/search?q=${encodeURIComponent(term)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error('Failed to search users:', error)
    } finally {
      setSearching(false)
    }
  }

  const awardBadge = async (userId: string, badgeType: BadgeType) => {
    try {
      const response = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, badgeType }),
      })

      if (response.ok) {
        // Refresh stats and user
        fetchBadgeStats()
        if (selectedUser) {
          setSelectedUser({
            ...selectedUser,
            badges: [...selectedUser.badges, badgeType],
          })
        }
        setAwardingBadge(null)
      }
    } catch (error) {
      console.error('Failed to award badge:', error)
    }
  }

  const revokeBadge = async (userId: string, badgeType: BadgeType) => {
    try {
      const response = await fetch('/api/admin/badges', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, badgeType }),
      })

      if (response.ok) {
        // Refresh stats
        fetchBadgeStats()
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({
            ...selectedUser,
            badges: selectedUser.badges.filter(b => b !== badgeType),
          })
        }
        setRevokingBadge(null)
      }
    } catch (error) {
      console.error('Failed to revoke badge:', error)
    }
  }

  const categories: BadgeCategory[] = ['sessions', 'connections', 'activations', 'creations']

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="ADMIN"
          title="Badge Management"
          subtitle="View, award, and revoke user badges"
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(category => {
            const categoryBadges = badgeStats.filter(
              b => BADGE_DEFINITIONS[b.type]?.category === category
            )
            const totalEarned = categoryBadges.reduce((sum, b) => sum + b.earnedCount, 0)
            const info = BADGE_CATEGORY_INFO[category]
            const colors = BADGE_CATEGORY_COLORS[category]

            return (
              <Card key={category} className={`p-4 ${colors.bg} border ${colors.border}`}>
                <h3 className="text-sm font-medium text-neutral-400">{info.label}</h3>
                <p className="text-2xl font-bold text-white">{totalEarned}</p>
                <p className="text-xs text-neutral-500">badges earned</p>
              </Card>
            )
          })}
        </div>

        {/* User Search Section */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-400" />
            Award Badge to User
          </h2>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                searchUsers(e.target.value)
              }}
              placeholder="Search by name or email..."
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {searching ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map(user => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedUser?.id === user.id
                      ? 'bg-primary-500/20 border border-primary-500/50'
                      : 'bg-neutral-800 hover:bg-neutral-700'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {user.full_name || 'No name'}
                      </p>
                      <p className="text-xs text-neutral-400">{user.email}</p>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {user.badges.length} badges
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <p className="text-sm text-neutral-500 text-center py-4">No users found</p>
          ) : null}

          {/* Selected User Badges */}
          {selectedUser && (
            <div className="mt-6 pt-6 border-t border-neutral-700">
              <h3 className="text-sm font-semibold text-white mb-4">
                {selectedUser.full_name || selectedUser.email}&apos;s Badges
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {getAllBadgeTypes().map(badgeType => {
                  const definition = BADGE_DEFINITIONS[badgeType]
                  const hasBadge = selectedUser.badges.includes(badgeType)
                  const colors = BADGE_CATEGORY_COLORS[definition.category]

                  return (
                    <div
                      key={badgeType}
                      className={`
                        p-3 rounded-lg text-center transition-all
                        ${hasBadge ? colors.bg : 'bg-neutral-800'}
                        ${hasBadge ? `border ${colors.border}` : 'border border-neutral-700'}
                      `}
                    >
                      <div className="mb-2">
                        <definition.icon
                          className={`w-6 h-6 mx-auto ${hasBadge ? '' : 'opacity-30'}`}
                          style={{ color: hasBadge ? colors.primary : '#666' }}
                        />
                      </div>
                      <p className={`text-xs font-medium mb-2 ${hasBadge ? 'text-white' : 'text-neutral-500'}`}>
                        {definition.label}
                      </p>
                      {hasBadge ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRevokingBadge({ userId: selectedUser.id, badgeType })}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Revoke
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => awardBadge(selectedUser.id, badgeType)}
                          className="text-xs"
                        >
                          <Gift className="w-3 h-3 mr-1" />
                          Award
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        {/* All Badges Overview with Requirements */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            All Badges &amp; Requirements
          </h2>

          {/* Requirements Legend */}
          <div className="flex flex-wrap gap-4 mb-6 p-3 bg-neutral-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-neutral-400">Threshold = Reach count</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-neutral-400">Streak = Daily consistency</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-neutral-400">Special = Custom criteria</span>
            </div>
          </div>

          {categories.map(category => {
            const categoryBadges = getBadgesByCategory(category)
            const info = BADGE_CATEGORY_INFO[category]
            const colors = BADGE_CATEGORY_COLORS[category]

            return (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  />
                  {info.label}
                  <span className="text-xs text-neutral-500 font-normal">
                    ({info.description})
                  </span>
                </h3>

                <div className="space-y-2">
                  {categoryBadges.map(definition => {
                    const stats = badgeStats.find(s => s.type === definition.type)
                    const isExpanded = expandedBadge === definition.type
                    const reqType = getRequirementType(definition)
                    const ReqIcon = reqType.icon

                    return (
                      <div
                        key={definition.type}
                        className={`rounded-lg border ${colors.border} overflow-hidden`}
                      >
                        <div
                          onClick={() => setExpandedBadge(isExpanded ? null : definition.type)}
                          className={`
                            flex items-center justify-between p-3 cursor-pointer
                            ${colors.bg} hover:opacity-90 transition-opacity
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <definition.icon
                              className="w-5 h-5"
                              style={{ color: colors.primary }}
                            />
                            <div>
                              <p className="text-sm font-medium text-white">
                                {definition.label}
                              </p>
                              <p className="text-xs text-neutral-400">
                                {definition.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Requirement badge */}
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-neutral-800/70 ${reqType.color}`}>
                              <ReqIcon className="w-3 h-3" />
                              <span className="text-xs font-medium">{getRequirementText(definition)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-white font-semibold">
                                {stats?.earnedCount || 0}
                              </span>
                              <span className="text-xs text-neutral-500">earned</span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-neutral-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-neutral-400" />
                            )}
                          </div>
                        </div>

                        {/* Expanded section with details and users */}
                        {isExpanded && (
                          <div className="bg-neutral-900 border-t border-neutral-800">
                            {/* Badge Details */}
                            <div className="p-4 border-b border-neutral-800">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Info className="w-3.5 h-3.5" />
                                    Badge Requirements
                                  </h4>
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    <div>
                                      <span className="text-neutral-500">Type:</span>
                                      <span className={`ml-2 ${reqType.color}`}>{reqType.label}</span>
                                    </div>
                                    <div>
                                      <span className="text-neutral-500">Category:</span>
                                      <span className="ml-2 text-white capitalize">{definition.category}</span>
                                    </div>
                                    {definition.threshold && (
                                      <div>
                                        <span className="text-neutral-500">Threshold:</span>
                                        <span className="ml-2 text-white">{definition.threshold}</span>
                                      </div>
                                    )}
                                    {definition.streakDays && (
                                      <div>
                                        <span className="text-neutral-500">Streak Days:</span>
                                        <span className="ml-2 text-white">{definition.streakDays}</span>
                                      </div>
                                    )}
                                    {definition.special && (
                                      <div>
                                        <span className="text-neutral-500">Special:</span>
                                        <span className="ml-2 text-purple-400">{definition.special}</span>
                                      </div>
                                    )}
                                    {definition.showInline && (
                                      <div>
                                        <span className="text-neutral-500">Show Inline:</span>
                                        <span className="ml-2 text-green-400">Yes (displays next to name)</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">
                                  <code>{definition.type}</code>
                                </div>
                              </div>
                            </div>

                            {/* Users who earned this badge */}
                            <div className="p-3">
                              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                Users Earned ({stats?.users?.length || 0})
                              </h4>
                              {stats && stats.users.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {stats.users.map(user => (
                                    <div
                                      key={user.id}
                                      className="flex items-center justify-between p-2 bg-neutral-800 rounded"
                                    >
                                      <div>
                                        <p className="text-sm text-white">
                                          {user.full_name || 'No name'}
                                        </p>
                                        <p className="text-xs text-neutral-500">{user.email}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-neutral-500">
                                          {new Date(user.earned_at).toLocaleDateString()}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setRevokingBadge({ userId: user.id, badgeType: definition.type })
                                          }}
                                          className="text-red-400 hover:text-red-300 p-1"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-neutral-500 text-center py-2">
                                  No users have earned this badge yet
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </Card>

        {/* Revoke Confirmation Modal */}
        {revokingBadge && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-2">Revoke Badge?</h3>
              <p className="text-sm text-neutral-400 mb-4">
                Are you sure you want to revoke the{' '}
                <span className="text-white font-medium">
                  {BADGE_DEFINITIONS[revokingBadge.badgeType].label}
                </span>{' '}
                badge? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setRevokingBadge(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => revokeBadge(revokingBadge.userId, revokingBadge.badgeType)}
                  className="flex-1"
                >
                  Revoke Badge
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Stack>
    </Container>
  )
}

export default function BadgesAdminPage() {
  return (
    <AdminWrapper>
      <BadgesAdminContent />
    </AdminWrapper>
  )
}
