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
  
  // Define page classifications - COMPLETE LIST OF ALL PAGES
  const pageClassifications = {
    // USER PAGES - Logged-in users, get sidebar + mobile nav
    USER: [
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
      
      // Account and billing
      '/billing',
      '/account/settings',
    ],
    
    // ADMIN PAGES - Admin users, get sidebar + mobile nav
    ADMIN: [
      '/admin/ai-models',
      '/admin/token-usage',
      '/admin/users',
      '/sitemap',
    ],
    
    // PUBLIC PAGES - Marketing/auth, get header + footer
    PUBLIC: [
      // Marketing pages
      '/',
      '/pricing',
      '/pricing-hormozi',
      '/design-system',
      '/design-system-experiment',
      
      // Authentication pages
      '/auth/login',
      '/auth/signup',
      '/auth/verify',
      '/auth/setup-password',
      '/auth/logout',
      '/auth/callback',
      '/auth/auto-login',
      
      // Public utility pages
      '/checkout',
      '/billing/success',
      '/debug/email',
      '/test-recording',
      '/vision/build',
      
      // Support (public access)
      '/support',
    ]
  }
  
  // Determine page type
  const getPageType = (pathname: string): 'USER' | 'ADMIN' | 'PUBLIC' => {
    // Check USER pages
    if (pageClassifications.USER.some(page => 
      pathname === page || pathname.startsWith(page + '/')
    )) {
      return 'USER'
    }
    
    // Check ADMIN pages
    if (pageClassifications.ADMIN.some(page => 
      pathname === page || pathname.startsWith(page + '/')
    )) {
      return 'ADMIN'
    }
    
    // Default to PUBLIC
    return 'PUBLIC'
  }
  
  const pageType = getPageType(pathname)
  
  // Render based on page type
  if (pageType === 'USER' || pageType === 'ADMIN') {
    // User and Admin pages: Use SidebarLayout with PageLayout
    return (
      <SidebarLayout isAdmin={pageType === 'ADMIN'}>
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
