# IndexedDB on Mobile - Storage Limits & Behavior

## Mobile Storage Limits:

### **iOS Safari (iPhone/iPad):**
- **Limit**: ~50MB - 1GB (depends on available space)
- **Behavior**: Uses device storage, not iCloud
- **Warning**: iOS will prompt user if app wants more than 50MB
- **Reality**: Usually allows up to available space, but warns after 50MB

### **Android Chrome:**
- **Limit**: 20% of total storage, or ~1-2GB typically
- **Behavior**: Uses app data storage
- **Warning**: Can clear data if device storage is low
- **Reality**: Usually 1-2GB available, sometimes more

### **Mobile Browsers (General):**
- **Average Available**: 500MB - 2GB per website
- **Depends On**: Available device storage
- **Worst Case**: iOS might limit to 50MB initially

---

## For Your Video Recordings:

### Video File Sizes:
- **1 minute of video**: ~10-50MB (depending on quality)
- **5 minutes**: ~50-250MB
- **10 minutes (max duration)**: ~100-500MB

### **Storage Analysis:**

#### Best Case Scenario (2GB available):
✅ Could store ~40+ recordings (10 min each)  
✅ More than enough for VIVA Life Vision flow  
✅ User unlikely to hit limit

#### Worst Case Scenario (50MB limit on iOS):
⚠️ Could store ~1-5 recordings (10 min each)  
⚠️ Would need to clear old recordings periodically  
⚠️ Should prompt user if getting close to limit

#### Realistic Scenario (500MB available):
✅ Could store ~10-20 recordings (10 min each)  
✅ Enough for multiple category recordings  
✅ Should be fine for typical use

---

## Mobile-Specific Considerations:

### **iOS Safari:**
```
- Starts with 50MB "soft limit"
- Prompts user: "This website wants to store data. Allow?"
- If allowed, can use more (up to available space)
- User can revoke permission anytime in Settings
```

### **Android Chrome:**
```
- No explicit permission prompt
- Uses storage automatically
- OS may clear if device storage is low (<10% free)
- More permissive than iOS
```

---

## Auto-Save Strategy for Mobile:

### **Recommended Approach:**

1. **Save Frequency:**
   - Audio: Every 30 seconds
   - Video: Every 20 seconds (or every 10MB)
   - Mobile: Same frequency is fine

2. **Storage Management:**
   - After successful upload to S3: Clear IndexedDB entry
   - Keep only "in progress" recordings
   - Clear old recordings after 7 days

3. **User Notifications:**
   - Show storage usage if > 80% of limit
   - Warn before starting new long recording
   - Option to clear old recordings

---

## Real-World Example:

### User Records 12 Categories (10 min each):
- **Total Size**: ~1.2GB - 6GB (worst case with high-quality video)
- **IndexedDB Usage**: Only stores "in progress" recordings
- **After Upload**: Cleared from IndexedDB
- **Peak Usage**: ~100-500MB at any time (just current recording)

**This is TOTALLY FINE** - well within mobile limits!

---

## Implementation Notes:

### **Detect Storage Quota:**
```javascript
// Check available storage
const estimate = await navigator.storage.estimate();
console.log('Available:', estimate.quota); // Total available
console.log('Used:', estimate.usage); // Currently used
console.log('Free:', estimate.quota - estimate.usage);
```

### **Handle Storage Errors:**
```javascript
try {
  await saveToIndexedDB(chunks);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Alert user, clear old recordings
    alert('Storage full! Please clear old recordings.');
  }
}
```

### **Mobile-Friendly Storage Strategy:**
1. Save chunks every 20-30 seconds
2. After upload completes: Clear immediately
3. Keep max 3 "in progress" recordings
4. Clear recordings older than 24 hours
5. Show storage usage warning if >80%

---

## Bottom Line:

**Mobile IndexedDB is SAME as desktop:**
- ✅ Same API
- ✅ Same behavior
- ✅ Mobile limits are usually MORE than enough
- ✅ Just need to manage storage (clear after upload)

**For VIVA Life Vision:**
- ✅ Store 1-2 recordings max at a time (current + maybe previous)
- ✅ Clear after successful S3 upload
- ✅ Should never hit storage limits
- ✅ Mobile users will be fine!

---

## Recommendation:

**Implementation Plan:**
1. Auto-save every 30 seconds (same for mobile/desktop)
2. Clear IndexedDB after successful upload
3. Show warning if storage > 80% full
4. Keep max 3 recordings in IndexedDB (clear oldest)
5. Works perfectly on mobile! ✅
