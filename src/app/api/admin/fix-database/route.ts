// /src/app/api/admin/fix-database/route.ts
// Admin endpoint to fix database issues

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin (you can modify this check as needed)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For now, let's just return the SQL commands that need to be run
    // You can run these manually in the Supabase SQL editor
    const sqlCommands = {
      fixResponseConstraint: `
        -- Fix response_value constraint to allow 0 for custom responses
        ALTER TABLE assessment_responses DROP CONSTRAINT IF EXISTS assessment_responses_response_value_check;
        ALTER TABLE assessment_responses ADD CONSTRAINT assessment_responses_response_value_check 
        CHECK (response_value IN (0, 2, 4, 6, 8, 10));
        COMMENT ON COLUMN assessment_responses.response_value IS 'Numerical value of the response (0 for custom responses, 2, 4, 6, 8, or 10 for regular responses)';
      `,
      fixGreenLineCalculations: `
        -- Fix Green Line calculations for 7-question categories
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
        COMMENT ON FUNCTION get_green_line_status IS 'Determines Green Line status based on score percentage (max 35 points per category)';
      `
    }

    return NextResponse.json({
      message: 'Database fix commands ready',
      instructions: 'Run these SQL commands in your Supabase SQL editor',
      commands: sqlCommands
    })

  } catch (error) {
    console.error('Database fix error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
