// /src/app/admin/page.tsx
// Admin Dashboard - Central navigation hub

'use client'

import { useRouter } from 'next/navigation'
import { Container, Stack, PageHero, Card } from '@/lib/design-system/components'
import {
  Users,
  Mail,
  MessageSquare,
  Calendar,
  Headphones,
  Image,
  Bot,
  Coins,
  Sparkles,
  Target,
  TestTube,
  LayoutDashboard,
  UserPlus,
  Megaphone,
  HeadphonesIcon,
  Link2,
  Award,
  Layers,
  Radio,
  GitBranch,
  Send,
  ShoppingBag,
} from 'lucide-react'

interface AdminSection {
  title: string
  description: string
  href: string
  icon: React.ElementType
  color: string
}

const crmSections: AdminSection[] = [
  {
    title: 'CRM Dashboard',
    description: 'Overview of business metrics',
    href: '/admin/crm/dashboard',
    icon: LayoutDashboard,
    color: 'text-primary-500',
  },
  {
    title: 'Members',
    description: 'Manage active members',
    href: '/admin/crm/members',
    icon: Users,
    color: 'text-secondary-500',
  },
  {
    title: 'Leads',
    description: 'Track and convert leads',
    href: '/admin/crm/leads',
    icon: UserPlus,
    color: 'text-[#FFB701]',
  },
  {
    title: 'Campaigns',
    description: 'Marketing campaigns',
    href: '/admin/crm/campaigns',
    icon: Megaphone,
    color: 'text-[#8B5CF6]',
  },
  {
    title: 'Support',
    description: 'Support ticket board',
    href: '/admin/crm/support/board',
    icon: HeadphonesIcon,
    color: 'text-[#D03739]',
  },
  {
    title: 'UTM Builder',
    description: 'Create tracking links',
    href: '/admin/crm/utm-builder',
    icon: Link2,
    color: 'text-neutral-400',
  },
  {
    title: 'Orders & Emails',
    description: 'Order status & email delivery',
    href: '/admin/orders',
    icon: ShoppingBag,
    color: 'text-green-400',
  },
]

const communicationSections: AdminSection[] = [
  {
    title: 'Messaging Hub',
    description: 'Overview, stats, and quick actions',
    href: '/admin/emails',
    icon: Mail,
    color: 'text-primary-500',
  },
  {
    title: 'Email Templates',
    description: 'Database-driven email templates',
    href: '/admin/emails/list',
    icon: Mail,
    color: 'text-primary-500',
  },
  {
    title: 'SMS Templates',
    description: 'Database-driven SMS templates',
    href: '/admin/sms',
    icon: MessageSquare,
    color: 'text-secondary-500',
  },
  {
    title: 'Automation Rules',
    description: 'Event-driven message triggers',
    href: '/admin/automations',
    icon: Radio,
    color: 'text-[#FF6B35]',
  },
  {
    title: 'Sequences',
    description: 'Multi-step drip campaigns',
    href: '/admin/sequences',
    icon: GitBranch,
    color: 'text-accent-500',
  },
  {
    title: 'Campaigns',
    description: 'Bulk audience sends',
    href: '/admin/messaging-campaigns',
    icon: Send,
    color: 'text-energy-500',
  },
]

const contentSections: AdminSection[] = [
  {
    title: 'Audio Designer',
    description: 'Design audio experiences',
    href: '/admin/audio-designer',
    icon: Headphones,
    color: 'text-[#8B5CF6]',
  },
  {
    title: 'Audio Generator',
    description: 'Generate audio content',
    href: '/admin/audio-generator',
    icon: Sparkles,
    color: 'text-primary-500',
  },
  {
    title: 'Audio Mixer',
    description: 'Mix and master audio',
    href: '/admin/audio-mixer',
    icon: Headphones,
    color: 'text-secondary-500',
  },
  {
    title: 'Assets',
    description: 'Manage media assets',
    href: '/admin/assets',
    icon: Image,
    color: 'text-[#FFB701]',
  },
]

const systemSections: AdminSection[] = [
  {
    title: 'Users',
    description: 'User management',
    href: '/admin/users',
    icon: Users,
    color: 'text-primary-500',
  },
  {
    title: 'Badges',
    description: 'Award and manage badges',
    href: '/admin/badges',
    icon: Award,
    color: 'text-[#FFB701]',
  },
  {
    title: 'Sessions',
    description: 'Coaching sessions',
    href: '/admin/sessions',
    icon: Calendar,
    color: 'text-secondary-500',
  },
  {
    title: 'Scheduling',
    description: 'Schedule management',
    href: '/admin/scheduling',
    icon: Calendar,
    color: 'text-[#8B5CF6]',
  },
  {
    title: 'Token Usage',
    description: 'Track token consumption',
    href: '/admin/token-usage',
    icon: Coins,
    color: 'text-[#FFB701]',
  },
  {
    title: 'Membership Tiers',
    description: 'Token grants & storage quotas',
    href: '/admin/membership-tiers',
    icon: Layers,
    color: 'text-primary-500',
  },
  {
    title: 'VIVA Models',
    description: 'Configure VIVA models',
    href: '/admin/ai-models',
    icon: Bot,
    color: 'text-[#8B5CF6]',
  },
  {
    title: 'Vibrational Events',
    description: 'Event source management',
    href: '/admin/vibrational-event/sources',
    icon: Target,
    color: 'text-[#D03739]',
  },
]

const intensiveSections: AdminSection[] = [
  {
    title: 'Schedule Call',
    description: 'Schedule intensive calls',
    href: '/admin/intensive/schedule-call',
    icon: Calendar,
    color: 'text-primary-500',
  },
  {
    title: 'Intensive Tester',
    description: 'Test intensive flows',
    href: '/admin/intensive/tester',
    icon: TestTube,
    color: 'text-secondary-500',
  },
]

function AdminSectionCard({ section }: { section: AdminSection }) {
  const router = useRouter()
  const Icon = section.icon

  return (
    <Card
      className="p-4 cursor-pointer hover:border-neutral-600 transition-all duration-200 hover:-translate-y-0.5"
      onClick={() => router.push(section.href)}
    >
      <div className="flex items-start gap-3">
        <div className={`${section.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm md:text-base truncate">{section.title}</h3>
          <p className="text-xs md:text-sm text-neutral-400 truncate">{section.description}</p>
        </div>
      </div>
    </Card>
  )
}

function SectionGroup({ title, sections }: { title: string; sections: AdminSection[] }) {
  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold mb-4 text-neutral-300">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {sections.map((section) => (
          <AdminSectionCard key={section.href} section={section} />
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="ADMIN"
          title="Admin Dashboard"
          subtitle="Central hub for managing Vibration Fit"
        />

        <SectionGroup title="CRM" sections={crmSections} />
        <SectionGroup title="Messaging & Automation" sections={communicationSections} />
        <SectionGroup title="Content & Audio" sections={contentSections} />
        <SectionGroup title="Intensive Program" sections={intensiveSections} />
        <SectionGroup title="System" sections={systemSections} />
      </Stack>
    </Container>
  )
}
