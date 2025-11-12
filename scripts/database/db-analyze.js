const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function analyzeDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Service Role Key');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('✅ Connected to Supabase successfully\n');

    // List of main tables based on the codebase analysis
    const mainTables = [
      'user_profiles',
      'vision_versions', 
      'journal_entries',
      'vision_board_items',
      'assessments',
      'assessment_responses',
      'token_usage',
      'membership_tiers',
      'customer_subscriptions',
      'refinements',
      'generated_images_gallery'
    ];

    console.log('📊 MAIN TABLES ANALYSIS:');
    console.log('='.repeat(50));

    for (const tableName of mainTables) {
      try {
        // Try to get a sample record to see if table exists and get structure
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`\n❌ Table ${tableName}: ${error.message}`);
          continue;
        }

        console.log(`\n📋 Table: ${tableName}`);
        
        if (data && data.length > 0) {
          const sampleRecord = data[0];
          console.log('  Columns:');
          Object.keys(sampleRecord).forEach(key => {
            const value = sampleRecord[key];
            const type = Array.isArray(value) ? 'array' : typeof value;
            console.log(`    ${key}: ${type}`);
          });
        } else {
          console.log('  (Empty table)');
        }

        // Get row count
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!countError) {
          console.log(`  Row count: ${count}`);
        }

      } catch (err) {
        console.log(`\n❌ Error analyzing ${tableName}: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🔍 DETAILED ANALYSIS COMPLETE');

  } catch (error) {
    console.error('❌ Database analysis error:', error.message);
  }
}

analyzeDatabase();
