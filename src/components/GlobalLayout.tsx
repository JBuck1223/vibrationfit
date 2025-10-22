'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { SidebarLayout, PageLayout } from '@/lib/design-system'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

interface GlobalLayoutProps {
  children: React.ReactNode
}

export function GlobalLayout({ children }: GlobalLayoutProps) {
  const pathname = usePathname()
  
  // Define pages that should use the full navigation system (logged-in user pages)
  const navigationPages = [
    // Dashboard and sub-pages
    '/dashboard',
    '/dashboard/activity',
    '/dashboard/add-tokens',
    '/dashboard/storage',
    '/dashboard/token-history',
    '/dashboard/tokens',
    '/dashboard/vibe-assistant-usage',
    
    // Life Vision and sub-pages
    '/life-vision',
    '/life-vision/new',
    '/life-vision/create-with-viva',
    '/life-vision/[id]',
    '/life-vision/[id]/audio',
    '/life-vision/[id]/refine',
    
    // Vision Board and sub-pages
    '/vision-board',
    '/vision-board/new',
    '/vision-board/gallery',
    '/vision-board/[id]',
    
    // Journal and sub-pages
    '/journal',
    '/journal/new',
    '/journal/[id]',
    '/journal/[id]/edit',
    
    // Profile and sub-pages
    '/profile',
    '/profile/edit',
    '/profile/new',
    
    // Assessment and sub-pages
    '/assessment',
    '/assessment/in-progress',
    '/assessment/results',
    
    // Actualization Blueprints
    '/actualization-blueprints',
    '/actualization-blueprints/[id]',
    
    // Intensive program pages
    '/intensive',
    '/intensive/activate',
    '/intensive/activation-protocol',
    '/intensive/builder',
    '/intensive/calibration',
    '/intensive/call-prep',
    '/intensive/check-email',
    '/intensive/dashboard',
    '/intensive/intake',
    '/intensive/refine-vision',
    '/intensive/schedule-call',
    
    // Other user pages
    '/billing',
    '/support',
    '/account/settings',
  ]
  
  // Check if current page should use navigation system
  const shouldUseNavigation = navigationPages.some(page => 
    pathname === page || pathname.startsWith(page + '/')
  )
  
  // Marketing/public pages that should show header and footer
  const isPublicPage = !shouldUseNavigation
  
  if (shouldUseNavigation) {
    // Logged-in user pages: Use SidebarLayout with PageLayout
    return (
      <SidebarLayout>
        <PageLayout containerSize="xl">
          {children}
        </PageLayout>
      </SidebarLayout>
    )
  }
  
  // Public pages: Use Header + Footer with PageLayout
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <PageLayout containerSize="xl">
        {children}
      </PageLayout>
      <Footer />
    </div>
  )
}
