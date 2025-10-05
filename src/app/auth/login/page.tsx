'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageLayout, Container, Card, Input, Button } from '@/lib/design-system'
import Image from 'next/image'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <PageLayout>
      <Container size="sm" className="py-12">
        <Card className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Image
              src={ASSETS.brand.logoWhite}
              alt="VibrationFit"
              width={200}
              height={40}
              className="h-10 w-auto mx-auto mb-4"
              priority
            />
            <p className="text-secondary-500">Welcome back</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            {error && (
              <div className="bg-error-600/10 border border-error-600 text-error-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-neutral-400 text-center mt-6">
            Don&apos;t have an account? <a href="/auth/signup" className="text-primary-500 hover:text-primary-400 transition-colors">Sign up</a>
          </p>
        </Card>
      </Container>
    </PageLayout>
  )
}