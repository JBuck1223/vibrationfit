'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container, Stack, Card, PageHero, Spinner } from '@/lib/design-system/components'
import { Sparkles, ArrowRight, Edit3, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLifeVisionStudio } from '@/components/life-vision-studio/LifeVisionStudioContext'

export default function LifeVisionCreatePage() {
  const router = useRouter()
  const { activeVisionId, draftId, loading } = useLifeVisionStudio()
  const [navigating, setNavigating] = useState(false)

  const handleRefineWithViva = async () => {
    setNavigating(true)
    try {
      if (draftId) {
        router.push(`/life-vision/${draftId}/refine`)
        return
      }

      if (activeVisionId) {
        router.push(`/life-vision/${activeVisionId}/refine`)
        return
      }

      router.push('/life-vision/refine/new')
    } catch {
      setNavigating(false)
    }
  }

  const handleEditManually = async () => {
    setNavigating(true)
    try {
      if (draftId) {
        router.push(`/life-vision/${draftId}/draft`)
        return
      }

      if (activeVisionId) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: existingDraft } = await supabase
          .from('vision_versions')
          .select('id')
          .eq('parent_id', activeVisionId)
          .eq('is_draft', true)
          .eq('user_id', user.id)
          .maybeSingle()

        if (existingDraft) {
          router.push(`/life-vision/${existingDraft.id}/draft`)
        } else {
          router.push(`/life-vision/${activeVisionId}/refine`)
        }
        return
      }

      router.push('/life-vision/manual')
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
          title="Create Life Vision"
          subtitle="Start a new vision, refine with VIVA, or edit your draft directly."
        />

        {navigating && (
          <div className="flex items-center justify-center py-4">
            <Spinner size="sm" />
            <span className="ml-2 text-sm text-neutral-400">Loading...</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/life-vision/new" className="block">
            <Card
              variant="elevated"
              hover
              className="p-6 transition-all border-[#39FF14]/30 bg-gradient-to-br from-[#39FF14]/[0.06] to-transparent"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#39FF14]/15">
                  <Plus className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-1">Start Fresh</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Build a new Life Vision from the ground up with VIVA guiding you through each category.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
              </div>
            </Card>
          </Link>

          <button onClick={handleRefineWithViva} disabled={navigating} className="block w-full text-left">
            <Card
              variant="elevated"
              hover
              className="p-6 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#BF00FF]/15">
                  <Sparkles className="w-6 h-6 text-[#BF00FF]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-1">Refine with VIVA</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Have a conversation with VIVA to elevate your vision through guided refinement and suggestions.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
              </div>
            </Card>
          </button>

          <button onClick={handleEditManually} disabled={navigating} className="block w-full text-left">
            <Card
              variant="elevated"
              hover
              className="p-6 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-cyan-500/15">
                  <Edit3 className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-1">Edit Manually</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Make direct edits to your vision categories in the draft editor.
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
