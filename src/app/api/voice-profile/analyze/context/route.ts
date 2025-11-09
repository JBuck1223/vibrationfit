import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VISION_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'fun', label: 'Fun & Recreation' },
  { key: 'travel', label: 'Variety, Travel & Adventure' },
  { key: 'home', label: 'Home & Environment' },
  { key: 'family', label: 'Family & Parenting' },
  { key: 'love', label: 'Love & Partnership' },
  { key: 'health', label: 'Health & Vitality' },
  { key: 'money', label: 'Money & Wealth' },
  { key: 'work', label: 'Business & Work' },
  { key: 'social', label: 'Social & Friendship' },
  { key: 'stuff', label: 'Things & Lifestyle' },
  { key: 'giving', label: 'Giving & Legacy' },
  { key: 'spirituality', label: 'Expansion & Spirituality' },
]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [scenesResponse, journalResponse] = await Promise.all([
      supabase
        .from('scenes')
        .select('id, title, text, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('journal_entries')
        .select('id, title, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    if (scenesResponse.error) {
      console.error('voice_profile analyze context scenes error', scenesResponse.error)
      return NextResponse.json({ error: 'Failed to load scenes' }, { status: 500 })
    }

    if (journalResponse.error) {
      console.error('voice_profile analyze context journal error', journalResponse.error)
      return NextResponse.json({ error: 'Failed to load journal entries' }, { status: 500 })
    }

    const scenes = (scenesResponse.data ?? [])
      .filter((scene) => scene.text && scene.text.trim().length > 0)
      .map((scene) => ({
        id: scene.id,
        type: 'scene' as const,
        title: scene.title ?? 'Untitled Scene',
        preview: scene.text.slice(0, 160),
        text: scene.text,
        updated_at: scene.updated_at,
      }))

    const journalEntries = (journalResponse.data ?? [])
      .filter((entry) => entry.content && entry.content.trim().length > 0)
      .map((entry) => ({
        id: entry.id,
        type: 'journal' as const,
        title: entry.title && entry.title.trim().length > 0 ? entry.title : 'Journal Entry',
        preview: entry.content.slice(0, 160),
        text: entry.content,
        created_at: entry.created_at,
      }))

    const { data: activeVision } = await supabase
      .from('vision_versions')
      .select(
        [
          'id',
          'is_active',
          'is_draft',
          ...VISION_FIELDS.map((field) => field.key),
        ].join(', ')
      )
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_draft', false)
      .maybeSingle()

    let visionParagraphs: Array<{
      id: string
      type: 'vision'
      label: string
      text: string
    }> = []

    if (activeVision) {
      const visionRecord = activeVision as unknown as Record<string, string | null | undefined>
      visionParagraphs = VISION_FIELDS.flatMap((field) => {
        const value = visionRecord[field.key]
        if (typeof value === 'string' && value.trim().length > 0) {
          return [
            {
              id: `${visionRecord.id}-${field.key}`,
              type: 'vision' as const,
              label: field.label,
              text: value,
            },
          ]
        }
        return []
      })
    }

    const defaults = {
      scenes: scenes.slice(0, 3).map((item) => item.id),
      journalEntries: journalEntries.slice(0, 3).map((item) => item.id),
      visionParagraphs: visionParagraphs.slice(0, 3).map((item) => item.id),
    }

    return NextResponse.json({
      scenes,
      journalEntries,
      visionParagraphs,
      defaults,
      maxSelectable: 10,
    })
  } catch (error) {
    console.error('voice_profile analyze context error', error)
    return NextResponse.json({ error: 'Failed to load analyze context' }, { status: 500 })
  }
}
