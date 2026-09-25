'use client'

// PayPal card checkout form (JS SDK v6 card fields, cards only — no PayPal
// buttons). Mirrors the Stripe CheckoutForm UX: account fields, membership
// agreement, then on-site card entry. The Stripe form remains available
// behind the NEXT_PUBLIC_PAYMENT_GATEWAY flag.
//
// Flow: validate account → server creates the order → SDK submits the card
// against that order (handles 3-D Secure) → server captures and fulfils.

import { useEffect, useRef, useState } from 'react'
import { usePayPalCardFieldsOneTimePaymentSession } from '@paypal/react-paypal-js/sdk-v6'
import { Input, Button, Checkbox } from '@/lib/design-system/components'
import { Loader2, Home } from 'lucide-react'
import { PayPalCardFieldsFrame, CardFieldBox, useCardFieldsStatus } from '@/components/checkout/PayPalCardFields'
import { formatPhoneDisplay, parsePhoneInput, phoneToDigits, phoneToE164 } from '@/lib/phone-format'
import type { AccountDetails, AccountLock } from '@/components/checkout/CheckoutForm'

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
  offerType?: 'intensive' | 'membership'
  accountLock?: AccountLock | null
}

function getMembershipBillingPhrase(continuity: 'annual' | '28day', planType: 'solo' | 'household'): string {
  if (continuity === '28day') return planType === 'solo' ? '$99 every 28 days' : '$149 every 28 days'
  return planType === 'solo' ? '$999 per year' : '$1,490 per year'
}

/** Account details plus the cardholder name PayPal needs at submit time */
type CheckoutDetails = AccountDetails & { cardName: string }

// ---------------------------------------------------------------------------
// Card section: fields + pay button. Must live inside PayPalCardFieldsFrame
// because the session hook picks the one-time-payment session type.
// ---------------------------------------------------------------------------

