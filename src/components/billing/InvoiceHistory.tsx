'use client'

import { Card, Badge } from '@/lib/design-system/components'
import { Receipt, Download, ExternalLink } from 'lucide-react'
import { formatPrice } from '@/lib/billing/config'

type Invoice = {
  id: string
  number: string | null
  date: string | null
  amountPaid: number
  currency: string
  status: string | null
  description: string
  pdfUrl: string | null
  hostedUrl: string | null
}

type Props = {
  invoices: Invoice[]
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getStatusBadge(status: string | null) {
  switch (status) {
    case 'paid': return <Badge variant="success">Paid</Badge>
    case 'open': return <Badge variant="warning">Open</Badge>
    case 'draft': return <Badge>Draft</Badge>
    case 'void': return <Badge variant="warning">Void</Badge>
    case 'uncollectible': return <Badge variant="warning">Uncollectible</Badge>
    default: return null
  }
}

export default function InvoiceHistory({ invoices }: Props) {
  return (
    <Card variant="outlined" className="p-4 md:p-5 border-neutral-800 bg-neutral-900/30">
      <div className="mb-4 flex items-center justify-center gap-2.5">
        <Receipt className="w-5 h-5 text-neutral-500 shrink-0" aria-hidden />
        <h3 className="text-lg md:text-xl font-semibold text-white leading-snug">Billing history</h3>
      </div>

      {invoices.length === 0 ? (
        <p className="text-neutral-500 text-sm text-center py-6">No invoices yet</p>
      ) : (
        <div className="space-y-2">
          {/* Header — desktop only */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-3 text-[11px] text-neutral-500 uppercase tracking-wide">
            <div>Description</div>
            <div className="w-20 text-right">Amount</div>
            <div className="w-16 text-center">Status</div>
            <div className="w-20 text-right">Actions</div>
          </div>

          {invoices.map(inv => (
            <div
              key={inv.id}
              className="bg-neutral-950/80 rounded-xl p-3 sm:px-4 border border-neutral-800/80 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-x-4 sm:gap-y-0 sm:items-center"
            >
              <div className="min-w-0 mb-3 sm:mb-0">
                <div className="text-sm font-medium text-white break-words">{inv.description}</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {formatDate(inv.date)}
                  {inv.number && ` \u00b7 ${inv.number}`}
                </div>
              </div>

              <div className="sm:hidden space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-neutral-500">Amount</span>
                  <span className="text-sm font-medium text-white tabular-nums">{formatPrice(inv.amountPaid)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-neutral-500">Status</span>
                  <div>{getStatusBadge(inv.status)}</div>
                </div>
                <div className="flex justify-end gap-1 pt-1 border-t border-neutral-800/80">
                  {inv.pdfUrl && (
                    <a
                      href={inv.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  {inv.hostedUrl && (
                    <a
                      href={inv.hostedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="View invoice"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <div className="hidden sm:block text-right text-sm font-medium text-white tabular-nums w-20">
                {formatPrice(inv.amountPaid)}
              </div>
              <div className="hidden sm:flex w-16 justify-center">
                {getStatusBadge(inv.status)}
              </div>
              <div className="hidden sm:flex w-20 justify-end gap-1">
                {inv.pdfUrl && (
                  <a
                    href={inv.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                {inv.hostedUrl && (
                  <a
                    href={inv.hostedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
                    title="View invoice"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
