// /src/app/account/settings/delete/page.tsx
// Account deletion page

'use client'

import { useState, useEffect } from 'react'
import { Container, Stack, PageHero, Card, Button, Input, Spinner } from '@/lib/design-system/components'
import { Trash2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function DeleteAccountPage() {
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [email, setEmail] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [step, setStep] = useState<'info' | 'confirm'>('info')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchUserEmail()
  }, [])

  const fetchUserEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setEmail(user.email)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setDeleting(true)
    try {
      // Call account deletion API
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      toast.success('Account deleted successfully')
      
      // Sign out and redirect
      await supabase.auth.signOut()
      router.push('/')
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Page Hero */}
        <PageHero
          title="Delete Account"
          subtitle="Permanently remove your account and all associated data"
        >
          <div className="flex justify-center w-full">
            <Button variant="outline" onClick={() => router.push('/account')}>
              Account Dashboard
            </Button>
          </div>
        </PageHero>

        {step === 'info' ? (
          /* Information Step */
          <Card className="p-6 border-2 border-red-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-red-500/20">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white">What happens when you delete your account</h3>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 p-4 bg-neutral-900 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-white">Permanent deletion</div>
                  <div className="text-sm text-neutral-400">Your account cannot be recovered once deleted</div>
                </div>
              </div>

              <div className="p-4 bg-neutral-900 rounded-xl">
                <div className="font-medium text-white mb-2">The following will be permanently deleted:</div>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    Your profile and all personal information
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    Your life visions and vision boards
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    Your journal entries and affirmations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    All uploaded media and audio recordings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    Your progress and activity history
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-neutral-900 rounded-xl">
                <div className="font-medium text-white mb-1">Account email</div>
                <div className="text-neutral-400">{email}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => router.push('/account')}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                className="flex-1"
                onClick={() => setStep('confirm')}
              >
                Continue to Delete
              </Button>
            </div>
          </Card>
        ) : (
          /* Confirmation Step */
          <Card className="p-6 border-2 border-red-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Confirm Account Deletion</h3>
            </div>

            <div className="max-w-md">
              <p className="text-neutral-400 mb-6">
                This action is <span className="text-red-500 font-semibold">permanent and cannot be undone</span>. 
                To confirm, type <span className="font-mono bg-neutral-800 px-2 py-1 rounded text-white">DELETE</span> below.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-200 mb-2">
                  Type DELETE to confirm
                </label>
                <Input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="w-full font-mono"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => {
                    setStep('info')
                    setConfirmText('')
                  }}
                >
                  Go Back
                </Button>
                <Button 
                  variant="danger" 
                  className="flex-1"
                  onClick={handleDeleteAccount}
                  disabled={deleting || confirmText !== 'DELETE'}
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete My Account'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

      </Stack>
    </Container>
  )
}
