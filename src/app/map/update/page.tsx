'use client'

import Link from 'next/link'
import { Container, Stack, Card } from '@/lib/design-system/components'
import { Target, PenLine, ChevronRight } from 'lucide-react'
import { useMapStudio } from '@/components/map-studio'

export default function MapUpdateLandingPage() {
  const { systemCommitments, customCommitments } = useMapStudio()

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div>
          <h1 className="text-2xl font-bold text-white">Update MAP</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Configure your System alignment tools and Custom personal commitments.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/map/update/system">
            <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] hover:border-primary-500/30 transition-colors h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white">System MAP</h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Configure Activate, Create, Connect, and Attend.
                  </p>
                  <p className="text-xs text-neutral-600 mt-2">
                    {systemCommitments.length} active system action{systemCommitments.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
              </div>
            </Card>
          </Link>

          <Link href="/map/update/custom">
            <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] hover:border-primary-500/30 transition-colors h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#BF00FF]/10 flex items-center justify-center flex-shrink-0">
                  <PenLine className="w-6 h-6 text-[#BF00FF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white">Custom Actions</h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Add personal commitments by life category.
                  </p>
                  <p className="text-xs text-neutral-600 mt-2">
                    {customCommitments.length} custom action{customCommitments.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-1" />
              </div>
            </Card>
          </Link>
        </div>
      </Stack>
    </Container>
  )
}
