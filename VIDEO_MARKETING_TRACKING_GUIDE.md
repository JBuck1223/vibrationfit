# Video Marketing Tracking Guide 📊

## Overview

Your video player now includes **two powerful marketing features**:

1. **Progress Tracking** - Remembers where users left off
2. **Milestone Tracking** - Tracks 25%, 50%, 75%, 95% view completion for marketing platforms

## Features Included

### 1. Progress Tracking (Resume Playback) ✅

Users can pick up exactly where they left off, even after closing the browser.

**How it works:**
- Saves current timestamp to localStorage every second
- On page reload, automatically resumes from saved position
- Unique tracking ID per video prevents conflicts

**Usage:**
```tsx
<OptimizedVideo
  url={videoUrl}
  trackingId="unique-video-id"
  saveProgress={true}  // Default: true
/>
```

**Example:**
```tsx
// Homepage hero video
<OptimizedVideo
  url="https://media.vibrationfit.com/site-assets/video/marketing/hero/intro-video.mp4"
  trackingId="homepage-hero-video"
  saveProgress={true}
/>

// User watches 2:30 of 5:00 video
// User closes browser
// User returns → Video starts at 2:30 ✅
```

### 2. Milestone Tracking (Marketing Analytics) ✅

Automatically fires callbacks at 25%, 50%, 75%, and 95% completion for marketing platforms.

**How it works:**
- Tracks video progress in real-time
- Fires callback once per milestone (no duplicates)
- Provides milestone percentage and current timestamp

**Usage:**
```tsx
<OptimizedVideo
  url={videoUrl}
  trackingId="marketing-video"
  onMilestoneReached={(milestone, currentTime) => {
    // milestone: 25 | 50 | 75 | 95
    // currentTime: seconds into video
    console.log(`User watched ${milestone}% (${currentTime}s)`)
    
    // Send to marketing platform
    fbq('track', 'VideoView', { milestone, currentTime })
  }}
/>
```

## Marketing Platform Integration

### Facebook Pixel

Track video engagement for retargeting and optimization:

```tsx
<OptimizedVideo
  url={videoUrl}
  trackingId="fb-marketing-video"
  onMilestoneReached={(milestone, time) => {
    // Standard Facebook Pixel event
    if (typeof fbq !== 'undefined') {
      fbq('track', 'VideoView', {
        video_title: 'Homepage Hero Video',
        video_milestone: milestone,
        video_duration: time
      })
    }
  }}
  onPlay={() => {
    if (typeof fbq !== 'undefined') {
      fbq('track', 'VideoPlay', {
        video_title: 'Homepage Hero Video'
      })
    }
  }}
  onComplete={() => {
    if (typeof fbq !== 'undefined') {
      fbq('track', 'VideoComplete', {
        video_title: 'Homepage Hero Video'
      })
    }
  }}
/>
```

### Google Analytics 4

Track video engagement for audience insights:

```tsx
<OptimizedVideo
  url={videoUrl}
  trackingId="ga-marketing-video"
  onMilestoneReached={(milestone, time) => {
    // Google Analytics 4 event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'video_progress', {
        video_title: 'Homepage Hero Video',
        video_milestone: milestone,
        video_current_time: time,
        video_provider: 'cloudfront'
      })
    }
  }}
  onPlay={() => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'video_start', {
        video_title: 'Homepage Hero Video'
      })
    }
  }}
  onComplete={() => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'video_complete', {
        video_title: 'Homepage Hero Video'
      })
    }
  }}
/>
```

### TikTok Pixel

Track video views for TikTok ads optimization:

```tsx
<OptimizedVideo
  url={videoUrl}
  trackingId="tiktok-marketing-video"
  onMilestoneReached={(milestone, time) => {
    if (typeof ttq !== 'undefined') {
      ttq.track('WatchVideo', {
        content_type: 'video',
        content_name: 'Homepage Hero Video',
        milestone: milestone,
        duration: time
      })
    }
  }}
/>
```

