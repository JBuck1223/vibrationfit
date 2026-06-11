import { AssessmentQuestion } from '@/types/assessment'

// --- Helper functions for conditional logic ---

export function hasOnlyAdultChildren(profile: any): boolean {
  if (!profile?.children || !Array.isArray(profile.children) || profile.children.length === 0) return false
  const now = new Date()
  return profile.children.every((child: any) => {
    if (!child.birthday) return false
    const birthDate = new Date(child.birthday)
    const age = now.getFullYear() - birthDate.getFullYear()
    const monthDiff = now.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      return age - 1 >= 18
    }
    return age >= 18
  })
}

export function hasYoungChildren(profile: any): boolean {
  if (!profile?.children || !Array.isArray(profile.children) || profile.children.length === 0) return false
  const now = new Date()
  return profile.children.some((child: any) => {
    if (!child.birthday) return true
    const birthDate = new Date(child.birthday)
    const age = now.getFullYear() - birthDate.getFullYear()
    const monthDiff = now.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      return age - 1 < 18
    }
    return age < 18
  })
}

export function isRetired(profile: any): boolean {
  return profile?.employment_type === 'Retired'
}

export function isFreelancerOrSolo(profile: any): boolean {
  const type = profile?.employment_type
  return type === 'Freelancer' || type === 'Self-Employed' || type === 'Contractor'
}

export function isUnemployed(profile: any): boolean {
  const type = profile?.employment_type
  return type === 'Unemployed' || type === 'Job Seeking'
}

export function isNotSeekingRelationship(profile: any): boolean {
  return profile?.seeking_relationship === false
}

// --- Branch 1: Retired Work Questions ---

