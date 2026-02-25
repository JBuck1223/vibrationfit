'use client'

import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Input, Button, Checkbox } from '@/lib/design-system/components'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

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
  email: string
  phone: string
  password: string
}

function getMembershipBillingPhrase(continuity: 'annual' | '28day', planType: 'solo' | 'household'): string {
  if (continuity === '28day') return planType === 'solo' ? '$99 every 28 days' : '$149 every 28 days'
  return planType === 'solo' ? '$999 per year' : '$1,499 per year'
}

export default function CheckoutForm({ onSubmit, isProcessing, submitLabel, submitLabelShort, continuity, planType }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()

  const membershipBillingPhrase =
    continuity && planType ? getMembershipBillingPhrase(continuity, planType) : null
  const agreementLabel = membershipBillingPhrase
    ? `I understand and agree to the charges shown, including that my Vision Pro membership will begin billing on Day 56 at ${membershipBillingPhrase} and that I'm covered by the 16‑week guarantee.`
    : "I understand and agree to the charges shown, including that my Vision Pro membership will begin billing on Day 56 at the plan I selected and that I'm covered by the 16‑week guarantee."

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = 'Full name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email address'
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

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
    const result = await onSubmit({ name, email, phone, password })
    if (!result) return // Parent handles error display

    // Confirm payment with the returned clientSecret
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret: result.clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}${result.redirectUrl}`,
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      setGeneralError(confirmError.message || 'Payment failed. Please try again.')
      return
    }

    // If no redirect was needed (3D Secure not required), navigate manually
    window.location.href = result.redirectUrl
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 -mx-2 sm:mx-0">
      <h2 className="text-xl font-bold text-white mb-1">Create your account</h2>
      <p className="text-sm text-neutral-400 mb-4">You'll use these credentials to log in.</p>

      <Input
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="Jordan Buckingham"
        autoComplete="name"
      />

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
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
          autoComplete="tel"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="8+ characters"
            autoComplete="new-password"
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 translate-y-1 text-neutral-400 hover:text-white transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <div className="relative">
          <Input
            label="Confirm password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            placeholder="Re-enter password"
            autoComplete="new-password"
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 translate-y-1 text-neutral-400 hover:text-white transition-colors"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
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
