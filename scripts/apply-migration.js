#!/usr/bin/env node
// Script to apply SQL migrations to remote Supabase database

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    env[key.trim()] = values.join('=').trim();
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

async function executeSql(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Response:', error);
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    throw error;
  }
}

async function applyMigration(migrationFile) {
  console.log(`📄 Reading migration: ${migrationFile}`);
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log(`🚀 Applying migration to ${SUPABASE_URL}...`);
  console.log(`📊 SQL length: ${sql.length} characters`);
  
  try {
    // Note: We need to use the Supabase SQL Editor API or connection pooler
    // For now, let's output instructions
    console.log('\n⚠️  Direct API execution from Node.js is limited.');
    console.log('📋 Please apply this migration using one of these methods:\n');
    
    console.log('Option 1: Supabase Dashboard (Recommended)');
    console.log('  1. Go to: https://supabase.com/dashboard/project/nxjhqibnlbwzzphewncj/sql');
    console.log('  2. Click "New Query"');
    console.log(`  3. Copy contents from: ${migrationPath}`);
    console.log('  4. Paste and click "Run"\n');
    
    console.log('Option 2: Use psql (if installed)');
    console.log('  Install: brew install postgresql');
    console.log('  Then run: psql "postgresql://postgres:[YOUR-DB-PASSWORD]@db.nxjhqibnlbwzzphewncj.supabase.co:5432/postgres" -f supabase/migrations/' + migrationFile + '\n');
    
    console.log('Option 3: Supabase CLI (requires login)');
    console.log('  1. npx supabase login');
    console.log('  2. npx supabase link --project-ref nxjhqibnlbwzzphewncj');
    console.log('  3. npx supabase db push\n');
    
    console.log('💡 Tip: The easiest method is Option 1 (Dashboard)');
    
  } catch (error) {
    console.error('❌ Failed to apply migration:', error.message);
    process.exit(1);
  }
}

// Get migration file from command line or use default
const migrationFile = process.argv[2] || '20250111000000_create_assessment_tables.sql';

applyMigration(migrationFile).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

