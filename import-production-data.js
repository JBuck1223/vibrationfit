const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Local Supabase client
const localSupabase = createClient(
  'http://127.0.0.1:54321',
  'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
);

async function importProductionData() {
  try {
    console.log('🔄 Importing production data to local database...');

    // Read all JSON files
    const profiles = JSON.parse(fs.readFileSync('production-profiles.json', 'utf8'));
    const assessments = JSON.parse(fs.readFileSync('production-assessments.json', 'utf8'));
    const journals = JSON.parse(fs.readFileSync('production-journals.json', 'utf8'));
    const visions = JSON.parse(fs.readFileSync('production-visions.json', 'utf8'));
    const refinements = JSON.parse(fs.readFileSync('production-refinements.json', 'utf8'));

    console.log(`📊 Found ${profiles.length} profiles, ${assessments.length} assessments, ${journals.length} journals, ${visions.length} visions, ${refinements.length} refinements`);

    // Import profiles first (they have user_id references)
    console.log('📥 Importing user_profiles...');
    for (const profile of profiles) {
      const { error } = await localSupabase
        .from('user_profiles')
        .insert(profile);
      
      if (error) {
        console.error('❌ Error importing profile:', error.message);
      } else {
        console.log(`✅ Imported profile for user: ${profile.user_id}`);
      }
    }

    // Import assessments
    console.log('📥 Importing assessment_results...');
    for (const assessment of assessments) {
      const { error } = await localSupabase
        .from('assessment_results')
        .insert(assessment);
      
      if (error) {
        console.error('❌ Error importing assessment:', error.message);
      } else {
        console.log(`✅ Imported assessment: ${assessment.id}`);
      }
    }

    // Import journals
    console.log('📥 Importing journal_entries...');
    for (const journal of journals) {
      const { error } = await localSupabase
        .from('journal_entries')
        .insert(journal);
      
      if (error) {
        console.error('❌ Error importing journal:', error.message);
      } else {
        console.log(`✅ Imported journal: ${journal.id}`);
      }
    }

    // Import visions
    console.log('📥 Importing vision_versions...');
    for (const vision of visions) {
      const { error } = await localSupabase
        .from('vision_versions')
        .insert(vision);
      
      if (error) {
        console.error('❌ Error importing vision:', error.message);
      } else {
        console.log(`✅ Imported vision: ${vision.id}`);
      }
    }

    // Import refinements
    console.log('📥 Importing refinements...');
    for (const refinement of refinements) {
      const { error } = await localSupabase
        .from('refinements')
        .insert(refinement);
      
      if (error) {
        console.error('❌ Error importing refinement:', error.message);
      } else {
        console.log(`✅ Imported refinement: ${refinement.id}`);
      }
    }

    console.log('🎉 Import complete! Your local database now has real production data.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

importProductionData();
