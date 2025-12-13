// /src/app/support/page.tsx
// Public support form

'use client'

import { useState, useEffect } from 'react'
import { Button, Card, Input, Textarea, Container, Stack, PageHero, Badge, Spinner, Select } from '@/lib/design-system/components'
import { CheckCircle, User, Mail, Calendar, Hash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface UserInfo {
  id: string
  email: string
  created_at: string
  full_name?: string
  profile_picture_url?: string
}

export default function SupportPage() {
  const [loading, setLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [formData, setFormData] = useState({
    guest_email: '',
    subject: '',
    description: '',
    category: 'account',
  })

  const supabase = createClient()

  // Fetch user data on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          console.log('Auth user found:', user.id)
          
          // Fetch active user profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('user_id, email, first_name, last_name, profile_picture_url, created_at')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (profileError) {
            console.error('Profile fetch error:', profileError.message, profileError)
          } else {
            console.log('Profile data:', profile)
          }

          if (profile) {
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()

            setUserInfo({
              id: profile.user_id,
              email: profile.email || user.email || '',
              created_at: profile.created_at || user.created_at,
              full_name: fullName || undefined,
              profile_picture_url: profile.profile_picture_url || undefined
            })

            // Auto-populate email
            setFormData(prev => ({
              ...prev,
              guest_email: profile.email || user.email || ''
            }))
          } else {
            // Fallback to auth user data if no profile exists
            console.log('No profile found, using auth data')
            setUserInfo({
              id: user.id,
              email: user.email || '',
              created_at: user.created_at,
              full_name: undefined,
              profile_picture_url: undefined
            })

            setFormData(prev => ({
              ...prev,
              guest_email: user.email || ''
            }))
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoadingUser(false)
      }
    }

    loadUser()
  }, [])

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('Form submitted with data:', formData)
    setLoading(true)

    try {
      // Include user_id if authenticated
      const payload = {
        ...formData,
        ...(userInfo && { user_id: userInfo.id })
      }
      
      console.log('Sending payload:', payload)

      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('Error response:', error)
        throw new Error(error.error || 'Failed to submit ticket')
      }

      const { ticket } = await response.json()
      console.log('Ticket created:', ticket)
      setTicketNumber(ticket.ticket_number)
      setSubmitted(true)
    } catch (error: any) {
      console.error('Error submitting ticket:', error)
      alert(error.message || 'Failed to submit ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (submitted) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <Card className="text-center p-8 md:p-12">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-black" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary-500">Ticket Created!</h2>
            <p className="text-sm md:text-base text-neutral-300 mb-2">
              Your support ticket has been created.
            </p>
            <p className="text-xl md:text-2xl font-semibold text-secondary-500 mb-4 md:mb-6">
              {ticketNumber}
            </p>
            <p className="text-xs md:text-sm text-neutral-400 mb-6 break-all">
              We've sent a confirmation email to {formData.guest_email}
            </p>
            <Button variant="primary" size="sm" onClick={() => (window.location.href = '/')}>
              Return Home
            </Button>
          </Card>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Get Support"
          subtitle="Need help? Submit a support ticket and we'll get back to you soon."
        />

        {/* User Info Card */}
        {loadingUser ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : userInfo ? (
          <Card className="p-4 md:p-6 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 border-primary-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary-500 tracking-widest">YOUR ACCOUNT</h3>
              <Badge variant="primary">Authenticated</Badge>
            </div>
            
            {/* Profile Header with Picture and Name */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-neutral-700">
              {userInfo.profile_picture_url ? (
                <Image
                  src={userInfo.profile_picture_url}
                  alt={userInfo.full_name || 'Profile'}
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-black text-2xl font-bold">
                    {userInfo.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div>
                <h4 className="text-xl font-bold text-white">{userInfo.full_name || 'User'}</h4>
                <p className="text-sm text-neutral-400">{userInfo.email}</p>
              </div>
            </div>
            
            {/* Account Details Grid */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-2 text-sm">
                <Hash className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-neutral-400 block mb-1">User ID:</span>
                  <span className="text-white font-mono text-xs break-all">{userInfo.id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span className="text-neutral-400">Member Since:</span>
                <span className="text-white font-medium">{formatDate(userInfo.created_at)}</span>
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="p-4 md:p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          
          {/* Account Info Fields (shown only when authenticated) */}
          {userInfo && (
            <div className="pb-4 mb-4 border-b border-neutral-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-2">Name</label>
                  <Input
                    type="text"
                    value={userInfo.full_name || 'Not provided'}
                    readOnly
                    disabled
                    className="opacity-75 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={formData.guest_email}
                    readOnly
                    disabled
                    className="opacity-75 cursor-not-allowed"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-xs md:text-sm font-medium mb-2">User ID</label>
                <Input
                  type="text"
                  value={userInfo.id}
                  readOnly
                  disabled
                  className="opacity-75 cursor-not-allowed font-mono text-xs"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  This ID will be attached to your support ticket
                </p>
              </div>
            </div>
          )}
          
          {/* Email field for non-authenticated users */}
          {!userInfo && (
            <div>
              <label className="block text-xs md:text-sm font-medium mb-2">Email *</label>
              <Input
                type="email"
                value={formData.guest_email}
                onChange={(e) => handleChange('guest_email', e.target.value)}
                placeholder="your@email.com"
                required
              />
              <p className="text-xs text-neutral-500 mt-1">
                We'll send updates to this email
              </p>
            </div>
          )}

          {/* Category and Subject in one row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium mb-2">Category *</label>
              <Select
                value={formData.category}
                onChange={(value) => handleChange('category', value)}
                options={[
                  { value: 'account', label: 'Account Help' },
                  { value: 'feature', label: 'Feature Request' },
                  { value: 'technical', label: 'Technical Assistance' },
                  { value: 'other', label: 'Other' }
                ]}
                placeholder="Select a category"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium mb-2">Subject *</label>
              <Input
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="Brief description of your issue"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium mb-2">Description *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Please provide as much detail as possible..."
              rows={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap bg-primary-500 text-black font-semibold border-2 border-transparent hover:bg-primary-500/80 active:opacity-80 px-6 py-3.5 text-base"
          >
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>

          <p className="text-xs md:text-sm text-neutral-500 text-center">
            We typically respond within 24 hours
          </p>
        </form>
      </Card>
      </Stack>
    </Container>
  )
}
