'use client'

import { Card, Badge, Button } from '@/lib/design-system/components'
import Link from 'next/link'
import { Zap, CheckCircle, Clock, Calendar, Mail, Home } from 'lucide-react'
import { formatPrice } from '@/lib/billing/config'

type Installment = {
  number: number
  amount: number
  status: 'paid' | 'upcoming' | 'scheduled'
  date: string | null
}

type IntensiveData = {
  id: string
  productName: string
  isHousehold: boolean
  paymentPlan: string
  installmentsTotal: number
  installmentsPaid: number
  amount: number
  completionStatus: string
  startedAt: string | null
  completedAt: string | null
  purchasedAt: string
  installments: Installment[]
}

type Props = {
  intensive: IntensiveData
}

function formatDate(iso: string | null): string {
  if (!iso) return 'TBD'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getPlanLabel(plan: string): string {
  switch (plan) {
    case 'full': return 'Paid in Full'
    case '2pay': return '2 Payments'
    case '3pay': return '3 Payments'
    default: return plan
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge variant="success">Completed</Badge>
    case 'in_progress':
      return <Badge variant="info">In Progress</Badge>
    case 'pending':
      return <Badge>Pending</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function IntensiveOverview({ intensive }: Props) {
  const allPaid = intensive.installmentsPaid >= intensive.installmentsTotal

  return (
    <Card variant="outlined" className="p-4 md:p-5 border-neutral-800 bg-neutral-900/30">
      <div className="mb-5 flex flex-col items-center gap-2 text-center md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-x-2">
        <div className="hidden min-w-0 md:block" aria-hidden="true" />
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 px-1">
          <Zap className="w-5 h-5 text-[#39FF14] shrink-0" aria-hidden />
          <h3 className="text-lg md:text-xl font-semibold text-white leading-snug">{intensive.productName}</h3>
        </div>
        <div className="flex shrink-0 justify-center md:justify-end">
          {getStatusBadge(intensive.completionStatus)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
        <div className="bg-neutral-950/80 rounded-xl p-3 border border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-1 uppercase tracking-wide">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            Purchased
          </div>
          <div className="text-sm font-medium text-white">
            {formatDate(intensive.purchasedAt)}
          </div>
        </div>
        <div className="bg-neutral-950/80 rounded-xl p-3 border border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-1 uppercase tracking-wide">
            Plan
          </div>
          <div className="text-sm font-medium text-white">
            {getPlanLabel(intensive.paymentPlan)}
          </div>
        </div>
        {intensive.isHousehold && (
          <div className="bg-neutral-950/80 rounded-xl p-3 border border-neutral-800/80 col-span-2">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-1 uppercase tracking-wide">
              <Home className="w-3.5 h-3.5 shrink-0" />
              Type
            </div>
            <div className="text-sm font-medium text-white">Household</div>
          </div>
        )}
      </div>

      {intensive.installments.length > 0 && (
        <div className="mb-5">
          <div className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">
            Payment schedule
          </div>
          <div className="space-y-2">
            {intensive.installments.map((inst) => (
              <div
                key={inst.number}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-neutral-950/80 rounded-xl px-3 py-3 sm:px-4 border border-neutral-800/80"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {inst.status === 'paid' ? (
                    <CheckCircle className="w-4 h-4 text-[#39FF14] shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-white">
                      {formatPrice(inst.amount)}
                    </span>
                    {intensive.installmentsTotal > 1 && (
                      <span className="text-xs text-neutral-500 ml-2">
                        {inst.number} / {intensive.installmentsTotal}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-neutral-400 sm:text-right pl-7 sm:pl-0 shrink-0">
                  {inst.status === 'paid' ? (
                    <span className="text-[#39FF14]">Paid {formatDate(inst.date)}</span>
                  ) : (
                    <span>Due {formatDate(inst.date)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {allPaid && intensive.installmentsTotal > 1 && (
            <div className="mt-2 text-xs text-[#39FF14] text-center">
              All payments complete
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full max-w-sm justify-center md:w-auto md:max-w-none"
          asChild
        >
          <Link href="/support/tickets" className="inline-flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            Contact Support
          </Link>
        </Button>
      </div>
    </Card>
  )
}
