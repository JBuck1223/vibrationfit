// /src/app/account/page.tsx
// Account dashboard - central hub for account management

'use client'

import { useState, useEffect } from 'react'
import { Container, Stack, PageHero, Card, Button, Spinner } from '@/lib/design-system/components'
import { User, Settings, Key, CreditCard, Shield, Trash2, ChevronRight, Mail, Phone, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { DEFAULT_PROFILE_IMAGE_URL } from '@/app/profile/components/ProfilePictureUpload'

interface AccountLink {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  variant?: 'default' | 'danger'
}

export default function AccountDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState<any>(null)
  const [imageLoadError, setImageLoadError] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchAccountData()
  }, [])

  const fetchAccountData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: accountData } = await supabase
        .from('user_accounts')
        .select('first_name, last_name, full_name, email, phone, profile_picture_url')
        .eq('id', user.id)
        .single()

      setAccount(accountData || { email: user.email })
    } catch (error) {
      console.error('Error fetching account:', error)
    } finally {
      setLoading(false)
    }
  }

  const accountLinks: AccountLink[] = [
    {
      title: 'Personal Information',
      description: 'Update your name, email, phone, and profile picture',
      href: '/account/settings',
      icon: <User className="w-5 h-5" />,
    },
    {
      title: 'Password & Security',
      description: 'Change your password and security settings',
      href: '/account/settings/password',
      icon: <Key className="w-5 h-5" />,
    },
    {
      title: 'Billing & Subscription',
      description: 'Manage your subscription and payment methods',
      href: '/account/billing',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      title: 'Privacy & Data',
      description: 'Learn how we protect your information',
      href: '/account/privacy',
      icon: <Shield className="w-5 h-5" />,
    },
    {
      title: 'Delete Account',
      description: 'Permanently delete your account and all data',
      href: '/account/settings/delete',
      icon: <Trash2 className="w-5 h-5" />,
      variant: 'danger',
    },
  ]

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
          title="Account"
          subtitle="Manage your account settings and preferences"
        />

        {/* Account Overview Card */}
        <Card className="p-6">
          <div className="flex items-center gap-6">
            {/* Profile Picture */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 flex-shrink-0">
              {imageLoadError ? (
                <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                  <User className="w-8 h-8 text-neutral-400" />
                </div>
              ) : (
                <NextImage
                  src={account?.profile_picture_url || DEFAULT_PROFILE_IMAGE_URL}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  onError={() => setImageLoadError(true)}
                  unoptimized={!account?.profile_picture_url}
                />
              )}
            </div>
            
            {/* Account Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white truncate">
                {account?.full_name || account?.first_name || 'Welcome'}
              </h2>
              
              <div className="mt-2 space-y-1">
                {account?.email && (
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{account.email}</span>
                  </div>
                )}
                {account?.phone && (
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Phone className="w-4 h-4" />
                    <span>{account.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <Button variant="secondary" size="sm" onClick={() => router.push('/account/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </Card>

        {/* Account Links */}
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-neutral-800">
            {accountLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`w-full flex items-center justify-between p-4 md:p-5 hover:bg-neutral-900 transition-colors text-left ${
                  link.variant === 'danger' ? 'hover:bg-red-500/10' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${
                    link.variant === 'danger' 
                      ? 'bg-red-500/20 text-red-500' 
                      : 'bg-neutral-800 text-white'
                  }`}>
                    {link.icon}
                  </div>
                  <div>
                    <div className={`font-medium ${
                      link.variant === 'danger' ? 'text-red-500' : 'text-white'
                    }`}>
                      {link.title}
                    </div>
                    <div className="text-sm text-neutral-400">{link.description}</div>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${
                  link.variant === 'danger' ? 'text-red-500' : 'text-neutral-500'
                }`} />
              </button>
            ))}
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
