'use client'

import Link from 'next/link'
import { Archive, ArrowLeft } from 'lucide-react'
import { Container, Card, Button } from '@/lib/design-system/components'

export default function LegacyArchiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0">
      <Container size="xl" className="pt-4 pb-2">
        <Card className="p-4 border-[#FFB701]/40 bg-[#FFB701]/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Archive className="w-5 h-5 text-[#FFB701] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#FFB701]">Legacy archive (admin only)</p>
                <p className="text-xs text-neutral-400 mt-1">
                  This is the archived member UI. Public URLs redirect to the current studio routes.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/legacy">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to legacy list
              </Link>
            </Button>
          </div>
        </Card>
      </Container>
      <div className="pb-8">{children}</div>
    </div>
  )
}