export const retiredWorkQuestions: AssessmentQuestion[] = [
  {
    id: 'work_retired_1',
    category: 'work',
    text: 'When you think about your life after working, what comes up?',
    options: [
      { text: 'Fulfilled — I\'ve built a life I love beyond my career', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Content — retirement suits me well', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed — some days are great, others feel purposeless', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Lost — I miss the identity and purpose work gave me', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Empty — I don\'t know who I am without my work', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Retired'
    }
  },
  {
    id: 'work_retired_2',
    category: 'work',
    text: 'How does your daily structure feel now that you set your own schedule?',
    options: [
      { text: 'Energizing — I wake up excited about what I\'ve created for myself', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Comfortable — I have a rhythm that works', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Inconsistent — some weeks flow, others drift', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Aimless — the days blur together without meaning', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Paralyzed — too much freedom feels overwhelming', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Retired'
    }
  },
  {
    id: 'work_retired_3',
    category: 'work',
    text: 'What\'s your relationship with free time like these days?',
    options: [
      { text: 'Abundant — I savor it and fill it with things I love', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Balanced — I enjoy leisure without guilt', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Uncertain — sometimes I feel I should be "doing more"', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Guilty — I struggle to relax without feeling unproductive', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Suffocating — there\'s too much of it and it haunts me', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Retired'
    }
  },
  {
    id: 'work_retired_4',
    category: 'work',
    text: 'How do you feel about staying engaged and relevant in the world?',
    options: [
      { text: 'Thriving — I contribute in new ways that light me up', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Connected — I stay current and involved in what matters to me', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Trying — I make efforts but sometimes feel out of touch', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Fading — the world moves on and I feel left behind', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Invisible — I feel irrelevant and forgotten', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Retired'
    }
  },
  {
    id: 'work_retired_5',
    category: 'work',
    text: 'When you reflect on your career and contributions, how do you feel?',
    options: [
      { text: 'Proud — I built something meaningful and my legacy lives on', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Satisfied — I did good work and can rest easy', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Ambivalent — parts were great, parts I wish I\'d done differently', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Regretful — I gave too much to work and missed what mattered', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Bitter — I feel unrecognized for what I contributed', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Retired'
    }
  },
  {
    id: 'work_retired_6',
    category: 'work',
    text: 'How is your social life since leaving the workplace?',
    options: [
      { text: 'Richer than ever — I\'ve deepened friendships and found new community', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Good — I maintain meaningful connections', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Smaller — I lost some work friendships but have a few solid ones', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Shrinking — I struggle to find connection outside of work', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Isolated — I lost my community when I left work', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Retired'
    }
  },
  {
    id: 'work_retired_7',
    category: 'work',
    text: 'How do you feel about your decision to retire?',
    options: [
      { text: 'Best decision I ever made — zero regrets', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Right call — it was time and I\'m glad I did it', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mostly fine — occasional doubt but generally at peace', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Uncertain — I wonder if I retired too early or for wrong reasons', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Regretful — I wish I could go back or find something meaningful again', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Retired'
    }
  }
]

// --- Branch 2: Freelancer/Solo Business Questions ---

export const freelanceWorkQuestions: AssessmentQuestion[] = [
  {
    id: 'work_freelance_1',
    category: 'work',
    text: 'How does your income flow feel as a solo operator?',
    options: [
      { text: 'Abundant — I\'ve built systems that create consistent, growing income', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Stable — I can predict my earnings and feel secure', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Inconsistent — feast-or-famine cycles I manage but don\'t love', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Stressful — I never know if next month will be okay', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Desperate — I\'m one bad month away from crisis', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Freelancer' || value === 'Self-Employed' || value === 'Contractor'
    }
  },
  {
    id: 'work_freelance_2',
    category: 'work',
    text: 'How well do you maintain boundaries between work and life?',
    options: [
      { text: 'Masterfully — I\'ve designed clear separation and honor it', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Well — I mostly shut off work and enjoy my personal time', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Trying — some weeks are balanced, others consume me', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Poorly — work bleeds into everything and I can\'t stop', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Nonexistent — I am my work, there is no separation', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Freelancer' || value === 'Self-Employed' || value === 'Contractor'
    }
  },
  {
    id: 'work_freelance_3',
    category: 'work',
    text: 'How does working solo affect your sense of connection?',
    options: [
      { text: 'I\'ve built community — I have peers, collaborators, and support', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Comfortable — I enjoy the solitude and connect when I choose', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed — sometimes I love it, sometimes I crave a team', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Lonely — I miss having colleagues and shared purpose', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Isolated — the loneliness is affecting my mental health', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Freelancer' || value === 'Self-Employed' || value === 'Contractor'
    }
  },
  {
    id: 'work_freelance_4',
    category: 'work',
    text: 'How does it feel being your own boss?',
    options: [
      { text: 'Liberating — the freedom fuels my best work and creativity', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Empowering — I love calling the shots even with challenges', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Double-edged — freedom is great but the weight of decisions is heavy', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Overwhelming — I\'m drowning in responsibility with no one to share it', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Crushing — I fantasize about someone else making decisions for me', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Freelancer' || value === 'Self-Employed' || value === 'Contractor'
    }
  },
  {
    id: 'work_freelance_5',
    category: 'work',
    text: 'How do you feel about pricing your work and client relationships?',
    options: [
      { text: 'Confident — I know my worth and attract clients who value me', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Good — I charge fairly and have mostly great client dynamics', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Uncertain — I second-guess my rates and sometimes feel undervalued', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Undervalued — I undercharge and attract clients who don\'t respect my work', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Degrading — I feel like I\'m begging for work and accepting crumbs', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Freelancer' || value === 'Self-Employed' || value === 'Contractor'
    }
  },
  {
    id: 'work_freelance_6',
    category: 'work',
    text: 'Where are you on the burnout spectrum right now?',
    options: [
      { text: 'Energized — I\'ve built sustainable rhythms and feel alive in my work', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Healthy — I manage my energy well and take real breaks', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Teetering — I push too hard sometimes but catch myself', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Burning — I\'m exhausted but can\'t stop because no one else will do it', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Burnt out — I\'m running on fumes and can\'t keep going like this', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Freelancer' || value === 'Self-Employed' || value === 'Contractor'
    }
  },
  {
    id: 'work_freelance_7',
    category: 'work',
    text: 'How do you feel about the future of your solo work?',
    options: [
      { text: 'Visionary — I\'m building toward something bigger and see the path clearly', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Content — I love what I do and don\'t need it to be more', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Unsure — I don\'t know if this is sustainable long-term', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Stuck — I want to grow but don\'t know how to get to the next level', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Trapped — I built something I can\'t escape and don\'t love anymore', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Freelancer' || value === 'Self-Employed' || value === 'Contractor'
    }
  }
]

// --- Branch 3: Unemployed/Job-Seeking Questions ---

export const unemployedWorkQuestions: AssessmentQuestion[] = [
  {
    id: 'work_unemployed_1',
    category: 'work',
    text: 'How does not having a job title affect how you see yourself?',
    options: [
      { text: 'Free — I\'ve separated my identity from my job and feel whole', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Grounded — I know who I am beyond what I do for work', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Shaky — some days I\'m fine, other days I feel like less', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Diminished — I avoid telling people I\'m unemployed', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Worthless — without work I feel like I have no value', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Unemployed' || value === 'Job Seeking'
    }
  },
  {
    id: 'work_unemployed_2',
    category: 'work',
    text: 'How is your daily structure and motivation holding up?',
    options: [
      { text: 'Strong — I\'ve created routines that keep me moving and growing', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Decent — I have a rhythm even without external structure', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Slipping — I have good intentions but struggle to follow through', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Eroding — days pass without accomplishing anything meaningful', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Gone — I can barely get out of bed some days', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Unemployed' || value === 'Job Seeking'
    }
  },
  {
    id: 'work_unemployed_3',
    category: 'work',
    text: 'What\'s the financial pressure like right now?',
    options: [
      { text: 'Managed — I have savings and a plan, money isn\'t my main stress', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Tight but okay — I\'m careful and can sustain this for a while', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Growing — the pressure builds with each passing month', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Heavy — financial stress dominates my thoughts daily', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Crushing — I\'m in survival mode and it\'s affecting everything', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Unemployed' || value === 'Job Seeking'
    }
  },
  {
    id: 'work_unemployed_4',
    category: 'work',
    text: 'How hopeful do you feel about finding the right work?',
    options: [
      { text: 'Excited — I know something great is coming and I\'m positioning for it', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Optimistic — it\'s taking time but I believe it will work out', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Fluctuating — hope one day, doubt the next', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Fading — I\'m losing belief that anything good will come', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Hopeless — I don\'t see how things get better from here', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Unemployed' || value === 'Job Seeking'
    }
  },
  {
    id: 'work_unemployed_5',
    category: 'work',
    text: 'How are you handling rejection in the job search?',
    options: [
      { text: 'Resilient — each no is just data, I refine and keep going', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Steady — rejection stings but doesn\'t stop me', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Bruised — it gets harder with each one but I push through', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Beaten down — every rejection confirms my worst fears about myself', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Paralyzed — I\'ve stopped applying because I can\'t take more rejection', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Unemployed' || value === 'Job Seeking'
    }
  },
  {
    id: 'work_unemployed_6',
    category: 'work',
    text: 'How supported do you feel during this transition?',
    options: [
      { text: 'Held — I have people cheering me on and helping actively', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Supported — my people believe in me and I feel their care', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed — some support, but I hide the struggle from most people', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Alone — I feel like a burden and don\'t ask for help', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Judged — the people around me make me feel worse about my situation', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Unemployed' || value === 'Job Seeking'
    }
  },
  {
    id: 'work_unemployed_7',
    category: 'work',
    text: 'Are you using this time intentionally or does it feel like it\'s slipping away?',
    options: [
      { text: 'Intentionally — I\'m investing in growth, skills, and clarity', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Mostly well — I balance job searching with personal development', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Trying — I have intentions but often fall into numbing or avoidance', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Wasting — most days disappear into scrolling, sleeping, or nothing', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Spiraling — the lack of structure is pulling me into a dark place', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'employment_type',
      condition: (value: any) => value === 'Unemployed' || value === 'Job Seeking'
    }
  }
]

// --- Branch 4: Adult Children Family Questions ---
// NOTE: Runtime should also apply `hasOnlyAdultChildren(profile)` check in addition to conditionalLogic

export const adultChildrenFamilyQuestions: AssessmentQuestion[] = [
  {
    id: 'family_adult_children_1',
    category: 'family',
    text: 'How would you describe your relationship with your adult children?',
    options: [
      { text: 'Deep and mutual — we\'ve evolved into a genuine friendship with respect', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Good — we\'re close and I enjoy who they\'ve become', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Surface level — we talk but rarely go deep', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Strained — there\'s tension or distance I don\'t know how to bridge', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Painful — we\'re disconnected or in conflict and it breaks my heart', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value: any) => value === true
    }
  },
  {
    id: 'family_adult_children_2',
    category: 'family',
    text: 'How have you navigated letting go of the active parenting role?',
    options: [
      { text: 'Gracefully — I\'ve found joy in watching them lead their own lives', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Well — I\'ve mostly transitioned to advisor rather than director', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'In progress — I catch myself overstepping and pull back', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Struggling — I still want to fix, help, and protect them', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Can\'t — my identity is still wrapped up in being their parent', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value: any) => value === true
    }
  },
  {
    id: 'family_adult_children_3',
    category: 'family',
    text: 'How do you handle boundaries with your adult children?',
    options: [
      { text: 'Healthy — we have clear, loving boundaries that work for everyone', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Mostly good — occasional friction but we communicate through it', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Fuzzy — I give too much or don\'t know when to say no', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Codependent — they rely on me too much or I can\'t stop helping', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Resentful — I feel used or taken for granted', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value: any) => value === true
    }
  },
  {
    id: 'family_adult_children_4',
    category: 'family',
    text: 'How do you feel about the choices your adult children are making?',
    options: [
      { text: 'Proud — they\'re living authentically and I respect their path', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Trusting — even when I\'d choose differently, I trust them', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Worried — I stay quiet but some of their choices concern me', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Anxious — I lose sleep over their decisions and can\'t let go', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Heartbroken — they\'re on a path that hurts to watch', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value: any) => value === true
    }
  },
  {
    id: 'family_adult_children_5',
    category: 'family',
    text: 'How often and how well do you connect with your adult children?',
    options: [
      { text: 'Consistently and deeply — we make real time for each other', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Regularly — we stay in touch and it feels genuine', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Sporadic — we connect but it feels like I\'m always initiating', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Rare — we go long stretches without meaningful contact', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Disconnected — I barely know what\'s happening in their lives', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value: any) => value === true
    }
  },
  {
    id: 'family_adult_children_6',
    category: 'family',
    text: 'If you have grandchildren (or anticipate them), how does that role feel?',
    options: [
      { text: 'Joyful — being a grandparent is one of life\'s greatest gifts', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Wonderful — I love the connection without the full responsibility', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Bittersweet — I wish I had more access or closer proximity', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Complicated — family dynamics make this role difficult', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Painful — I\'m excluded or the relationship isn\'t what I hoped', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value: any) => value === true
    }
  },
  {
    id: 'family_adult_children_7',
    category: 'family',
    text: 'How is your own identity now that active parenting is behind you?',
    options: [
      { text: 'Liberated — I\'ve rediscovered who I am beyond "mom" or "dad"', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Evolving — I\'m building a new chapter and it feels exciting', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Adjusting — I\'m figuring it out but it\'s not fully clear yet', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Empty — I defined myself through my kids and now I\'m lost', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Grieving — I mourn the family life we had and can\'t move forward', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'has_children',
      condition: (value: any) => value === true
    }
  }
]

// --- Branch 5: Not Seeking Love Questions ---

export const notSeekingLoveQuestions: AssessmentQuestion[] = [
  {
    id: 'love_not_seeking_1',
    category: 'love',
    text: 'How at peace are you with being single by choice?',
    options: [
      { text: 'Deeply at peace — this is exactly where I want to be', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Content — I\'m happy single and don\'t feel I\'m missing out', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mostly okay — occasional doubt but generally solid in this choice', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Conflicted — I say I don\'t want a relationship but part of me wonders', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Protective — I say I don\'t want one because I\'m afraid to try again', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'seeking_relationship',
      condition: (value: any) => value === false
    }
  },
  {
    id: 'love_not_seeking_2',
    category: 'love',
    text: 'How is your relationship with yourself these days?',
    options: [
      { text: 'Loving — I genuinely enjoy my own company and treat myself well', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Good — I like who I am and practice self-care', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Work in progress — I\'m learning to be my own best friend', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Neglectful — I don\'t prioritize my own needs or happiness', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Harsh — I\'m my own worst critic and don\'t like being alone with myself', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'seeking_relationship',
      condition: (value: any) => value === false
    }
  },
  {
    id: 'love_not_seeking_3',
    category: 'love',
    text: 'How do you handle societal pressure about being in a relationship?',
    options: [
      { text: 'Unbothered — I don\'t let others\' expectations define my happiness', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Confident — I explain my choice easily and people respect it', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Annoyed — the comments bother me but I stand my ground', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Pressured — I feel judged and sometimes doubt myself because of others', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Ashamed — I internalize the message that something is wrong with me', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'seeking_relationship',
      condition: (value: any) => value === false
    }
  },
  {
    id: 'love_not_seeking_4',
    category: 'love',
    text: 'How fulfilled do you feel by your non-romantic relationships?',
    options: [
      { text: 'Deeply — my friendships and family give me everything I need', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Satisfied — I have rich, meaningful connections in my life', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Partially — good connections exist but something feels missing', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Lacking — I wish I had deeper bonds with friends or family', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Starving — I\'m emotionally hungry and no one fills that space', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'seeking_relationship',
      condition: (value: any) => value === false
    }
  },
  {
    id: 'love_not_seeking_5',
    category: 'love',
    text: 'How does your independence feel to you?',
    options: [
      { text: 'Empowering — I love the freedom to design my life exactly as I want', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Comfortable — I appreciate not having to compromise', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Mixed — freedom is nice but sometimes I wish someone was here', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Lonely — independence sounds good in theory but feels isolating', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Forced — I\'m alone not because I chose it but because I gave up', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'seeking_relationship',
      condition: (value: any) => value === false
    }
  },
  {
    id: 'love_not_seeking_6',
    category: 'love',
    text: 'How well are your needs for closeness and intimacy being met?',
    options: [
      { text: 'Fully — through friends, family, and self I feel deeply connected', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Mostly — I have enough warmth and physical/emotional closeness', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Partially — some needs are met but I notice gaps', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Barely — I\'m touch-starved or emotionally disconnected', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Not at all — I\'ve shut down that part of myself entirely', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'seeking_relationship',
      condition: (value: any) => value === false
    }
  },
  {
    id: 'love_not_seeking_7',
    category: 'love',
    text: 'When you imagine your future without a romantic partner, what do you feel?',
    options: [
      { text: 'Excited — I see a beautiful life full of adventure and purpose', value: 5, emoji: '🟢', greenLine: 'above' },
      { text: 'Content — I can picture a fulfilling future on my own terms', value: 4, emoji: '🟢', greenLine: 'above' },
      { text: 'Neutral — I don\'t think about it much either way', value: 3, emoji: '⚪', greenLine: 'neutral' },
      { text: 'Anxious — I worry about growing old alone', value: 2, emoji: '🔴', greenLine: 'below' },
      { text: 'Terrified — the thought of being alone forever haunts me', value: 1, emoji: '🔴', greenLine: 'below' },
      { text: 'None of these specifically resonate', value: 0, emoji: '🤔', greenLine: 'neutral', isCustom: true }
    ],
    conditionalLogic: {
      field: 'seeking_relationship',
      condition: (value: any) => value === false
    }
  }
]

// --- Combined export for convenience ---

export const allBranchQuestions: AssessmentQuestion[] = [
  ...retiredWorkQuestions,
  ...freelanceWorkQuestions,
  ...unemployedWorkQuestions,
  ...adultChildrenFamilyQuestions,
  ...notSeekingLoveQuestions
]
