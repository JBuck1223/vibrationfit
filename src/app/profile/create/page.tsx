'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Stack, Card, PageHero, Spinner } from '@/lib/design-system/components'
import { Edit3, ArrowRight, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfileStudio } from '@/components/profile-studio/ProfileStudioContext'

export default function ProfileCreatePage() {
  const router = useRouter()
  const { activeProfileId, draftId, loading } = useProfileStudio()
  const [navigating, setNavigating] = useState(false)

  const handleEditDraft = async () => {
    setNavigating(true)
    try {
      if (draftId) {
        router.push(`/profile/${draftId}/edit`)
        return
      }
      if (activeProfileId) {
        router.push(`/profile/${activeProfileId}/edit`)
        return
      }
      router.push('/profile/new')
    } catch {
      setNavigating(false)
    }
  }

  const handleCreateNewDraft = async () => {
    setNavigating(true)
    try {
      if (!activeProfileId) {
        router.push('/profile/new')
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const existingDraft = draftId
      if (existingDraft) {
        router.push(`/profile/${existingDraft}/edit`)
        return
      }

      router.push(`/profile/${activeProfileId}/new`)
    } catch {
      setNavigating(false)
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <PageHero
          title="Update Profile"
          subtitle="Edit your existing draft or create a new version from your active profile."
        />

        {navigating && (
          <div className="flex items-center justify-center py-4">
            <Spinner size="sm" />
            <span className="ml-2 text-sm text-neutral-400">Loading...</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={handleEditDraft} disabled={navigating} className="block w-full text-left">
            <Card
              variant="elevated"
              hover
              className="p-6 transition-all border-[#39FF14]/30 bg-gradient-to-br from-[#39FF14]/[0.06] to-transparent"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#39FF14]/15">
                  <Edit3 className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-1">
                    {draftId ? 'Edit Existing Draft' : 'Edit Profile'}
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {draftId
                      ? 'Continue editing your current draft profile version.'
                      : 'Open your active profile for editing.'}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
              </div>
            </Card>
          </button>

          <button onClick={handleCreateNewDraft} disabled={navigating} className="block w-full text-left">
            <Card
              variant="elevated"
              hover
              className="p-6 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-cyan-500/15">
                  <Copy className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-1">Create New Draft</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Create a new draft version from your active profile to make changes without affecting the original.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
              </div>
            </Card>
          </button>
        </div>
      </Stack>
    </Container>
  )
}
