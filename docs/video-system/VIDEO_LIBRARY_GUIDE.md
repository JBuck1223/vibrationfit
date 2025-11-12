# 🎬 VibrationFit Video Library Guide

## 🚀 **Your Setup is PERFECT!**

You already have:
- ✅ **S3 bucket** with CloudFront CDN
- ✅ **Custom domain:** `media.vibrationfit.com`
- ✅ **Lightning-fast delivery** worldwide
- ✅ **Enhanced Video component** with tracking

## 📁 **Recommended Video Library Structure**

```
media.vibrationfit.com/
├── videos/
│   ├── intro/
│   │   ├── intro-video-1080p.mp4    # High quality
│   │   ├── intro-video-720p.mp4     # Medium quality  
│   │   ├── intro-video-480p.mp4     # Low quality (mobile)
│   │   └── intro-poster.jpg         # Thumbnail
│   ├── courses/
│   │   ├── course-preview-1080p.mp4
│   │   ├── course-preview-720p.mp4
│   │   ├── course-preview-480p.mp4
│   │   └── course-poster.jpg
│   ├── training/
│   │   ├── training-video-1080p.mp4
│   │   ├── training-video-720p.mp4
│   │   ├── training-video-480p.mp4
│   │   └── training-poster.jpg
│   └── marketing/
│       ├── testimonials-1080p.mp4
│       ├── testimonials-720p.mp4
│       ├── testimonials-480p.mp4
│       └── testimonials-poster.jpg
```

## 🎯 **Usage Examples**

### **Basic Video with Auto Quality:**
```tsx
<Video 
  src="https://media.vibrationfit.com/videos/intro/intro-video.mp4"
  poster="https://media.vibrationfit.com/videos/intro/intro-poster.jpg"
  trackingId="intro-video"
  quality="auto"
/>
```

### **Lead Generation Video:**
```tsx
<Video 
  src="https://media.vibrationfit.com/videos/courses/course-preview.mp4"
  poster="https://media.vibrationfit.com/videos/courses/course-poster.jpg"
  trackingId="course-preview"
  showLeadCaptureAt={75}
  quality="high"
  onLeadCapture={(data) => {
    // Send to your CRM
    addToHubSpot(data.email, data.name)
  }}
/>
```

### **Mobile Optimized:**
```tsx
<Video 
  src="https://media.vibrationfit.com/videos/training/training-video.mp4"
  trackingId="training-video"
  quality="medium" // Automatically uses 720p
  preload="metadata"
/>
```

## 🚀 **Upload Your Videos**

### **Option 1: Use the Upload Script**
```bash
# Make script executable
chmod +x scripts/upload-videos.sh

# Run the script
./scripts/upload-videos.sh
```

### **Option 2: Manual Upload**
```bash
# Upload with multiple qualities
aws s3 cp intro-video.mp4 s3://media.vibrationfit.com/videos/intro/

# Set proper content type and caching
aws s3 cp intro-video.mp4 s3://media.vibrationfit.com/videos/intro/ \
  --content-type "video/mp4" \
  --cache-control "public, max-age=31536000"
```

### **Option 3: AWS Console**
1. Go to S3 Console
2. Navigate to your bucket
3. Create `videos/` folder structure
4. Upload your videos with proper naming

## 🎨 **Video Component Features**

### **Quality Options:**
- `auto` - Automatically selects best quality
- `high` - Uses 1080p version
- `medium` - Uses 720p version  
- `low` - Uses 480p version

### **Tracking Features:**
- **Milestone tracking:** 25%, 50%, 75%, 95%
- **Progress saving:** Resume where they left off
- **Lead capture:** Custom forms at any milestone
- **Analytics:** Play, pause, complete events

### **Performance Features:**
- **Preload control:** `metadata`, `auto`, `none`
- **Responsive design:** Mobile-first
- **VibrationFit styling:** Neon green progress bar

## 📊 **Analytics Integration**

### **Google Analytics 4:**
```tsx
onMilestoneReached={(milestone, time) => {
  gtag('event', 'video_milestone', {
    video_id: trackingId,
    milestone: milestone,
    current_time: time
  })
}}
```

### **HubSpot:**
```tsx
onLeadCapture={(data) => {
  fetch('/api/hubspot/contact', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      firstname: data.name,
      video_source: trackingId
    })
  })
}}
```

## 🎯 **Video Optimization Tips**

### **File Naming Convention:**
```
{video-name}-{quality}.mp4
intro-video-1080p.mp4
intro-video-720p.mp4
intro-video-480p.mp4
intro-poster.jpg
```

### **Compression Settings:**
```bash
# Optimal compression for web
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -crf 23 \
  -preset medium \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  output.mp4
```

### **Poster Image:**
```bash
# Create thumbnail at 5 seconds
ffmpeg -i input.mp4 -ss 00:00:05 -vframes 1 -q:v 2 poster.jpg
```

## 🚀 **Performance Benefits**

### **CloudFront CDN:**
- **400+ edge locations** worldwide
- **50-100ms** video start times
- **HTTP/2 & HTTP/3** support
- **Automatic compression**

### **Quality Selection:**
- **Auto quality** based on connection
- **Mobile optimization** with 480p
- **Bandwidth efficient** streaming
- **Progressive loading**

## 🎉 **You're All Set!**

Your existing `media.vibrationfit.com` setup is perfect for:
- ⚡ **Lightning-fast video delivery**
- 📊 **Complete engagement tracking**
- 💰 **Cost-effective hosting**
- 🎨 **Full VibrationFit branding**
- 📱 **Perfect mobile experience**

**Start uploading your videos and watch the engagement soar!** 🚀
