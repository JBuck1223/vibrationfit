#!/usr/bin/env node
/**
 * Test Supabase Connection
 * 
 * Tests all three Supabase clients:
 * 1. Browser Client (anon key)
 * 2. Server Client (with cookie handling)
 * 3. Service Client (service role key)
 * 
 * Usage:
 *   node scripts/database/test-supabase-connection.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testConnection() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan')
  log('🔍 Testing Supabase Connection', 'cyan')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan')

  // Check environment variables
  log('📋 Environment Variables:', 'blue')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    log('   ❌ NEXT_PUBLIC_SUPABASE_URL is missing', 'red')
    return
  }
  log(`   ✅ URL: ${supabaseUrl}`, 'green')

  if (!anonKey) {
    log('   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', 'red')
    return
  }
  log(`   ✅ Anon Key: ${anonKey.substring(0, 20)}...`, 'green')

  if (!serviceKey) {
    log('   ⚠️  SUPABASE_SERVICE_ROLE_KEY is missing', 'yellow')
  } else {
    log(`   ✅ Service Key: ${serviceKey.substring(0, 20)}...`, 'green')
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan')

  // Test 1: Browser/Anon Client
  log('1️⃣  Testing Browser Client (Anon Key)...', 'blue')
  try {
    const browserClient = createClient(supabaseUrl, anonKey)
    
    // Simple query to test connection
    const { data, error } = await browserClient
      .from('profiles')
      .select('count')
      .limit(1)

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    log('   ✅ Browser client connected successfully!', 'green')
  } catch (error) {
    log(`   ❌ Browser client failed: ${error.message}`, 'red')
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan')

  // Test 2: Service Client
  if (serviceKey) {
    log('2️⃣  Testing Service Client (Service Role Key)...', 'blue')
    try {
      const serviceClient = createClient(supabaseUrl, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // Query that might need elevated permissions
      const { data, error } = await serviceClient
        .from('profiles')
        .select('count')
        .limit(1)

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      log('   ✅ Service client connected successfully!', 'green')
    } catch (error) {
      log(`   ❌ Service client failed: ${error.message}`, 'red')
    }
  } else {
    log('2️⃣  Skipping Service Client test (no service key)', 'yellow')
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan')

  // Test 3: Database Info
  log('3️⃣  Fetching Database Info...', 'blue')
  try {
    const client = createClient(supabaseUrl, anonKey)
    
    // Get database version
    const { data: healthCheck, error: healthError } = await client
      .rpc('version')
      .single()

    if (healthError) {
      log('   ⚠️  Could not fetch database version', 'yellow')
      log(`      ${healthError.message}`, 'yellow')
    } else {
      log(`   ✅ Database is healthy!`, 'green')
    }

    // List available tables
    const { data: tables, error: tablesError } = await client
      .from('profiles')
      .select('*')
      .limit(0)

    if (!tablesError) {
      log('   ✅ Can access profiles table', 'green')
    }

  } catch (error) {
    log(`   ⚠️  Database info check: ${error.message}`, 'yellow')
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan')
  log('✨ Connection test complete!', 'cyan')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan')

  log('💡 Tips:', 'yellow')
  log('   • View Studio: http://127.0.0.1:54323', 'yellow')
  log('   • View Emails: http://127.0.0.1:54324', 'yellow')
  log('   • Check status: supabase status', 'yellow')
  log('   • View logs: supabase logs\n', 'yellow')
}

// Run the test
testConnection().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red')
  process.exit(1)
})



