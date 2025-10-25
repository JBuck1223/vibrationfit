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
    const { data: visions } = await supabase
      .from('vision_versions')
      .select('id, status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    visions?.forEach((vision: any) => {
      activities.push({
        id: `vision-${vision.id}`,
        type: 'vision',
        title: vision.status === 'complete' ? 'Completed Life Vision' : 'Started Life Vision',
        description: `${vision.status === 'complete' ? 'Finished' : 'Created'} a new vision version`,
        timestamp: vision.status === 'complete' ? vision.updated_at : vision.created_at,
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
    const { data: profileVersions } = await supabase
      .from('profile_versions')
      .select('id, version_number, version_notes, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false})
      .limit(10)

    profileVersions?.forEach((version: any) => {
      activities.push({
        id: `profile-${version.id}`,
        type: 'profile',
        title: `Updated Profile (v${version.version_number})`,
        description: version.version_notes || 'Made changes to profile',
        timestamp: version.created_at,
        icon: 'User',
        color: 'text-secondary-500',
        link: '/profile',
      })
    })

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
    const { data: assessments } = await supabase
      .from('assessment_results')
      .select('id, overall_score, max_possible_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    assessments?.forEach((assessment: any) => {
      const percentage = Math.round((assessment.overall_score / assessment.max_possible_score) * 100)
      activities.push({
        id: `assessment-${assessment.id}`,
        type: 'assessment',
        title: 'Completed Vibrational Assessment',
        description: `Scored ${assessment.overall_score}/${assessment.max_possible_score} (${percentage}%)`,
        timestamp: assessment.created_at,
        icon: 'CheckCircle',
        color: 'text-primary-500',
        link: '/assessment',
      })
    })

    // Get Token Transactions (AI usage)
    const { data: tokenTx } = await supabase
      .from('token_transactions')
      .select('id, action_type, tokens_used, created_at, metadata')
      .eq('user_id', user.id)
      .gt('tokens_used', 0) // Only deductions (not grants)
      .order('created_at', { ascending: false })
      .limit(20)

    tokenTx?.forEach((tx: any) => {
      const actionLabels: Record<string, { title: string; desc: string; icon: string; color: string; link: string }> = {
        chat: { 
          title: 'VIVA Chat', 
          desc: 'Had a conversation with VIVA',
          icon: 'MessageSquare',
          color: 'text-secondary-500',
          link: '/vision/build'
        },
        refinement: { 
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
        transcription: { 
          title: 'Transcribed Recording', 
          desc: 'Converted voice to text',
          icon: 'Zap',
          color: 'text-neutral-400',
          link: '/journal/new'
        },
        image_generation: { 
          title: 'Generated Image', 
          desc: 'Created image with VIVA',
          icon: 'ImageIcon',
          color: 'text-accent-400',
          link: '/vision-board/new'
        },
      }

      const config = actionLabels[tx.action_type] || {
        title: tx.action_type,
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
              link: '/profile/edit'
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
              link: '/profile/edit'
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

