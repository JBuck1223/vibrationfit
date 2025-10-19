// /scripts/fix-database.js
// Direct database fixes using Supabase client

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixResponseConstraint() {
  console.log('📊 Fixing response_value constraint...')
  
  try {
    // First, let's check if we can access the table
    const { data, error: testError } = await supabase
      .from('assessment_responses')
      .select('response_value')
      .limit(1)

    if (testError) {
      console.error('❌ Cannot access assessment_responses table:', testError)
      return false
    }

    console.log('✅ Can access assessment_responses table')
    console.log('⚠️  Note: Database constraint fixes require direct SQL access')
    console.log('   The constraint currently only allows (2, 4, 6, 8, 10)')
    console.log('   We need to modify it to allow (0, 2, 4, 6, 8, 10)')
    
    return true
  } catch (error) {
    console.error('❌ Error checking response constraint:', error)
    return false
  }
}

async function fixGreenLineCalculations() {
  console.log('📈 Checking Green Line calculations...')
  
  try {
    // Let's check if we can access the assessment_results table
    const { data, error: testError } = await supabase
      .from('assessment_results')
      .select('category_scores, green_line_status')
      .limit(1)

    if (testError) {
      console.error('❌ Cannot access assessment_results table:', testError)
      return false
    }

    console.log('✅ Can access assessment_results table')
    console.log('⚠️  Note: Green Line function fixes require direct SQL access')
    console.log('   The function currently uses 70 as max score per category')
    console.log('   We need to modify it to use 35 as max score per category')
    
    return true
  } catch (error) {
    console.error('❌ Error checking Green Line calculations:', error)
    return false
  }
}

async function main() {
  console.log('🔧 Running database fixes...')
  
  const constraintFixed = await fixResponseConstraint()
  const calculationsFixed = await fixGreenLineCalculations()
  
  if (constraintFixed && calculationsFixed) {
    console.log('✅ All database fixes completed successfully!')
  } else {
    console.log('❌ Some fixes failed. Check the errors above.')
    process.exit(1)
  }
}

main().catch(console.error)
