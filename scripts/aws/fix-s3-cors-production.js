#!/usr/bin/env node

/**
 * Fix S3 CORS for Production - More Permissive
 * Allows all HTTPS origins temporarily to fix 405 errors
 */

const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3')
require('dotenv').config({ path: '.env.local' })

const BUCKET_NAME = 'vibration-fit-client-storage'
const REGION = process.env.AWS_REGION || 'us-east-2'

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

// More permissive CORS - allows all HTTPS origins
const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: ['*'], // Allow all origins temporarily to fix 405
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

async function applyCors() {
  console.log('🚀 Applying MORE PERMISSIVE CORS configuration...')
  console.log('   This allows ALL origins (*)  to fix 405 errors')
  console.log(`   Bucket: ${BUCKET_NAME}\n`)

  const command = new PutBucketCorsCommand({
    Bucket: BUCKET_NAME,
    CORSConfiguration: corsConfiguration,
  })

  await s3Client.send(command)
  console.log('✅ CORS configuration applied!\n')
}

async function verifyCors() {
  console.log('🔍 Verifying CORS configuration...\n')
  const command = new GetBucketCorsCommand({ Bucket: BUCKET_NAME })
  const response = await s3Client.send(command)
  
  console.log('Current CORS Rules:')
  console.log(JSON.stringify(response.CORSRules, null, 2))
}

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  VibrationFit S3 CORS - Production Fix')
  console.log('═══════════════════════════════════════════\n')

  await applyCors()
  await new Promise(resolve => setTimeout(resolve, 2000))
  await verifyCors()

  console.log('\n✅ CORS now allows ALL origins')
  console.log('   This should fix 405 errors immediately!')
  console.log('   Test your 4-image upload now!\n')
}

main().catch(error => {
  console.error('\n❌ Error:', error)
  process.exit(1)
})

