/**
 * Email Templates API
 * 
 * GET /api/admin/templates/email - List all email templates
 * POST /api/admin/templates/email - Create a new email template
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    // Build query
    let query = supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching email templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error in GET /api/admin/templates/email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.slug || !body.subject || !body.html_body) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, subject, html_body' },
        { status: 400 }
      )
    }

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from('email_templates')
      .select('id')
      .eq('slug', body.slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Template with this slug already exists' }, { status: 409 })
    }

    // Create template
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        slug: body.slug,
        name: body.name,
        description: body.description || null,
        category: body.category || 'other',
        status: body.status || 'draft',
        subject: body.subject,
        html_body: body.html_body,
        text_body: body.text_body || null,
        variables: body.variables || [],
        triggers: body.triggers || [],
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating email template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/templates/email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

