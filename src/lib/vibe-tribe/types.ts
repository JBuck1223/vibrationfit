// Vibe Tribe Types

export type VibeTag = 'win' | 'wobble' | 'vision' | 'collaboration'

export type VibeMediaType = 'none' | 'image' | 'video' | 'mixed'

export interface VibePost {
  id: string
  user_id: string
  content: string | null
  media_urls: string[]
  media_type: VibeMediaType
  vibe_tag: VibeTag
  life_categories: string[] // Optional life vision categories
  hearts_count: number
  comments_count: number
  is_deleted: boolean
  deleted_at: string | null
  deleted_by: string | null
  created_at: string
  updated_at: string
  // Joined data
  user?: {
    id: string
    full_name: string | null
    profile_picture_url: string | null
  }
  has_hearted?: boolean
}

export interface VibeComment {
  id: string
  post_id: string
  user_id: string
  content: string
  hearts_count: number
  is_deleted: boolean
  deleted_at: string | null
  deleted_by: string | null
  created_at: string
  // Joined data
  user?: {
    id: string
    full_name: string | null
    profile_picture_url: string | null
  }
  has_hearted?: boolean
}

export interface VibeHeart {
  id: string
  user_id: string
  post_id: string | null
  comment_id: string | null
  created_at: string
}

export interface UserCommunityStats {
  id: string
  user_id: string
  total_posts: number
  total_comments: number
  hearts_given: number
  hearts_received: number
  streak_days: number
  last_post_date: string | null
  longest_streak: number
  created_at: string
  updated_at: string
}

export interface VibeUserMiniProfile {
  id: string
  full_name: string | null
  profile_picture_url: string | null
  created_at: string
  community_stats: UserCommunityStats | null
}

// API Request/Response types
export interface CreatePostRequest {
  content?: string
  media_urls?: string[]
  vibe_tag: VibeTag
}

export interface CreateCommentRequest {
  post_id: string
  content: string
}

export interface PostsListResponse {
  posts: VibePost[]
  hasMore: boolean
  total: number
}

export interface ActivityItem {
  id: string
  type: 'post' | 'comment' | 'heart_received' | 'heart_given'
  title: string
  description: string
  timestamp: string
  post_id?: string
  comment_id?: string
  vibe_tag?: VibeTag
}

// Vibe Tag Metadata
export const VIBE_TAG_CONFIG: Record<VibeTag, {
  label: string
  displayName: string
  description: string
  icon: string
  color: string
  bgColor: string
  route: string
}> = {
  win: {
    label: 'Win',
    displayName: 'Wins & Synchronicities',
    description: 'Celebrate victories, share meaningful coincidences',
    icon: 'Trophy',
    color: '#39FF14', // Primary green
    bgColor: 'rgba(57, 255, 20, 0.1)',
    route: '/vibe-tribe/wins',
  },
  wobble: {
    label: 'Wobble',
    displayName: 'Wobbles & Support',
    description: 'Ask for help, share challenges',
    icon: 'HandHeart',
    color: '#00FFFF', // Secondary cyan/teal
    bgColor: 'rgba(0, 255, 255, 0.1)',
    route: '/vibe-tribe/wobbles',
  },
  vision: {
    label: 'Vision',
    displayName: 'Visions & Intentions',
    description: 'Share goals, declare intentions',
    icon: 'Sparkles',
    color: '#BF00FF', // Accent purple
    bgColor: 'rgba(191, 0, 255, 0.1)',
    route: '/vibe-tribe/visions',
  },
  collaboration: {
    label: 'Collaboration',
    displayName: 'Collaboration Lab',
    description: 'Share tips, hacks, practices',
    icon: 'Lightbulb',
    color: '#FFFF00', // Energy yellow
    bgColor: 'rgba(255, 255, 0, 0.1)',
    route: '/vibe-tribe/collaboration',
  },
}

// Helper to get all vibe tags
export const VIBE_TAGS: VibeTag[] = ['win', 'wobble', 'vision', 'collaboration']
