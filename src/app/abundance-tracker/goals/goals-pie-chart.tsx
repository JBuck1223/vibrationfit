'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export type GoalsPieDatum = { name: string; value: number; color: string }

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function pieLegendPayload(entries: GoalsPieDatum[]) {
  return entries.map((d) => ({
    value: d.name,
    color: d.color,
    payload: { value: d.value },
  }))
}

function ChartLegend(props: {
  payload?: Array<{ value: string; color: string; payload?: { value?: number } }>
  formatCurrency?: (n: number) => string
}) {
  const { payload = [], formatCurrency: fmt = formatCurrency } = props
  return (
    <ul className="flex flex-wrap justify-center gap-2 pt-2 list-none p-0 m-0">
      {payload.map((entry, i) => (
        <li
          key={`legend-${i}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white transition hover:border-white/[0.12] hover:bg-white/[0.06]"
        >
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{
              backgroundColor: entry.color,
              boxShadow: `0 0 8px ${entry.color}40`,
            }}
          />
          <span>
            {entry.value}: {fmt(entry.payload?.value ?? 0)}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function GoalsPieChart({ data }: { data: GoalsPieDatum[] }) {
  return (
    <div className="flex w-full flex-col">
      <div className="h-[260px] w-full min-w-0 sm:h-[280px] lg:h-[270px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="34%"
              outerRadius="52%"
              paddingAngle={0}
              dataKey="value"
              nameKey="name"
              label={false}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend payload={pieLegendPayload(data)} formatCurrency={formatCurrency} />
    </div>
  )
}
