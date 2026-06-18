'use client'

import { useState, useEffect, useCallback } from 'react'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Suspense } from 'react'
import IntensiveOverview from '@/components/billing/IntensiveOverview'
import PlanOverview from '@/components/billing/PlanOverview'
import HouseholdSection from '@/components/billing/HouseholdSection'
import PaymentMethodsList from '@/components/billing/PaymentMethodsList'
import InvoiceHistory from '@/components/billing/InvoiceHistory'
import AddCardForm from '@/components/billing/AddCardForm'
import CancelMembershipDialog from '@/components/billing/CancelMembershipDialog'

type IntensiveBillingData = {
  completionStatus: string
  installments: Array<{ status: 'paid' | 'upcoming' | 'scheduled' }>
}

function shouldShowIntensiveBilling(intensive: IntensiveBillingData | null): boolean {
  if (!intensive) return false
  if (intensive.completionStatus === 'pending' || intensive.completionStatus === 'in_progress') {
    return true
  }
  return intensive.installments.some(
    inst => inst.status === 'upcoming' || inst.status === 'scheduled',
  )
}

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [membership, setMembership] = useState<any>(null)
  const [intensive, setIntensive] = useState<any>(null)
  const [household, setHousehold] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isCanceling, setIsCanceling] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [membershipRes, intensiveRes, pmRes, invoicesRes, householdRes] = await Promise.all([
        fetch('/api/billing/membership'),
        fetch('/api/billing/intensive'),
        fetch('/api/billing/payment-methods'),
        fetch('/api/billing/invoices'),
        fetch('/api/household?includeMembers=true'),
      ])

      const [membershipData, intensiveData, pmData, invoicesData] = await Promise.all([
        membershipRes.json(),
        intensiveRes.json(),
        pmRes.json(),
        invoicesRes.json(),
      ])

      const householdData = householdRes.ok ? await householdRes.json() : null

      setMembership(membershipData)
      setIntensive(intensiveData.intensive || null)
      const isActiveHousehold = householdData?.household?.plan_type === 'household'
      setHousehold(isActiveHousehold ? householdData : null)
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

  const handleCancelClick = () => setShowCancelDialog(true)

  const handleConfirmCancel = async () => {
    setIsCanceling(true)
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to cancel')
      }
      toast.success('Membership set to cancel at end of billing period')
      setShowCancelDialog(false)
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
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl" className="pt-2 pb-12">
      <Stack gap="md">
        <h1 className="sr-only">Billing</h1>

        <PlanOverview
          subscription={membership?.subscription || null}
          upcomingInvoice={membership?.upcomingInvoice || null}
          paymentMethods={paymentMethods}
          onAddCard={() => setShowAddCard(true)}
          onCancel={handleCancelClick}
          onResume={handleResume}
          onRefresh={fetchAll}
          isCanceling={isCanceling}
          isResuming={isResuming}
        />

        {shouldShowIntensiveBilling(intensive) && (
          <IntensiveOverview intensive={intensive} />
        )}

        {household && (
          <HouseholdSection
            data={household}
            billingInterval={membership?.subscription?.tier?.billingInterval || '28day'}
            onRefresh={fetchAll}
          />
        )}

        <PaymentMethodsList
          paymentMethods={paymentMethods}
          onRefresh={fetchAll}
          onAddCard={() => setShowAddCard(true)}
        />

        <AddCardForm
          isOpen={showAddCard}
          onClose={() => setShowAddCard(false)}
          onSuccess={fetchAll}
        />

        <InvoiceHistory invoices={invoices} />
      </Stack>

      <CancelMembershipDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirmCancel={handleConfirmCancel}
        isCanceling={isCanceling}
      />
    </Container>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Container>
    }>
      <BillingContent />
    </Suspense>
  )
}
