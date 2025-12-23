# Flexible Audio Mixing - Setup Guide

**Quick setup guide for the new flexible audio mixing system.**

## Step 1: Run the Migration

```bash
cd /Users/jordanbuckingham/Desktop/vibrationfit
supabase db push
```

This will:
- ✅ Create `background_tracks` table
- ✅ Create `mix_ratios` table
- ✅ Seed 10 background tracks
- ✅ Seed 10 mix ratio presets
- ✅ Set up RLS policies

## Step 2: Verify Tables

```bash
supabase db diff --linked
```

Should show no differences if migration applied successfully.

## Step 3: Test the UI

1. Navigate to: `/life-vision/[id]/audio/generate`
2. You should see:
   - **Step 1:** Select Base Voice (unchanged)
   - **Step 2:** Create Custom Mix (NEW!)
     - Background track selector with categories
     - Mix ratio selector with 10 presets

## Step 4: Upload Background Tracks (Optional)

If you want to add real audio files (the migration uses placeholder URLs):

```bash
# Upload to S3
aws s3 cp Ocean-Waves-1.mp3 s3://vibration-fit-client-storage/site-assets/audio/mixing-tracks/

# Update database with correct URL
psql -h [your-supabase-host] -U postgres -d postgres
UPDATE background_tracks 
SET file_url = 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-1.mp3'
WHERE name = 'ocean-waves-1';
```

## What Changed

### Database
- **New tables:** `background_tracks`, `mix_ratios`
- **Old table:** `audio_variants` (still exists for backwards compatibility)

### API Routes
- **New:** `/api/audio/generate-custom-mix` - Generates custom mixes
- **New:** `/api/audio/mix-custom` - Mixes individual tracks
- **Old:** `/api/audio/generate` - Still works for old variants
- **Old:** `/api/audio/mix` - Still works for old variants

### UI
- **Page:** `/life-vision/[id]/audio/generate`
- **New section:** Step 2 now shows track + ratio selectors
- **Old section:** Still visible for backwards compatibility

## Testing Checklist

- [ ] Migration runs without errors
- [ ] Tables created with correct schema
- [ ] 10 background tracks seeded
- [ ] 10 mix ratios seeded
- [ ] UI shows track selector with categories
- [ ] UI shows ratio selector with presets
- [ ] Can select a track and ratio
- [ ] Generate button is enabled when selections made
- [ ] Generation creates batch and redirects to queue
- [ ] Mixed audio appears in audio_tracks table

## Troubleshooting

### Migration fails
```bash
# Check current schema
supabase db diff --linked

# Reset if needed (CAUTION: loses data)
supabase db reset
```

### Tables not showing in UI
```bash
# Check RLS policies
supabase db diff --linked --schema public

# Verify data
psql -c "SELECT COUNT(*) FROM background_tracks;"
psql -c "SELECT COUNT(*) FROM mix_ratios;"
```

### Audio files not loading
- Verify S3 bucket permissions (public read)
- Check CloudFront distribution
- Verify URLs in `background_tracks.file_url`

## Next Steps

1. **Upload Real Audio Files**
   - Replace placeholder URLs with actual S3 files
   - Test playback in browser

2. **Add More Tracks**
   - Upload new files to S3
   - Insert into `background_tracks` table

3. **Customize Ratios**
   - Add/remove ratios in `mix_ratios` table
   - Update sort_order for preferred ordering

4. **Test End-to-End**
   - Generate voice-only track
   - Create custom mix
   - Verify mixed audio plays correctly

## Support

If you encounter issues:
1. Check migration file: `supabase/migrations/20251223161528_flexible_audio_mixing.sql`
2. Check docs: `docs/features/FLEXIBLE_AUDIO_MIXING_SYSTEM.md`
3. Check logs: CloudWatch (Lambda), Supabase (database), Browser console (client)

