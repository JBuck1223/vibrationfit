// SIMPLE BROWSER CONSOLE CHECK - Copy and paste this:

// Method 1: Check localStorage (easiest)
console.log('=== SUPABASE AUTH TOKEN ===')
const authKeys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'))
authKeys.forEach(k => {
  const value = localStorage.getItem(k)
  try {
    // Try to parse if it's JSON
    const parsed = JSON.parse(value)
    console.log(k, parsed)
    if (parsed?.user) {
      console.log('User:', parsed.user)
      console.log('User Metadata:', parsed.user.user_metadata)
      console.log('First Name:', parsed.user.user_metadata?.first_name)
      console.log('Full Name:', parsed.user.user_metadata?.full_name)
    }
  } catch {
    console.log(k, value?.substring(0, 100))
  }
})

// Method 2: Check Network Tab (easier!)
// 1. Open DevTools → Network tab
// 2. Filter by "user" 
// 3. Look for request to: /auth/v1/user
// 4. Click it → Response tab → See user object

// Method 3: If Supabase client is available on window
// Check if app exposes it:
console.log('window.supabase:', window.supabase)
console.log('window.__SUPABASE__:', window.__SUPABASE__)

