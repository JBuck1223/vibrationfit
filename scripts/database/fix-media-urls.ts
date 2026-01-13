/**
 * Fix Media URLs: Convert Direct S3 URLs to CDN URLs
 * 
 * Problem: Some media items have direct S3 URLs stored in the database:
 *   ❌ https://vibration-fit-client-storage.s3.amazonaws.com/path/file.mp4
 *   ❌ https://vibration-fit-client-storage.s3.us-east-2.amazonaws.com/path/file.mp4
 * 
 * These cause "Access Denied" errors because the bucket requires CloudFront access.
 * 
 * Solution: Convert all S3 URLs to CDN URLs:
 *   ✅ https://media.vibrationfit.com/path/file.mp4
 * 
 * Usage:
 *   tsx scripts/database/fix-media-urls.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const CDN_URL = 'https://media.vibrationfit.com'

/**
 * Convert S3 URL to CDN URL
 */
function convertToCDN(url: string | null): string | null {
  if (!url) return null

  // Already a CDN URL
  if (url.startsWith(CDN_URL)) {
    return url
  }

  // Extract S3 key from various S3 URL formats
  const s3Patterns = [
    /https:\/\/vibration-fit-client-storage\.s3\.amazonaws\.com\/(.+)/,
    /https:\/\/vibration-fit-client-storage\.s3\.us-east-2\.amazonaws\.com\/(.+)/,
    /https:\/\/vibration-fit-client-storage\.s3-us-east-2\.amazonaws\.com\/(.+)/,
    /https:\/\/s3\.amazonaws\.com\/vibration-fit-client-storage\/(.+)/,
    /https:\/\/s3\.us-east-2\.amazonaws\.com\/vibration-fit-client-storage\/(.+)/,
    /https:\/\/s3-us-east-2\.amazonaws\.com\/vibration-fit-client-storage\/(.+)/,
  ]

  for (const pattern of s3Patterns) {
    const match = url.match(pattern)
    if (match) {
      const key = decodeURIComponent(match[1]) // Decode URL-encoded characters
      return `${CDN_URL}/${key}`
    }
  }

  // If no pattern matches, assume it's already valid or return as-is
  console.warn(`⚠️  Could not parse URL: ${url}`)
  return url
}

/**
 * Fix URLs in intensive_responses table
 */
async function fixIntensiveResponseUrls() {
  console.log('\n📋 Checking intensive_responses table...')

  const { data: responses, error } = await supabase
    .from('intensive_responses')
    .select('id, testimonial_video_url, calibration_recording_url, produced_video_url, produced_video_thumbnail_url')

  if (error) {
    console.error('❌ Error fetching intensive responses:', error)
    return
  }

  if (!responses || responses.length === 0) {
    console.log('✅ No intensive responses found')
    return
  }

  console.log(`📊 Found ${responses.length} intensive responses`)

  let updatedCount = 0

  for (const response of responses) {
    const updates: Record<string, string | null> = {}
    let hasChanges = false

    // Check testimonial_video_url
    if (response.testimonial_video_url) {
      const converted = convertToCDN(response.testimonial_video_url)
      if (converted !== response.testimonial_video_url) {
        updates.testimonial_video_url = converted
        hasChanges = true
        console.log(`   🔄 testimonial_video_url: ${response.testimonial_video_url.substring(0, 60)}...`)
        console.log(`      → ${converted?.substring(0, 60)}...`)
      }
    }

    // Check calibration_recording_url
    if (response.calibration_recording_url) {
      const converted = convertToCDN(response.calibration_recording_url)
      if (converted !== response.calibration_recording_url) {
        updates.calibration_recording_url = converted
        hasChanges = true
        console.log(`   🔄 calibration_recording_url: ${response.calibration_recording_url.substring(0, 60)}...`)
        console.log(`      → ${converted?.substring(0, 60)}...`)
      }
    }

    // Check produced_video_url
    if (response.produced_video_url) {
      const converted = convertToCDN(response.produced_video_url)
      if (converted !== response.produced_video_url) {
        updates.produced_video_url = converted
        hasChanges = true
        console.log(`   🔄 produced_video_url: ${response.produced_video_url.substring(0, 60)}...`)
        console.log(`      → ${converted?.substring(0, 60)}...`)
      }
    }

    // Check produced_video_thumbnail_url
    if (response.produced_video_thumbnail_url) {
      const converted = convertToCDN(response.produced_video_thumbnail_url)
      if (converted !== response.produced_video_thumbnail_url) {
        updates.produced_video_thumbnail_url = converted
        hasChanges = true
        console.log(`   🔄 produced_video_thumbnail_url: ${response.produced_video_thumbnail_url.substring(0, 60)}...`)
        console.log(`      → ${converted?.substring(0, 60)}...`)
      }
    }

    // Apply updates if any changes detected
    if (hasChanges) {
      const { error: updateError } = await supabase
        .from('intensive_responses')
        .update(updates)
        .eq('id', response.id)

      if (updateError) {
        console.error(`   ❌ Failed to update response ${response.id}:`, updateError)
      } else {
        console.log(`   ✅ Updated response ${response.id}`)
        updatedCount++
      }
    }
  }

  console.log(`\n✅ Updated ${updatedCount} intensive responses with CDN URLs`)
}