### Custom Analytics Platform

Send to your own analytics endpoint:

```tsx
<OptimizedVideo
  url={videoUrl}
  trackingId="custom-marketing-video"
  onMilestoneReached={async (milestone, time) => {
    try {
      await fetch('/api/analytics/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'video_milestone',
          video_id: 'homepage-hero',
          milestone,
          timestamp: time,
          user_id: userId,
          session_id: sessionId
        })
      })
    } catch (error) {
      console.error('Analytics error:', error)
    }
  }}
/>
```

## Real-World Examples

### Homepage Hero Video (Current Implementation)

```tsx
<OptimizedVideo
  url="https://media.vibrationfit.com/site-assets/video/marketing/hero/intro-video-active.mp4"
  thumbnailUrl="https://media.vibrationfit.com/site-assets/video/marketing/hero/intro-video-active-poster.jpg"
  context="hero"
  trackingId="homepage-hero-video"
  saveProgress={true}
  onMilestoneReached={(milestone, time) => {
    // Track milestone for marketing analytics
    console.log(`Video milestone: ${milestone}% at ${time}s`)
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
      fbq('track', 'VideoView', { milestone, time })
    }
    
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'video_progress', {
        video_title: 'Homepage Hero',
        milestone,
        time
      })
    }
  }}
  onPlay={() => {
    console.log('Hero video started playing')
    if (typeof fbq !== 'undefined') {
      fbq('track', 'VideoPlay')
    }
  }}
  onComplete={() => {
    console.log('Hero video completed')
    if (typeof fbq !== 'undefined') {
      fbq('track', 'VideoComplete')
    }
  }}
/>
```

### Sales Page Video

```tsx
<OptimizedVideo
  url="https://media.vibrationfit.com/site-assets/video/marketing/sales-page.mp4"
  trackingId="sales-page-video"
  saveProgress={true}
  onMilestoneReached={(milestone, time) => {
    // Track high-intent users who watch 75%+
    if (milestone >= 75) {
      // Add to high-intent retargeting audience
      if (typeof fbq !== 'undefined') {
        fbq('track', 'ViewContent', {
          content_type: 'video',
          content_name: 'Sales Page Video',
          value: milestone / 100, // 0.75 - 0.95
          currency: 'USD'
        })
      }
    }
  }}
  onComplete={() => {
    // User watched entire sales video - very high intent!
    if (typeof fbq !== 'undefined') {
      fbq('track', 'AddToCart', {
        content_type: 'video_completion',
        content_name: 'Sales Page Video'
      })
    }
  }}
/>
```

### Webinar Replay

```tsx
<OptimizedVideo
  url="https://media.vibrationfit.com/site-assets/video/webinar-replay.mp4"
  trackingId="webinar-replay"
  saveProgress={true}  // Important for long videos!
  onMilestoneReached={(milestone, time) => {
    // Track engagement throughout long webinar
    console.log(`Webinar progress: ${milestone}%`)
    
    // Send to CRM for lead scoring
    fetch('/api/crm/update-lead-score', {
      method: 'POST',
      body: JSON.stringify({
        user_email: userEmail,
        activity: 'webinar_view',
        engagement_level: milestone,
        points: milestone // 25, 50, 75, or 95 points
      })
    })
  }}
/>
```

## Retargeting Strategies

### Strategy 1: Engagement-Based Audiences

Create custom audiences based on video engagement:

```tsx
onMilestoneReached={(milestone, time) => {
  if (milestone === 25) {
    // Low engagement - general retargeting
    fbq('track', 'CustomEvent', { 
      audience: 'video_25_percent',
      intent: 'low'
    })
  }
  
  if (milestone === 50) {
    // Medium engagement - interested audience
    fbq('track', 'CustomEvent', { 
      audience: 'video_50_percent',
      intent: 'medium'
    })
  }
  
  if (milestone === 75) {
    // High engagement - warm audience
    fbq('track', 'CustomEvent', { 
      audience: 'video_75_percent',
      intent: 'high'
    })
  }
  
  if (milestone === 95) {
    // Very high engagement - hot audience
    fbq('track', 'CustomEvent', { 
      audience: 'video_95_percent',
      intent: 'very_high'
    })
  }
}
```

