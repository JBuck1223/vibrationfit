'use client'

import { Card, Badge, Button } from '@/lib/design-system/components'
import { Zap, CheckCircle, Clock, Calendar, Mail } from 'lucide-react'
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
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-[#39FF14]" />
          <h3 className="text-lg font-bold text-white">{intensive.productName}</h3>
        </div>
        {getStatusBadge(intensive.completionStatus)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-neutral-900 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            Purchased
          </div>
          <div className="text-sm font-medium text-white">
            {formatDate(intensive.purchasedAt)}
          </div>
        </div>
        <div className="bg-neutral-900 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            Payment Plan
          </div>
          <div className="text-sm font-medium text-white">
            {getPlanLabel(intensive.paymentPlan)}
          </div>
        </div>
        {intensive.isHousehold && (
          <div className="bg-neutral-900 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
              Plan Type
            </div>
            <div className="text-sm font-medium text-white">Household</div>
          </div>
        )}
      </div>

      {intensive.installments.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-neutral-400 uppercase tracking-wide mb-3">
            Payment Schedule
          </div>
          <div className="space-y-2">
            {intensive.installments.map((inst) => (
              <div
                key={inst.number}
                className="flex items-center justify-between bg-neutral-900 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {inst.status === 'paid' ? (
                    <CheckCircle className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-sm font-medium text-white">
                      {formatPrice(inst.amount)}
                    </span>
                    {intensive.installmentsTotal > 1 && (
                      <span className="text-xs text-neutral-500 ml-2">
                        Payment {inst.number} of {intensive.installmentsTotal}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-neutral-400">
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

      <Button
        variant="ghost"
        className="w-full text-neutral-400 hover:text-white"
        onClick={() => window.location.href = 'mailto:support@vibrationfit.com?subject=Intensive%20Billing%20Inquiry'}
      >
        <Mail className="w-4 h-4 mr-2" />
        Contact Support
      </Button>
    </Card>
  )
}
