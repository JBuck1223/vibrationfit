'use client'

import { useState, useEffect, useCallback } from 'react'
import { Container, Stack, PageHero, Button, Spinner } from '@/lib/design-system/components'
import { ChevronLeft, Zap, CreditCard } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Suspense } from 'react'
import IntensiveOverview from '@/components/billing/IntensiveOverview'
import PlanOverview from '@/components/billing/PlanOverview'
import AddOnsList from '@/components/billing/AddOnsList'
import PaymentMethodsList from '@/components/billing/PaymentMethodsList'
import InvoiceHistory from '@/components/billing/InvoiceHistory'
import AddCardForm from '@/components/billing/AddCardForm'

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <Icon className="w-4 h-4 text-neutral-500" />
      <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{title}</h2>
      <div className="flex-1 border-t border-neutral-800" />
    </div>
  )
}

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [membership, setMembership] = useState<any>(null)
  const [intensive, setIntensive] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isCanceling, setIsCanceling] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [membershipRes, intensiveRes, pmRes, invoicesRes] = await Promise.all([
        fetch('/api/billing/membership'),
        fetch('/api/billing/intensive'),
        fetch('/api/billing/payment-methods'),
        fetch('/api/billing/invoices'),
      ])

      const [membershipData, intensiveData, pmData, invoicesData] = await Promise.all([
        membershipRes.json(),
        intensiveRes.json(),
        pmRes.json(),
        invoicesRes.json(),
      ])

      setMembership(membershipData)
      setIntensive(intensiveData.intensive || null)
      setPaymentMethods(pmData.paymentMethods || [])
      setInvoices(invoicesData.invoices || [])
    } catch {
      toast.error('Failed to load billing information')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (searchParams.get('card_added') === 'true') {
      toast.success('Payment method added')
      fetchAll()
      router.replace('/account/billing')
    }
  }, [searchParams, fetchAll, router])

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your membership? You will retain access until the end of your billing period.')) return

    setIsCanceling(true)
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to cancel')
      }
      toast.success('Membership set to cancel at end of billing period')
      fetchAll()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsCanceling(false)
    }
  }

  const handleResume = async () => {
    setIsResuming(true)
    try {
      const res = await fetch('/api/billing/resume', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to resume')
      }
      toast.success('Membership resumed')
      fetchAll()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsResuming(false)
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Billing & Subscription"
          subtitle="Manage your purchases, membership, and billing history"
        >
          <div className="flex justify-center w-full">
            <Button variant="outline" onClick={() => router.push('/account')}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Account Dashboard
            </Button>
          </div>
        </PageHero>

        {intensive && (
          <>
            <SectionHeader icon={Zap} title="Vision Activation Intensive" />
            <IntensiveOverview intensive={intensive} />
          </>
        )}

        <SectionHeader icon={CreditCard} title="Vision Pro Membership" />
        <PlanOverview
          subscription={membership?.subscription || null}
          upcomingInvoice={membership?.upcomingInvoice || null}
          onCancel={handleCancel}
          onResume={handleResume}
          onRefresh={fetchAll}
          isCanceling={isCanceling}
          isResuming={isResuming}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AddOnsList
            addons={membership?.addons || []}
            onRemoved={fetchAll}
          />
          <PaymentMethodsList
            paymentMethods={paymentMethods}
            onRefresh={fetchAll}
            onAddCard={() => setShowAddCard(true)}
          />
        </div>

        <AddCardForm
          isOpen={showAddCard}
          onClose={() => setShowAddCard(false)}
          onSuccess={fetchAll}
        />

        <InvoiceHistory invoices={invoices} />
      </Stack>
    </Container>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    }>
      <BillingContent />
    </Suspense>
  )
}
