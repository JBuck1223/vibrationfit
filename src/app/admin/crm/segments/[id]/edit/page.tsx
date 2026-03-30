'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Container, PageHero, Spinner } from '@/lib/design-system/components'
import { ArrowLeft } from 'lucide-react'
import SegmentBuilderForm from '../../_components/SegmentBuilderForm'
import DataSourceReference from '../../_components/DataSourceReference'
import { toast } from 'sonner'

const btnGhost =
  'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full text-neutral-400 hover:text-white hover:bg-[#333] transition-all duration-200'

export default function EditSegmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [segment, setSegment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/crm/segments/${id}`)
        if (!res.ok) throw new Error('Failed to load segment')
        const data = await res.json()
        setSegment(data.segment)
      } catch {
        toast.error('Failed to load segment')
        router.push('/admin/crm/segments')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!segment) return null

  return (
    <Container size="xl">
      <PageHero title="Edit Segment" subtitle={segment.name}>
        <button
          type="button"
          onClick={() => router.push('/admin/crm/segments')}
          className={btnGhost}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Segments
        </button>
      </PageHero>
      <div className="mt-8 space-y-6">
        <DataSourceReference />
        <SegmentBuilderForm mode="edit" segment={segment} />
      </div>
    </Container>
  )
}
