#!/usr/bin/env ts-node
/**
 * Generate All Documentation
 * 
 * Master script that runs all doc generators.
 * Run this to regenerate all auto-generated docs from source code.
 */

import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  console.log('🚀 Generating all documentation from source...\n')
  
  try {
    const scriptsDir = __dirname
    
    // Run each generator
    console.log('Running schema docs generator...')
    execSync(`ts-node "${join(scriptsDir, 'generate-schema-docs.ts')}"`, { stdio: 'inherit' })
    
    console.log('\nRunning API docs generator...')
    execSync(`ts-node "${join(scriptsDir, 'generate-api-docs.ts')}"`, { stdio: 'inherit' })
    
    console.log('\nRunning constants docs generator...')
    execSync(`ts-node "${join(scriptsDir, 'generate-constants-docs.ts')}"`, { stdio: 'inherit' })
    
    console.log('\n✅ All documentation generated successfully!')
    console.log('📁 Generated files:')
    console.log('   - docs/generated/SCHEMA.md')
    console.log('   - docs/generated/API_ENDPOINTS.md')
    console.log('   - docs/generated/CONSTANTS.md')
    
  } catch (error) {
    console.error('\n❌ Error generating documentation:', error)
    process.exit(1)
  }
}

main()
