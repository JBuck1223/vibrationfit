#!/usr/bin/env node

/**
 * Restore S3 objects from Glacier Flexible Retrieval back to STANDARD storage class.
 *
 * Usage:
 *   node scripts/aws/restore-glacier-objects.js scan         # List Glacier objects
 *   node scripts/aws/restore-glacier-objects.js restore      # Initiate restore requests
 *   node scripts/aws/restore-glacier-objects.js check        # Check restore status
 *   node scripts/aws/restore-glacier-objects.js finalize     # Copy restored objects back to STANDARD
 *
 * Workflow:
 *   1. Run `scan` to see how many objects are in Glacier
 *   2. Run `restore` to initiate restore (takes 3-5 hours for Flexible Retrieval)
 *   3. Run `check` periodically to see if restores have completed
 *   4. Run `finalize` to copy objects back to STANDARD storage class
 *   5. Remove the lifecycle policy in AWS Console to prevent re-archiving
 */

const { S3Client, ListObjectsV2Command, RestoreObjectCommand, HeadObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3')
require('dotenv').config({ path: '.env.local' })

const BUCKET = 'vibration-fit-client-storage'
const PREFIX = 'user-uploads/'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

async function listAllObjects(prefix) {
  const objects = []
  let continuationToken

  while (true) {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })

    const response = await s3.send(command)
    if (response.Contents) {
      objects.push(...response.Contents)
    }

    if (!response.IsTruncated) break
    continuationToken = response.NextContinuationToken
  }

  return objects
}

async function scan() {
  console.log(`Scanning ${BUCKET}/${PREFIX} for Glacier objects...\n`)

  const objects = await listAllObjects(PREFIX)
  const glacierObjects = objects.filter(obj =>
    obj.StorageClass === 'GLACIER' ||
    obj.StorageClass === 'DEEP_ARCHIVE' ||
    obj.StorageClass === 'GLACIER_IR'
  )
  const standardObjects = objects.filter(obj =>
    !obj.StorageClass || obj.StorageClass === 'STANDARD'
  )

  console.log(`Total objects: ${objects.length}`)
  console.log(`Standard:      ${standardObjects.length}`)
  console.log(`Glacier:       ${glacierObjects.length}`)

  if (glacierObjects.length > 0) {
    const byClass = {}
    glacierObjects.forEach(obj => {
      const cls = obj.StorageClass
      byClass[cls] = (byClass[cls] || 0) + 1
    })
    console.log('\nBreakdown by storage class:')
    Object.entries(byClass).forEach(([cls, count]) => {
      console.log(`  ${cls}: ${count}`)
    })

    const totalSizeMB = glacierObjects.reduce((sum, obj) => sum + (obj.Size || 0), 0) / 1024 / 1024
    console.log(`\nTotal Glacier size: ${totalSizeMB.toFixed(2)} MB`)

    console.log('\nSample Glacier objects (first 10):')
    glacierObjects.slice(0, 10).forEach(obj => {
      console.log(`  ${obj.Key} (${(obj.Size / 1024).toFixed(1)} KB, ${obj.StorageClass})`)
    })

    console.log(`\nRun 'node scripts/aws/restore-glacier-objects.js restore' to initiate restoration.`)
  } else {
    console.log('\nNo Glacier objects found. All objects are accessible.')
  }
}

async function restore() {
  console.log(`Initiating restore for Glacier objects in ${BUCKET}/${PREFIX}...\n`)

  const objects = await listAllObjects(PREFIX)
  const glacierObjects = objects.filter(obj =>
    obj.StorageClass === 'GLACIER' ||
    obj.StorageClass === 'DEEP_ARCHIVE' ||
    obj.StorageClass === 'GLACIER_IR'
  )

  if (glacierObjects.length === 0) {
    console.log('No Glacier objects found.')
    return
  }

  console.log(`Found ${glacierObjects.length} Glacier objects. Starting restore requests...\n`)

  let restored = 0
  let alreadyRestoring = 0
  let errors = 0

  for (const obj of glacierObjects) {
    try {
      const command = new RestoreObjectCommand({
        Bucket: BUCKET,
        Key: obj.Key,
        RestoreRequest: {
          Days: 7,
          GlacierJobParameters: {
            Tier: 'Standard', // 3-5 hours; use 'Expedited' for 1-5 min (more expensive)
          },
        },
      })

      await s3.send(command)
      restored++

      if (restored % 50 === 0) {
        console.log(`  Progress: ${restored}/${glacierObjects.length} restore requests sent`)
      }
    } catch (err) {
      if (err.Code === 'RestoreAlreadyInProgress' || err.name === 'RestoreAlreadyInProgress') {
        alreadyRestoring++
      } else {
        errors++
        if (errors <= 5) {
          console.error(`  Error restoring ${obj.Key}: ${err.message}`)
        }
      }
    }
  }

  console.log(`\nRestore requests complete:`)
  console.log(`  New restores initiated: ${restored}`)
  console.log(`  Already restoring:      ${alreadyRestoring}`)
  console.log(`  Errors:                 ${errors}`)
  console.log(`\nRestores typically take 3-5 hours for Glacier Flexible Retrieval.`)
  console.log(`Run 'node scripts/aws/restore-glacier-objects.js check' to monitor progress.`)
}

