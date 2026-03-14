'use client'

import { useRouter } from 'next/navigation'
import { Container, Stack, PageHero, Card } from '@/lib/design-system/components'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface DashboardCard {
  name: string
  description: string
  href: string
  iconName: string
}

export interface DashboardSection {
  title: string
  cards: DashboardCard[]
}

const GROUP_COLORS: Record<string, string> = {
  'User Management': 'text-primary-500',
  'CRM & Marketing': 'text-[#FFB701]',
  'Messaging': 'text-secondary-500',
  'Content': 'text-[#8B5CF6]',
  'Audio': 'text-[#BF00FF]',
  'VIVA & Models': 'text-accent-500',
  'Scheduling': 'text-[#00FFFF]',
  'Intensive Program': 'text-[#39FF14]',
  'Homeschool': 'text-[#FFB701]',
  'Developer': 'text-neutral-400',
}

function resolveIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>
  return icons[name] || LucideIcons.FileText
}

function AdminCard({ card, groupColor }: { card: DashboardCard; groupColor: string }) {
  const router = useRouter()
  const Icon = resolveIcon(card.iconName)

  return (
    <Card
      className="p-4 cursor-pointer hover:border-neutral-600 transition-all duration-200 hover:-translate-y-0.5"
      onClick={() => router.push(card.href)}
    >
      <div className="flex items-start gap-3">
        <div className={groupColor}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm md:text-base truncate">{card.name}</h3>
          <p className="text-xs md:text-sm text-neutral-400 truncate">{card.description}</p>
        </div>
      </div>
    </Card>
  )
}

function SectionGroup({ title, cards, groupColor }: { title: string; cards: DashboardCard[]; groupColor: string }) {
  if (cards.length === 0) return null

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold mb-4 text-neutral-300">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {cards.map((card) => (
          <AdminCard key={card.href} card={card} groupColor={groupColor} />
        ))}
      </div>
    </div>
  )
}

interface AdminDashboardClientProps {
  topLevelCards: DashboardCard[]
  curatedSections: DashboardSection[]
  uncategorizedCards: DashboardCard[]
}

export default function AdminDashboardClient({
  topLevelCards,
  curatedSections,
  uncategorizedCards,
}: AdminDashboardClientProps) {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="ADMIN"
          title="Admin Dashboard"
          subtitle="Central hub for managing Vibration Fit"
        />

        {topLevelCards.length > 0 && (
          <SectionGroup
            title="Quick Access"
            cards={topLevelCards}
            groupColor="text-[#FF0040]"
          />
        )}

        {curatedSections.map((section) => (
          <SectionGroup
            key={section.title}
            title={section.title}
            cards={section.cards}
            groupColor={GROUP_COLORS[section.title] || 'text-neutral-400'}
          />
        ))}

        {uncategorizedCards.length > 0 && (
          <SectionGroup
            title="Other Admin Pages"
            cards={uncategorizedCards}
            groupColor="text-neutral-500"
          />
        )}
      </Stack>
    </Container>
  )
}
