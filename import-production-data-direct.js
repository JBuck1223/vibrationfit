const { Client } = require('pg');
const fs = require('fs');

async function importProductionDataDirect() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  });

  try {
    await client.connect();
    console.log('🔄 Connected to local database');

    // Read all JSON files
    const profiles = JSON.parse(fs.readFileSync('production-profiles.json', 'utf8'));
    const assessments = JSON.parse(fs.readFileSync('production-assessments.json', 'utf8'));
    const journals = JSON.parse(fs.readFileSync('production-journals.json', 'utf8'));
    const visions = JSON.parse(fs.readFileSync('production-visions.json', 'utf8'));
    const refinements = JSON.parse(fs.readFileSync('production-refinements.json', 'utf8'));

    console.log(`📊 Found ${profiles.length} profiles, ${assessments.length} assessments, ${journals.length} journals, ${visions.length} visions, ${refinements.length} refinements`);

    // Import profiles
    console.log('📥 Importing user_profiles...');
    for (const profile of profiles) {
      const columns = Object.keys(profile).join(', ');
      const values = Object.values(profile).map(v => 
        v === null ? 'NULL' : 
        typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
        typeof v === 'object' ? `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb` :
        v
      ).join(', ');
      
      const query = `INSERT INTO user_profiles (${columns}) VALUES (${values})`;
      await client.query(query);
      console.log(`✅ Imported profile: ${profile.user_id}`);
    }

    // Import assessments
    console.log('📥 Importing assessment_results...');
    for (const assessment of assessments) {
      const columns = Object.keys(assessment).join(', ');
      const values = Object.values(assessment).map(v => 
        v === null ? 'NULL' : 
        typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
        typeof v === 'object' ? `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb` :
        v
      ).join(', ');
      
      const query = `INSERT INTO assessment_results (${columns}) VALUES (${values})`;
      await client.query(query);
      console.log(`✅ Imported assessment: ${assessment.id}`);
    }

    // Import journals
    console.log('📥 Importing journal_entries...');
    for (const journal of journals) {
      const columns = Object.keys(journal).join(', ');
      const values = Object.values(journal).map(v => 
        v === null ? 'NULL' : 
        typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
        typeof v === 'object' ? `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb` :
        v
      ).join(', ');
      
      const query = `INSERT INTO journal_entries (${columns}) VALUES (${values})`;
      await client.query(query);
      console.log(`✅ Imported journal: ${journal.id}`);
    }

    // Import visions
    console.log('📥 Importing vision_versions...');
    for (const vision of visions) {
      const columns = Object.keys(vision).join(', ');
      const values = Object.values(vision).map(v => 
        v === null ? 'NULL' : 
        typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
        typeof v === 'object' ? `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb` :
        v
      ).join(', ');
      
      const query = `INSERT INTO vision_versions (${columns}) VALUES (${values})`;
      await client.query(query);
      console.log(`✅ Imported vision: ${vision.id}`);
    }

    // Import refinements
    console.log('📥 Importing refinements...');
    for (const refinement of refinements) {
      const columns = Object.keys(refinement).join(', ');
      const values = Object.values(refinement).map(v => 
        v === null ? 'NULL' : 
        typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
        typeof v === 'object' ? `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb` :
        v
      ).join(', ');
      
      const query = `INSERT INTO refinements (${columns}) VALUES (${values})`;
      await client.query(query);
      console.log(`✅ Imported refinement: ${refinement.id}`);
    }

    console.log('🎉 Import complete! Your local database now has real production data.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

importProductionDataDirect();
