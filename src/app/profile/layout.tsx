'use client'

import React from 'react'
import { ProfileStudioProvider } from '@/components/profile-studio/ProfileStudioContext'
import { ProfileAreaBar } from '@/components/profile-studio/ProfileAreaBar'

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileStudioProvider>
      <div className="min-h-screen flex flex-col bg-black">
        <ProfileAreaBar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </ProfileStudioProvider>
  )
}
