'use client'

import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Input, Button } from '@/lib/design-system/components'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

interface CheckoutFormProps {
  onSubmit: (accountDetails: AccountDetails) => Promise<{ clientSecret: string; redirectUrl: string } | null>
  isProcessing: boolean
  submitLabel?: string
}

export interface AccountDetails {
  name: string
  email: string
  phone: string
  password: string
}

export default function CheckoutForm({ onSubmit, isProcessing, submitLabel }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')

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
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="8+ characters"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-neutral-400 hover:text-white transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <Input
        label="Confirm password"
        type={showPassword ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        placeholder="Re-enter password"
        autoComplete="new-password"
      />

      {/* Stripe Payment Element */}
      <div className="pt-2">
        <label className="block text-sm font-medium text-[#E5E7EB] mb-2">Payment</label>
        <div className="bg-[#2A2A2A] rounded-xl p-4 border-2 border-[#666666]">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </div>
      </div>

      {generalError && (
        <div className="bg-[#FF0040]/10 border border-[#FF0040]/30 rounded-xl p-3 text-sm text-[#FF0040]">
          {generalError}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isProcessing || !stripe || !elements}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </span>
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
