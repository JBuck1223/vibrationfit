'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, User } from 'lucide-react'
import { Card, Button, Spinner, Container } from '@/lib/design-system/components'
import { useProfileStudio } from '@/components/profile-studio/ProfileStudioContext'

export default function ProfileListPage() {
  const router = useRouter()
  const { versions, loading, activeProfileId } = useProfileStudio()
  const redirected = useRef(false)

  useEffect(() => {
    if (loading || redirected.current) return

    if (activeProfileId) {
      redirected.current = true
      router.replace(`/profile/${activeProfileId}`)
      return
    }

    const firstVersion = versions[0]
    if (firstVersion?.id) {
      redirected.current = true
      router.replace(`/profile/${firstVersion.id}`)
    }
  }, [loading, activeProfileId, versions, router])

  if (loading || activeProfileId || versions.length > 0) {
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
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">No profile yet</h3>
          <p className="text-neutral-400 mb-8">
            Start by creating your first profile. Define your personal information and preferences.
          </p>
          <Button asChild size="lg">
            <Link href="/profile/new">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Profile
            </Link>
          </Button>
        </Card>
      </div>
    </Container>
  )
}
