# ElevenLabs TTS Integration (Archived)

**Status:** Experimental - Removed from production  
**Date Archived:** December 6, 2025  
**Reason:** Cost concerns - ElevenLabs Turbo v2.5 costs $0.15/1K chars vs OpenAI TTS at $0.015/1K chars (10x more expensive)

## What This Contains

This folder contains the complete ElevenLabs text-to-speech integration that was built and tested for VibrationFit.

### Features Implemented
- ✅ ElevenLabs API integration (Turbo v2.5 model)
- ✅ Voice cloning functionality
- ✅ Pre-made ElevenLabs voices (Rachel, Clyde, etc.)
- ✅ Cost tracking and estimation
- ✅ Single section testing
- ✅ Batch generation with ElevenLabs

### Cost Comparison
| Provider | Cost per 1K chars | Full Vision (30K) | Notes |
|----------|------------------|-------------------|-------|
| **OpenAI TTS** | $0.015 | $0.45 | Currently in production |
| **ElevenLabs Turbo v2.5** | $0.15 | $4.49 | 10x more expensive |
| **ElevenLabs Multilingual v2** | $0.30 | $8.97 | 20x more expensive |

### What Was Removed
1. ElevenLabs API calls (`synthesizeWithElevenLabs`)
2. Voice cloning UI and database tables
3. ElevenLabs voice selection in audio generation
4. Test single section feature (ElevenLabs-specific)
5. Model switching logic (Turbo v2.5 vs Multilingual v2)

### Files Archived
- `audioService-with-elevenlabs.ts` - Full audio service with ElevenLabs
- `test-single-section-route.ts` - API route for testing single sections
- `voice-cloning-schema.sql` - Database schema for voice clones
- `elevenlabs-voices.ts` - List of pre-made ElevenLabs voices

### If You Want to Restore
1. Copy `audioService-with-elevenlabs.ts` back to `src/lib/services/audioService.ts`
2. Apply the voice cloning migration
3. Update the audio generation UI to include ElevenLabs voices
4. Restore the test-single-section endpoint

### Key Learnings
- ElevenLabs voice quality is excellent (especially for cloned voices)
- Cost is prohibitive for production use at scale
- Single section testing feature was valuable for cost estimation
- Cache-busting with timestamps is necessary for CDN
- Unique filenames prevent CloudFront caching issues

### Migration Notes
After removal, the system defaults to:
- OpenAI TTS for all audio generation
- Voices: alloy, echo, fable, onyx, nova, shimmer
- Cost: ~$0.45 per full vision (30K characters)

