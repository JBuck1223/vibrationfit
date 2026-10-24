'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { DollarSign, Plus } from 'lucide-react'
import { Button } from '@/lib/design-system/components'
import { useDashboard } from '../DashboardContext'
import { WidgetFrame, WidgetStat, type WidgetChromeProps } from '../WidgetFrame'
import { relativeDay, todayInTimezone, useAbundanceMonth } from './queries'

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function AbundanceWidget(chrome: WidgetChromeProps) {
  const { server } = useDashboard()
  const { monthStart, monthEnd, monthLabel } = useMemo(() => {
    const today = todayInTimezone(server.userTimezone)
    const [y, m] = today.split('-').map(Number)
    const start = `${y}-${String(m).padStart(2, '0')}-01`
    const lastDay = new Date(y, m, 0).getDate()
    const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long' })
    return { monthStart: start, monthEnd: end, monthLabel: label }
  }, [server.userTimezone])

  const { data, isLoading } = useAbundanceMonth(monthStart, monthEnd)

  return (
    <WidgetFrame
      {...chrome}
      title="Abundance"
      icon={DollarSign}
      accent="#FFB701"
      href="/abundance-tracker"
      hrefLabel="Open"
      loading={isLoading}
    >
      <div className="flex flex-1 flex-col gap-3">
        <p className="text-[10px] font-medium text-white/60">{monthLabel} so far</p>
        <div className="grid grid-cols-2 gap-2">
          <WidgetStat label="Money in" value={formatMoney(data?.moneyTotal ?? 0)} hint={`${data?.moneyCount ?? 0} ${data?.moneyCount === 1 ? 'entry' : 'entries'}`} />
          <WidgetStat label="Value received" value={data?.valueCount ?? 0} hint="moments noticed" />
        </div>
        {data?.last ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-neutral-400">
            <span className="text-neutral-500">{relativeDay(data.last.created_at)}: </span>
            {data.last.note}
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-neutral-400">
            Log what shows up: a check, a gift, a free coffee. Noticing is the practice.
          </p>
        )}
        <div className="mt-auto">
          <Button variant="primary" size="sm" asChild>
            <Link href="/abundance-tracker/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Log abundance
            </Link>
          </Button>
        </div>
      </div>
    </WidgetFrame>
  )
}
