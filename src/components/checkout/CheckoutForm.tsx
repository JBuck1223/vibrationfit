'use client'

import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Input, Button, Checkbox } from '@/lib/design-system/components'
import { Loader2 } from 'lucide-react'

interface CheckoutFormProps {
  onSubmit: (accountDetails: AccountDetails) => Promise<{ clientSecret: string; redirectUrl: string } | null>
  isProcessing: boolean
  submitLabel?: string
  /** Short label for mobile (e.g. "Pay $499"); if set, shown on small screens instead of submitLabel */
  submitLabelShort?: string
  /** For intensive checkout: 'annual' | '28day' - used to show membership billing in agreement text */
  continuity?: 'annual' | '28day' | null
  /** For intensive checkout: 'solo' | 'household' - used to show membership billing in agreement text */
  planType?: 'solo' | 'household' | null
}

export interface AccountDetails {
  name: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

function getMembershipBillingPhrase(continuity: 'annual' | '28day', planType: 'solo' | 'household'): string {
  if (continuity === '28day') return planType === 'solo' ? '$99 every 28 days' : '$149 every 28 days'
  return planType === 'solo' ? '$999 per year' : '$1,499 per year'
}

// Country codes: prefix (digits), E.164 code, national length. Try longer prefixes first.
const PHONE_COUNTRIES: { prefix: string; code: string; nationalLength: number; format: (n: string) => string }[] = [
  { prefix: '44', code: '+44', nationalLength: 10, format: n => n.length <= 4 ? n : n.length <= 7 ? `${n.slice(0, 4)} ${n.slice(4)}` : `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}` },
  { prefix: '33', code: '+33', nationalLength: 9, format: n => n.length <= 1 ? n : [n.slice(0, 1), ...(n.slice(1).match(/.{1,2}/g) || [])].join(' ') },
  { prefix: '49', code: '+49', nationalLength: 11, format: n => n.length <= 5 ? n : n.length <= 9 ? `${n.slice(0, 5)} ${n.slice(5)}` : `${n.slice(0, 5)} ${n.slice(5, 9)} ${n.slice(9)}` },
  { prefix: '61', code: '+61', nationalLength: 9, format: n => n.length <= 4 ? n : `${n.slice(0, 4)} ${n.slice(4)}` },
  { prefix: '1', code: '+1', nationalLength: 10, format: n => n.length <= 3 ? (n.length ? `(${n}` : '') : n.length <= 6 ? `(${n.slice(0, 3)}) ${n.slice(3)}` : `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}` },
]

function getPhoneCountryAndNational(digits: string): { code: string; national: string } | null {
  const d = digits.replace(/\D/g, '')
  if (!d.length) return null
  // Try matching country by prefix (longest first)
  for (const { prefix, code, nationalLength, format } of PHONE_COUNTRIES) {
    if (d === prefix || d.startsWith(prefix)) {
      const national = d.length > prefix.length ? d.slice(prefix.length, prefix.length + nationalLength) : d.slice(prefix.length)
      return { code, national }
    }
  }
  // No match: treat as US (10 digits)
  const us = PHONE_COUNTRIES.find(c => c.prefix === '1')!
  const national = d.slice(0, us.nationalLength)
  return { code: us.code, national }
}

function formatPhoneDisplay(digits: string): string {
  const parsed = getPhoneCountryAndNational(digits)
  if (!parsed || !parsed.national) return ''
  const country = PHONE_COUNTRIES.find(c => c.code === parsed!.code)
  const formatted = country ? country.format(parsed.national) : parsed.national
  return `${parsed.code} ${formatted}`.trim()
}

/** Normalize to digits only; cap at 13 (country + national). */
function parsePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 13)
}

/** E.164 value for submit: +country + national (e.g. +15551234567). */
function phoneToE164(digits: string): string {
  const parsed = getPhoneCountryAndNational(digits)
  if (!parsed || !parsed.national) return ''
  const countryDigits = parsed.code.replace('+', '')
  return `+${countryDigits}${parsed.national}`
}

export default function CheckoutForm({ onSubmit, isProcessing, submitLabel, submitLabelShort, continuity, planType }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()

  const membershipBillingPhrase =
    continuity && planType ? getMembershipBillingPhrase(continuity, planType) : null
  const agreementLabel = membershipBillingPhrase
    ? `I understand and agree to the charges shown, including that my Vision Pro membership will begin billing on Day 56 at ${membershipBillingPhrase} and that I'm covered by the 16‑week guarantee.`
    : "I agree to the charges shown, including Vision Pro billing starting on Day 56 at my selected plan, covered by the 16‑week guarantee."

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!firstName.trim()) newErrors.firstName = 'First name is required'
    if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email address'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGeneralError('')

    if (!stripe || !elements) {
      setGeneralError('Payment system is loading. Please wait.')
      return
    }

    if (!validate()) return

    if (!agreedToTerms) {
      setGeneralError('Please confirm you understand the membership billing and guarantee terms below.')
      return
    }

    // Trigger form validation on the Payment Element
    const { error: elementsError } = await elements.submit()
    if (elementsError) {
      setGeneralError(elementsError.message || 'Please check your payment details.')
      return
    }

    // Call parent to create the intent (user account + PaymentIntent/Subscription)
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    const phoneE164 = phoneToE164(phone)
    const result = await onSubmit({ name, firstName: firstName.trim(), lastName: lastName.trim(), email, phone: phoneE164 })
    if (!result) return // Parent handles error display

    const returnUrl = result.redirectUrl.startsWith('http')
      ? result.redirectUrl
      : `${window.location.origin}${result.redirectUrl}`

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret: result.clientSecret,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    })

    if (confirmError) {
      setGeneralError(confirmError.message || 'Payment failed. Please try again.')
      return
    }

    window.location.href = returnUrl
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 -mx-2 sm:mx-0">
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

      {/* Stripe Payment Element - min-height so Link row has room on mobile */}
      <div>
        <label className="block text-sm font-medium text-[#E5E7EB] mb-1">Payment</label>
        <div className="bg-[#2A2A2A] rounded-xl border-2 border-[#666666] px-3 pt-1 pb-4 sm:px-4 sm:pt-2 sm:pb-4 min-h-[220px] w-full overflow-visible">
          <div className="min-w-0 w-full">
            <PaymentElement
              options={{
                layout: 'tabs',
              }}
            />
          </div>
        </div>
      </div>

      {generalError && (
        <div className="bg-[#FF0040]/10 border border-[#FF0040]/30 rounded-xl p-3 text-sm text-[#FF0040]">
          {generalError}
        </div>
      )}

      {/* Membership agreement */}
      <div className="flex flex-col w-full lg:max-w-none">
        <Checkbox
          label={agreementLabel}
          labelClassName="flex-1 block py-3 px-4 border border-neutral-600 rounded-lg bg-neutral-800/50 text-neutral-200 cursor-pointer"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isProcessing || !stripe || !elements || !agreedToTerms}
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
    </form>
  )
}
