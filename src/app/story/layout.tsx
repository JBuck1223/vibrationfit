'use client'

import React from 'react'

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