function CardSection({
  cardName,
  setCardName,
  cardNameError,
  validateAccount,
  createOrder,
  onApproved,
  isProcessing,
  setIsProcessing,
  generalError,
  setGeneralError,
  submitLabel,
  submitLabelShort,
  agreedToTerms,
  children,
}: {
  cardName: string
  setCardName: (v: string) => void
  cardNameError?: string
  validateAccount: () => CheckoutDetails | null
  createOrder: (accountDetails: AccountDetails) => Promise<string>
  onApproved: (orderID: string) => Promise<string>
  isProcessing: boolean
  setIsProcessing: (v: boolean) => void
  generalError: string
  setGeneralError: (v: string) => void
  submitLabel?: string
  submitLabelShort?: string
  agreedToTerms: boolean
  children: React.ReactNode
}) {
  const { submit, submitResponse, error: submitError } = usePayPalCardFieldsOneTimePaymentSession()
  const fieldsStatus = useCardFieldsStatus()
  // Only react to submit results we asked for (the hook keeps the last one around)
  const awaitingRef = useRef(false)

  async function handlePay() {
    setGeneralError('')
    const details = validateAccount()
    if (!details) return
    if (!agreedToTerms) {
      setGeneralError('Please confirm you understand the membership billing and guarantee terms below.')
      return
    }
    if (fieldsStatus.kind !== 'ready') {
      setGeneralError(fieldsStatus.kind === 'error' ? fieldsStatus.message : 'Payment system is loading. Please wait.')
      return
    }

    setIsProcessing(true)
    const { cardName: cardholderName, ...accountDetails } = details
    let orderId: string
    try {
      orderId = await createOrder(accountDetails)
    } catch (err) {
      setGeneralError(err instanceof Error && err.message ? err.message : 'Failed to start checkout. Please try again.')
      setIsProcessing(false)
      return
    }

    awaitingRef.current = true
    // Validates the fields, runs 3DS if the issuer asks, then attaches the
    // card to the order. Result arrives via submitResponse / submitError.
    await submit(orderId, { name: cardholderName })
  }

  useEffect(() => {
    if (!awaitingRef.current) return
    if (!submitResponse && !submitError) return
    awaitingRef.current = false

    if (submitError) {
      setGeneralError(submitError.message || 'Payment failed. Please check your card details and try again.')
      setIsProcessing(false)
      return
    }
    if (!submitResponse) return

    if (submitResponse.state === 'succeeded') {
      onApproved(submitResponse.data.orderId)
        .then((redirectUrl) => {
          window.location.href = redirectUrl
        })
        .catch((err: unknown) => {
          setGeneralError(err instanceof Error && err.message ? err.message : 'Payment failed. Please try again.')
          setIsProcessing(false)
        })
      return
    }
    if (submitResponse.state === 'canceled') {
      setGeneralError('Card verification was cancelled. Please try again.')
    } else {
      setGeneralError(submitResponse.data.message || 'Please check your card details and try again.')
    }
    setIsProcessing(false)
  }, [submitResponse, submitError, onApproved, setGeneralError, setIsProcessing])

  return (
    <>
      <div className="space-y-4">
        <Input
          label="Name on card"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          error={cardNameError}
          placeholder="Name on card"
          autoComplete="cc-name"
        />
        <CardFieldBox type="number" label="Card number" placeholder="Card number" />
        <div className="grid grid-cols-2 gap-5">
          <CardFieldBox type="expiry" label="Expiration" placeholder="MM / YY" />
          <CardFieldBox type="cvv" label="CVV" placeholder="CVV" />
        </div>
        {fieldsStatus.kind === 'error' && (
          <p className="text-sm text-[#FF0040]">{fieldsStatus.message}</p>
        )}
      </div>

      {children}

      <div className="space-y-5 mt-5">
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
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

export default function PayPalCheckoutForm({
  createOrder,
  onApproved,
  submitLabel,
  submitLabelShort,
  continuity,
  planType,
  paymentPlan,
  renewalPhrase,
  offerType = 'intensive',
  accountLock = null,
}: PayPalCheckoutFormProps) {
  const isMembershipCheckout = offerType === 'membership'
  const membershipBillingPhrase =
    renewalPhrase || (continuity && planType ? getMembershipBillingPhrase(continuity, planType) : null)
  const agreementLabel = isMembershipCheckout
    ? 'I understand and agree that Vision Pro is $99 every 28 days starting today, that I can cancel anytime, and that I am covered by the 28-day membership guarantee.'
    : membershipBillingPhrase
    ? `I understand and agree to the charges shown, including that my Vision Pro membership will continue billing on Day 28 at ${membershipBillingPhrase} and that I'm covered by the 16‑week guarantee.`
    : "I agree to the charges shown, including Vision Pro billing starting on Day 28 at my selected plan, covered by the 16‑week guarantee."

  const isHousehold = !isMembershipCheckout && planType === 'household'
  const isTwoPay = paymentPlan === '2pay'
  const isIntensiveCheckout = !isMembershipCheckout && Boolean(continuity && planType)

  const [firstName, setFirstName] = useState(accountLock?.firstName || '')
  const [lastName, setLastName] = useState(accountLock?.lastName || '')
  const [email, setEmail] = useState(accountLock?.email || '')
  const [phone, setPhone] = useState(accountLock?.phone ? phoneToDigits(accountLock.phone) : '')
  const showLastName = !accountLock?.lastName.trim()
  const showPhone = !accountLock?.phone.trim()
  const [partnerFirstName, setPartnerFirstName] = useState('')
  const [partnerLastName, setPartnerLastName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [cardName, setCardName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  function buildAccountDetails(): CheckoutDetails {
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    return {
      name,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      phone: phoneToE164(phone),
      cardName: cardName.trim() || name,
      ...(isHousehold
        ? {
            partnerFirstName: partnerFirstName.trim(),
            partnerLastName: partnerLastName.trim(),
            partnerEmail: partnerEmail.trim().toLowerCase(),
          }
        : {}),
    }
  }

  /** Returns the account details when valid, otherwise sets field errors. */
  function validateAccount(): CheckoutDetails | null {
    const newErrors: Record<string, string> = {}

    if (!firstName.trim()) newErrors.firstName = 'First name is required'
    if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email address'
    if (!cardName.trim()) newErrors.cardName = 'Name on card is required'

    if (isHousehold) {
      if (!partnerFirstName.trim()) newErrors.partnerFirstName = 'Partner first name is required'
      if (!partnerLastName.trim()) newErrors.partnerLastName = 'Partner last name is required'
      if (!partnerEmail.trim()) newErrors.partnerEmail = 'Partner email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partnerEmail)) newErrors.partnerEmail = 'Invalid email address'
      else if (partnerEmail.trim().toLowerCase() === email.trim().toLowerCase()) newErrors.partnerEmail = 'Partner email must be different from yours'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0 ? buildAccountDetails() : null
  }

  return (
    <div className="space-y-5 -mx-2 sm:mx-0">
      <h2 className="text-xl font-bold text-white mb-1">{accountLock ? 'Add your card' : 'Create your account'}</h2>
      {!accountLock?.hasPassword && (
        <p className="text-sm text-neutral-400 mb-4">You&apos;ll set your password right after payment.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          error={errors.firstName}
          placeholder="First name"
          autoComplete="given-name"
        />
        {showLastName && (
        <Input
          label="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          error={errors.lastName}
          placeholder="Last name"
          autoComplete="family-name"
        />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => { if (!accountLock) setEmail(e.target.value) }}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
          readOnly={!!accountLock}
        />
        {showPhone && (
        <Input
          label="Phone (optional)"
          type="tel"
          value={formatPhoneDisplay(phone)}
          onChange={(e) => setPhone(parsePhoneInput(e.target.value))}
          placeholder="(555) 000-0000"
          autoComplete="tel"
        />
        )}
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

      <PayPalCardFieldsFrame>
        <CardSection
          cardName={cardName}
          setCardName={setCardName}
          cardNameError={errors.cardName}
          validateAccount={validateAccount}
          createOrder={createOrder}
          onApproved={onApproved}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          generalError={generalError}
          setGeneralError={setGeneralError}
          submitLabel={submitLabel}
          submitLabelShort={submitLabelShort}
          agreedToTerms={agreedToTerms}
        >
          {/* Membership agreement */}
          <div className="flex flex-col w-full lg:max-w-none mt-5">
            <Checkbox
              label={agreementLabel}
              labelClassName="flex-1 block py-3 px-4 border border-neutral-600 rounded-lg bg-neutral-800/50 text-neutral-200 cursor-pointer"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
          </div>

          {isMembershipCheckout && (
            <div className="text-xs text-neutral-400 border border-neutral-700 rounded-lg bg-neutral-900/50 p-4 space-y-2 leading-relaxed mt-5">
              <p>
                You are starting Vision Pro today for $99. It renews at $99 every 28 days on the same
                payment method until you cancel. Cancel any time with one click in your account before
                the next renewal.
              </p>
            </div>
          )}

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
        </CardSection>
      </PayPalCardFieldsFrame>

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
  )
}
