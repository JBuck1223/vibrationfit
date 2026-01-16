// /src/app/account/settings/page.tsx
// Account settings - manages user_accounts table fields
// Step 1 of Activation Intensive - completes when First Name, Last Name, Phone, Email, profile_picture_url are filled

'use client'

import { useState, useEffect } from 'react'
import { Container, Stack, PageHero, Card, Button, Input, Spinner, DatePicker, Checkbox, Modal, Badge } from '@/lib/design-system/components'
import { User, Check, Rocket } from 'lucide-react'
import { ProfilePictureUpload } from '@/app/profile/components/ProfilePictureUpload'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Default profile picture URL to check against
const DEFAULT_PROFILE_PICTURE = 'https://media.vibrationfit.com/site-assets/default-avatar.png'

export default function AccountSettingsPage() {
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
  
  // Notification preferences (stored in user_accounts)
  const [smsOptIn, setSmsOptIn] = useState(true)
  const [emailOptIn, setEmailOptIn] = useState(true)
  
  // Modal state for opt-out confirmation
  const [showOptOutModal, setShowOptOutModal] = useState(false)
  const [pendingOptOut, setPendingOptOut] = useState<'sms' | 'email' | null>(null)
  
  // Intensive mode state
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [showDefaultPictureModal, setShowDefaultPictureModal] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
    checkIntensiveMode()
  }, [])

  const checkIntensiveMode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id, intensive_id, status')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        setIsIntensiveMode(true)
        setIntensiveId(checklist.intensive_id)
      }
    } catch (error) {
      console.error('Error checking intensive mode:', error)
    }
  }

  // Check if all required fields for intensive Step 1 are complete
  const isIntensiveStep1Complete = () => {
    const hasFirstName = firstName.trim().length > 0
    const hasLastName = lastName.trim().length > 0
    const hasEmail = email.trim().length > 0
    const hasPhone = phone.replace(/\D/g, '').length >= 10
    const hasProfilePicture = profilePictureUrl && profilePictureUrl !== DEFAULT_PROFILE_PICTURE
    
    return hasFirstName && hasLastName && hasEmail && hasPhone && hasProfilePicture
  }

  // Check if fields are complete but using default picture
  const canProceedWithDefaultPicture = () => {
    const hasFirstName = firstName.trim().length > 0
    const hasLastName = lastName.trim().length > 0
    const hasEmail = email.trim().length > 0
    const hasPhone = phone.replace(/\D/g, '').length >= 10
    const isDefaultPicture = !profilePictureUrl || profilePictureUrl === DEFAULT_PROFILE_PICTURE
    
    return hasFirstName && hasLastName && hasEmail && hasPhone && isDefaultPicture
  }

  const markIntensiveSettingsComplete = async () => {
    if (!intensiveId) return

    try {
      // Update the intensive_checklist - using a generic "settings_completed" approach
      // Note: The actual field name may need to be adjusted based on final schema
      const { error } = await supabase
        .from('intensive_checklist')
        .update({
          // Settings step doesn't have its own field, it's tracked implicitly
          // The dashboard will check user_accounts directly
          updated_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId)

      if (error) {
        console.error('Error marking intensive settings complete:', error)
      } else {
        toast.success('Settings complete! Redirecting to your Intensive Dashboard...')
        setTimeout(() => {
          router.push('/intensive/dashboard')
        }, 1500)
      }
    } catch (error) {
      console.error('Error in markIntensiveSettingsComplete:', error)
    }
  }

  const handleContinueToIntensive = async () => {
    if (canProceedWithDefaultPicture()) {
      // Show modal asking about default picture
      setShowDefaultPictureModal(true)
    } else if (isIntensiveStep1Complete()) {
      // All complete including custom picture, proceed
      await markIntensiveSettingsComplete()
    }
  }

  const handleProceedWithDefaultPicture = async () => {
    setShowDefaultPictureModal(false)
    await markIntensiveSettingsComplete()
  }

  // Track changes
  useEffect(() => {
    if (!originalAccount) return
    
    const changed = 
      firstName !== (originalAccount.first_name || '') ||
      lastName !== (originalAccount.last_name || '') ||
      email !== (originalAccount.email || '') ||
      phone !== (originalAccount.phone || '') ||
      dateOfBirth !== (originalAccount.date_of_birth || '') ||
      smsOptIn !== (originalAccount.sms_opt_in ?? true) ||
      emailOptIn !== (originalAccount.email_opt_in ?? true)
    
    setHasChanges(changed)
  }, [firstName, lastName, email, phone, dateOfBirth, smsOptIn, emailOptIn, originalAccount])

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)

      // Fetch all user account data
      // Note: email_opt_in may not exist until migration is run - query without it first
      const { data: accountData, error } = await supabase
        .from('user_accounts')
        .select('first_name, last_name, full_name, email, phone, profile_picture_url, date_of_birth, sms_opt_in, sms_opt_in_date')
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

        setOriginalAccount({ ...accountData, email_opt_in: emailOptInValue })
        setFirstName(accountData.first_name || '')
        setLastName(accountData.last_name || '')
        setEmail(accountData.email || user.email || '')
        setPhone(formatPhoneNumber(accountData.phone || ''))
        setDateOfBirth(accountData.date_of_birth || '')
        setProfilePictureUrl(accountData.profile_picture_url)
        setSmsOptIn(accountData.sms_opt_in ?? true)
        setEmailOptIn(emailOptInValue)
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
      // Opting in - no confirmation needed
      if (type === 'sms') {
        setSmsOptIn(true)
      } else {
        setEmailOptIn(true)
      }
    } else {
      // Opting out - show confirmation modal
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

      // Update user_accounts
      const updateData: any = {
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
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
    // Also update user_accounts directly
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
    <Container size="xl">
      <Stack gap="lg">
        {/* Page Hero */}
        <PageHero
          eyebrow={isIntensiveMode ? "ACTIVATION INTENSIVE - STEP 1" : undefined}
          title="Account Settings"
          subtitle="Manage your personal information and preferences"
        >
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
            {isIntensiveMode && (
              <Badge variant="premium">
                <Rocket className="w-4 h-4 mr-2" />
                Step 1 of 14
              </Badge>
            )}
            <Button variant="outline" onClick={() => router.push('/account')}>
              Account Dashboard
            </Button>
          </div>
        </PageHero>

        {/* Personal Information */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold text-white">Personal Information</h3>
          </div>
          
          {/* Profile Picture */}
          <div className="mb-6">
            <ProfilePictureUpload
              currentImageUrl={profilePictureUrl}
              onImageChange={handleProfilePictureChange}
              onError={(err) => toast.error(err)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-2">
                First Name
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
              <label className="block text-sm font-medium text-neutral-200 mb-2">
                Last Name
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
              <label className="block text-sm font-medium text-neutral-200 mb-2">
                Email Address
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
              <label className="block text-sm font-medium text-neutral-200 mb-2">
                Phone Number
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

            {/* Communication Opt-In */}
            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-2">
                Communication Opt-In
              </label>
              <div className="flex gap-6 mt-3">
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
          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSaveAccount}
              disabled={saving || !hasChanges}
              variant="primary"
              className={`min-w-[140px] ${hasChanges ? 'animate-pulse' : ''}`}
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

        {/* Intensive Mode - Continue Button */}
        {isIntensiveMode && (
          <Card className="p-6 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-3">Ready to Continue?</h3>
              <p className="text-sm md:text-base text-neutral-300 mb-6">
                Complete your settings to move to the next step in your Activation Intensive.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleContinueToIntensive}
                disabled={!firstName.trim() || !lastName.trim() || !email.trim() || phone.replace(/\D/g, '').length < 10}
                className="w-full sm:w-auto"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Continue to Intensive Dashboard
              </Button>
              {(!firstName.trim() || !lastName.trim() || !email.trim() || phone.replace(/\D/g, '').length < 10) && (
                <p className="text-xs text-neutral-500 mt-3">
                  Please fill in First Name, Last Name, Email, and Phone to continue.
                </p>
              )}
            </div>
          </Card>
        )}
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

      {/* Default Profile Picture Modal */}
      <Modal
        isOpen={showDefaultPictureModal}
        onClose={() => setShowDefaultPictureModal(false)}
        title="Profile Picture"
      >
        <div className="space-y-4">
          <p className="text-neutral-300">
            Your Profile Picture is used across VibrationFit to help you become a vibrational match to your vision. Are you sure you want to proceed with the default icon?
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="primary" onClick={() => setShowDefaultPictureModal(false)} className="w-full">
              Add My Photo
            </Button>
            <Button variant="ghost" onClick={handleProceedWithDefaultPicture} className="w-full">
              Continue with Default
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}
