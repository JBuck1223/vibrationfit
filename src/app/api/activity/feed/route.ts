// /src/app/api/activity/feed/route.ts
// Aggregates user activity from all features into a unified feed

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import {
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
} from 'lucide-react'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activities: any[] = []

    // Get Life Visions
    const { data: visions, error: visionsError } = await supabase
      .from('vision_versions')
      .select('id, is_draft, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (visionsError) {
      console.error('Error fetching visions:', visionsError)
    } else {
      console.log('Visions found:', visions?.length || 0)
    }

    visions?.forEach((vision: any) => {
      // Determine status based on flags
      const isComplete = vision.is_active && !vision.is_draft
      const isDraft = vision.is_draft
      
      activities.push({
        id: `vision-${vision.id}`,
        type: 'vision',
        title: isComplete ? 'Activated Life Vision' : isDraft ? 'Created Vision Draft' : 'Created Life Vision',
        description: isComplete ? 'Activated and finalized vision' : isDraft ? 'Started working on vision' : 'Created a new vision version',
        timestamp: isComplete ? vision.updated_at : vision.created_at,
        icon: 'Target',
        color: 'text-primary-500',
        link: `/life-vision/${vision.id}`,
      })
    })

    // Get Journal Entries
    const { data: journals } = await supabase
      .from('journal_entries')
      .select('id, title, created_at, categories, image_urls')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    journals?.forEach((entry: any) => {
      const firstImage = entry.image_urls?.[0]
      
      activities.push({
        id: `journal-${entry.id}`,
        type: 'journal',
        title: entry.title || 'Journal Entry',
        description: `Logged entry in ${entry.categories?.[0] || 'journal'}`,
        timestamp: entry.created_at,
        icon: 'BookOpen',
        color: 'text-energy-500',
        link: `/journal/${entry.id}`,
        metadata: firstImage ? {
          fileUrl: firstImage,
          fileName: firstImage.split('/').pop() || 'journal-image.jpg',
        } : undefined,
      })
    })

    // Get Profile Updates
    const { data: userProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, updated_at, created_at')
      .eq('user_id', user.id)
      .limit(1)

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
    } else {
      console.log('User profiles found:', userProfiles?.length || 0)
    }

    // Add profile creation and latest update as activities
    if (userProfiles && userProfiles.length > 0) {
      const userProfile = userProfiles[0]
      
      // Profile creation
      activities.push({
        id: `profile-created-${userProfile.id}`,
        type: 'profile',
        title: 'Created Profile',
        description: 'Set up your VibrationFit profile',
        timestamp: userProfile.created_at,
        icon: 'User',
        color: 'text-secondary-500',
        link: '/profile',
      })

      // Profile update (only if updated after creation)
      if (userProfile.updated_at && userProfile.updated_at !== userProfile.created_at) {
        activities.push({
          id: `profile-updated-${userProfile.id}`,
          type: 'profile',
          title: 'Updated Profile',
          description: 'Made changes to profile',
          timestamp: userProfile.updated_at,
          icon: 'User',
          color: 'text-secondary-500',
          link: '/profile',
        })
      }
    }

    // Get Vision Board Items
    const { data: visionBoardItems } = await supabase
      .from('vision_board_items')
      .select('id, name, status, created_at, image_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15)

    visionBoardItems?.forEach((item: any) => {
      activities.push({
        id: `vision-board-${item.id}`,
        type: 'vision-board',
        title: item.status === 'actualized' ? `Actualized: ${item.name}` : `Added to Vision Board`,
        description: item.name,
        timestamp: item.created_at,
        icon: 'ImageIcon',
        color: 'text-accent-500',
        link: `/vision-board/${item.id}`,
        metadata: item.image_url ? {
          fileUrl: item.image_url,
          fileName: `${item.name}.jpg`,
        } : undefined,
      })
    })

    // Get Assessment Results
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessment_results')
      .select('id, total_score, max_possible_score, status, completed_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (assessmentError) {
      console.error('Error fetching assessments:', assessmentError)
    } else {
      console.log('Assessments found:', assessments?.length || 0, assessments?.map(a => ({ id: a.id, status: a.status })))
    }

    assessments?.forEach((assessment: any) => {
      const percentage = Math.round((assessment.total_score / assessment.max_possible_score) * 100)
      const isCompleted = assessment.status === 'completed'
      const isInProgress = assessment.status === 'in_progress'
      
      // Show completed assessments, and in-progress ones with scores
      if (isCompleted || (isInProgress && assessment.total_score > 0)) {
        activities.push({
          id: `assessment-${assessment.id}`,
          type: 'assessment',
          title: isCompleted ? 'Completed Vibrational Assessment' : 'Assessment In Progress',
          description: `Scored ${assessment.total_score}/${assessment.max_possible_score} (${percentage}%)`,
          timestamp: assessment.completed_at || assessment.created_at,
          icon: 'CheckCircle',
          color: 'text-primary-500',
          link: '/assessment',
        })
      }
    })

    // Get Token Usage (AI usage) from token_usage table
    const { data: tokenUsage } = await supabase
      .from('token_usage')
      .select('id, action_type, tokens_used, created_at, metadata, success')
      .eq('user_id', user.id)
      .eq('success', true) // Only successful calls
      .gt('tokens_used', 0) // Only deductions (not grants)
      .neq('action_type', 'admin_grant') // Exclude admin grants
      .order('created_at', { ascending: false })
      .limit(20)

    tokenUsage?.forEach((tx: any) => {
      // Map tracking action types to display labels
      const actionLabels: Record<string, { title: string; desc: string; icon: string; color: string; link: string }> = {
        chat_conversation: { 
          title: 'VIVA Chat', 
          desc: 'Had a conversation with VIVA',
          icon: 'MessageSquare',
          color: 'text-secondary-500',
          link: '/vision/build'
        },
        vision_refinement: { 
          title: 'Refined Vision', 
          desc: `Enhanced ${tx.metadata?.category || 'vision'} with VIVA`,
          icon: 'Sparkles',
          color: 'text-primary-500',
          link: '/life-vision'
        },
        audio_generation: { 
          title: 'Generated Audio', 
          desc: 'Created vision audio track',
          icon: 'Music',
          color: 'text-energy-500',
          link: '/life-vision'
        },
        image_generation: { 
          title: 'Generated Image', 
          desc: 'Created image with VIVA',
          icon: 'ImageIcon',
          color: 'text-accent-400',
          link: '/vision-board/new'
        },
        vision_generation: {
          title: 'Generated Vision',
          desc: `Created vision for ${tx.metadata?.category || 'category'}`,
          icon: 'Sparkles',
          color: 'text-primary-500',
          link: '/life-vision'
        },
        blueprint_generation: {
          title: 'Generated Blueprint',
          desc: 'Created action blueprint with VIVA',
          icon: 'Target',
          color: 'text-primary-500',
          link: '/vision/build'
        },
        assessment_scoring: {
          title: 'Scored Assessment',
          desc: 'AI analyzed assessment response',
          icon: 'CheckCircle',
          color: 'text-primary-500',
          link: '/assessment'
        },
        // Life vision creation actions
        life_vision_category_summary: {
          title: 'Life Vision Summary',
          desc: `Generated category summary for ${tx.metadata?.category || 'life vision'}`,
          icon: 'Target',
          color: 'text-primary-500',
          link: '/life-vision/new'
        },
        life_vision_master_assembly: {
          title: 'Assembled Life Vision',
          desc: 'Created complete life vision document',
          icon: 'Target',
          color: 'text-primary-500',
          link: '/life-vision'
        },
        prompt_suggestions: {
          title: 'Prompt Suggestions',
          desc: 'Generated personalized prompts',
          icon: 'Sparkles',
          color: 'text-secondary-500',
          link: '/life-vision/new'
        },
      }

      const config = actionLabels[tx.action_type] || {
        title: tx.action_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        desc: 'Used VIVA',
        icon: 'Zap',
        color: 'text-neutral-400',
        link: '/dashboard/tokens'
      }

      activities.push({
        id: `token-${tx.id}`,
        type: 'viva',
        title: config.title,
        description: config.desc,
        timestamp: tx.created_at,
        icon: config.icon,
        color: config.color,
        link: config.link,
        metadata: {
          tokensUsed: Math.abs(tx.tokens_used).toLocaleString(),
        },
      })
    })

    // Get File Uploads from S3
    const prefix = `user-uploads/${user.id}/`
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 30,
    })

    try {
      const s3Response = await s3Client.send(command)
      const files = s3Response.Contents || []

      files
        .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0))
        .slice(0, 15)
        .forEach((file: any) => {
          if (!file.Key) return

          const pathParts = file.Key.split('/')
          const folder = pathParts[2]
          const fileName = file.Key.split('/').pop() || file.Key

          const folderLabels: Record<string, { title: string; desc: string; icon: string; color: string; link: string }> = {
            'avatar': { 
              title: 'Updated Profile Picture',
              desc: fileName,
              icon: 'User',
              color: 'text-primary-500',
              link: '/profile/active/edit'
            },
            'vision-board': { 
              title: 'Added to Vision Board',
              desc: fileName,
              icon: 'ImageIcon',
              color: 'text-accent-500',
              link: '/vision-board'
            },
            'journal': { 
              title: 'Uploaded Journal Evidence',
              desc: fileName,
              icon: 'Upload',
              color: 'text-energy-500',
              link: '/journal'
            },
            'life-vision': { 
              title: 'Generated Vision Audio',
              desc: fileName,
              icon: 'Music',
              color: 'text-secondary-500',
              link: '/life-vision'
            },
            'evidence': { 
              title: 'Recorded Profile Story',
              desc: fileName,
              icon: 'Upload',
              color: 'text-neutral-400',
              link: '/profile/active/edit'
            },
          }

          const config = folderLabels[folder] || {
            title: 'Uploaded File',
            desc: fileName,
            icon: 'Upload',
            color: 'text-neutral-500',
            link: '/dashboard/storage'
          }

          activities.push({
            id: `storage-${file.Key}`,
            type: 'storage',
            title: config.title,
            description: config.desc,
            timestamp: file.LastModified?.toISOString() || new Date().toISOString(),
            icon: config.icon,
            color: config.color,
            link: config.link,
            metadata: {
              size: formatBytes(file.Size || 0),
              fileUrl: `https://media.vibrationfit.com/${file.Key}`,
              fileName: fileName,
            },
          })
        })
    } catch (s3Error) {
      console.error('Error fetching S3 files:', s3Error)
      // Continue without storage items
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Take only the most recent 50
    const recentActivities = activities.slice(0, 50)

    // Log activity breakdown for debugging
    const breakdown = {
      total: activities.length,
      vision: activities.filter(a => a.type === 'vision').length,
      journal: activities.filter(a => a.type === 'journal').length,
      profile: activities.filter(a => a.type === 'profile').length,
      'vision-board': activities.filter(a => a.type === 'vision-board').length,
      assessment: activities.filter(a => a.type === 'assessment').length,
      viva: activities.filter(a => a.type === 'viva').length,
      storage: activities.filter(a => a.type === 'storage').length,
    }
    console.log('Activity breakdown:', breakdown)

    return NextResponse.json({ activities: recentActivities })

  } catch (error: any) {
    console.error('Activity feed error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch activity' 
    }, { status: 500 })
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

