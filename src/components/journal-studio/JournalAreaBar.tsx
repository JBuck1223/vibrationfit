'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, PenLine, Calendar } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AreaBar, type AreaBarVersionSelector } from '@/lib/design-system/components'
import { useAreaBarWalkthrough } from '@/components/tool-walkthrough'
import { useJournalStudio } from './JournalStudioContext'

const TABS = [
  { label: 'My Journal', path: '/journal', icon: BookOpen, dataTour: 'studio-tab-journal-view' },
  { label: 'Create', path: '/journal/new', icon: PenLine, dataTour: 'studio-tab-journal-create' },
]

export function JournalAreaBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { entries } = useJournalStudio()
  const walkthroughMenu = useAreaBarWalkthrough()

  const isJournalList = pathname === '/journal' || pathname === '/journal/'
  const isJournalDetail = !isJournalList
    && pathname !== '/journal/new'
    && pathname !== '/journal/resources'
    && /^\/journal\/[^/]+(\/edit)?$/.test(pathname)

  let versionSelectors: AreaBarVersionSelector[] | undefined

  if (isJournalDetail) {
    const segments = pathname.split('/')
    const entryId = segments[2] || ''

    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr + 'T00:00:00')
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    versionSelectors = [{
      id: 'journal-entry',
      label: 'Journal entry',
      dataTour: 'studio-versions',
      icon: Calendar,
      position: 'contextRow',
      searchable: true,
      options: entries.map(entry => ({
        id: entry.id,
        label: entry.title || 'Untitled Entry',
        sublabel: formatDate(entry.date),
        icon: Calendar,
      })),
      selectedId: entryId,
      onSelect: (id: string) => {
        if (id !== entryId) router.push(`/journal/${id}`)
      },
    }]
  }

  return (
    <AreaBar
      area={{ name: 'My Journal', icon: BookOpen }}
      tabs={TABS}
      versionSelectors={versionSelectors}
      menuItems={walkthroughMenu}
      variant="default"
      appLikePrimaryTabs
    />
  )
}
