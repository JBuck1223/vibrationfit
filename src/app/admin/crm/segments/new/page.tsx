'use client'

import { useRouter } from 'next/navigation'
import { Container, PageHero } from '@/lib/design-system/components'
import { ArrowLeft } from 'lucide-react'
import SegmentBuilderForm from '../_components/SegmentBuilderForm'
import DataSourceReference from '../_components/DataSourceReference'

const btnGhost =
  'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full text-neutral-400 hover:text-white hover:bg-[#333] transition-all duration-200'

export default function NewSegmentPage() {
  const router = useRouter()

  return (
    <Container size="xl">
      <PageHero title="New Segment" subtitle="Build a reusable audience segment">
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
        <SegmentBuilderForm mode="create" />
      </div>
    </Container>
  )
}
