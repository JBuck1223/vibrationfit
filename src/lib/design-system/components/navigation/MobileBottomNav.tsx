'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '../shared-utils'
import { userNavigation, adminNavigation as centralAdminNav, mobileNavigation as centralMobileNav, isNavItemActive, type NavItem as CentralNavItem, type NavItem } from '@/lib/navigation'

// Mobile Bottom Navigation Component
interface MobileBottomNavProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  navigation?: NavItem[]
  isAdmin?: boolean
}

export const MobileBottomNav = React.forwardRef<HTMLDivElement, MobileBottomNavProps>(
  ({ className, navigation, isAdmin = false, ...props }, ref) => {
    const pathname = usePathname()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    
    // Use admin navigation if isAdmin is true, otherwise use provided navigation or centralized userNavigation
    const navItems = isAdmin ? centralAdminNav : (navigation || userNavigation)
    
    // Use centralized mobile navigation
    const mobileNavItems = centralMobileNav.map((item: CentralNavItem) => ({
      ...item,
      isAction: item.href === '#', // "More" button is an action
    }))

    // Get all sidebar items for the drawer (exclude main nav items)
    const allSidebarItems = navItems.filter((item: NavItem) => 
      !mobileNavItems.some((mobileItem: NavItem & { isAction?: boolean }) => 
        mobileItem.href === item.href || 
        (mobileItem.href === '/life-vision' && item.href === '/life-vision') ||
        (mobileItem.href === '/vision-board' && item.href === '/vision-board') ||
        (mobileItem.href === '/journal' && item.href === '/journal') ||
        (mobileItem.href === '/admin/users' && item.href === '/admin/users') ||
        (mobileItem.href === '/admin/ai-models' && item.href === '/admin/ai-models') ||
        (mobileItem.href === '/admin/token-usage' && item.href === '/admin/token-usage')
      )
    )

    const handleItemClick = (item: any) => {
      if (item.hasDropdown && item.children) {
        setSelectedCategory(item.name)
        setIsDrawerOpen(true)
      }
    }

    const closeDrawer = () => {
      setIsDrawerOpen(false)
      setSelectedCategory(null)
    }

    return (
      <>
        <div 
          ref={ref}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'bg-neutral-900 border-t border-neutral-800',
            'md:hidden', // Only show on mobile
            className
          )}
          {...props}
        >
          <div className="flex items-center justify-around py-2">
            {mobileNavItems.map((item: NavItem & { isAction?: boolean }) => {
              const Icon = item.icon
              const isActive = isNavItemActive(item, pathname)
              
              if (item.isAction) {
                return (
                  <button
                    key={item.name}
                    onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                    className={cn(
                      'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1',
                      isDrawerOpen 
                        ? 'text-[#39FF14] bg-[#39FF14]/10' 
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                    )}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium truncate">{item.name}</span>
                  </button>
                )
              }
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1',
                    isActive
                      ? 'text-[#39FF14] bg-[#39FF14]/10'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                  )}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium truncate">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Slideout Drawer */}
        <div className={cn(
          'fixed inset-0 z-40 md:hidden',
          'transition-all duration-300 ease-in-out',
          isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          
          {/* Drawer Content - positioned above bottom bar */}
          <div className={cn(
            'absolute left-0 right-0',
            'bg-neutral-900 border-t border-neutral-800 rounded-t-2xl',
            'transform transition-transform duration-300 ease-in-out',
            isDrawerOpen ? 'translate-y-0' : 'translate-y-full',
            'bottom-16' // Position above the bottom bar (assuming bottom bar is ~64px tall)
          )}>
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  {selectedCategory ? `${selectedCategory} Options` : 'More Options'}
                </h3>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Grid of Items */}
              <div className="grid grid-cols-2 gap-3">
                {allSidebarItems.map((item: NavItem) => {
                  const Icon = item.icon
                  const isActive = isNavItemActive(item, pathname)
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeDrawer}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200',
                        'border-2 border-neutral-700 hover:border-neutral-600',
                        isActive
                          ? 'bg-[#39FF14]/20 border-[#39FF14]/50 text-[#39FF14]'
                          : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                      )}
                    >
                      <Icon className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium text-center">{item.name}</span>
                      {item.badge && (
                        <span className="mt-1 px-2 py-0.5 text-xs bg-[#39FF14] text-black rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
)
MobileBottomNav.displayName = 'MobileBottomNav'

