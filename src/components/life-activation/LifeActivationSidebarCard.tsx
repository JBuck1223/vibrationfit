'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import {
  getLifeActivationSidebarItem,
  getLifeActivationSidebarMode,
  isLifeActivationSidebarActive,
} from '@/lib/life-activation/sidebar'

export function LifeActivationSidebarCard({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const { progress } = useLifeActivation()

  const mode = getLifeActivationSidebarMode(progress)
  if (mode === 'hidden') return null

  const item = getLifeActivationSidebarItem(mode)
  const Icon = item.icon
  const isActive = isLifeActivationSidebarActive(mode, pathname)

  return (
    <Link
      href={item.href}
      title={item.description}
      className={cn(
        'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
        collapsed ? 'justify-center p-2' : 'px-3 py-2.5',
        isActive
          ? 'bg-[#00CC44]/20 text-[#00CC44] border border-[#00CC44]/30'
          : 'text-neutral-300 hover:text-white hover:bg-neutral-800',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="flex-1">{item.name}</span>}
    </Link>
  )
}
