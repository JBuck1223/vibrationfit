'use client'

import Link from 'next/link'
import { MessageSquare, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'
import { relativeDay, useLastVivaSession } from './queries'

export function VivaWidget(chrome: WidgetChromeProps) {
  const { data: session, isLoading } = useLastVivaSession()

  return (
    <WidgetFrame
      {...chrome}
      title="VIVA"
      icon={Sparkles}
      accent="#BF00FF"
      href="/viva"
      hrefLabel="Open"
      loading={isLoading}
    >
      <div className="flex flex-1 flex-col gap-3">
        {session ? (
          <Link
            href="/viva"
            className="group rounded-xl border border-accent-500/20 bg-accent-500/[0.06] p-3 transition-colors hover:border-accent-500/40"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-500">Last conversation</p>
            <p className="mt-1 line-clamp-1 text-sm font-medium text-white">
              {session.title || 'Untitled conversation'}
            </p>
            {session.preview_message ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-400">{session.preview_message}</p>
            ) : null}
            <p className="mt-2 text-[11px] text-neutral-500">
              {session.message_count ? `${session.message_count} messages · ` : ''}
              {relativeDay(session.last_message_at)}
            </p>
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed border-accent-500/30 p-3">
            <p className="text-sm font-medium text-white">Say something true.</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-400">
              VIVA knows your vision, your journal, and your board. Bring whatever is up.
            </p>
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-2">
          <Button variant="accent" size="sm" asChild>
            <Link href="/viva">
              {session ? (
                <>
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  Continue with VIVA
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Talk with VIVA
                </>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </WidgetFrame>
  )
}
