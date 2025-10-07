// Discovery Path Question Templates for All 14 Life Vision Categories
// Based on VibrationFit Discovery Path specification

export interface DiscoveryOption {
  id: string
  label: string
  sublabel: string
  icon: string
  internalNote?: string
  inputField?: boolean
}

export interface DiscoveryQuestion {
  step: number
  questionText: string
  aiMessage: string
  options: DiscoveryOption[]
  purpose: string
  strategy: string
}

export const DISCOVERY_TEMPLATES: Record<string, DiscoveryQuestion[]> = {
  // FORWARD - Opening statement and intention
  forward: [
    {
      step: 1,
      questionText: "What aspects of your vision journey call to you?",
      aiMessage: "Let's discover what excites you about creating your life vision! 🌟\n\nNo pressure - just choose what resonates. Pick as many as you want:",
      options: [
        { id: "clarity", label: "Getting Clear", sublabel: "knowing what I want", icon: "🎯", internalNote: "Values direction and focus" },
        { id: "transformation", label: "Transformation", sublabel: "becoming the best version of myself", icon: "✨", internalNote: "Growth-oriented" },
        { id: "manifestation", label: "Manifestation", sublabel: "creating my dream life", icon: "🌈", internalNote: "Action and results focused" },
        { id: "alignment", label: "Alignment", sublabel: "living in harmony with my true self", icon: "🧘", internalNote: "Authenticity-focused" },
        { id: "purpose", label: "Purpose", sublabel: "discovering my path and meaning", icon: "🌟", internalNote: "Meaning-seeker" },
        { id: "freedom", label: "Freedom", sublabel: "living life on my terms", icon: "🦅", internalNote: "Autonomy-focused" },
        { id: "other", label: "Something else", sublabel: "tell me more", icon: "💭", inputField: true }
      ],
      purpose: "Understand their primary motivation for vision work",
      strategy: "See what aspects resonate - reveals their deeper why"
    }
  ],

  // FUN / RECREATION
  fun: [
    {
      step: 1,
      questionText: "What kind of fun calls to you?",
      aiMessage: "Let's discover what lights you up! 🧭\n\nNo pressure - just choose what resonates. Pick as many as you want:",
      options: [
        { id: "physical", label: "Physical/Active", sublabel: "sports, dancing, hiking, movement", icon: "🏃", internalNote: "Body-based joy, kinesthetic" },
        { id: "creative", label: "Creative", sublabel: "art, music, writing, building", icon: "🎨", internalNote: "Expression-based joy, making things" },
        { id: "social", label: "Social", sublabel: "games, parties, hanging with friends", icon: "👥", internalNote: "Connection-based joy, community" },
        { id: "adventurous", label: "Adventurous", sublabel: "exploring, trying new things", icon: "🌄", internalNote: "Discovery-based joy, novelty" },
        { id: "relaxing", label: "Relaxing", sublabel: "reading, nature, gentle activities", icon: "🌿", internalNote: "Peace-based joy, restoration" },
        { id: "learning", label: "Learning", sublabel: "classes, workshops, new skills", icon: "📚", internalNote: "Growth-based joy, mastery" },
        { id: "playful", label: "Playful", sublabel: "silly, childlike, spontaneous", icon: "🎈", internalNote: "Freedom-based joy, no rules" },
        { id: "other", label: "Something else", sublabel: "tell me more", icon: "✨", inputField: true }
      ],
      purpose: "Cast wide net - see what resonates. Track selections for pattern.",
      strategy: "Neutral state - help them discover through choice. Follow their energy."
    }
  ],

  // TRAVEL / ADVENTURE
  travel: [
    {
      step: 1,
      questionText: "What kind of adventures excite you?",
      aiMessage: "Let's explore what makes your spirit come alive! ✈️\n\nChoose the types of travel and adventure that call to you:",
      options: [
        { id: "nature", label: "Nature Adventures", sublabel: "mountains, beaches, wilderness", icon: "🏔️", internalNote: "Connection to earth and outdoors" },
        { id: "cultural", label: "Cultural Immersion", sublabel: "new cities, different cultures", icon: "🌍", internalNote: "Learning through experience" },
        { id: "spiritual", label: "Spiritual Journeys", sublabel: "sacred sites, retreats, pilgrimages", icon: "🕉️", internalNote: "Seeking deeper meaning" },
        { id: "adventure", label: "Thrill & Adventure", sublabel: "activities, challenges, adrenaline", icon: "🪂", internalNote: "Physical excitement and challenge" },
        { id: "relaxation", label: "Relaxation Retreats", sublabel: "resorts, spas, peaceful escapes", icon: "🌴", internalNote: "Rest and rejuvenation" },
        { id: "foodie", label: "Culinary Journeys", sublabel: "food tours, cooking experiences", icon: "🍜", internalNote: "Exploration through taste" },
        { id: "spontaneous", label: "Spontaneous Road Trips", sublabel: "just go, no fixed plans", icon: "🚗", internalNote: "Freedom and spontaneity" },
        { id: "other", label: "Something else", sublabel: "tell me more", icon: "✨", inputField: true }
      ],
      purpose: "Understand their travel style and what they seek in adventures",
      strategy: "Reveal what they're seeking - connection, challenge, peace, culture, etc."
    }
  ],

  // Continue with other categories...
  // (I'll add more in the next iteration based on user feedback)
}

