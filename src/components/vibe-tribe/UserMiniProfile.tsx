'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Button, Spinner } from '@/lib/design-system'
import { Heart, FileText, Flame, Calendar, ExternalLink } from 'lucide-react'
import { VibeUserMiniProfile } from '@/lib/vibe-tribe/types'
import { formatDistanceToNow } from 'date-fns'

interface UserMiniProfileProps {
  userId: string
  trigger: React.ReactNode
}

export function UserMiniProfile({ userId, trigger }: UserMiniProfileProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<VibeUserMiniProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && !profile) {
      fetchProfile()
    }
  }, [isOpen, userId])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/vibe-tribe/user/${userId}/profile`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-block">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Popover */}
          <div className="absolute left-0 top-full mt-2 z-50 min-w-[280px]">
            <Card className="p-4 shadow-xl border border-neutral-700">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : profile ? (
                <div>
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0">
                      {profile.profile_picture_url ? (
                        <img
                          src={profile.profile_picture_url}
                          alt={profile.full_name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xl font-medium">
                          {profile.full_name?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-lg truncate">
                        {profile.full_name || 'Anonymous'}
                      </h3>
                      <p className="text-sm text-neutral-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Member since {formatDistanceToNow(new Date(profile.created_at), { addSuffix: false })}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  {profile.community_stats && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-neutral-800 rounded-lg p-3 text-center">
                        <FileText className="w-4 h-4 text-[#39FF14] mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">
                          {profile.community_stats.total_posts}
                        </p>
                        <p className="text-xs text-neutral-400">Posts</p>
                      </div>
                      <div className="bg-neutral-800 rounded-lg p-3 text-center">
                        <Heart className="w-4 h-4 text-[#00FFFF] mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">
                          {profile.community_stats.hearts_received}
                        </p>
                        <p className="text-xs text-neutral-400">Hearts</p>
                      </div>
                      <div className="bg-neutral-800 rounded-lg p-3 text-center">
                        <Flame className="w-4 h-4 text-[#FFFF00] mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">
                          {profile.community_stats.streak_days}
                        </p>
                        <p className="text-xs text-neutral-400">Streak</p>
                      </div>
                    </div>
                  )}

                  {/* View Profile Link */}
                  <Button asChild variant="ghost" size="sm" className="w-full">
                    <Link href={`/snapshot/${userId}`}>
                      View Snapshot
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-neutral-400 text-center py-4">
                  Unable to load profile
                </p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
