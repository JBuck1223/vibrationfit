'use client'

import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'

function SidebarPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'hidden md:flex flex-col bg-neutral-800 border-r border-neutral-800 shrink-0 w-64',
        className
      )}
    />
  )
}

export const UserSidebar = dynamic(
  () => import('./Sidebar').then((mod) => mod.UserSidebar),
  { ssr: false, loading: () => <SidebarPlaceholder /> }
)

export const AdminSidebar = dynamic(
  () => import('./Sidebar').then((mod) => mod.AdminSidebar),
  { ssr: false, loading: () => <SidebarPlaceholder /> }
)

export function SidebarLayout({
  children,
  className,
  isAdmin = false,
}: {
  children: ReactNode
  className?: string
  isAdmin?: boolean
}) {
  return (
    <div className="flex h-screen bg-black">
      {isAdmin ? (
        <AdminSidebar className={className} />
      ) : (
        <UserSidebar className={className} />
      )}
      <main className={cn('min-w-0 flex-1 overflow-auto min-h-0', className)}>
        <div className="w-full">{children}</div>
      </main>
    </div>
  )
}
