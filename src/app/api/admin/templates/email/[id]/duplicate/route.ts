/**
 * Duplicate Email Template API
 * 
 * POST /api/admin/templates/email/[id]/duplicate - Duplicate a template
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin (database-driven)
    const { checkIsAdmin } = await import('@/middleware/admin')
    if (!await checkIsAdmin(supabase, user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get original template
    const { data: original, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !original) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Generate unique slug
    let newSlug = `${original.slug}-copy`
    let counter = 1
    let slugExists = true

    while (slugExists) {
      const { data: existing } = await supabase
        .from('email_templates')
        .select('id')
        .eq('slug', newSlug)
        .single()

      if (!existing) {
        slugExists = false
      } else {
        counter++
        newSlug = `${original.slug}-copy-${counter}`
      }
    }

    // Create duplicate
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        slug: newSlug,
        name: `${original.name} (Copy)`,
        description: original.description,
        category: original.category,
        status: 'draft',
        subject: original.subject,
        html_body: original.html_body,
        text_body: original.text_body,
        variables: original.variables,
        triggers: original.triggers,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error duplicating email template:', error)
      return NextResponse.json({ error: 'Failed to duplicate template' }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/templates/email/[id]/duplicate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

