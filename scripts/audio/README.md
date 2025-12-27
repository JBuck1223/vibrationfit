# Audio Track Generators

Generate healing frequency audio tracks for the VibrationFit audio mixing system.

## 🚀 Quick Start (All-in-One)

Generate and upload all tracks with one command:

```bash
cd scripts/audio
./generate-and-upload.sh
```

This will:
1. ✅ Generate 40 Solfeggio Binaural tracks (~10 min)
2. ✅ Upload them to S3 automatically
3. ✅ Output SQL statements for database
4. ✅ Verify everything uploaded correctly

Then just copy-paste the SQL into Supabase and you're done!

---

## 📚 Detailed Guides

## What Are Binaural Beats?

Binaural beats are an auditory illusion created when two slightly different frequencies are played in each ear:

- **Left ear:** 200 Hz
- **Right ear:** 204 Hz  
- **Brain perceives:** 4 Hz (Theta wave)

The brain "hears" the difference between the two frequencies, which can influence brainwave patterns.

## Frequency Ranges & Effects

| Wave Type | Frequency | Mental State |
|-----------|-----------|--------------|
| **Delta** | 0.5-4 Hz | Deep sleep, healing, regeneration |
| **Theta** | 4-8 Hz | Deep relaxation, meditation, creativity |
| **Alpha** | 8-13 Hz | Relaxed focus, learning, light meditation |
| **Beta (Low)** | 13-18 Hz | Alert focus, active thinking |
| **Beta (High)** | 18-30 Hz | Intense concentration, problem solving |
| **Gamma** | 30-100 Hz | Peak cognitive function, heightened awareness |

## Prerequisites

### FFmpeg Required

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows (using Chocolatey)
choco install ffmpeg
```

## Usage

### Option A: All-in-One Script (Recommended)

```bash
./generate-and-upload.sh
```

Generates and uploads everything automatically!

### Option B: Step-by-Step

#### 1. Generate Files

```bash
# Basic binaural beats
node generate-binaural-beats.js

# OR Solfeggio binaural (36 combinations + 4 journeys)
node generate-solfeggio-binaural.js
```

This will create:
```
output/binaural/
├── delta.mp3       # 2 Hz beat (deep sleep)
├── theta.mp3       # 6 Hz beat (meditation)
├── alpha.mp3       # 10 Hz beat (relaxed focus)
├── beta-low.mp3    # 15 Hz beat (alert focus)
├── beta-high.mp3   # 20 Hz beat (concentration)
└── gamma.mp3       # 40 Hz beat (peak awareness)
```

Each file is:
- ⏱️ 5 minutes long (will loop in mixing)
- 🔉 -30dB volume (subtle, won't overpower voice/background)
- 🎧 Stereo with different frequencies in each ear
- 💾 128kbps MP3 (pure tones don't need high bitrate)

#### 2. Upload to S3

```bash
# Solfeggio Binaural tracks
aws s3 cp output/solfeggio-binaural/ \
  s3://vibration-fit-client-storage/site-assets/audio/mixing-tracks/solfeggio/binaural/ \
  --recursive \
  --content-type "audio/mpeg" \
  --cache-control "max-age=31536000"

# OR Basic binaural beats
aws s3 cp output/binaural/ \
  s3://vibration-fit-client-storage/site-assets/audio/binaural/ \
  --recursive
```

#### 3. Add to Database

The scripts output SQL statements. Copy-paste into Supabase SQL editor:

```sql
INSERT INTO public.audio_background_tracks (name, display_name, category, file_url, description, sort_order)
VALUES ('binaural-theta', 'Binaural Theta (4-8 Hz)', 'binaural', 
        'https://media.vibrationfit.com/site-assets/audio/binaural/theta.mp3', 
        'Deep relaxation, meditation, creativity', 100);