/**
 * Fix URLs in journal_entries table
 */
async function fixJournalEntryUrls() {
  console.log('\n📋 Checking journal_entries for media URLs...')
  
  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('id, image_urls, thumbnail_urls, audio_recordings')

  if (error) {
    console.error('❌ Error fetching journal entries:', error)
    return
  }

  if (!entries || entries.length === 0) {
    console.log('✅ No journal entries found')
    return
  }

  console.log(`📊 Found ${entries.length} journal entries`)

  let updatedCount = 0

  for (const entry of entries) {
    const updates: Record<string, any> = {}
    let hasChanges = false

    // Fix image_urls array
    if (entry.image_urls && Array.isArray(entry.image_urls) && entry.image_urls.length > 0) {
      const fixedUrls = entry.image_urls.map((url: string) => convertToCDN(url)).filter(Boolean)
      if (JSON.stringify(fixedUrls) !== JSON.stringify(entry.image_urls)) {
        updates.image_urls = fixedUrls
        hasChanges = true
        console.log(`   🔄 Entry ${entry.id}: Fixed ${fixedUrls.length} image URLs`)
      }
    }

    // Fix thumbnail_urls JSONB
    if (entry.thumbnail_urls && Array.isArray(entry.thumbnail_urls) && entry.thumbnail_urls.length > 0) {
      const fixedThumbs = entry.thumbnail_urls.map((url: string) => convertToCDN(url)).filter(Boolean)
      if (JSON.stringify(fixedThumbs) !== JSON.stringify(entry.thumbnail_urls)) {
        updates.thumbnail_urls = fixedThumbs
        hasChanges = true
      }
    }

    // Fix audio_recordings JSONB (contains {url, transcript, ...} objects)
    if (entry.audio_recordings && Array.isArray(entry.audio_recordings) && entry.audio_recordings.length > 0) {
      const fixedRecordings = entry.audio_recordings.map((rec: any) => {
        if (rec.url) {
          const fixedUrl = convertToCDN(rec.url)
          if (fixedUrl !== rec.url) {
            return { ...rec, url: fixedUrl }
          }
        }
        return rec
      })
      if (JSON.stringify(fixedRecordings) !== JSON.stringify(entry.audio_recordings)) {
        updates.audio_recordings = fixedRecordings
        hasChanges = true
      }
    }

    // Apply updates
    if (hasChanges) {
      const { error: updateError } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', entry.id)

      if (updateError) {
        console.error(`   ❌ Failed to update entry ${entry.id}:`, updateError)
      } else {
        console.log(`   ✅ Updated entry ${entry.id}`)
        updatedCount++
      }
    }
  }

  console.log(`\n✅ Updated ${updatedCount} journal entries with CDN URLs`)
}

/**
 * Fix URLs in vision_board_items table
 */
async function fixVisionBoardUrls() {
  console.log('\n📋 Checking vision_board_items for media URLs...')
  
  const { data: items, error } = await supabase
    .from('vision_board_items')
    .select('id, image_url, actualized_image_url')

  if (error) {
    console.error('❌ Error fetching vision board items:', error)
    return
  }

  if (!items || items.length === 0) {
    console.log('✅ No vision board items found')
    return
  }

  console.log(`📊 Found ${items.length} vision board items`)

  let updatedCount = 0

  for (const item of items) {
    const updates: Record<string, string | null> = {}
    let hasChanges = false

    // Fix image_url
    if (item.image_url) {
      const converted = convertToCDN(item.image_url)
      if (converted !== item.image_url) {
        updates.image_url = converted
        hasChanges = true
        console.log(`   🔄 Item ${item.id}: Fixed image_url`)
      }
    }

    // Fix actualized_image_url
    if (item.actualized_image_url) {
      const converted = convertToCDN(item.actualized_image_url)
      if (converted !== item.actualized_image_url) {
        updates.actualized_image_url = converted
        hasChanges = true
      }
    }

    // Apply updates
    if (hasChanges) {
      const { error: updateError } = await supabase
        .from('vision_board_items')
        .update(updates)
        .eq('id', item.id)

      if (updateError) {
        console.error(`   ❌ Failed to update item ${item.id}:`, updateError)
      } else {
        console.log(`   ✅ Updated item ${item.id}`)
        updatedCount++
      }
    }
  }

  console.log(`\n✅ Updated ${updatedCount} vision board items with CDN URLs`)
}

