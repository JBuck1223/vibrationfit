// src/app/life-vision/create-with-viva/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VisionBuilder } from '@/components/VisionBuilder'
import { Button } from '@/lib/design-system/components'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function CreateWithVivaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUserId(user.id)
      } catch (error) {
        console.error('Error getting user:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router, supabase])

  const handleVisionComplete = async (visionData: Record<string, string>) => {
    try {
      if (!userId) return

      // Save the vision to the database
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if we already have a vision for this user with version 1
      const { data: existingVision } = await supabase
        .from('vision_versions')
        .select('id')
        .eq('user_id', user.id)
        .eq('version_number', 1)
        .single()

      const upsertData = {
        ...(existingVision?.id && { id: existingVision.id }),
        user_id: user.id,
        ...visionData,
        version_number: 1,
        status: 'complete',
        completion_percent: 100,
        ai_generated: true,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('vision_versions')
        .upsert(upsertData)

      if (error) {
        console.error('Error saving vision:', error)
        alert('Failed to save your vision. Please try again.')
        return
      }

      // Redirect to the vision page
      router.push('/life-vision')
    } catch (error) {
      console.error('Error in handleVisionComplete:', error)
      alert('An error occurred. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading your VIVA experience...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center">
          <div className="flex items-center gap-2 text-primary-500">
            <Sparkles size={24} />
            <span className="text-xl font-bold">VIVA</span>
          </div>
        </div>
      </div>

      {/* Vision Builder */}
      <VisionBuilder 
        userId={userId}
        onComplete={handleVisionComplete}
      />
    </div>
  )
}