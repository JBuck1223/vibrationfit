'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageLayout, Container, Card, Button, Input } from '@/lib/design-system/components'

export default function EmailDebugPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const supabase = createClient()

  const testMagicLink = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('🧪 Testing magic link with email:', email)
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      const response = {
        success: !error,
        data,
        error: error ? {
          message: error.message,
          status: error.status,
          name: error.name
        } : null,
        timestamp: new Date().toISOString()
      }

      console.log('🧪 Full response:', response)
      setResult(response)
    } catch (err) {
      const response = {
        success: false,
        error: {
          message: err instanceof Error ? err.message : 'Unknown error',
          type: 'Exception'
        },
        timestamp: new Date().toISOString()
      }
      console.error('🧪 Exception:', err)
      setResult(response)
    } finally {
      setLoading(false)
    }
  }

  const testSupabaseConnection = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.getUser()
      setResult({
        connection: !error,
        user: data.user,
        error: error?.message,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      setResult({
        connection: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <Container className="py-8">
        <Card>
          <h1 className="text-2xl font-bold mb-6">Email Debug Tool</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={testSupabaseConnection}
                loading={loading}
                variant="secondary"
              >
                Test Supabase Connection
              </Button>
              
              <Button 
                onClick={testMagicLink}
                loading={loading}
                disabled={!email}
              >
                Test Magic Link
              </Button>
            </div>

            {result && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Result:</h3>
                <pre className="bg-neutral-800 p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>
      </Container>
    </PageLayout>
  )
}