**Use these audiences for:**
- 25% viewers → General brand awareness ads
- 50% viewers → Feature highlight ads
- 75% viewers → Testimonial/proof ads
- 95% viewers → Direct offer/discount ads

### Strategy 2: Time-Based Retargeting

Track how long users watch:

```tsx
onMilestoneReached={(milestone, time) => {
  // Calculate watch time
  const watchMinutes = Math.floor(time / 60)
  
  if (watchMinutes >= 2) {
    // User watched 2+ minutes - highly engaged
    fbq('track', 'CustomEvent', {
      audience: 'engaged_video_viewer',
      watch_time_minutes: watchMinutes
    })
  }
}
```

### Strategy 3: Sequential Retargeting

Show different ads based on video completion:

```tsx
const [videoStage, setVideoStage] = useState<'intro' | 'features' | 'benefits' | 'cta'>('intro')

onMilestoneReached={(milestone, time) => {
  if (milestone === 25) {
    setVideoStage('features')
    fbq('track', 'CustomEvent', { stage: 'features' })
  } else if (milestone === 50) {
    setVideoStage('benefits')
    fbq('track', 'CustomEvent', { stage: 'benefits' })
  } else if (milestone === 75) {
    setVideoStage('cta')
    fbq('track', 'CustomEvent', { stage: 'cta' })
  }
}
```

## Progress Tracking Use Cases

### Long-Form Content

Perfect for webinars, courses, and tutorials:

```tsx
<OptimizedVideo
  url="https://media.vibrationfit.com/site-assets/video/course/lesson-1.mp4"
  trackingId="course-lesson-1"
  saveProgress={true}
  onMilestoneReached={(milestone, time) => {
    // Save progress to database
    fetch('/api/course/save-progress', {
      method: 'POST',
      body: JSON.stringify({
        lesson_id: 1,
        progress: milestone,
        timestamp: time
      })
    })
  }}
/>
```

### Sales Videos

Help users resume where they left off:

```tsx
<OptimizedVideo
  url="https://media.vibrationfit.com/site-assets/video/sales-video.mp4"
  trackingId="sales-video-main"
  saveProgress={true}
  onMilestoneReached={(milestone, time) => {
    // Track which section user reached
    if (milestone === 25) {
      console.log('User saw problem section')
    } else if (milestone === 50) {
      console.log('User saw solution section')
    } else if (milestone === 75) {
      console.log('User saw proof section')
    } else if (milestone === 95) {
      console.log('User saw CTA section')
    }
  }}
/>
```

## Testing Your Tracking

### 1. Console Logging (Current Implementation)

The homepage hero video currently logs to console:

```tsx
onMilestoneReached={(milestone, time) => {
  console.log(`Video milestone: ${milestone}% at ${time}s`)
}}
```

**To test:**
1. Open homepage
2. Open browser console (F12)
3. Play video
4. Watch console for milestone logs at 25%, 50%, 75%, 95%

### 2. Facebook Pixel Helper

Install Facebook Pixel Helper Chrome extension:
1. Install extension
2. Load page with video
3. Play video
4. Click extension icon to see fired events

### 3. Google Tag Assistant

Use Google Tag Assistant to verify GA4 events:
1. Install extension
2. Start recording
3. Play video
4. Check recorded events

## Best Practices

### 1. Unique Tracking IDs

Always use unique tracking IDs for each video:

```tsx
// ✅ Good
<OptimizedVideo trackingId="homepage-hero-2024" />
<OptimizedVideo trackingId="sales-page-intro" />
<OptimizedVideo trackingId="webinar-replay-jan-2024" />

// ❌ Bad (conflicts)
<OptimizedVideo trackingId="video" />
<OptimizedVideo trackingId="video" />
```

