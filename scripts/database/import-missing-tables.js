const { Client } = require('pg');
const fs = require('fs');

async function importMissingTables() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  });

  try {
    await client.connect();
    console.log('🔄 Connected to local database');

    const tables = [
      { name: 'assessment_responses', file: 'production-assessment_responses.json', hasData: true },
      { name: 'assessment_insights', file: 'production-assessment_insights.json', hasData: false },
      { name: 'membership_tiers', file: 'production-membership_tiers.json', hasData: true },
      { name: 'customer_subscriptions', file: 'production-customer_subscriptions.json', hasData: false },
      { name: 'payment_history', file: 'production-payment_history.json', hasData: false },
      { name: 'token_usage', file: 'production-token_usage.json', hasData: true },
      { name: 'token_transactions', file: 'production-token_transactions.json', hasData: false }
    ];

    for (const table of tables) {
      const data = JSON.parse(fs.readFileSync(table.file, 'utf8'));
      
      if (data.length === 0) {
        console.log(`⏭️  Skipping ${table.name} (no data)`);
        continue;
      }

      console.log(`📥 Importing ${table.name}...`);
      
      for (const record of data) {
        const columns = Object.keys(record).join(', ');
        const values = Object.values(record).map(v => 
          v === null ? 'NULL' : 
          typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
          typeof v === 'object' ? `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb` :
          v
        ).join(', ');
        
        const query = `INSERT INTO ${table.name} (${columns}) VALUES (${values})`;
        await client.query(query);
      }
      
      console.log(`✅ Imported ${data.length} records into ${table.name}`);
    }

    console.log('🎉 Import complete! All tables now have real production data.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

importMissingTables();
