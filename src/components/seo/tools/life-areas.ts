/** The 12 Life Vision categories, as members see them in the app. */
export const LIFE_AREAS = [
  { key: 'fun', label: 'Fun', color: '#39FF14', prompt: 'Laughing until my face hurts, every week' },
  { key: 'health', label: 'Health', color: '#00FFFF', prompt: 'Waking up rested, strong and clear' },
  { key: 'travel', label: 'Travel', color: '#BF00FF', prompt: 'A month somewhere warm by the water' },
  { key: 'love', label: 'Love', color: '#FF0080', prompt: 'A partnership that feels like home' },
  { key: 'family', label: 'Family', color: '#FFFF00', prompt: 'Slow Sunday dinners with everyone I love' },
  { key: 'social', label: 'Social', color: '#39FF14', prompt: 'Friends who light me up and call me higher' },
  { key: 'home', label: 'Home', color: '#00FFFF', prompt: 'A home that feels like a deep exhale' },
  { key: 'work', label: 'Work', color: '#BF00FF', prompt: 'Work I love that pays me beautifully' },
  { key: 'money', label: 'Money', color: '#FFFF00', prompt: 'Paying every bill with ease and a smile' },
  { key: 'stuff', label: 'Stuff', color: '#FF0080', prompt: 'Owning only things I truly love' },
  { key: 'giving', label: 'Giving', color: '#39FF14', prompt: 'Giving generously without checking my account' },
  { key: 'spirituality', label: 'Spirituality', color: '#00FFFF', prompt: 'Feeling connected and guided every day' },
] as const

export type LifeAreaKey = (typeof LIFE_AREAS)[number]['key']
