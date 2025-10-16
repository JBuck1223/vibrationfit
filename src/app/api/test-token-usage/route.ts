import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Simple test endpoint to check if token_usage table exists
    const supabase = await createClient()
    
    // Try to query the token_usage table
    const { data, error } = await supabase
      .from('token_usage')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        error: 'Database error',
        details: error.message,
        table_exists: false
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      table_exists: true,
      sample_data: data,
      message: 'Token usage table is accessible'
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
      table_exists: false
    }, { status: 500 })
  }
}
