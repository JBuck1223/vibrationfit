// /src/app/admin/page.tsx
// Admin Dashboard - Auto-generated from adminNavigation (single source of truth)

'use client'

import { useRouter } from 'next/navigation'
import { Container, Stack, PageHero, Card } from '@/lib/design-system/components'
import { adminNavigation, type NavItem } from '@/lib/navigation'

const GROUP_COLORS: Record<string, string> = {
  'User Management': 'text-primary-500',
  'CRM & Marketing': 'text-[#FFB701]',
  'Messaging': 'text-secondary-500',
  'Content': 'text-[#8B5CF6]',
  'Audio': 'text-[#BF00FF]',
  'VIVA & Models': 'text-accent-500',
  'Scheduling': 'text-[#00FFFF]',
  'Intensive Program': 'text-[#39FF14]',
  'Developer': 'text-neutral-400',
}

function AdminSectionCard({ item, groupColor }: { item: NavItem; groupColor: string }) {
  const router = useRouter()
  const Icon = item.icon

  return (
    <Card
      className="p-4 cursor-pointer hover:border-neutral-600 transition-all duration-200 hover:-translate-y-0.5"
      onClick={() => router.push(item.href)}
    >
      <div className="flex items-start gap-3">
        <div className={groupColor}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm md:text-base truncate">{item.name}</h3>
          <p className="text-xs md:text-sm text-neutral-400 truncate">{item.description || ''}</p>
        </div>
      </div>
    </Card>
  )
}

function SectionGroup({ title, items, groupColor }: { title: string; items: NavItem[]; groupColor: string }) {
  if (items.length === 0) return null

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold mb-4 text-neutral-300">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {items.map((item) => (
          <AdminSectionCard key={item.href} item={item} groupColor={groupColor} />
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const topLevelItems: NavItem[] = []
  const groups: { name: string; items: NavItem[] }[] = []

  for (const item of adminNavigation) {
    if (item.href === '/admin') continue

    if (item.hasDropdown && item.children?.length) {
      groups.push({ name: item.name, items: item.children })
    } else {
      topLevelItems.push(item)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="ADMIN"
          title="Admin Dashboard"
          subtitle="Central hub for managing Vibration Fit"
        />

        {topLevelItems.length > 0 && (
          <SectionGroup
            title="Quick Access"
            items={topLevelItems}
            groupColor="text-[#FF0040]"
          />
        )}

        {groups.map((group) => (
          <SectionGroup
            key={group.name}
            title={group.name}
            items={group.items}
            groupColor={GROUP_COLORS[group.name] || 'text-neutral-400'}
          />
        ))}
      </Stack>
    </Container>
  )
}