### 2. Conditional Tracking

Only track marketing videos, not user-generated content:

```tsx
// Marketing video - track everything
<OptimizedVideo
  url={marketingVideoUrl}
  trackingId="marketing-video"
  saveProgress={true}
  onMilestoneReached={trackMilestone}
/>

// User journal video - no tracking needed
<OptimizedVideo
  url={userVideoUrl}
  context="list"
  lazy={true}
  // No trackingId or callbacks
/>
```

### 3. Error Handling

Always wrap analytics calls in try-catch:

```tsx
onMilestoneReached={(milestone, time) => {
  try {
    if (typeof fbq !== 'undefined') {
      fbq('track', 'VideoView', { milestone, time })
    }
  } catch (error) {
    console.error('Analytics error:', error)
    // Don't let analytics errors break video playback
  }
}}
```

### 4. Privacy Compliance

Respect user privacy settings:

```tsx
const [hasConsent, setHasConsent] = useState(false)

onMilestoneReached={(milestone, time) => {
  if (hasConsent) {
    // Only track if user consented
    fbq('track', 'VideoView', { milestone, time })
  }
}}
```

## Complete Example: Marketing Landing Page

```tsx
'use client'

import { OptimizedVideo } from '@/components/OptimizedVideo'
import { useEffect, useState } from 'react'

export default function MarketingPage() {
  const [userId, setUserId] = useState<string>()
  
  useEffect(() => {
    // Get user ID from session/cookie
    setUserId(getUserId())
  }, [])

  const trackVideoMilestone = async (milestone: number, time: number) => {
    try {
      // Facebook Pixel
      if (typeof fbq !== 'undefined') {
        fbq('track', 'VideoView', {
          video_title: 'Sales Video',
          milestone,
          time
        })
      }

      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'video_progress', {
          video_title: 'Sales Video',
          milestone,
          time
        })
      }

      // Custom analytics
      await fetch('/api/analytics/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'video_milestone',
          video_id: 'sales-video',
          milestone,
          timestamp: time,
          user_id: userId
        })
      })

      // Update lead score in CRM
      if (milestone >= 75) {
        await fetch('/api/crm/update-lead', {
          method: 'POST',
          body: JSON.stringify({
            user_id: userId,
            engagement_score: milestone,
            intent: 'high'
          })
        })
      }
    } catch (error) {
      console.error('Tracking error:', error)
    }
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8">
        Transform Your Life with VibrationFit
      </h1>
      
      <OptimizedVideo
        url="https://media.vibrationfit.com/site-assets/video/marketing/sales-video.mp4"
        thumbnailUrl="https://media.vibrationfit.com/site-assets/video/marketing/sales-video-poster.jpg"
        context="single"
        trackingId="sales-video-main"
        saveProgress={true}
        onMilestoneReached={trackVideoMilestone}
        onPlay={() => {
          console.log('Video started')
          if (typeof fbq !== 'undefined') {
            fbq('track', 'VideoPlay')
          }
        }}
        onComplete={() => {
          console.log('Video completed')
          if (typeof fbq !== 'undefined') {
            fbq('track', 'VideoComplete')
          }
        }}
        className="w-full max-w-4xl mx-auto"
      />
      
      <div className="mt-8 text-center">
        <button className="bg-primary-500 text-white px-8 py-4 rounded-lg text-xl">
          Get Started Today
        </button>
      </div>
    </div>
  )
}
```

## Summary

✅ **Progress Tracking** - Users resume where they left off  
✅ **Milestone Tracking** - Track 25%, 50%, 75%, 95% completion  
✅ **Marketing Integration** - Facebook, Google, TikTok, custom platforms  
✅ **Retargeting Ready** - Create engagement-based audiences  
✅ **Privacy Compliant** - Conditional tracking with consent  
✅ **Error Handling** - Robust analytics that won't break playback  

**Your video player is now a powerful marketing tool!** 📊🎯



