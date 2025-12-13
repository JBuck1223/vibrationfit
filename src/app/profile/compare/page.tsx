'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Button, Badge, Spinner, Heading, Text, Stack, Container, PageHero } from '@/lib/design-system/components'
import { VersionComparison } from '../components/VersionComparison'
import { VersionSelector } from '../components/VersionSelector'
import { ArrowLeft } from 'lucide-react'

interface ProfileData {
  id: string
  version_number: number
  is_draft: boolean
  is_active: boolean
  created_at: string
}

export default function ProfileComparePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const version1Id = searchParams.get('v1')
  const version2Id = searchParams.get('v2')
  
  const [versions, setVersions] = useState<ProfileData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSelector, setShowSelector] = useState(!version1Id || !version2Id)

  useEffect(() => {
    fetchVersions()
  }, [])

  useEffect(() => {
    // Update selector visibility when query params change
    const v1 = searchParams.get('v1')
    const v2 = searchParams.get('v2')
    setShowSelector(!v1 || !v2)
  }, [searchParams])

  const fetchVersions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile?includeVersions=true')
      if (!response.ok) {
        throw new Error('Failed to fetch versions')
      }
      const data = await response.json()
      setVersions(data.versions || [])
      
      // If we have query params but not enough versions, show selector
      if ((version1Id || version2Id) && (!version1Id || !version2Id)) {
        setShowSelector(true)
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompare = (v1Id: string, v2Id: string) => {
    router.push(`/profile/compare?v1=${v1Id}&v2=${v2Id}`)
    setShowSelector(false)
  }

  const handleBack = () => {
    router.push('/profile')
  }

  if (isLoading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" />
        </div>
      </Container>
    )
  }

  // Show version selector if no versions selected or need to select
  if (showSelector || !version1Id || !version2Id) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            title="Compare Profile Versions"
            subtitle="Select two versions to compare and see what changed between them."
          >
            <Button
              onClick={handleBack}
              variant="ghost"
              className="text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Profile
            </Button>
          </PageHero>
        
        {versions.length < 2 ? (
          <Card className="p-8 text-center">
            <Text className="text-neutral-400 mb-4">
              You need at least 2 versions to compare.
            </Text>
            <Button onClick={handleBack} variant="primary">
              Back to Profile
            </Button>
          </Card>
        ) : (
          <VersionSelector
            versions={versions}
            onCompare={handleCompare}
            onClose={handleBack}
          />
        )}
        </Stack>
      </Container>
    )
  }

  // Show comparison view
  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Compare Profile Versions"
          subtitle="View changes between versions"
        >
          <Button
            onClick={handleBack}
            variant="ghost"
            className="text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Profile
          </Button>
        </PageHero>
        
        <VersionComparison
          version1Id={version1Id}
          version2Id={version2Id}
          onClose={handleBack}
        />
      </Stack>
    </Container>
  )
}