// Helper to get drill-down questions based on initial selections
export function getDrillDownQuestions(category: string, selections: string[]): Record<string, DiscoveryOption[]> {
  // Example for Fun / Recreation
  if (category === 'fun' || category === 'Fun / Recreation') {
    const drillDowns: Record<string, DiscoveryOption[]> = {}

    if (selections.includes('creative')) {
      drillDowns['creative_types'] = [
        { id: "visual", label: "Visual arts", sublabel: "painting, drawing, photography", icon: "🎨" },
        { id: "music", label: "Music", sublabel: "playing, singing, listening live", icon: "🎵" },
        { id: "writing", label: "Writing", sublabel: "journaling, stories, poetry", icon: "✍️" },
        { id: "crafts", label: "Crafts/Making", sublabel: "pottery, woodwork, DIY", icon: "🛠️" },
        { id: "performance", label: "Performance", sublabel: "dance, theater, improv", icon: "🎭" },
        { id: "digital", label: "Digital creation", sublabel: "design, video, coding", icon: "💻" },
        { id: "other_creative", label: "Other", sublabel: "", icon: "✨", inputField: true }
      ]
    }

    if (selections.includes('adventurous')) {
      drillDowns['adventure_types'] = [
        { id: "nature", label: "Nature adventures", sublabel: "hiking, camping, exploring outdoors", icon: "🏕️" },
        { id: "travel", label: "Travel", sublabel: "new cities, new countries", icon: "✈️" },
        { id: "urban", label: "Urban exploration", sublabel: "new neighborhoods, hidden spots", icon: "🏙️" },
        { id: "spontaneous", label: "Spontaneous day trips", sublabel: "just go somewhere new", icon: "🚗" },
        { id: "cultural", label: "Cultural experiences", sublabel: "festivals, museums, events", icon: "🎭" },
        { id: "food", label: "Food adventures", sublabel: "new restaurants, cooking new cuisines", icon: "🍜" },
        { id: "other_adventure", label: "Other", sublabel: "", icon: "✨", inputField: true }
      ]
    }

    if (selections.includes('playful')) {
      drillDowns['playful_expression'] = [
        { id: "games", label: "Games", sublabel: "board games, video games, party games", icon: "🎮" },
        { id: "silly", label: "Being silly", sublabel: "not taking things seriously, laughing", icon: "😄" },
        { id: "spontaneous_play", label: "Spontaneous", sublabel: "unplanned, following impulses", icon: "🎈" },
        { id: "childlike", label: "Childlike activities", sublabel: "playgrounds, building forts, etc.", icon: "🧸" },
        { id: "experimental", label: "Experimenting", sublabel: "trying new things without judgment", icon: "🔬" },
        { id: "other_playful", label: "Other", sublabel: "", icon: "✨", inputField: true }
      ]
    }

    return drillDowns
  }

  return {}
}

// Rhythm/Integration question (Step 3 for most categories)
export const RHYTHM_QUESTION: DiscoveryQuestion = {
  step: 3,
  questionText: "When you imagine your ideal week with all this woven in, how does it show up?",
  aiMessage: "One last question to make this really YOU:",
  options: [
    { id: "daily", label: "Little moments daily", sublabel: "Small doses of joy throughout the week", icon: "☀️", internalNote: "Wants fun integrated into everyday" },
    { id: "weekly", label: "Weekly rituals", sublabel: "Dedicated time each week for hobbies", icon: "📅", internalNote: "Wants structure around fun time" },
    { id: "spontaneous_rhythm", label: "Spontaneous bursts", sublabel: "Whenever inspiration strikes, follow it", icon: "✨", internalNote: "Wants total freedom, no schedule" },
    { id: "weekends", label: "Weekend adventures", sublabel: "Weekdays for work, weekends for play", icon: "🎉", internalNote: "Wants clear separation" },
    { id: "balanced", label: "All of the above!", sublabel: "Different rhythms for different activities", icon: "🌈", internalNote: "Wants variety in how fun shows up" }
  ],
  purpose: "Solidify how this integrates into regular life",
  strategy: "Help them envision rhythm/frequency - this is where energy solidifies"
}

