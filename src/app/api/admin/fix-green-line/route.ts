// /src/app/api/admin/fix-green-line/route.ts
// Temporary API endpoint to fix the Green Line calculation function

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Fix the get_green_line_status function
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_green_line_status(p_score INTEGER)
        RETURNS green_line_status AS $$
        DECLARE
          v_percentage NUMERIC;
        BEGIN
          -- Calculate percentage (max score per category is 35 points: 7 questions × 5 points each)
          v_percentage := (p_score::NUMERIC / 35.0) * 100;
          
          -- Determine status
          IF v_percentage >= 80 THEN
            RETURN 'above'::green_line_status;
          ELSIF v_percentage >= 60 THEN
            RETURN 'transition'::green_line_status;
          ELSE
            RETURN 'below'::green_line_status;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `
    })

    if (error) {
      console.error('Error fixing function:', error)
      return NextResponse.json(
        { error: 'Failed to fix function' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Green Line function fixed successfully' })

  } catch (error) {
    console.error('Fix function error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
