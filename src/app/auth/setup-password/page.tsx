'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Container, Input } from '@/lib/design-system/components'
import { Lock, CheckCircle, Eye, EyeOff, Clock } from 'lucide-react'

export default function SetupPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isIntensive = searchParams.get('intensive') === 'true'
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      
      // Wait a moment for auth to fully establish
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserEmail(user.email || null)

        // If user already has a password, skip this page
        if (user.user_metadata?.has_password === true) {
          if (isIntensive) {
            window.location.href = '/intensive/start'
          } else {
            window.location.href = '/dashboard'
          }
        }
      } else {
        // No session - redirect to login
        router.push('/auth/login')
      }
    }
    
    checkUser()
  }, [isIntensive, router])

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // Update user password and mark as having a password
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: {
          has_password: true,
        },
      })

      if (updateError) {
        throw updateError
      }

      console.log('Password set for:', data.user?.email)
      setSuccess(true)

      // Redirect after brief success state
      setTimeout(() => {
        if (isIntensive) {
          window.location.href = '/intensive/start'
        } else {
          window.location.href = '/dashboard'
        }
      }, 1500)

    } catch (err: any) {
      console.error('Password setup error:', err)
      setError(err.message || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="sm" className="py-16">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-primary-500" />
        </div>
        <h1 className="text-4xl font-bold mb-3">
          {isIntensive ? 'Welcome to Your Intensive' : 'Welcome to VibrationFit'}
        </h1>
        <p className="text-lg text-neutral-300">
          {isIntensive 
            ? 'Secure your account to access your Vision Activation Intensive'
            : 'Set your password to secure your account'
          }
        </p>
        {userEmail && (
          <p className="text-sm text-neutral-500 mt-2">
            Setting password for {userEmail}
          </p>
        )}
      </div>

      <Card variant="elevated" className="max-w-md mx-auto">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Password Set</h2>
            <p className="text-neutral-300">
              Redirecting to your {isIntensive ? 'intensive' : 'dashboard'}...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSetupPassword} className="space-y-6">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                helperText="Must be at least 8 characters"
                required
                disabled={loading}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-10 text-neutral-400 hover:text-neutral-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={loading}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-10 text-neutral-400 hover:text-neutral-300 transition-colors"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border-2 border-red-500 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
            >
              {loading ? 'Setting Password...' : 'Set Password & Continue'}
            </Button>

            {isIntensive && (
              <div className="bg-primary-500/10 border-2 border-primary-500/30 px-4 py-3 rounded-xl flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                <p className="text-primary-500 text-sm">
                  Your 72-hour activation window begins when you start your intensive on the next page.
                </p>
              </div>
            )}
          </form>
        )}
      </Card>

      <div className="text-center mt-6">
        <p className="text-sm text-neutral-400">
          Need help? Contact{' '}
          <a href="mailto:support@vibrationfit.com" className="text-primary-500 hover:underline">
            support@vibrationfit.com
          </a>
        </p>
      </div>
    </Container>
  )
}
