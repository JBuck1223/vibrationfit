import {
  Home,
  Sparkles,
  Headphones,
  PenLine,
  UsersRound,
  Target,
  Image,
  Map,
  Globe,
  BookOpen,
  FileText,
  DollarSign,
  Plane,
  Wind,
  Music2,
  Mic,
  Lightbulb,
  Video,
  Share2,
  Settings,
  TrendingUp,
  CreditCard,
  HardDrive,
  Zap,
  Headset,
  Activity,
  GraduationCap,
  ListMusic,
  Wand2,
} from 'lucide-react'
export type RoomId =
  | 'home'
  | 'viva'
  | 'listen'
  | 'capture'
  | 'tribe'
  | 'account'
export const ROOM_TABS = [
  { id: 'home', name: 'Home', href: '/dashboard', icon: Home },
  { id: 'viva', name: 'VIVA', href: '/viva', icon: Sparkles },
  { id: 'listen', name: 'Listen', href: '/listen', icon: Headphones },
  { id: 'capture', name: 'Capture', href: '/capture', icon: PenLine },
  { id: 'tribe', name: 'Tribe', href: '/tribe', icon: UsersRound },
] as const
export const ROOM_TOOLS = [
  {
    id: 'vision',
    name: 'Life Vision',
    href: '/life-vision',
    room: 'home',
    icon: Target,
    description: 'Read, write and refine your vision',
  },
  {
    id: 'manifestations',
    name: 'Manifestations',
    href: '/manifestations',
    room: 'home',
    icon: Image,
    description: 'Your board and the life taking shape',
  },
  {
    id: 'map',
    name: 'MAP',
    href: '/map',
    room: 'home',
    icon: Map,
    description: 'Your plan, commitments and daily practice',
  },
  {
    id: 'world',
    name: 'Your World',
    href: '/your-world',
    room: 'home',
    icon: Globe,
    description: 'Your people, home and work',
  },
  {
    id: 'tracking',
    name: 'Progress',
    href: '/tracking',
    room: 'home',
    icon: TrendingUp,
    description: 'Tracking, streaks and badges',
  },
  {
    id: 'viva',
    name: 'VIVA',
    href: '/viva',
    room: 'viva',
    icon: Sparkles,
    description: 'Your conversations and personal coaching',
  },
  {
    id: 'daily-paper',
    name: 'Daily Paper',
    href: '/daily-paper',
    room: 'capture',
    icon: FileText,
    description: 'Gratitude, priorities and your day',
  },
  {
    id: 'journal',
    name: 'Journal',
    href: '/journal',
    room: 'capture',
    icon: BookOpen,
    description: 'Capture a moment or return to an entry',
  },
  {
    id: 'abundance',
    name: 'Abundance',
    href: '/abundance-tracker',
    room: 'capture',
    icon: DollarSign,
    description: 'Log moments, track goals and see reports',
  },
  {
    id: 'trips',
    name: 'Trips',
    href: '/travel-tracker',
    room: 'capture',
    icon: Plane,
    description: 'Places, memories and dream trips',
  },
  {
    id: 'audio',
    name: 'Life Vision Audio',
    href: '/audio',
    room: 'listen',
    icon: Headphones,
    description: 'Your audio sets, recording and mixing studio',
  },
  {
    id: 'meditations',
    name: 'Meditations',
    href: '/meditations',
    room: 'listen',
    icon: Wind,
    description: 'Make space to breathe and reset',
  },
  {
    id: 'songs',
    name: 'Songs',
    href: '/audio/songs',
    room: 'listen',
    icon: Music2,
    description: 'Your songs and songwriting studio',
  },
  {
    id: 'stories',
    name: 'Stories',
    href: '/story',
    room: 'listen',
    icon: BookOpen,
    description: 'Read, create and listen to your stories',
  },
  {
    id: 'incantations',
    name: 'Incantations',
    href: '/story?kind=incantation',
    room: 'listen',
    icon: Mic,
    description: 'Words you want in your own voice',
  },
  {
    id: 'queries',
    name: 'Queries',
    href: '/story?kind=spark_query',
    room: 'listen',
    icon: Lightbulb,
    description: 'Explore your SparkQueries',
  },
  {
    id: 'playlists',
    name: 'Playlists',
    href: '/audio/playlists',
    room: 'listen',
    icon: ListMusic,
    description: 'Arrange what you want to hear',
  },
  {
    id: 'songwriter',
    name: 'Create a song',
    href: '/audio/songwriter',
    room: 'listen',
    icon: Wand2,
    description: 'Start or continue writing a song',
  },
  {
    id: 'gym',
    name: 'Alignment Gym',
    href: '/alignment-gym',
    room: 'tribe',
    icon: Video,
    description: 'Live sessions, coaching and replays',
  },
  {
    id: 'tribe',
    name: 'Vibe Tribe',
    href: '/vibe-tribe',
    room: 'tribe',
    icon: UsersRound,
    description: 'Conversations, wins and collaboration',
  },
  {
    id: 'referrals',
    name: 'Referrals',
    href: '/referral',
    room: 'tribe',
    icon: Share2,
    description: 'Your invitations, earnings and payouts',
  },
  {
    id: 'account',
    name: 'Settings',
    href: '/account',
    room: 'account',
    icon: Settings,
    description: 'Profile, household, privacy and password',
  },
  {
    id: 'billing',
    name: 'Billing',
    href: '/account/billing',
    room: 'account',
    icon: CreditCard,
    description: 'Your plan, payment methods and invoices',
  },
  {
    id: 'storage',
    name: 'Storage',
    href: '/storage',
    room: 'account',
    icon: HardDrive,
    description: 'Your files and storage history',
  },
  {
    id: 'tokens',
    name: 'Tokens',
    href: '/tokens',
    room: 'account',
    icon: Zap,
    description: 'Usage and token history',
  },
  {
    id: 'support',
    name: 'Support',
    href: '/support',
    room: 'account',
    icon: Headset,
    description: 'Tickets, help and announcements',
  },
  {
    id: 'activity',
    name: 'Activity',
    href: '/activity',
    room: 'account',
    icon: Activity,
    description: 'Your activity timeline',
  },
  {
    id: 'training',
    name: 'Tools Training',
    href: '/begin/training',
    room: 'home',
    icon: GraduationCap,
    description: 'Learn your way around each tool',
  },
] as const
export type ToolId = (typeof ROOM_TOOLS)[number]['id']
export function toolForHref(href: string) {
  const [path, search = ''] = href.split('?')
  const kind = new URLSearchParams(search).get('kind')
  if (path === '/story' && kind)
    return ROOM_TOOLS.find((t) => t.href === `/story?kind=${kind}`)
  return [...ROOM_TOOLS]
    .filter((t) => !t.href.includes('?'))
    .sort((a, b) => b.href.length - a.href.length)
    .find((t) => path === t.href || path.startsWith(t.href + '/'))
}
export function roomForHref(href: string): RoomId {
  if (href === '/listen' || href.startsWith('/listen?')) return 'listen'
  if (href === '/capture') return 'capture'
  if (href === '/tribe') return 'tribe'
  return toolForHref(href)?.room ?? 'home'
}
export const COASTAL_IMAGE =
  'https://media.vibrationfit.com/site-assets/mobile/rooms/coastal-home-20261021.webp'
