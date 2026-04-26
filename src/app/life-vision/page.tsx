'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Card, Button, Spinner, Container } from '@/lib/design-system/components'
import { useLifeVisionStudio } from '@/components/life-vision-studio/LifeVisionStudioContext'

export default function VisionListPage() {
  const router = useRouter()
  const { visions, loading, activeVisionId } = useLifeVisionStudio()
  const redirected = useRef(false)

  useEffect(() => {
    if (loading || redirected.current) return

    if (activeVisionId) {
      redirected.current = true
      router.replace(`/life-vision/${activeVisionId}`)
      return
    }

    const firstVision = visions.find(v => !v.is_draft)
    if (firstVision?.id) {
      redirected.current = true
      router.replace(`/life-vision/${firstVision.id}`)
    }
  }, [loading, activeVisionId, visions, router])

  if (loading || activeVisionId || visions.some(v => !v.is_draft)) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl" className="py-12">
      <div className="text-center">
        <Card className="max-w-md mx-auto">
          <h3 className="text-2xl font-bold text-white mb-4">No vision yet</h3>
          <p className="text-neutral-400 mb-8">
            Start your conscious creation journey by creating your first Life Vision.
          </p>
          <Button asChild size="lg">
            <Link href="/life-vision/new">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Life Vision
            </Link>
          </Button>
        </Card>
      </div>
    </Container>
  )
}