/**
 * Fix URLs in life_vision_categories table (has recordings JSONB)
 */
async function fixLifeVisionUrls() {
  console.log('\n📋 Checking life_vision_categories for media URLs...')
  
  const { data: categories, error } = await supabase
    .from('life_vision_categories')
    .select('id, image_urls, recordings')

  if (error) {
    console.error('❌ Error fetching life vision categories:', error)
    return
  }

  if (!categories || categories.length === 0) {
    console.log('✅ No life vision categories found')
    return
  }

  console.log(`📊 Found ${categories.length} life vision categories`)

  let updatedCount = 0

  for (const category of categories) {
    const updates: Record<string, any> = {}
    let hasChanges = false

    // Fix image_urls array
    if (category.image_urls && Array.isArray(category.image_urls) && category.image_urls.length > 0) {
      const fixedUrls = category.image_urls.map((url: string) => convertToCDN(url)).filter(Boolean)
      if (JSON.stringify(fixedUrls) !== JSON.stringify(category.image_urls)) {
        updates.image_urls = fixedUrls
        hasChanges = true
        console.log(`   🔄 Category ${category.id}: Fixed ${fixedUrls.length} image URLs`)
      }
    }

    // Fix recordings JSONB (contains {url, transcript, ...} objects)
    if (category.recordings && Array.isArray(category.recordings) && category.recordings.length > 0) {
      const fixedRecordings = category.recordings.map((rec: any) => {
        if (rec.url) {
          const fixedUrl = convertToCDN(rec.url)
          if (fixedUrl !== rec.url) {
            return { ...rec, url: fixedUrl }
          }
        }
        return rec
      })
      if (JSON.stringify(fixedRecordings) !== JSON.stringify(category.recordings)) {
        updates.recordings = fixedRecordings
        hasChanges = true
      }
    }

    // Apply updates
    if (hasChanges) {
      const { error: updateError } = await supabase
        .from('life_vision_categories')
        .update(updates)
        .eq('id', category.id)

      if (updateError) {
        console.error(`   ❌ Failed to update category ${category.id}:`, updateError)
      } else {
        console.log(`   ✅ Updated category ${category.id}`)
        updatedCount++
      }
    }
  }

  console.log(`\n✅ Updated ${updatedCount} life vision categories with CDN URLs`)
}

/**
 * Fix URLs in user_profiles table (progress_photos field)
 */
async function fixUserProfileUrls() {
  console.log('\n📋 Checking user_profiles for media URLs...')
  
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, progress_photos')

  if (error) {
    console.error('❌ Error fetching user profiles:', error)
    return
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ No user profiles found')
    return
  }

  console.log(`📊 Found ${profiles.length} user profiles`)

  let updatedCount = 0

  for (const profile of profiles) {
    const updates: Record<string, any> = {}
    let hasChanges = false

    // Fix progress_photos array
    if (profile.progress_photos && Array.isArray(profile.progress_photos) && profile.progress_photos.length > 0) {
      const fixedUrls = profile.progress_photos.map((url: string) => convertToCDN(url)).filter(Boolean)
      if (JSON.stringify(fixedUrls) !== JSON.stringify(profile.progress_photos)) {
        updates.progress_photos = fixedUrls
        hasChanges = true
        console.log(`   🔄 Profile ${profile.id}: Fixed ${fixedUrls.length} progress photos`)
        profile.progress_photos.forEach((url: string, idx: number) => {
          const fixed = fixedUrls[idx]
          if (url !== fixed) {
            console.log(`      ${url.substring(0, 70)}...`)
            console.log(`      → ${fixed?.substring(0, 70)}...`)
          }
        })
      }
    }

    // Apply updates
    if (hasChanges) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', profile.id)

      if (updateError) {
        console.error(`   ❌ Failed to update profile ${profile.id}:`, updateError)
      } else {
        console.log(`   ✅ Updated profile ${profile.id}`)
        updatedCount++
      }
    }
  }

  console.log(`\n✅ Updated ${updatedCount} user profiles with CDN URLs`)
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Starting Media URL Fix Script')
  console.log(`📡 Supabase URL: ${supabaseUrl}`)
  console.log(`🌐 CDN URL: ${CDN_URL}`)
  
  try {
    await fixIntensiveResponseUrls()
    await fixJournalEntryUrls()
    await fixVisionBoardUrls()
    await fixLifeVisionUrls()
    await fixUserProfileUrls()
    
    console.log('\n✅ Media URL fix completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Test media playback in your app')
    console.log('   2. Check browser console for any remaining Access Denied errors')
    console.log('   3. If issues persist, check CloudFront distribution is working')
    console.log('   4. Verify CloudFront distribution: https://media.vibrationfit.com')
    
  } catch (error) {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  }
}

main()
