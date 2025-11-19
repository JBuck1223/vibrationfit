// /src/app/account/settings/page.tsx
// Account settings and preferences

'use client'

import { useState, useEffect } from 'react'
import {  Card, Button, Input, Checkbox } from '@/lib/design-system/components'
import { User, Mail, Bell, Shield, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [notifications, setNotifications] = useState({
    email_marketing: true,
    email_product: true,
    email_weekly: false,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)
      setEmail(user.email || '')
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEmail = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ email })
      
      if (error) throw error
      
      toast.success('Email updated! Check your inbox to confirm.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update email')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = () => {
    // Trigger password reset email
    toast.info('Password reset link sent to your email')
  }

  return (
    <>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-neutral-400">
            Manage your account preferences and security
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Email Settings */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-5 h-5 text-primary-500" />
                <h2 className="text-2xl font-bold text-white">Email Address</h2>
              </div>

              <div className="max-w-md">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mb-4"
                />
                <Button
                  onClick={handleUpdateEmail}
                  disabled={saving || email === user?.email}
                  variant="primary"
                >
                  {saving ? 'Updating...' : 'Update Email'}
                </Button>
                <p className="text-xs text-neutral-500 mt-2">
                  You'll receive a confirmation email to verify the change
                </p>
              </div>
            </Card>

            {/* Password */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-primary-500" />
                <h2 className="text-2xl font-bold text-white">Password</h2>
              </div>

              <div className="max-w-md">
                <p className="text-neutral-400 mb-4">
                  Reset your password via email
                </p>
                <Button onClick={handleUpdatePassword} variant="secondary">
                  Send Reset Link
                </Button>
              </div>
            </Card>

            {/* Notification Preferences */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-primary-500" />
                <h2 className="text-2xl font-bold text-white">Notifications</h2>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors">
                  <div>
                    <div className="font-semibold text-white">Product Updates</div>
                    <div className="text-sm text-neutral-400">New features and improvements</div>
                  </div>
                  <Checkbox
                    checked={notifications.email_product}
                    onChange={(e) => setNotifications({ ...notifications, email_product: e.target.checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors">
                  <div>
                    <div className="font-semibold text-white">Marketing Emails</div>
                    <div className="text-sm text-neutral-400">Tips, guides, and offers</div>
                  </div>
                  <Checkbox
                    checked={notifications.email_marketing}
                    onChange={(e) => setNotifications({ ...notifications, email_marketing: e.target.checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors">
                  <div>
                    <div className="font-semibold text-white">Weekly Summary</div>
                    <div className="text-sm text-neutral-400">Your progress and insights</div>
                  </div>
                  <Checkbox
                    checked={notifications.email_weekly}
                    onChange={(e) => setNotifications({ ...notifications, email_weekly: e.target.checked })}
                  />
                </div>

                <Button variant="primary" className="w-full">
                  Save Preferences
                </Button>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-2 border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-3 mb-6">
                <Trash2 className="w-5 h-5 text-red-500" />
                <h2 className="text-2xl font-bold text-white">Danger Zone</h2>
              </div>

              <div className="max-w-md">
                <p className="text-neutral-400 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="danger">
                  Delete Account
                </Button>
              </div>
            </Card>
          </div>
        )}
    </>
  )
}

