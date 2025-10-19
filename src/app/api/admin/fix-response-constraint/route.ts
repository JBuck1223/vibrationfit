// /src/app/api/admin/fix-response-constraint/route.ts
// Temporary API endpoint to fix the response_value constraint

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Fix the response_value constraint
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop the existing constraint
        ALTER TABLE assessment_responses DROP CONSTRAINT IF EXISTS assessment_responses_response_value_check;
        
        -- Add the new constraint that allows 0, 2, 4, 6, 8, 10
        ALTER TABLE assessment_responses ADD CONSTRAINT assessment_responses_response_value_check 
        CHECK (response_value IN (0, 2, 4, 6, 8, 10));
      `
    })

    if (error) {
      console.error('Error fixing constraint:', error)
      return NextResponse.json(
        { error: 'Failed to fix constraint' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Response value constraint fixed successfully' })

  } catch (error) {
    console.error('Fix constraint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
