'use client'

import React from 'react'
import { cn } from '../shared-utils'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import type { NavItem } from '@/lib/navigation'

// Sidebar Layout Component
interface SidebarLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  navigation?: NavItem[]
  isAdmin?: boolean
}

export const SidebarLayout = React.forwardRef<HTMLDivElement, SidebarLayoutProps>(
  ({ children, className, navigation, isAdmin = false, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className="flex min-h-screen min-h-[100dvh] bg-black"
        {...props}
      >
        <Sidebar navigation={navigation} isAdmin={isAdmin} />
        <main className={cn('flex-1 overflow-auto pb-20 md:pb-0 min-h-[100dvh]', className)}>
          {children}
        </main>
        <MobileBottomNav navigation={navigation} isAdmin={isAdmin} />
      </div>
    )
  }
)
SidebarLayout.displayName = 'SidebarLayout'

