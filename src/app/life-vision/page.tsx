'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Card, Button, Spinner, Container } from '@/lib/design-system/components'

export default function VisionListPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasVision, setHasVision] = useState(false)

  useEffect(() => {
    const loadAndRedirect = async () => {
      try {
        const response = await fetch('/api/vision?includeVersions=false')
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth/login')
            return
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        if (data.vision?.id) {
          setHasVision(true)
          router.replace(`/life-vision/${data.vision.id}`)
        } else {
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    }

    loadAndRedirect()
  }, [router])

  if (loading || hasVision) {
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
