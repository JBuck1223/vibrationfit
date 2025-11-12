const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

/**
 * Pull user profile data for sidebar from production
 * 
 * Usage:
 *   node pull-user-sidebar.js [user_id] [--export-only]
 * 
 * Examples:
 *   node pull-user-sidebar.js <user-id>           # Pull specific user (try to import)
 *   node pull-user-sidebar.js <user-id> --export-only  # Export to JSON only
 *   node pull-user-sidebar.js                    # List all users and let you choose
 */

async function pullUserSidebar() {
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

  const userId = process.argv[2];
  const exportOnly = process.argv.includes('--export-only');

  // Connect to production
  const prodSupabase = createClient(prodUrl, prodKey);
  
  // Connect to local (only if not export-only)
  let localSupabase = null;
  if (!exportOnly) {
    try {
      localSupabase = createClient(localUrl, localKey);
    } catch (err) {
      console.warn('⚠️  Could not connect to local Supabase. Use --export-only to export to JSON.');
      console.warn('   Make sure Supabase is running: supabase start\n');
    }
  }

  try {
    if (!userId) {
      // List all users
      console.log('📋 Fetching users from production...\n');
      
      const { data: profiles, error } = await prodSupabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email, is_active, is_draft, updated_at')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Error fetching users:', error);
        process.exit(1);
      }

      if (!profiles || profiles.length === 0) {
        console.log('⚠️  No users found in production');
        process.exit(0);
      }

      console.log(`Found ${profiles.length} user(s):\n`);
      profiles.forEach((profile, index) => {
        const name = profile.first_name || profile.email || 'Unknown';
        const status = profile.is_draft ? 'DRAFT' : profile.is_active ? 'ACTIVE' : 'INACTIVE';
        console.log(`${index + 1}. ${name} (${profile.user_id}) [${status}]`);
      });
      
      console.log('\n💡 Usage: node pull-user-sidebar.js <user_id>');
      console.log('   Example: node pull-user-sidebar.js', profiles[0].user_id);
      process.exit(0);
    }

    // Pull specific user
    console.log(`🔄 Pulling user profile for sidebar from production...`);
    console.log(`   User ID: ${userId}\n`);

    // Fetch profile from production (active non-draft first, then fallback)
    let { data: prodProfile, error: prodError } = await prodSupabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('is_draft', false)
      .maybeSingle();

    // Fallback to latest non-draft profile if no active one found
    if (!prodProfile && !prodError) {
      console.log('   No active profile found, trying latest non-draft profile...');
      const fallbackResult = await prodSupabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_draft', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      prodProfile = fallbackResult.data;
      prodError = fallbackResult.error;
    }

    if (prodError) {
      console.error('❌ Error fetching from production:', prodError);
      process.exit(1);
    }

    if (!prodProfile) {
      console.log('⚠️  No profile found in production for this user');
      process.exit(0);
    }

    console.log(`✅ Found profile in production:`);
    console.log(`   Name: ${prodProfile.first_name || 'N/A'}`);
    console.log(`   Email: ${prodProfile.email || 'N/A'}`);
    console.log(`   Active: ${prodProfile.is_active ? 'Yes' : 'No'}`);
    console.log(`   Draft: ${prodProfile.is_draft ? 'Yes' : 'No'}`);
    console.log(`   Tokens: ${prodProfile.vibe_assistant_tokens_remaining ?? 0}`);
    console.log();

    // Export to JSON file
    const filename = `production-user-profile-${userId}.json`;
    fs.writeFileSync(filename, JSON.stringify(prodProfile, null, 2));
    console.log(`💾 Exported profile to: ${filename}`);

    if (exportOnly) {
      console.log('\n✨ Profile exported successfully!');
      console.log('   To import later, run: node pull-user-sidebar.js', userId);
      console.log('   (Make sure Supabase is running: supabase start)');
      return;
    }

    // Try to import into local database if connected
    if (!localSupabase) {
      console.log('\n⚠️  Local Supabase not connected. Profile saved to JSON file.');
      console.log('   Start Supabase with: supabase start');
      console.log('   Then run this script again to import.');
      return;
    }

    // Delete existing profile for this user in local
    console.log(`🗑️  Clearing existing local profile...`);
    const { error: deleteError } = await localSupabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116 = no rows deleted (OK)
      console.warn('⚠️  Could not delete existing profile:', deleteError.message);
    }

    // Insert into local database
    console.log(`📥 Inserting into local database...`);
    
    const { data: insertData, error: insertError } = await localSupabase
      .from('user_profiles')
      .insert(prodProfile)
      .select();

    if (insertError) {
      console.error('❌ Error inserting into local database:', insertError);
      console.error('   This might be due to constraint violations or missing foreign keys');
      console.error('   Profile saved to JSON file:', filename);
      console.error('   Full error:', JSON.stringify(insertError, null, 2));
      process.exit(1);
    }

    console.log(`✅ Successfully imported profile to local database!`);
    console.log();
    console.log('📊 Imported profile summary:');
    console.log(`   Name: ${insertData[0].first_name || 'N/A'}`);
    console.log(`   Picture: ${insertData[0].profile_picture_url ? 'Yes' : 'No'}`);
    console.log(`   Tokens: ${insertData[0].vibe_assistant_tokens_remaining ?? 0}`);
    console.log(`   Storage Quota: ${insertData[0].storage_quota_gb ?? 5} GB`);
    console.log();
    console.log('✨ Your sidebar should now display correctly!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

pullUserSidebar();

