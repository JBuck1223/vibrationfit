// /src/app/dashboard/activity/page.tsx
// Real-time activity feed showing all user actions

'use client'

import { useState, useEffect } from 'react'
import { PageLayout, Container, Card, Badge, Button } from '@/lib/design-system/components'
import { 
  Activity, 
  Target, 
  BookOpen, 
  Image as ImageIcon, 
  User, 
  Zap,
  Music,
  Sparkles,
  MessageSquare,
  CheckCircle,
  Edit,
  Upload,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  icon: string // Icon name as string
  color: string
  link?: string
  metadata?: any
}

// Map icon names to components
const ICON_MAP: Record<string, any> = {
  Target,
  BookOpen,
  ImageIcon,
  User,
  Zap,
  Music,
  Sparkles,
  MessageSquare,
  CheckCircle,
  Edit,
  Upload,
  Activity,
}

export default function ActivityFeedPage() {
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activity/feed')
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity')
      }

      const data = await response.json()
      setActivities(data.activities || [])

    } catch (error) {
      console.error('Error fetching activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter)

  const activityTypes = [
    { value: 'all', label: 'All Activity', count: activities.length },
    { value: 'vision', label: 'Life Vision', count: activities.filter(a => a.type === 'vision').length },
    { value: 'journal', label: 'Journal', count: activities.filter(a => a.type === 'journal').length },
    { value: 'profile', label: 'Profile', count: activities.filter(a => a.type === 'profile').length },
    { value: 'assessment', label: 'Assessment', count: activities.filter(a => a.type === 'assessment').length },
    { value: 'viva', label: 'VIVA', count: activities.filter(a => a.type === 'viva').length },
    { value: 'storage', label: 'Uploads', count: activities.filter(a => a.type === 'storage').length },
  ]

  return (
    <PageLayout>
      <Container size="xl" className="py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-primary-500" />
            <h1 className="text-4xl font-bold text-white">My Activity Feed</h1>
          </div>
          <p className="text-neutral-400">
            Your transformation journey in real-time
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-neutral-400 mt-4">Loading your activity...</p>
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
              {activityTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilter(type.value)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    filter === type.value
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  {type.label}
                  {type.count > 0 && (
                    <span className="ml-2 text-xs opacity-75">({type.count})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Activity Timeline */}
            {filteredActivities.length === 0 ? (
              <Card className="p-12 text-center">
                <Activity className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-400">No activity yet</p>
                <p className="text-sm text-neutral-500 mt-2">
                  Start creating to see your journey unfold!
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity) => {
                  const IconComponent = ICON_MAP[activity.icon] || Activity
                  
                  // Check if this is a media file and get thumbnail
                  const fileUrl = activity.metadata?.fileUrl
                  const fileName = activity.metadata?.fileName || activity.description
                  const fileType = fileName?.split('.').pop()?.toLowerCase() || ''
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)
                  const isVideo = ['mp4', 'mov', 'webm'].includes(fileType)
                  const isAudio = ['mp3', 'wav', 'ogg'].includes(fileType)
                  const hasMedia = (isImage || isVideo || isAudio) && fileUrl
                  
                  const content = (
                    <Card className="p-5 pt-6 hover:border-neutral-700 transition-all cursor-pointer group">
                      <div className="flex items-start gap-4">
                        {/* Thumbnail or Icon */}
                        {hasMedia ? (
                          <div className="flex-shrink-0">
                            {isImage && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-neutral-800">
                                <img
                                  src={fileUrl}
                                  alt={fileName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            {isVideo && (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-neutral-800">
                                <video
                                  src={fileUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                                    <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-black border-b-4 border-b-transparent ml-1" />
                                  </div>
                                </div>
                              </div>
                            )}
                            {isAudio && (
                              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-neutral-800 flex items-center justify-center">
                                <Music className="w-8 h-8 text-primary-500" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex-shrink-0">
                            <div className={`p-3 rounded-xl bg-neutral-900 group-hover:scale-110 transition-transform`} style={{ backgroundColor: `${activity.color.replace('text-', 'rgb(var(--')}/20` }}>
                              <IconComponent className={`w-5 h-5 ${activity.color}`} />
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-base font-semibold text-white">
                              {activity.title}
                            </h3>
                            <Badge variant="ghost" className="text-xs">
                              {activity.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-400 mb-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <Clock className="w-3 h-3" />
                            {new Date(activity.timestamp).toLocaleString()}
                          </div>
                        </div>

                        {/* Actions & Metadata */}
                        <div className="flex-shrink-0 text-right">
                          {/* Visit Button for clickable items */}
                          {activity.link && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-2"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                window.open(activity.link, '_blank')
                              }}
                            >
                              Visit
                            </Button>
                          )}
                          
                          {/* Metadata */}
                          {activity.metadata && (
                            <div>
                              {activity.metadata.size && (
                                <p className="text-xs text-neutral-500">
                                  {activity.metadata.size}
                                </p>
                              )}
                              {activity.metadata.tokensUsed && (
                                <p className="text-xs text-energy-500">
                                  {activity.metadata.tokensUsed} tokens
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )

                  // Wrap in link if available
                  return activity.link ? (
                    <Link key={activity.id} href={activity.link}>
                      {content}
                    </Link>
                  ) : (
                    <div key={activity.id}>{content}</div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </Container>
    </PageLayout>
  )
}

