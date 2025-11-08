import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateScenesForCategory } from '@/lib/vibration/service'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { category, profileGoesWellText, profileNotWellTextFlipped, assessmentSnippets, existingVisionParagraph, dataRichnessTier } =
      body ?? {}

    if (!category) {
      return NextResponse.json({ error: 'Category is required.' }, { status: 400 })
    }

    const scenes = await generateScenesForCategory({
      userId: user.id,
      category,
      profileGoesWellText,
      profileNotWellTextFlipped,
      assessmentSnippets,
      existingVisionParagraph,
      dataRichnessTier,
    })

    return NextResponse.json({ scenes })
  } catch (error) {
    console.error('Error generating scenes:', error)
    return NextResponse.json({ error: 'Failed to generate scenes.' }, { status: 500 })
  }
}

