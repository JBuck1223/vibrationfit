const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function executeIndexes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Service Role Key');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const indexes = [
    {
      name: 'idx_journal_entries_user_date',
      sql: 'CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries(user_id, date DESC)'
    },
    {
      name: 'idx_vision_board_items_user_status',
      sql: 'CREATE INDEX IF NOT EXISTS idx_vision_board_items_user_status ON vision_board_items(user_id, status)'
    },
    {
      name: 'idx_assessment_responses_assessment_category',
      sql: 'CREATE INDEX IF NOT EXISTS idx_assessment_responses_assessment_category ON assessment_responses(assessment_id, category)'
    },
    {
      name: 'idx_token_usage_user_action',
      sql: 'CREATE INDEX IF NOT EXISTS idx_token_usage_user_action ON token_usage(user_id, action_type)'
    },
    {
      name: 'idx_vision_versions_user_status',
      sql: 'CREATE INDEX IF NOT EXISTS idx_vision_versions_user_status ON vision_versions(user_id, status)'
    },
    {
      name: 'idx_token_usage_user_date',
      sql: 'CREATE INDEX IF NOT EXISTS idx_token_usage_user_date ON token_usage(user_id, created_at DESC)'
    },
    {
      name: 'idx_assessment_responses_assessment_question',
      sql: 'CREATE INDEX IF NOT EXISTS idx_assessment_responses_assessment_question ON assessment_responses(assessment_id, question_id)'
    },
    {
      name: 'idx_refinements_user_vision',
      sql: 'CREATE INDEX IF NOT EXISTS idx_refinements_user_vision ON refinements(user_id, vision_id)'
    },
    {
      name: 'idx_user_profiles_membership_tier',
      sql: 'CREATE INDEX IF NOT EXISTS idx_user_profiles_membership_tier ON user_profiles(membership_tier_id) WHERE membership_tier_id IS NOT NULL'
    },
    {
      name: 'idx_vision_versions_completion',
      sql: 'CREATE INDEX IF NOT EXISTS idx_vision_versions_completion ON vision_versions(user_id, completion_percent DESC)'
    },
    {
      name: 'idx_assessment_responses_category',
      sql: 'CREATE INDEX IF NOT EXISTS idx_assessment_responses_category ON assessment_responses(category)'
    },
    {
      name: 'idx_refinements_category',
      sql: 'CREATE INDEX IF NOT EXISTS idx_refinements_category ON refinements(category)'
    }
  ];

  console.log('🚀 Creating database indexes...\n');

  for (const index of indexes) {
    try {
      console.log(`Creating ${index.name}...`);
      
      // Use rpc to execute raw SQL
      const { data, error } = await supabase.rpc('exec_sql', {
        query: index.sql
      });

      if (error) {
        console.log(`❌ ${index.name}: ${error.message}`);
      } else {
        console.log(`✅ ${index.name}: Created successfully`);
      }
    } catch (err) {
      console.log(`❌ ${index.name}: ${err.message}`);
    }
  }

  console.log('\n🎉 Index creation complete!');
}

executeIndexes();
