'use client'

// PayPal card-fields checkout form (no PayPal buttons — cards only).
// Mirrors the Stripe CheckoutForm UX: account fields, membership agreement,
// then on-site card entry. The Stripe form remains available behind the
// NEXT_PUBLIC_PAYMENT_GATEWAY flag.

import { useRef, useState } from 'react'
import {
  PayPalScriptProvider,
  PayPalCardFieldsProvider,
  PayPalNameField,
  PayPalNumberField,
  PayPalExpiryField,
  PayPalCVVField,
  usePayPalCardFields,
} from '@paypal/react-paypal-js'
import { Input, Button, Checkbox } from '@/lib/design-system/components'
import { Loader2, Home } from 'lucide-react'
import { formatPhoneDisplay, parsePhoneInput, phoneToE164 } from '@/lib/phone-format'
import type { AccountDetails } from '@/components/checkout/CheckoutForm'

interface PayPalCheckoutFormProps {
  /** Create the PayPal order server-side; returns the PayPal order id */
  createOrder: (accountDetails: AccountDetails) => Promise<string>
  /** Capture + fulfill server-side; returns the success redirect URL */
  onApproved: (orderID: string) => Promise<string>
  submitLabel?: string
  submitLabelShort?: string
  continuity?: 'annual' | '28day' | null
  planType?: 'solo' | 'household' | null
  paymentPlan?: 'full' | '2pay' | null
  /** Overrides the renewal billing phrase when a promo discounts renewals */
  renewalPhrase?: string | null
}

function getMembershipBillingPhrase(continuity: 'annual' | '28day', planType: 'solo' | 'household'): string {
  if (continuity === '28day') return planType === 'solo' ? '$99 every 28 days' : '$149 every 28 days'
  return planType === 'solo' ? '$999 per year' : '$1,490 per year'
}

// The card inputs live inside PayPal-hosted iframes, so they're styled via
// PayPal's style API to match the design-system Input: dark bg, 2px border,
// rounded-xl. Only documented selectors/properties — exotic ones can make
// the SDK abort rendering (fields flash then disappear).
const cardFieldStyle = {
  input: {
    'font-size': '16px',
    'font-family': 'system-ui, sans-serif',
    color: '#FFFFFF',
    padding: '12px 16px',
    background: '#404040',
    border: '2px solid #666666',
    'border-radius': '12px',
  },
  '.invalid': { color: '#FF0040' },
  ':focus': { color: '#FFFFFF' },
}


function SubmitSection({
  validateAccount,
  isProcessing,
  setIsProcessing,
  generalError,
  setGeneralError,
  submitLabel,
  submitLabelShort,
  agreedToTerms,
}: {
  validateAccount: () => boolean
  isProcessing: boolean
  setIsProcessing: (v: boolean) => void
  generalError: string
  setGeneralError: (v: string) => void
  submitLabel?: string
  submitLabelShort?: string
  agreedToTerms: boolean
}) {
  const { cardFieldsForm } = usePayPalCardFields()

  async function handlePay() {
    setGeneralError('')
    if (!cardFieldsForm) {
      setGeneralError('Payment system is loading. Please wait.')
      return
    }
    if (!validateAccount()) return
    if (!agreedToTerms) {
      setGeneralError('Please confirm you understand the membership billing and guarantee terms below.')
      return
    }

    const formState = await cardFieldsForm.getState()
    if (!formState.isFormValid) {
      setGeneralError('Please check your card details.')
      return
    }

    setIsProcessing(true)
    try {
      // Triggers createOrder → card processing → onApprove
      await cardFieldsForm.submit()
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setGeneralError(message || 'Payment failed. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <>
      {generalError && (
        <div className="bg-[#FF0040]/10 border border-[#FF0040]/30 rounded-xl p-3 text-sm text-[#FF0040]">
          {generalError}
        </div>
      )}
      <Button
        type="button"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isProcessing || !agreedToTerms}
        onClick={handlePay}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </span>
        ) : submitLabelShort ? (
          <>
            <span className="md:hidden">{submitLabelShort}</span>
            <span className="hidden md:inline">{submitLabel || 'Complete Purchase'}</span>
          </>
        ) : (
          submitLabel || 'Complete Purchase'
        )}
      </Button>
    </>
  )
}

