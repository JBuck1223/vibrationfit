'use client'

import React from 'react'
import { ProfileStudioProvider } from '@/components/profile-studio/ProfileStudioContext'
import { ProfileAreaBar } from '@/components/profile-studio/ProfileAreaBar'

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileStudioProvider>
      <div className="min-h-screen flex flex-col bg-black">
        <ProfileAreaBar />
        <main className="flex-1 pt-6 pb-3 md:pt-8 md:pb-3 lg:pt-6 px-4 md:px-0">
          {children}
        </main>
      </div>
    </ProfileStudioProvider>
  )
}
