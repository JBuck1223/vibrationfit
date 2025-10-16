import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/server'
import { trackTokenUsage } from '@/lib/tokens/tracking'

export async function POST(req: NextRequest) {
  try {
    const { userId, delta } = await req.json()
    console.log('Admin token adjustment request:', { userId, delta })
    
    if (!userId || typeof delta !== 'number') {
      return NextResponse.json({ error: 'userId and delta required' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    
    // Ensure user profile exists first
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single()
    
    if (!existingProfile) {
      // Create profile if it doesn't exist
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          vibe_assistant_tokens_remaining: 100,
          vibe_assistant_tokens_used: 0,
          storage_quota_gb: 1
        })
      
      if (createError) {
        console.error('Failed to create user profile:', createError)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }
    }
    
    // Use the centralized token tracking system for admin adjustments
    console.log('Calling trackTokenUsage with:', {
      user_id: userId,
      action_type: delta > 0 ? 'admin_grant' : 'admin_deduct',
      tokens_used: Math.abs(delta)
    })
    
    await trackTokenUsage({
      user_id: userId,
      action_type: delta > 0 ? 'admin_grant' : 'admin_deduct',
      model_used: 'admin',
      tokens_used: Math.abs(delta),
      cost_estimate: 0, // Admin adjustments have no cost
      input_tokens: 0,
      output_tokens: 0,
      success: true,
      metadata: {
        admin_action: true,
        delta: delta,
        reason: 'Admin token adjustment'
      }
    }, supabase)
    
    console.log('Token adjustment completed successfully')
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}