-- ... etc
```

#### 4. Verify in Admin Panel

Navigate to `/admin/audio-mixer` → Background Tracks tab

You should see your tracks with category badges:
- 🌊 "binaural" - Basic binaural beats
- 🎵 "solfeggio" - Solfeggio + Binaural combinations  
- 🌊 "journey" - Progressive journey tracks

---

## 📁 What Gets Generated

### Solfeggio Binaural System (40 files)
- **36 Static Combinations:** Every Solfeggio (9) × Every Brainwave (4)
  - `174hz-delta.mp3` through `963hz-beta.mp3`
- **4 Journey Tracks:** Progressive transitions
  - `journey-sleep-journey.mp3` (7 min)
  - `journey-meditation-journey.mp3` (7 min)
  - `journey-focus-journey.mp3` (7 min)
  - `journey-healing-journey.mp3` (7 min)

### Basic Binaural Beats (6 files)
- `delta.mp3` - 2 Hz (Deep sleep)
- `theta.mp3` - 6 Hz (Meditation)
- `alpha.mp3` - 10 Hz (Relaxed focus)
- `beta-low.mp3` - 15 Hz (Alert)
- `beta-high.mp3` - 20 Hz (Intense focus)
- `gamma.mp3` - 40 Hz (Peak awareness)

---

## Customization

Edit the `BINAURAL_BEATS` array in `generate-binaural-beats.js`:

```javascript
{
  name: 'custom',              // Filename
  displayName: 'Custom (X Hz)', // UI name
  targetFrequency: 5.0,        // Beat frequency (Hz)
  baseFrequency: 200,          // Carrier frequency (Hz)
  duration: 300,               // Length in seconds
  description: 'Custom effect'
}
```

### Parameters Explained

**targetFrequency:** The beat you want the brain to perceive
- Lower = more relaxing (Delta 0.5-4 Hz)
- Higher = more alert (Beta 13-30 Hz)

**baseFrequency:** The carrier wave (usually 200-400 Hz)
- Lower carrier = warmer, deeper sound
- Higher carrier = brighter, clearer sound

**duration:** How long the file is
- Current: 5 minutes (will loop when mixed with longer tracks)
- Longer = less looping = smoother experience

## Using in Mixes

Once uploaded, binaural beats can be used as background tracks:

### Option 1: Pure Binaural
```
Voice: 90%
Background (Binaural Theta): 10%
```

### Option 2: Layered
```
Voice: 70%
Background (Ocean Waves): 25%
Binaural (Theta): 5%
```
*(Requires 3-layer mixing - see advanced setup)*

## Advanced: Custom Frequencies

Want specific frequencies? Edit the script:

```javascript
// For a specific 7.83 Hz Schumann Resonance
{
  name: 'schumann',
  displayName: 'Schumann Resonance (7.83 Hz)',
  targetFrequency: 7.83,
  baseFrequency: 200,
  duration: 600,  // 10 minutes
  description: 'Earth\'s natural frequency'
}
```

## Troubleshooting

### "FFmpeg not found"
Install FFmpeg (see Prerequisites above)

### "Permission denied"
Make script executable:
```bash
chmod +x generate-binaural-beats.js
```

### "Low volume"
Binaural beats are intentionally quiet (-30dB). They should be subtle background tones. If mixing with voice/music, they'll be audible but not overpowering.

### "Doesn't sound like anything"
Binaural beats need headphones! The effect only works when each ear hears a different frequency. On speakers, the frequencies mix in the air before reaching your ears.

## Science & Safety

### How It Works
The brain creates the "beat" through neural oscillations. This is called "frequency following response" - brainwaves naturally sync to external rhythms.

### Safety Notes
- ✅ Generally safe for most people
- ⚠️ Not recommended for those with epilepsy or seizure disorders
- ⚠️ May affect alertness (don't drive while using delta/theta beats)
- ⚠️ Start with shorter sessions (5-10 minutes)
- ✅ Effects are temporary and wear off after listening stops

### Best Practices
1. **Use headphones** - Required for binaural effect
2. **Low volume** - Should be barely audible
3. **Consistent use** - Effects build over multiple sessions
4. **Match activity** - Delta for sleep, Beta for focus, etc.

## Examples for VibrationFit

### Morning Routine
```
Track: "Morning Motivation"
Voice: 80% (affirmations)
Background: 15% (Uplifting Energy)
Binaural: 5% (Beta 20 Hz)
= Energized, focused start
```

### Meditation
```
Track: "Deep Meditation"
Voice: 60% (guidance)
Background: 30% (Calm Ocean)
Binaural: 10% (Theta 6 Hz)
= Deep relaxation
```

### Sleep
```
Track: "Sleep Journey"
Voice: 10% (whispered affirmations)
Background: 80% (Gentle Rain)
Binaural: 10% (Delta 2 Hz)
= Deep, restorative sleep
```

## Further Reading

- [Binaural Beats on Wikipedia](https://en.wikipedia.org/wiki/Binaural_beats)
- [Brainwave Entrainment Research](https://pubmed.ncbi.nlm.nih.gov/?term=binaural+beats)
- [Monroe Institute](https://www.monroeinstitute.org/) - Pioneers in binaural research

## License

MIT - Use freely in VibrationFit

