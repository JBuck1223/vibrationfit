import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { supabase } = auth

    const { data: tools, error } = await supabase
      .from('ai_tools')
      .select('id, tool_key, tool_name, description, model_name, temperature, max_tokens, system_prompt, is_active, created_at, updated_at')
      .order('tool_name')

    if (error) {
      console.error('Error fetching AI tools:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch AI tools', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ tools })
  } catch (error) {
    console.error('Error in GET /api/admin/ai-tools:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { supabase } = auth

    const body = await request.json()
    const { tool_key, model_name, temperature, max_tokens, system_prompt, is_active } = body

    if (!tool_key) {
      return NextResponse.json({ error: 'tool_key is required' }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (model_name !== undefined) updateData.model_name = model_name
    if (temperature !== undefined) updateData.temperature = temperature
    if (max_tokens !== undefined) updateData.max_tokens = max_tokens
    if (system_prompt !== undefined) updateData.system_prompt = system_prompt
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: tool, error } = await supabase
      .from('ai_tools')
      .update(updateData)
      .eq('tool_key', tool_key)
      .select()
      .single()

    if (error) {
      console.error('Error updating AI tool:', error)
      return NextResponse.json({ error: 'Failed to update AI tool' }, { status: 500 })
    }

    return NextResponse.json({ tool })
  } catch (error) {
    console.error('Error in PUT /api/admin/ai-tools:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
