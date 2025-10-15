'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Container, PageLayout } from '@/lib/design-system/components'

export default function SetupPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isIntensive = searchParams.get('intensive') === 'true'
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const supabase = createClient()
      
      // Wait a moment for session to fully establish
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('Password setup page - Session check:', !!session)
      console.log('Password setup page - User:', session?.user?.email)
      
      if (!session) {
        console.error('No session found on password setup page')
        // Don't show error immediately - session might still be loading
      }
    }
    
    checkUser()
  }, [])

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
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
      
      // Update user password
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        throw updateError
      }

      console.log('Password updated successfully for:', data.user?.email)
      console.log('User session:', data.user?.id)
      
      setSuccess(true)

      // Wait a moment for the session to fully persist, then redirect
      setTimeout(() => {
        if (isIntensive) {
          console.log('Redirecting to intensive dashboard...')
          window.location.href = '/intensive/dashboard' // Force full page reload to ensure session is picked up
        } else {
          console.log('Redirecting to dashboard...')
          window.location.href = '/dashboard'
        }
      }, 1000) // 1 second delay to let session persist

    } catch (err: any) {
      console.error('Password setup error:', err)
      setError(err.message || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <Container size="sm" className="py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {isIntensive ? '🎉 Welcome to Your Intensive!' : '🎉 Welcome to VibrationFit!'}
          </h1>
          <p className="text-xl text-neutral-300">
            {isIntensive 
              ? 'Set your password to access your 72-hour Vision Activation Intensive'
              : 'Set your password to secure your account'
            }
          </p>
        </div>

        <Card variant="elevated" className="max-w-md mx-auto">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Password Set!</h2>
              <p className="text-neutral-300">
                Redirecting to your {isIntensive ? 'intensive dashboard' : 'dashboard'}...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSetupPassword} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Create Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors"
                  required
                  minLength={8}
                  disabled={loading}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 bg-[#1F1F1F] border-2 border-[#333] rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors"
                  required
                  minLength={8}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Setting Password...' : 'Set Password & Continue'}
              </Button>

              {isIntensive && (
                <div className="bg-primary-500/10 border-l-4 border-primary-500 p-4 rounded">
                  <p className="text-primary-500 text-sm">
                    ⏰ Your 72-hour activation window starts now!
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
    </PageLayout>
  )
}