export default function PayPalCheckoutForm({
  createOrder,
  onApproved,
  submitLabel,
  submitLabelShort,
  continuity,
  planType,
  paymentPlan,
  renewalPhrase,
}: PayPalCheckoutFormProps) {
  const membershipBillingPhrase =
    renewalPhrase || (continuity && planType ? getMembershipBillingPhrase(continuity, planType) : null)
  const agreementLabel = membershipBillingPhrase
    ? `I understand and agree to the charges shown, including that my Vision Pro membership will continue billing on Day 28 at ${membershipBillingPhrase} and that I'm covered by the 16‑week guarantee.`
    : "I agree to the charges shown, including Vision Pro billing starting on Day 28 at my selected plan, covered by the 16‑week guarantee."

  const isHousehold = planType === 'household'
  const isTwoPay = paymentPlan === '2pay'
  const isIntensiveCheckout = Boolean(continuity && planType)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [partnerFirstName, setPartnerFirstName] = useState('')
  const [partnerLastName, setPartnerLastName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // createOrder/onApprove fire from inside the PayPal SDK — read latest values via ref
  const accountRef = useRef<AccountDetails | null>(null)

  function buildAccountDetails(): AccountDetails {
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    return {
      name,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      phone: phoneToE164(phone),
      ...(isHousehold
        ? {
            partnerFirstName: partnerFirstName.trim(),
            partnerLastName: partnerLastName.trim(),
            partnerEmail: partnerEmail.trim().toLowerCase(),
          }
        : {}),
    }
  }

  function validateAccount(): boolean {
    const newErrors: Record<string, string> = {}

    if (!firstName.trim()) newErrors.firstName = 'First name is required'
    if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email address'

    if (isHousehold) {
      if (!partnerFirstName.trim()) newErrors.partnerFirstName = 'Partner first name is required'
      if (!partnerLastName.trim()) newErrors.partnerLastName = 'Partner last name is required'
      if (!partnerEmail.trim()) newErrors.partnerEmail = 'Partner email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partnerEmail)) newErrors.partnerEmail = 'Invalid email address'
      else if (partnerEmail.trim().toLowerCase() === email.trim().toLowerCase()) newErrors.partnerEmail = 'Partner email must be different from yours'
    }

    setErrors(newErrors)
    const ok = Object.keys(newErrors).length === 0
    if (ok) accountRef.current = buildAccountDetails()
    return ok
  }

  async function handleCreateOrder(): Promise<string> {
    const details = accountRef.current || buildAccountDetails()
    return createOrder(details)
  }

  async function handleApprove(data: { orderID: string }): Promise<void> {
    try {
      const redirectUrl = await onApproved(data.orderID)
      window.location.href = redirectUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setGeneralError(message || 'Payment failed. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        components: 'card-fields',
        currency: 'USD',
      }}
    >
      <div className="space-y-5 -mx-2 sm:mx-0">
        <h2 className="text-xl font-bold text-white mb-1">Create your account</h2>
        <p className="text-sm text-neutral-400 mb-4">You&apos;ll set your password right after payment.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
            placeholder="First name"
            autoComplete="given-name"
          />
          <Input
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
            placeholder="Last name"
            autoComplete="family-name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Input
            label="Phone (optional)"
            type="tel"
            value={formatPhoneDisplay(phone)}
            onChange={(e) => setPhone(parsePhoneInput(e.target.value))}
            placeholder="(555) 000-0000"
            autoComplete="tel"
          />
        </div>

        {isHousehold && (
          <div className="border-2 border-[#39FF14]/20 rounded-2xl p-5 space-y-4 bg-[#39FF14]/5">
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-5 h-5 text-[#39FF14]" />
              <h3 className="text-lg font-bold text-white">Second Household Member</h3>
            </div>
            <p className="text-sm text-neutral-400">
              Your household plan includes 2 logins. We&apos;ll send your partner an invitation to create their account.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Partner first name"
                value={partnerFirstName}
                onChange={(e) => setPartnerFirstName(e.target.value)}
                error={errors.partnerFirstName}
                placeholder="First name"
              />
              <Input
                label="Partner last name"
                value={partnerLastName}
                onChange={(e) => setPartnerLastName(e.target.value)}
                error={errors.partnerLastName}
                placeholder="Last name"
              />
            </div>
            <Input
              label="Partner email"
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              error={errors.partnerEmail}
              placeholder="partner@example.com"
            />
          </div>
        )}

        <PayPalCardFieldsProvider
          createOrder={handleCreateOrder}
          onApprove={handleApprove}
          onError={(err) => {
            console.error('[paypal card fields] error:', err)
            setGeneralError('Payment failed. Please check your card details and try again.')
            setIsProcessing(false)
          }}
          style={cardFieldStyle}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-1">Name on card</label>
              <PayPalNameField placeholder="Name on card" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-1">Card number</label>
              <PayPalNumberField placeholder="Card number" />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#E5E7EB] mb-1">Expiration</label>
                <PayPalExpiryField placeholder="MM / YY" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#E5E7EB] mb-1">CVV</label>
                <PayPalCVVField placeholder="CVV" />
              </div>
            </div>
          </div>

          {/* Membership agreement */}
          <div className="flex flex-col w-full lg:max-w-none mt-5">
            <Checkbox
              label={agreementLabel}
              labelClassName="flex-1 block py-3 px-4 border border-neutral-600 rounded-lg bg-neutral-800/50 text-neutral-200 cursor-pointer"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
          </div>

          {/* Enrollment & renewal disclosure */}
          {isIntensiveCheckout && (
            <div className="text-xs text-neutral-400 border border-neutral-700 rounded-lg bg-neutral-900/50 p-4 space-y-2 leading-relaxed mt-5">
              <p>
                By completing this purchase, you are enrolling in the 28‑day Vision Activation Intensive and your
                included 28 days of Vision Pro Vibration Fit Membership.
              </p>
              <p>
                After your first 28 days, your membership will automatically continue at{' '}
                <strong className="text-neutral-200">{membershipBillingPhrase}</strong>
                , billed to the same payment method, until you choose to cancel. You can cancel any time with
                one click in your account before your next renewal.
              </p>
              {isTwoPay && (
                <p>
                  2‑pay option: You will be charged {isHousehold ? '$399' : '$275'} today and{' '}
                  {isHousehold ? '$399' : '$275'} in 14 days. Your membership renewals at{' '}
                  {isHousehold ? '$149' : '$99'} every 28 days begin after your included 28 days and are separate
                  from these two activation payments.
                </p>
              )}
            </div>
          )}

          <div className="space-y-5 mt-5">
            <SubmitSection
              validateAccount={validateAccount}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              generalError={generalError}
              setGeneralError={setGeneralError}
              submitLabel={submitLabel}
              submitLabelShort={submitLabelShort}
              agreedToTerms={agreedToTerms}
            />
          </div>
        </PayPalCardFieldsProvider>

        <p className="text-xs text-neutral-500 text-center">
          By completing this purchase you agree to the{' '}
          <a href="/terms-of-service" className="text-[#39FF14] hover:underline" target="_blank">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy-policy" className="text-[#39FF14] hover:underline" target="_blank">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </PayPalScriptProvider>
  )
}
