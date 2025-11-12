const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

/**
 * Pull specific data from production Supabase to local
 * 
 * Usage:
 *   node pull-from-production.js <table> [filter]
 * 
 * Examples:
 *   node pull-from-production.js user_profiles user_id=eq.123
 *   node pull-from-production.js vision_versions user_id=eq.123
 *   node pull-from-production.js profiles user_id=eq.123
 *   node pull-from-production.js refinements id=eq.456
 */

async function pullFromProduction() {
  // Get production credentials
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Get local credentials
  const localUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_LOCAL || 'http://127.0.0.1:54321';
  const localKey = process.env.SUPABASE_SERVICE_ROLE_KEY_LOCAL || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

  if (!prodUrl || !prodKey) {
    console.error('❌ Missing production Supabase credentials');
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('❌ Usage: node pull-from-production.js <table> [filter]');
    console.error('   Example: node pull-from-production.js user_profiles user_id=eq.123');
    console.error('   Example: node pull-from-production.js vision_versions user_id=eq.123');
    process.exit(1);
  }

  const tableName = args[0];
  const filter = args[1] || null;

  console.log(`🔄 Pulling data from production...`);
  console.log(`   Table: ${tableName}`);
  if (filter) {
    console.log(`   Filter: ${filter}`);
  }
  console.log();

  // Connect to production
  const prodSupabase = createClient(prodUrl, prodKey);
  
  // Connect to local
  const localSupabase = createClient(localUrl, localKey);

  try {
    // Fetch data from production
    let query = prodSupabase.from(tableName).select('*');
    
    if (filter) {
      // Parse filter (format: column=operator.value)
      const [column, rest] = filter.split('=');
      const [operator, value] = rest.split('.');
      
      switch (operator) {
        case 'eq':
          query = query.eq(column, value);
          break;
        case 'neq':
          query = query.neq(column, value);
          break;
        case 'gt':
          query = query.gt(column, value);
          break;
        case 'gte':
          query = query.gte(column, value);
          break;
        case 'lt':
          query = query.lt(column, value);
          break;
        case 'lte':
          query = query.lte(column, value);
          break;
        case 'like':
          query = query.like(column, `%${value}%`);
          break;
        case 'in':
          query = query.in(column, value.split(','));
          break;
        default:
          console.error(`❌ Unknown operator: ${operator}`);
          console.error('   Supported: eq, neq, gt, gte, lt, lte, like, in');
          process.exit(1);
      }
    }

    const { data: prodData, error: prodError } = await query;

    if (prodError) {
      console.error('❌ Error fetching from production:', prodError);
      process.exit(1);
    }

    if (!prodData || prodData.length === 0) {
      console.log('⚠️  No data found in production matching the criteria');
      process.exit(0);
    }

    console.log(`✅ Found ${prodData.length} record(s) in production`);
    console.log();

    // Insert into local database
    console.log(`📥 Inserting into local database...`);
    
    // Delete existing records if they exist (optional - comment out if you want to keep duplicates)
    if (filter) {
      console.log(`   Clearing existing records matching filter...`);
      const [column, rest] = filter.split('=');
      const [operator, value] = rest.split('.');
      
      if (operator === 'eq') {
        const { error: deleteError } = await localSupabase
          .from(tableName)
          .delete()
          .eq(column, value);
        
        if (deleteError) {
          console.warn('⚠️  Could not delete existing records:', deleteError.message);
        }
      }
    }

    // Insert records
    const { data: insertData, error: insertError } = await localSupabase
      .from(tableName)
      .insert(prodData)
      .select();

    if (insertError) {
      console.error('❌ Error inserting into local database:', insertError);
      console.error('   This might be due to constraint violations or missing foreign keys');
      console.error('   Data fetched:', JSON.stringify(prodData, null, 2));
      process.exit(1);
    }

    console.log(`✅ Successfully imported ${insertData.length} record(s) to local database`);
    console.log();
    console.log('📊 Sample of imported data:');
    console.log(JSON.stringify(insertData[0], null, 2));

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

pullFromProduction();

