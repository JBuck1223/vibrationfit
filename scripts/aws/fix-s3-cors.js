#!/usr/bin/env node

/**
 * Fix S3 CORS Configuration for VibrationFit
 * 
 * This script configures the S3 bucket to allow browser uploads via presigned URLs
 * Fixes 405 Method Not Allowed errors
 */

const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3')
require('dotenv').config({ path: '.env.local' })

const BUCKET_NAME = 'vibration-fit-client-storage'
const REGION = process.env.AWS_REGION || 'us-east-2'

// Initialize S3 client
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

// CORS configuration for VibrationFit
const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: [
        'http://localhost:3000',
        'https://vibrationfit.com',
        'https://www.vibrationfit.com',
        'https://*.vercel.app',
      ],
      ExposeHeaders: [
        'ETag',
        'x-amz-server-side-encryption',
        'x-amz-request-id',
        'x-amz-id-2',
      ],
      MaxAgeSeconds: 3600,
    },
  ],
}

async function getCurrentCors() {
  try {
    console.log('📋 Fetching current CORS configuration...\n')
    const command = new GetBucketCorsCommand({ Bucket: BUCKET_NAME })
    const response = await s3Client.send(command)
    return response.CORSRules
  } catch (error) {
    if (error.name === 'NoSuchCORSConfiguration') {
      console.log('⚠️  No CORS configuration found (this is expected)\n')
      return null
    }
    throw error
  }
}

async function applyCors() {
  try {
    console.log('🚀 Applying CORS configuration to S3 bucket...')
    console.log(`   Bucket: ${BUCKET_NAME}`)
    console.log(`   Region: ${REGION}\n`)

    const command = new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: corsConfiguration,
    })

    await s3Client.send(command)
    console.log('✅ CORS configuration applied successfully!\n')
    return true
  } catch (error) {
    console.error('❌ Failed to apply CORS configuration:', error.message)
    return false
  }
}

async function verifyCors() {
  try {
    console.log('🔍 Verifying CORS configuration...\n')
    const rules = await getCurrentCors()
    
    if (!rules || rules.length === 0) {
      console.log('❌ CORS configuration not found after applying')
      return false
    }

    console.log('✅ CORS Rules Applied:')
    rules.forEach((rule, index) => {
      console.log(`\n   Rule ${index + 1}:`)
      console.log(`   - Allowed Methods: ${rule.AllowedMethods.join(', ')}`)
      console.log(`   - Allowed Origins: ${rule.AllowedOrigins.join(', ')}`)
      console.log(`   - Allowed Headers: ${rule.AllowedHeaders.join(', ')}`)
      console.log(`   - Expose Headers: ${rule.ExposeHeaders?.join(', ') || 'None'}`)
      console.log(`   - Max Age: ${rule.MaxAgeSeconds}s`)
    })
    console.log()
    return true
  } catch (error) {
    console.error('❌ Failed to verify CORS configuration:', error.message)
    return false
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  VibrationFit S3 CORS Configuration Fix')
  console.log('═══════════════════════════════════════════════════════\n')

  // Check credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials not found in .env.local')
    console.error('   Please ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set\n')
    process.exit(1)
  }

  console.log('✓ AWS credentials loaded')
  console.log(`✓ Target bucket: ${BUCKET_NAME}`)
  console.log(`✓ Region: ${REGION}\n`)

  // Show current CORS configuration
  const currentCors = await getCurrentCors()
  if (currentCors) {
    console.log('📋 Current CORS configuration:')
    console.log(JSON.stringify(currentCors, null, 2))
    console.log()
  }

  // Apply new CORS configuration
  const applied = await applyCors()
  if (!applied) {
    console.error('\n❌ Failed to apply CORS configuration. Please check:')
    console.error('   1. AWS credentials have S3 permissions')
    console.error('   2. Bucket name is correct')
    console.error('   3. Region is correct\n')
    process.exit(1)
  }

  // Wait a moment for AWS to propagate
  console.log('⏳ Waiting for AWS to propagate changes (2 seconds)...\n')
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Verify the configuration
  const verified = await verifyCors()
  
  if (verified) {
    console.log('═══════════════════════════════════════════════════════')
    console.log('  ✅ CORS Configuration Applied Successfully!')
    console.log('═══════════════════════════════════════════════════════\n')
    console.log('What this means:')
    console.log('  ✓ Browser can now upload files directly to S3')
    console.log('  ✓ 405 errors should be resolved')
    console.log('  ✓ Large file uploads will be faster\n')
    console.log('Next steps:')
    console.log('  1. Test upload in your app (may take 1-2 min to fully propagate)')
    console.log('  2. Check browser console for "✅ Presigned upload successful"')
    console.log('  3. No more automatic fallbacks needed!\n')
  } else {
    console.log('⚠️  Configuration applied but verification failed')
    console.log('   This may be due to AWS propagation delay')
    console.log('   Try testing your app in 1-2 minutes\n')
  }
}

// Run the script
main().catch(error => {
  console.error('\n❌ Unexpected error:', error)
  process.exit(1)
})

