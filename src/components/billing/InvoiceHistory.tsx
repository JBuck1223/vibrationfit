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
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Receipt className="w-5 h-5 text-neutral-400" />
        <h3 className="text-lg font-bold text-white">Billing History</h3>
      </div>

      {invoices.length === 0 ? (
        <p className="text-neutral-500 text-sm text-center py-4">No invoices yet</p>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 text-xs text-neutral-500 uppercase tracking-wide">
            <div>Description</div>
            <div className="w-20 text-right">Amount</div>
            <div className="w-16 text-center">Status</div>
            <div className="w-20 text-right">Actions</div>
          </div>

          {invoices.map(inv => (
            <div
              key={inv.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 bg-neutral-900 rounded-xl p-4 items-center"
            >
              <div>
                <div className="text-sm font-medium text-white truncate">{inv.description}</div>
                <div className="text-xs text-neutral-400">
                  {formatDate(inv.date)}
                  {inv.number && ` \u00b7 ${inv.number}`}
                </div>
              </div>
              <div className="w-20 text-right text-sm font-medium text-white">
                {formatPrice(inv.amountPaid)}
              </div>
              <div className="w-16 text-center">
                {getStatusBadge(inv.status)}
              </div>
              <div className="w-20 flex justify-end gap-1">
                {inv.pdfUrl && (
                  <a
                    href={inv.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
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
                    className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
                    title="View Invoice"
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
