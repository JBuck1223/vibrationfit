// /src/app/account/settings/delete/page.tsx
// Account deletion page

'use client'

import { useState, useEffect } from 'react'
import { Container, Stack, Card, Button, Input, Spinner } from '@/lib/design-system/components'
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
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        <h1 className="sr-only">Delete account</h1>

        <p className="text-sm text-neutral-500">
          Permanently remove your account and associated data. This cannot be undone.
        </p>

        {step === 'info' ? (
          /* Information Step */
          <Card
            variant="glass"
            className="border border-red-500/20 p-4 shadow-none sm:p-5"
          >
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                <Trash2 className="h-5 w-5 text-red-400" aria-hidden />
              </div>
              <h2 className="text-base font-semibold text-white">What happens when you delete</h2>
            </div>

            <div className="mb-6 space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" aria-hidden />
                <div>
                  <div className="text-sm font-medium text-white">Permanent deletion</div>
                  <div className="mt-0.5 text-xs text-neutral-400">Your account cannot be recovered once deleted.</div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="mb-2 text-sm font-medium text-white">The following will be permanently deleted</div>
                <ul className="space-y-2 text-xs text-neutral-400">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    Your profile and personal information
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    Life visions and vision boards
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    Journal entries and affirmations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    Uploaded media and recordings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    Progress and activity history
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="text-xs font-medium text-neutral-500">Account email</div>
                <div className="mt-1 text-sm text-neutral-300">{email}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" className="flex-1" onClick={() => router.push('/account')}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => setStep('confirm')}>
                Continue to delete
              </Button>
            </div>
          </Card>
        ) : (
          /* Confirmation Step */
          <Card
            variant="glass"
            className="border border-red-500/20 p-4 shadow-none sm:p-5"
          >
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden />
              </div>
              <h2 className="text-base font-semibold text-white">Confirm account deletion</h2>
            </div>

            <div className="max-w-md">
              <p className="mb-6 text-sm leading-relaxed text-neutral-400">
                This action is{' '}
                <span className="font-semibold text-red-500">permanent and cannot be undone</span>. To confirm, type{' '}
                <span className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-sm text-white">DELETE</span> below.
              </p>

              <div className="mb-6">
                <label className="mb-1.5 block text-xs font-medium text-neutral-400">Type DELETE to confirm</label>
                <Input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="w-full font-mono"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setStep('info')
                    setConfirmText('')
                  }}
                >
                  Go back
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleDeleteAccount}
                  disabled={deleting || confirmText !== 'DELETE'}
                >
                  {deleting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Deleting...
                    </>
                  ) : (
                    'Delete my account'
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
