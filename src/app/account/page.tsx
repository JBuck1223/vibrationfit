'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Container, Stack, Card, Spinner } from '@/lib/design-system/components'
import {
  User,
  Key,
  CreditCard,
  Shield,
  Trash2,
  ChevronRight,
  Mail,
  Phone,
  Pencil,
  Home,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPhoneDisplay, phoneToDigits } from '@/lib/phone-format'
import NextImage from 'next/image'
import { DEFAULT_PROFILE_IMAGE_URL } from '@/app/profile/components/ProfilePictureUpload'
import { ProfilePictureClickable } from '@/components/ProfilePictureClickable'

interface QuickLink {
  title: string
  description: string
  href: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  hoverBg: string
  danger?: boolean
}

const QUICK_LINKS: QuickLink[] = [
  {
    title: 'Personal information',
    description: 'Name, email, phone, and profile picture',
    href: '/account/settings',
    icon: User,
    iconColor: 'text-[#39FF14]',
    iconBg: 'bg-[#39FF14]/15',
    hoverBg: 'hover:bg-[#39FF14]/[0.11]',
  },
  {
    title: 'Household',
    description: 'Members, invitations, and shared token pool',
    href: '/account/household',
    icon: Home,
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-500/15',
    hoverBg: 'hover:bg-sky-500/[0.11]',
  },
  {
    title: 'Password and security',
    description: 'Sign-in password and security options',
    href: '/account/settings/password',
    icon: Key,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15',
    hoverBg: 'hover:bg-cyan-500/[0.11]',
  },
  {
    title: 'Billing and subscription',
    description: 'Plan, payment methods, and invoices',
    href: '/account/billing',
    icon: CreditCard,
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-500/15',
    hoverBg: 'hover:bg-teal-500/[0.11]',
  },
  {
    title: 'Privacy and data',
    description: 'How we handle your information',
    href: '/account/privacy',
    icon: Shield,
    iconColor: 'text-[#BF00FF]',
    iconBg: 'bg-[#BF00FF]/15',
    hoverBg: 'hover:bg-[#BF00FF]/[0.11]',
  },
  {
    title: 'Delete account',
    description: 'Permanently remove your account and data',
    href: '/account/settings/delete',
    icon: Trash2,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/15',
    hoverBg: 'hover:bg-red-500/[0.11]',
    danger: true,
  },
]

export default function AccountDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState<{
    first_name?: string | null
    last_name?: string | null
    full_name?: string | null
    email?: string | null
    phone?: string | null
    profile_picture_url?: string | null
  } | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
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
    void fetchAccountData()
  }, [])

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  const displayName = account?.full_name || account?.first_name || 'Member'

  const displayPhone =
    account?.phone != null && String(account.phone).trim() !== ''
      ? formatPhoneDisplay(phoneToDigits(account.phone)) || String(account.phone).trim()
      : null

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        <h1 className="sr-only">Account overview</h1>

        <Card
          variant="glass"
          className="relative z-0 border border-white/[0.06] p-4 shadow-none sm:p-5"
        >
          <div className="relative z-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative z-0 flex min-w-0 items-center gap-4">
              <ProfilePictureClickable
                src={account?.profile_picture_url || DEFAULT_PROFILE_IMAGE_URL}
                alt="Profile"
                className="inline-flex h-16 w-16 shrink-0 overflow-hidden rounded-full border border-neutral-700 bg-neutral-800 sm:h-[4.5rem] sm:w-[4.5rem]"
              >
                {imageLoadError ? (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-700">
                    <User className="h-7 w-7 text-neutral-400" />
                  </div>
                ) : (
                  <NextImage
                    src={account?.profile_picture_url || DEFAULT_PROFILE_IMAGE_URL}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    onError={() => setImageLoadError(true)}
                    unoptimized={!account?.profile_picture_url}
                  />
                )}
              </ProfilePictureClickable>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">Signed in as</p>
                <p className="truncate text-lg font-semibold text-white">{displayName}</p>
                {account?.email && (
                  <p className="mt-1 flex items-center gap-2 truncate text-sm text-neutral-400">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-500" aria-hidden />
                    <span className="truncate">{account.email}</span>
                  </p>
                )}
                {displayPhone && (
                  <p className="mt-0.5 flex items-center gap-2 text-sm text-neutral-400">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-500" aria-hidden />
                    <span>{displayPhone}</span>
                  </p>
                )}
              </div>
            </div>

            <Link
              href="/account/settings"
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:border-primary-500/40 hover:bg-white/[0.04] hover:text-white sm:self-center"
            >
              <Pencil className="h-4 w-4 text-primary-500" aria-hidden />
              Edit profile
            </Link>
          </div>
        </Card>

        <h2 className="sr-only">Shortcuts</h2>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group block min-w-0 touch-manipulation"
              >
                <Card
                  variant="glass"
                  className={`flex min-h-[5.5rem] w-full items-start gap-3 p-3.5 shadow-none transition-[border-color,background-color,transform] duration-200 sm:min-h-0 sm:p-4 hover:border-neutral-500 active:scale-[0.99] ${link.hoverBg} ${
                    link.danger ? 'border-red-500/20 hover:border-red-500/30' : ''
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${link.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${link.iconColor}`} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <h3 className="text-sm font-semibold leading-snug text-white">{link.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-neutral-500">{link.description}</p>
                  </div>
                  <ChevronRight
                    className={`mt-2 h-5 w-5 shrink-0 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-neutral-400 ${
                      link.danger ? 'group-hover:text-red-400/90' : ''
                    }`}
                    aria-hidden
                  />
                </Card>
              </Link>
            )
          })}
        </div>
      </Stack>
    </Container>
  )
}