async function check() {
  console.log(`Checking restore status for Glacier objects in ${BUCKET}/${PREFIX}...\n`)

  const objects = await listAllObjects(PREFIX)
  const glacierObjects = objects.filter(obj =>
    obj.StorageClass === 'GLACIER' ||
    obj.StorageClass === 'DEEP_ARCHIVE' ||
    obj.StorageClass === 'GLACIER_IR'
  )

  if (glacierObjects.length === 0) {
    console.log('No Glacier objects found. All objects may have been finalized already.')
    return
  }

  let restored = 0
  let inProgress = 0
  let notStarted = 0
  let errors = 0

  const batchSize = 20
  for (let i = 0; i < glacierObjects.length; i += batchSize) {
    const batch = glacierObjects.slice(i, i + batchSize)

    await Promise.all(batch.map(async (obj) => {
      try {
        const head = await s3.send(new HeadObjectCommand({
          Bucket: BUCKET,
          Key: obj.Key,
        }))

        if (head.Restore) {
          if (head.Restore.includes('ongoing-request="false"')) {
            restored++
          } else if (head.Restore.includes('ongoing-request="true"')) {
            inProgress++
          }
        } else {
          notStarted++
        }
      } catch (err) {
        errors++
      }
    }))

    if ((i + batchSize) % 200 === 0) {
      console.log(`  Checked ${Math.min(i + batchSize, glacierObjects.length)}/${glacierObjects.length}...`)
    }
  }

  console.log(`\nRestore status (${glacierObjects.length} Glacier objects):`)
  console.log(`  Restore complete (ready to finalize): ${restored}`)
  console.log(`  Restore in progress:                  ${inProgress}`)
  console.log(`  Not yet started:                      ${notStarted}`)
  console.log(`  Errors checking:                      ${errors}`)

  if (restored > 0 && inProgress === 0 && notStarted === 0) {
    console.log(`\nAll restores complete! Run 'node scripts/aws/restore-glacier-objects.js finalize' to move back to STANDARD.`)
  } else if (restored > 0) {
    console.log(`\n${restored} objects ready. You can run 'finalize' now for those, or wait for all to complete.`)
  } else if (inProgress > 0) {
    console.log(`\nRestores still in progress. Check again in 1-2 hours.`)
  }
}

async function finalize() {
  console.log(`Finalizing: copying restored Glacier objects back to STANDARD in ${BUCKET}/${PREFIX}...\n`)

  const objects = await listAllObjects(PREFIX)
  const glacierObjects = objects.filter(obj =>
    obj.StorageClass === 'GLACIER' ||
    obj.StorageClass === 'DEEP_ARCHIVE' ||
    obj.StorageClass === 'GLACIER_IR'
  )

  if (glacierObjects.length === 0) {
    console.log('No Glacier objects found. Everything is already STANDARD.')
    return
  }

  let finalized = 0
  let notReady = 0
  let errors = 0

  for (const obj of glacierObjects) {
    try {
      const head = await s3.send(new HeadObjectCommand({
        Bucket: BUCKET,
        Key: obj.Key,
      }))

      if (!head.Restore || !head.Restore.includes('ongoing-request="false"')) {
        notReady++
        continue
      }

      await s3.send(new CopyObjectCommand({
        Bucket: BUCKET,
        Key: obj.Key,
        CopySource: `${BUCKET}/${encodeURIComponent(obj.Key)}`,
        StorageClass: 'STANDARD',
        MetadataDirective: 'COPY',
      }))

      finalized++

      if (finalized % 50 === 0) {
        console.log(`  Progress: ${finalized} objects moved to STANDARD`)
      }
    } catch (err) {
      errors++
      if (errors <= 5) {
        console.error(`  Error finalizing ${obj.Key}: ${err.message}`)
      }
    }
  }

  console.log(`\nFinalization complete:`)
  console.log(`  Moved to STANDARD: ${finalized}`)
  console.log(`  Not ready yet:     ${notReady}`)
  console.log(`  Errors:            ${errors}`)

  if (notReady > 0) {
    console.log(`\n${notReady} objects not yet restored. Run 'check' then 'finalize' again later.`)
  }

  if (finalized > 0) {
    console.log(`\nIMPORTANT: Remove the S3 lifecycle policy in AWS Console to prevent re-archiving!`)
    console.log(`  1. Go to S3 > vibration-fit-client-storage > Management > Lifecycle rules`)
    console.log(`  2. Delete or disable the rule transitioning objects to Glacier`)
  }
}

const action = process.argv[2]

switch (action) {
  case 'scan':
    scan().catch(console.error)
    break
  case 'restore':
    restore().catch(console.error)
    break
  case 'check':
    check().catch(console.error)
    break
  case 'finalize':
    finalize().catch(console.error)
    break
  default:
    console.log('Usage: node scripts/aws/restore-glacier-objects.js <action>')
    console.log('')
    console.log('Actions:')
    console.log('  scan      - List how many objects are in Glacier')
    console.log('  restore   - Initiate restore requests (takes 3-5 hours)')
    console.log('  check     - Check restore progress')
    console.log('  finalize  - Copy restored objects back to STANDARD')
    console.log('')
    console.log('Workflow: scan -> restore -> (wait 3-5 hrs) -> check -> finalize')
}
