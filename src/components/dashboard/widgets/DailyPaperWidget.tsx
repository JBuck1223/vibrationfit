'use client'

import Link from 'next/link'
import { ArrowRight, Flame, PenLine, Sun } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { cn } from '@/lib/utils'
import { useDashboard } from '../DashboardContext'
import { WidgetEmpty, WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'
import { todayInTimezone, useAreaStatsQuery, useTodayDailyPaper } from './queries'
import { isWideWidget } from '@/lib/dashboard/widgets/registry'

export function DailyPaperWidget(chrome: WidgetChromeProps) {
  const { server } = useDashboard()
  const today = todayInTimezone(server.userTimezone)
  const { data: paper, isLoading } = useTodayDailyPaper(today)
  const { data: stats } = useAreaStatsQuery('daily-paper')

  const tasks = paper ? [paper.task_one, paper.task_two, paper.task_three].filter((t) => t && t.trim()) : []
  const streak = stats?.currentStreak ?? 0

  return (
    <WidgetFrame
      {...chrome}
      title="Daily Paper"
      icon={Sun}
      accent="#FFFF00"
      href="/daily-paper"
      hrefLabel="Open"
      loading={isLoading}
    >
      {!paper ? (
        <WidgetEmpty
          title="Write today's paper"
          body="One gratitude, three tasks, one fun plan. Two minutes that set the tone."
          action={
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm" asChild>
                <Link href="/daily-paper/new">
                  <PenLine className="mr-1.5 h-4 w-4" />
                  Write it
                </Link>
              </Button>
              {streak > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs text-energy-500">
                  <Flame className="h-3.5 w-3.5" />
                  {streak}-day streak on the line
                </span>
              ) : null}
            </div>
          }
        />
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-energy-500/10 px-2 py-0.5 text-[11px] font-medium text-energy-500">
              Done today
            </span>
            {streak > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                <Flame className="h-3.5 w-3.5 text-energy-500" />
                {streak} {streak === 1 ? 'day' : 'days'}
              </span>
            ) : null}
          </div>

          {paper.gratitude?.trim() ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Grateful for</p>
              <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-neutral-200">{paper.gratitude}</p>
            </div>
          ) : null}

          {tasks.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Today</p>
              <ul className="mt-1 space-y-1">
                {tasks.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-200">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-energy-500" />
                    <span className="line-clamp-1">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {paper.fun_plan?.trim() ? (
            <p className={cn('text-xs text-neutral-400', !isWideWidget(chrome.size) && 'line-clamp-1')}>
              <span className="font-medium text-neutral-300">Fun:</span> {paper.fun_plan}
            </p>
          ) : null}

          <Link
            href="/daily-paper"
            className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-white"
          >
            Edit today&apos;s paper
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </WidgetFrame>
  )
}
