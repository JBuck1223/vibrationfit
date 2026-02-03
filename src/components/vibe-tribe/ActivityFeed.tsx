'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Button, Spinner } from '@/lib/design-system'
import { Heart, MessageCircle, FileText, Bell } from 'lucide-react'
import { ActivityItem, VIBE_TAG_CONFIG } from '@/lib/vibe-tribe/types'
import { VibeTagBadge } from './VibeTagBadge'
import { formatDistanceToNow } from 'date-fns'

interface ActivityFeedProps {
  className?: string
}

type ActivityFilter = 'all' | 'posts' | 'hearts_received' | 'comments'

const FILTER_OPTIONS: { key: ActivityFilter; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'all', label: 'All', icon: Bell },
  { key: 'posts', label: 'My Posts', icon: FileText },
  { key: 'hearts_received', label: 'Hearts', icon: Heart },
  { key: 'comments', label: 'Comments', icon: MessageCircle },
]

export function ActivityFeed({ className = '' }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ActivityFilter>('all')

  useEffect(() => {
    fetchActivities()
  }, [filter])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/vibe-tribe/activity?filter=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <FileText className="w-4 h-4" />
      case 'comment':
        return <MessageCircle className="w-4 h-4" />
      case 'heart_received':
      case 'heart_given':
        return <Heart className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'post':
        return '#39FF14' // Green
      case 'comment':
        return '#00FFFF' // Cyan
      case 'heart_received':
      case 'heart_given':
        return '#BF00FF' // Purple
      default:
        return '#FFFF00' // Yellow
    }
  }

  return (
    <div className={className}>
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {FILTER_OPTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
              transition-all duration-200 text-sm font-medium
              ${filter === key
                ? 'bg-[#39FF14] text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity.id} className="p-4 hover:border-neutral-600 transition-all">
              <Link 
                href={activity.post_id ? `/vibe-tribe/posts/${activity.post_id}` : '#'}
                className="flex items-start gap-3"
              >
                {/* Icon */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: `${getActivityColor(activity.type)}20`,
                    color: getActivityColor(activity.type),
                  }}
                >
                  {getActivityIcon(activity.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-medium text-white">
                      {activity.title}
                    </p>
                    {activity.vibe_tag && (
                      <VibeTagBadge tag={activity.vibe_tag} size="sm" showLabel={false} />
                    )}
                  </div>
                  <p className="text-sm text-neutral-400 line-clamp-2">
                    {activity.description}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
            <Bell className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No activity yet
          </h3>
          <p className="text-neutral-400 max-w-md mx-auto">
            {filter === 'all' 
              ? 'Start posting and engaging with the community to see your activity here.'
              : `No ${filter.replace('_', ' ')} activity to show.`
            }
          </p>
        </Card>
      )}
    </div>
  )
}
