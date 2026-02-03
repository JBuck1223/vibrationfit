'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Container, Stack, PageHero, Card, Spinner } from '@/lib/design-system/components'
import { RetentionDashboard } from '@/components/retention'
import { BadgeDisplay } from '@/components/badges'
import { User, Calendar, ArrowLeft, Award } from 'lucide-react'
import Link from 'next/link'

interface MemberProfile {
  id: string
  full_name: string | null
  first_name: string | null
  profile_picture_url: string | null
  created_at: string
}

export default function SnapshotPage() {
  const params = useParams()
  const userId = params.id as string
  
  const [member, setMember] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMemberProfile() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/snapshot/${userId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Member not found')
          }
          throw new Error('Failed to load member profile')
        }
        
        const data = await response.json()
        setMember(data)
      } catch (err) {
        console.error('Error fetching member profile:', err)
        setError(err instanceof Error ? err.message : 'Failed to load member')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchMemberProfile()
    }
  }, [userId])

  // Format the member since date
  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (error || !member) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <Card className="p-6 md:p-8 text-center">
            <div className="text-red-400 mb-4">
              <User className="w-12 h-12 mx-auto opacity-50" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">
              {error || 'Member not found'}
            </h2>
            <p className="text-neutral-400 mb-6 text-sm md:text-base">
              This member profile could not be loaded.
            </p>
            <Link 
              href="/vibe-tribe"
              className="text-teal-400 hover:underline inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Vibe Tribe
            </Link>
          </Card>
        </Stack>
      </Container>
    )
  }

  const displayName = member.full_name || member.first_name || 'Community Member'

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* PageHero with member info */}
        <PageHero
          eyebrow="VIBE TRIBE"
          title={displayName}
          subtitle={`Member since ${formatMemberSince(member.created_at)}`}
        >
          {/* Profile picture */}
          <div className="flex flex-col items-center gap-4">
            {member.profile_picture_url ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-700">
                <img
                  src={member.profile_picture_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center">
                <User className="w-10 h-10 text-neutral-500" />
              </div>
            )}
            
            {/* Back link */}
            <Link 
              href="/vibe-tribe"
              className="text-sm text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Vibe Tribe
            </Link>
          </div>
        </PageHero>

        {/* Retention Metrics Section */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-semibold text-white">Activity Snapshot</h2>
          </div>
          
          <RetentionDashboard userId={userId} readonly />
        </Card>

        {/* Badges Section */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Earned Badges</h2>
          </div>
          <BadgeDisplay userId={userId} compact={false} hideEmpty={false} lockUntilEarned={true} variant="engraved" />
        </Card>
      </Stack>
    </Container>
  )
}
