# Audio Player Components Guide

## Overview

VibrationFit now includes powerful audio player components designed to work seamlessly with life vision audio tracks. The components are built with mobile-first responsive design and follow all VibrationFit design system patterns.

## Components

### 1. AudioPlayer (Individual Track Player)

A single track audio player with full controls, progress tracking, and volume management.

**Features:**
- Play/Pause controls with visual feedback
- Progress bar with seek functionality
- Volume control (slider on desktop, toggle on mobile)
- Time display (current / duration)
- Auto-advance to next track
- Track info display (title, artist)
- Mobile-optimized controls

**Usage:**

```tsx
import { AudioPlayer, type AudioTrack } from '@/lib/design-system'

const track: AudioTrack = {
  id: '1',
  title: 'Forward - Your Life Vision',
  artist: 'VibrationFit AI',
  duration: 180, // in seconds
  url: 'https://media.vibrationfit.com/audio.mp3',
  thumbnail: 'https://media.vibrationfit.com/thumbnail.jpg' // optional
}

<AudioPlayer 
  track={track}
  showInfo={true}
  autoPlay={false}
  onTrackEnd={() => console.log('Track ended')}
/>
```

**Props:**
- `track` (required): AudioTrack object with id, title, artist, duration, url
- `showInfo` (optional): Show track title and artist (default: true)
- `autoPlay` (optional): Auto-play on mount (default: false)
- `onTrackEnd` (optional): Callback when track finishes
- `className` (optional): Additional CSS classes

### 2. PlaylistPlayer (Multi-Track Player)

A full-featured playlist player with shuffle, repeat modes, and queue management.

**Features:**
- Full playlist navigation (shuffle, repeat modes)
- Previous/Next track controls
- Track selection from list
- Repeat modes: off, all, one
- Shuffle playback
- Volume control
- Current track info with thumbnail
- Playlist visualization with active track highlighting

**Usage:**

```tsx
import { PlaylistPlayer, type AudioTrack } from '@/lib/design-system'

const tracks: AudioTrack[] = [
  {
    id: '1',
    title: 'Forward - Your Life Vision',
    artist: 'VibrationFit AI',
    duration: 180,
    url: 'https://media.vibrationfit.com/audio1.mp3'
  },
  {
    id: '2',
    title: 'Health & Vitality',
    artist: 'VibrationFit AI',
    duration: 210,
    url: 'https://media.vibrationfit.com/audio2.mp3'
  }
]

<PlaylistPlayer 
  tracks={tracks}
  autoPlay={false}
/>
```

**Props:**
- `tracks` (required): Array of AudioTrack objects
- `autoPlay` (optional): Auto-play first track (default: false)
- `className` (optional): Additional CSS classes

## AudioTrack Interface

```typescript
interface AudioTrack {
  id: string           // Unique identifier
  title: string       // Track title
  artist: string      // Artist/creator name
  duration: number    // Duration in seconds
  url: string         // Audio file URL
  thumbnail?: string  // Optional thumbnail URL
}
```

## Design System Integration

Both components follow VibrationFit design system patterns:

### Colors
- Primary Green (#39FF14): Play buttons, active states
- Secondary Teal (#14B8A6): Hover states, secondary actions
- Accent Purple (#8B5CF6): Premium features

### Responsive Design
- Mobile-first approach
- Touch-friendly controls (44px+ touch targets)
- Responsive text sizing
- Adaptive layouts (mobile vs desktop)

### Animations
- Smooth hover effects (translate-y)
- Active state transitions (300ms)
- Loading states with spinners

## Mobile Optimization

### AudioPlayer
- Play button: 48px touch target on mobile
- Volume control: Hidden on mobile, shown on desktop
- Progress bar: Full-width, large touch area
- Time display: Responsive text size

### PlaylistPlayer
- Controls: Smaller on mobile, larger on desktop
- Playlist: Scrollable with proper spacing
- Volume: Collapsible on mobile
- Active track: Clear visual feedback

## Example: Life Vision Audio

```tsx
'use client'
import { PlaylistPlayer, AudioPlayer, type AudioTrack } from '@/lib/design-system'

export default function LifeVisionAudioPage({ visionId }: { visionId: string }) {
  const tracks: AudioTrack[] = [
    {
      id: visionId + '-intro',
      title: 'Forward - Your Life Vision',
      artist: 'VibrationFit AI',
      duration: 180,
      url: `https://media.vibrationfit.com/life-vision/${visionId}/forward.mp3`
    },
    {
      id: visionId + '-health',
      title: 'Health & Vitality',
      artist: 'VibrationFit AI',
      duration: 210,
      url: `https://media.vibrationfit.com/life-vision/${visionId}/health.mp3`
    },
    {
      id: visionId + '-money',
      title: 'Money & Abundance',
      artist: 'VibrationFit AI',
      duration: 195,
      url: `https://media.vibrationfit.com/life-vision/${visionId}/money.mp3`
    }
  ]

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Life Vision Audio</h1>
      <PlaylistPlayer tracks={tracks} />
    </div>
  )
}
```

## Keyboard Accessibility

Both components support keyboard navigation:

- **Space**: Play/Pause
- **Arrow Left/Right**: Previous/Next track
- **M**: Mute/Unmute
- **Arrow Up/Down**: Volume control
- **Enter**: Activate controls

## Browser Compatibility

Both components use native HTML5 audio and are compatible with:
- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes

- Audio elements are lazy-loaded
- Progress updates are throttled for performance
- Multiple instances don't interfere with each other
- Volume control uses native audio API

## Upcoming Features

- Waveform visualization
- Playback speed control
- Cross-device synchronization
- Background playback (mobile)
- AirPlay/Chromecast support

## Design System Showcase

Visit `/design-system` to see both components in action with live examples and code snippets.

## File Locations

- Components: `/src/lib/design-system/components.tsx`
- Showcase: `/src/app/design-system/page.tsx`
- Type Definitions: Included in components file

---

**Built with:** React, TypeScript, Tailwind CSS, VibrationFit Design System
**Last Updated:** January 2025

