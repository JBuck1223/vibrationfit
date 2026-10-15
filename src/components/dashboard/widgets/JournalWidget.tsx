'use client'

import Link from 'next/link'
import { BookOpen, PenLine, ScrollText, Sparkles } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { WidgetEmpty, WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'
import { relativeDay, useRecentJournal } from './queries'

export function JournalWidget(chrome: WidgetChromeProps) {
  const { data, isLoading } = useRecentJournal(3)
  const entries = data?.entries ?? []

  return (
    <WidgetFrame
      {...chrome}
      title="Journal"
      icon={BookOpen}
      accent="#00FFFF"
      href="/journal"
      hrefLabel="Open"
      loading={isLoading}
    >
      {entries.length === 0 ? (
        <WidgetEmpty
          title="Capture what is moving"
          body="Contrast, clarity, synchronicity. Write it down and VIVA can turn it into a story."
          action={
            <Button variant="primary" size="sm" asChild>
              <Link href="/journal/new">
                <PenLine className="mr-1.5 h-4 w-4" />
                New entry
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <ul className="divide-y divide-white/[0.06]">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Link href={`/journal/${entry.id}`} className="block py-2 first:pt-0 hover:text-white">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-white">{entry.title || 'Untitled entry'}</p>
                    <span className="shrink-0 text-[11px] text-neutral-500">{relativeDay(entry.created_at)}</span>
                  </div>
                  {entry.content ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-neutral-400">{entry.content}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap gap-2">
            <Button variant="primary" size="sm" asChild>
              <Link href="/journal/new">
                <PenLine className="mr-1.5 h-4 w-4" />
                Capture
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/journal">
                <ScrollText className="mr-1.5 h-4 w-4" />
                Review
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/story/new">
                <Sparkles className="mr-1.5 h-4 w-4" />
                Make a story
              </Link>
            </Button>
          </div>
          {data?.total ? (
            <p className="text-[11px] text-neutral-500">{data.total} entries and counting.</p>
          ) : null}
        </div>
      )}
    </WidgetFrame>
  )
}
