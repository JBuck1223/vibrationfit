// /src/app/account/settings/page.tsx
// Account settings - manages user_accounts table fields

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Stack, Card, Button, Input, Spinner, DatePicker, Checkbox, Modal } from '@/lib/design-system/components'
import { Check, Globe } from 'lucide-react'
import { ProfilePictureUpload } from '@/app/profile/components/ProfilePictureUpload'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function AccountSettingsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [originalAccount, setOriginalAccount] = useState<any>(null)
  
  // Form states - all user_accounts fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  
  const [timezone, setTimezone] = useState('')

  // Notification preferences (stored in user_accounts)
  const [smsOptIn, setSmsOptIn] = useState(true)
  const [emailOptIn, setEmailOptIn] = useState(true)
  
  // Modal state for opt-out confirmation
  const [showOptOutModal, setShowOptOutModal] = useState(false)
  const [pendingOptOut, setPendingOptOut] = useState<'sms' | 'email' | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash === '#household') {
      router.replace('/account/household')
    }
  }, [router])

  // Track changes
  useEffect(() => {
    if (!originalAccount) return
    
    const changed = 
      firstName !== (originalAccount.first_name || '') ||
      lastName !== (originalAccount.last_name || '') ||
      email !== (originalAccount.email || '') ||
      phone !== (originalAccount.phone || '') ||
      dateOfBirth !== (originalAccount.date_of_birth || '') ||
      timezone !== (originalAccount.timezone || '') ||
      smsOptIn !== (originalAccount.sms_opt_in ?? true) ||
      emailOptIn !== (originalAccount.email_opt_in ?? true)
    
    setHasChanges(changed)
  }, [firstName, lastName, email, phone, dateOfBirth, timezone, smsOptIn, emailOptIn, originalAccount])

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)

      const { data: accountData, error } = await supabase
        .from('user_accounts')
        .select('first_name, last_name, full_name, email, phone, profile_picture_url, date_of_birth, sms_opt_in, sms_opt_in_date, timezone')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user_accounts:', error)
      }

      if (accountData) {
        // Try to fetch email_opt_in separately (column may not exist yet)
        let emailOptInValue = true
        try {
          const { data: optInData } = await supabase
            .from('user_accounts')
            .select('email_opt_in')
            .eq('id', user.id)
            .single()
          if (optInData && 'email_opt_in' in optInData) {
            emailOptInValue = optInData.email_opt_in ?? true
          }
        } catch {
          // Column doesn't exist yet, use default
        }

        const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone
        const userTz = accountData.timezone || detectedTz || 'America/New_York'

        setOriginalAccount({ ...accountData, email_opt_in: emailOptInValue, timezone: userTz })
        setFirstName(accountData.first_name || '')
        setLastName(accountData.last_name || '')
        setEmail(accountData.email || user.email || '')
        setPhone(formatPhoneNumber(accountData.phone || ''))
        setDateOfBirth(accountData.date_of_birth || '')
        setProfilePictureUrl(accountData.profile_picture_url)
        setTimezone(userTz)
        setSmsOptIn(true)
        setEmailOptIn(true)

        // Auto-save detected timezone if the user doesn't have one stored yet
        if (!accountData.timezone && detectedTz) {
          supabase
            .from('user_accounts')
            .update({ timezone: detectedTz })
            .eq('id', user.id)
            .then(() => {})
        }
      } else {
        setEmail(user.email || '')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      toast.error('Failed to load account data')
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneNumber = (value: string): string => {
    if (!value) return ''
    const cleaned = value.replace(/\D/g, '')
    const limited = cleaned.slice(0, 10)
    
    if (limited.length <= 3) {
      return limited
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
    }
  }

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhoneNumber(value))
  }

  const handleDateChange = (dateString: string) => {
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      setDateOfBirth(date.toISOString().split('T')[0])
    }
  }

  const handleOptOutAttempt = (type: 'sms' | 'email', checked: boolean) => {
    if (checked) {
      if (type === 'sms') {
        setSmsOptIn(true)
      } else {
        setEmailOptIn(true)
      }
    } else {
      setPendingOptOut(type)
      setShowOptOutModal(true)
    }
  }

  const confirmOptOut = () => {
    if (pendingOptOut === 'sms') {
      setSmsOptIn(false)
    } else if (pendingOptOut === 'email') {
      setEmailOptIn(false)
    }
    setShowOptOutModal(false)
    setPendingOptOut(null)
  }

  const cancelOptOut = () => {
    setShowOptOutModal(false)
    setPendingOptOut(null)
  }

  const handleSaveAccount = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      // Get IP for SMS compliance if opting in
      let ip = ''
      if (smsOptIn && !originalAccount?.sms_opt_in) {
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json')
          const ipData = await ipResponse.json()
          ip = ipData.ip
        } catch {
          // Continue without IP
        }
      }

      const updateData: any = {
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
        timezone: timezone || null,
        sms_opt_in: phone ? smsOptIn : false,
      }

      // Try to include email_opt_in (column may not exist until migration runs)
      try {
        const { error: testError } = await supabase
          .from('user_accounts')
          .select('email_opt_in')
          .eq('id', user.id)
          .single()
        
        if (!testError) {
          updateData.email_opt_in = emailOptIn
        }
      } catch {
        // Column doesn't exist yet, skip
      }

      // Only update SMS consent tracking if changing opt-in status
      if (smsOptIn && !originalAccount?.sms_opt_in) {
        updateData.sms_opt_in_date = new Date().toISOString()
        if (ip) updateData.sms_opt_in_ip = ip
      } else if (!smsOptIn && originalAccount?.sms_opt_in) {
        updateData.sms_opt_in_date = null
        updateData.sms_opt_in_ip = null
      }

      const { error: accountError } = await supabase
        .from('user_accounts')
        .update(updateData)
        .eq('id', user.id)

      if (accountError) throw accountError

      // Update email separately if changed (requires auth update)
      if (email !== originalAccount?.email) {
        const { error: authError } = await supabase.auth.updateUser({ email })
        if (authError) throw authError
        
        await supabase
          .from('user_accounts')
          .update({ email })
          .eq('id', user.id)
      }
      
      if (email !== originalAccount?.email) {
        toast.success('Account updated! Check your email to confirm the address change.')
      } else {
        toast.success('Account updated successfully')
      }
      
      // Refresh data
      await fetchUserData()
    } catch (error: any) {
      console.error('Error saving account:', error)
      toast.error(error.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleProfilePictureChange = (url: string) => {
    setProfilePictureUrl(url)
    if (user) {
      supabase
        .from('user_accounts')
        .update({ profile_picture_url: url })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) console.error('Error updating profile picture:', error)
        })
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
        <h1 className="sr-only">Personal information</h1>

        <Card
          variant="glass"
          className="border border-white/[0.06] p-4 shadow-none sm:p-5"
        >
          <p className="mb-5 text-sm text-neutral-500">
            Update your name, contact details, timezone, and how we reach you.
          </p>

          {/* Profile Picture */}
          <div className="mb-6">
            <ProfilePictureUpload
              currentImageUrl={profilePictureUrl}
              onImageChange={handleProfilePictureChange}
              onError={(err) => toast.error(err)}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            {/* First Name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">
                First name
              </label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                className="w-full"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">
                Last name
              </label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                className="w-full"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">
                Phone
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <DatePicker
                label="Date of Birth"
                value={dateOfBirth}
                onChange={(dateString: string) => handleDateChange(dateString)}
                maxDate={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>

            {/* Timezone */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-neutral-400">
                <Globe className="h-3.5 w-3.5 shrink-0 text-neutral-500" aria-hidden />
                Time zone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
              >
                <optgroup label="United States">
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Anchorage">Alaska Time (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="America/Phoenix">Arizona (no DST)</option>
                  <option value="America/Puerto_Rico">Atlantic Time (AT)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Europe/Paris">Central Europe (CET)</option>
                  <option value="Europe/Berlin">Berlin (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Shanghai">China (CST)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                  <option value="Pacific/Auckland">New Zealand (NZST)</option>
                </optgroup>
              </select>
              <p className="mt-1.5 text-xs text-neutral-500">
                Used for scheduling and how times appear in the app
              </p>
            </div>

            {/* Communication Opt-In */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">
                Communication preferences
              </label>
              <div className="mt-2 flex gap-6">
                <Checkbox
                  checked={emailOptIn}
                  onChange={(e) => handleOptOutAttempt('email', e.target.checked)}
                  label="Email"
                />
                <Checkbox
                  checked={smsOptIn}
                  onChange={(e) => handleOptOutAttempt('sms', e.target.checked)}
                  label="SMS"
                  disabled={!phone}
                />
              </div>
              {!phone && (
                <p className="text-xs text-neutral-500 mt-2">Add a phone number to enable SMS</p>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end border-t border-white/[0.06] pt-5">
            <Button
              onClick={handleSaveAccount}
              disabled={saving || !hasChanges}
              variant="primary"
              className="min-w-[140px]"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : hasChanges ? (
                'Save Changes'
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved
                </>
              )}
            </Button>
          </div>
        </Card>
      </Stack>

      {/* Opt-Out Confirmation Modal */}
      <Modal
        isOpen={showOptOutModal}
        onClose={cancelOptOut}
        title="Are you sure?"
      >
        <div className="space-y-4">
          <p className="text-neutral-300">
            Many of our features depend on these notifications. Opting out may affect your experience with appointment reminders, progress updates, and important account alerts.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="primary" onClick={cancelOptOut} className="w-full">
              Keep Enabled
            </Button>
            <Button variant="danger" onClick={confirmOptOut} className="w-full">
              Turn Off {pendingOptOut === 'sms' ? 'SMS' : 'Email'}
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}
