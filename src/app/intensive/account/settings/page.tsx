// /src/app/intensive/account/settings/page.tsx
// Intensive Account Settings - manages user_accounts table fields
// Step 1 of Activation Intensive - completes when First Name, Last Name, Phone, Email, profile_picture_url are filled

'use client'

import { useState, useEffect } from 'react'
import { Container, Stack, Card, Button, Input, Spinner, DatePicker, Checkbox, Modal, IntensiveStepCompleteModal } from '@/lib/design-system/components'
import { User, Check, Globe } from 'lucide-react'
import { ProfilePictureUpload } from '@/app/profile/components/ProfilePictureUpload'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'
import { getStepInfo, getNextStep } from '@/lib/intensive/step-mapping'
import { getActiveIntensiveClient } from '@/lib/intensive/utils-client'
import { invalidateIntensiveSnapshot } from '@/lib/intensive/intensive-snapshot'

const DEFAULT_PROFILE_PICTURE = 'https://media.vibrationfit.com/site-assets/default-avatar.png'

export default function IntensiveAccountSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [originalAccount, setOriginalAccount] = useState<any>(null)
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  
  const [timezone, setTimezone] = useState('')

  const [smsOptIn, setSmsOptIn] = useState(true)
  const [emailOptIn, setEmailOptIn] = useState(true)
  
  const [showOptOutModal, setShowOptOutModal] = useState(false)
  const [pendingOptOut, setPendingOptOut] = useState<'sms' | 'email' | null>(null)
  
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [showDefaultPictureModal, setShowDefaultPictureModal] = useState(false)
  const [justCompletedStep, setJustCompletedStep] = useState(false)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()
  const { setCompletedAt: setStepCompleted } = useIntensiveStep()

  useEffect(() => {
    if (isAlreadyCompleted && completedAt) setStepCompleted(completedAt)
    return () => setStepCompleted(null)
  }, [isAlreadyCompleted, completedAt, setStepCompleted])

  useEffect(() => {
    fetchUserData()
    checkCompletionStatus()
  }, [])

  const checkCompletionStatus = async () => {
    try {
      const intensiveData = await getActiveIntensiveClient()

      if (intensiveData) {
        setIntensiveId(intensiveData.intensive_id)
        
        const { data: accountData } = await supabase
          .from('user_accounts')
          .select('first_name, last_name, email, phone, updated_at')
          .eq('id', intensiveData.user_id)
          .single()

        if (accountData) {
          const hasFirstName = accountData.first_name && accountData.first_name.trim().length > 0
          const hasLastName = accountData.last_name && accountData.last_name.trim().length > 0
          const hasEmail = accountData.email && accountData.email.trim().length > 0
          const hasPhone = accountData.phone && accountData.phone.replace(/\D/g, '').length >= 10
          
          if (hasFirstName && hasLastName && hasEmail && hasPhone) {
            setIsAlreadyCompleted(true)
            setCompletedAt(accountData.updated_at)
          }
        }
      }
    } catch (error) {
      console.error('Error checking completion status:', error)
    }
  }

  const isIntensiveStep1Complete = () => {
    const hasFirstName = firstName.trim().length > 0
    const hasLastName = lastName.trim().length > 0
    const hasEmail = email.trim().length > 0
    const hasPhone = phone.replace(/\D/g, '').length >= 10
    const hasProfilePicture = profilePictureUrl && profilePictureUrl !== DEFAULT_PROFILE_PICTURE
    
    return hasFirstName && hasLastName && hasEmail && hasPhone && hasProfilePicture
  }

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
      const { error } = await supabase
        .from('intensive_checklist')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId)

      if (error) {
        console.error('Error marking intensive settings complete:', error)
      } else {
        invalidateIntensiveSnapshot()
        setJustCompletedStep(true)
        setShowStepCompleteModal(true)
      }
    } catch (error) {
      console.error('Error in markIntensiveSettingsComplete:', error)
    }
  }

  const handleContinueToIntensive = async () => {
    if (canProceedWithDefaultPicture()) {
      setShowDefaultPictureModal(true)
    } else if (isIntensiveStep1Complete()) {
      await markIntensiveSettingsComplete()
    }
  }

  const handleProceedWithDefaultPicture = async () => {
    setShowDefaultPictureModal(false)
    await markIntensiveSettingsComplete()
  }

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

      if (email !== originalAccount?.email) {
        const { error: authError } = await supabase.auth.updateUser({ email })
        if (authError) throw authError
        
        await supabase
          .from('user_accounts')
          .update({ email })
          .eq('id', user.id)
      }
      
      if (!isAlreadyCompleted) {
        const hasFirstName = firstName.trim().length > 0
        const hasLastName = lastName.trim().length > 0
        const hasEmail = email.trim().length > 0
        const hasPhone = phone.replace(/\D/g, '').length >= 10
        
        if (hasFirstName && hasLastName && hasEmail && hasPhone) {
          setIsAlreadyCompleted(true)
          setShowStepCompleteModal(true)
          return
        }
      }
      
      if (email !== originalAccount?.email) {
        toast.success('Account updated! Check your email to confirm the address change.')
      } else {
        toast.success('Account updated successfully')
      }
      
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

  const currentStep = getStepInfo('settings')
  const nextStep = getNextStep('settings')

  return (
    <Container size="xl">
      <Stack gap="lg">
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

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-2">
                <Globe className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Time Zone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-900 border-2 border-neutral-700 text-white text-sm focus:border-primary-500 focus:outline-none transition-colors"
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
              <p className="text-xs text-neutral-500 mt-1.5">
                Used for scheduling calls and displaying times
              </p>
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
            Your Profile Picture is used across Vibration Fit to help you become a vibrational match to your vision. Are you sure you want to proceed with the default icon?
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

      <IntensiveStepCompleteModal
        isOpen={showStepCompleteModal}
        onClose={() => setShowStepCompleteModal(false)}
        stepId="settings"
      />
    </Container>
  )
}
