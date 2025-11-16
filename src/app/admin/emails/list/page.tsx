'use client'

import { useState } from 'react'
import { Container, Card, Badge, Button } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Mail, Send, Eye, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Email template metadata
const EMAIL_TEMPLATES = [
  {
    id: 'household-invitation',
    name: 'Household Invitation',
    description: 'Invite family members to join your household account',
    category: 'Household',
    triggers: [
      'Admin clicks "Send Invitation" in Household Settings',
      'API: POST /api/household/invite',
    ],
    variables: ['inviterName', 'inviterEmail', 'householdName', 'invitationLink', 'expiresInDays'],
    status: 'active',
    lastSent: '2025-11-14',
    totalSent: 12,
  },
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Welcome new users to VibrationFit',
    category: 'Onboarding',
    triggers: [
      'User completes signup',
      'Auth: Email verification success',
    ],
    variables: ['userName', 'verificationLink'],
    status: 'planned',
    lastSent: null,
    totalSent: 0,
  },
  {
    id: 'intensive-welcome',
    name: 'Intensive Program Welcome',
    description: 'Onboarding email for Intensive program purchasers',
    category: 'Intensive',
    triggers: [
      'Stripe webhook: intensive purchase complete',
      'Subscription status: active',
    ],
    variables: ['userName', 'dashboardLink', 'callScheduleLink'],
    status: 'planned',
    lastSent: null,
    totalSent: 0,
  },
  {
    id: 'token-purchase-confirmation',
    name: 'Token Pack Purchase',
    description: 'Confirmation email when user buys token packs',
    category: 'Billing',
    triggers: [
      'Stripe webhook: token pack purchase complete',
      'Payment status: succeeded',
    ],
    variables: ['userName', 'tokenAmount', 'receiptLink'],
    status: 'planned',
    lastSent: null,
    totalSent: 0,
  },
  {
    id: 'subscription-renewal',
    name: 'Subscription Renewal',
    description: 'Notification of upcoming subscription renewal',
    category: 'Billing',
    triggers: [
      'Scheduled: 7 days before renewal',
      'Stripe: subscription active',
    ],
    variables: ['userName', 'renewalDate', 'amount', 'planName'],
    status: 'planned',
    lastSent: null,
    totalSent: 0,
  },
  {
    id: 'password-reset',
    name: 'Password Reset',
    description: 'Password reset link for account recovery',
    category: 'Authentication',
    triggers: [
      'User clicks "Forgot Password"',
      'API: POST /auth/reset-password',
    ],
    variables: ['userName', 'resetLink', 'expiresIn'],
    status: 'planned',
    lastSent: null,
    totalSent: 0,
  },
]

const CATEGORIES = ['All', 'Household', 'Onboarding', 'Intensive', 'Billing', 'Authentication']

function EmailsPageContent() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredEmails = selectedCategory === 'All'
    ? EMAIL_TEMPLATES
    : EMAIL_TEMPLATES.filter(email => email.category === selectedCategory)

  return (
    <Container size="xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2">
          Transactional Emails
        </h1>
        <p className="text-sm md:text-base text-neutral-400">
          Manage and monitor automated email templates
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Email Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredEmails.map(email => (
          <Card
            key={email.id}
            variant="elevated"
            className="p-4 md:p-6 hover:border-primary-500 transition-colors cursor-pointer"
            onClick={() => router.push(`/admin/emails/${email.id}`)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-semibold">{email.name}</h3>
                  <Badge 
                    variant={email.status === 'active' ? 'success' : 'info'}
                    className="text-xs mt-1"
                  >
                    {email.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs md:text-sm text-neutral-400 mb-3 md:mb-4 line-clamp-2">
              {email.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-3 md:mb-4 text-xs text-neutral-500">
              <div>
                <Send className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                {email.totalSent} sent
              </div>
              {email.lastSent && (
                <div>
                  Last: {new Date(email.lastSent).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Triggers Preview */}
            <div className="pt-3 md:pt-4 border-t border-neutral-800">
              <p className="text-xs font-medium text-neutral-400 mb-2">Triggers:</p>
              <div className="space-y-1">
                {email.triggers.slice(0, 2).map((trigger, idx) => (
                  <p key={idx} className="text-xs text-neutral-500 truncate">
                    • {trigger}
                  </p>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3 md:mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/admin/emails/${email.id}`)
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              {email.status === 'active' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/admin/emails/${email.id}`)
                  }}
                >
                  <Send className="w-3 h-3 mr-1" />
                  Test
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Coming Soon Notice */}
      <Card variant="elevated" className="p-4 md:p-6 lg:p-8 mt-6 md:mt-8 text-center">
        <h3 className="text-lg md:text-xl font-semibold mb-2">More Templates Coming Soon</h3>
        <p className="text-xs md:text-sm text-neutral-400 mb-4">
          We're building a comprehensive email system. Check back for updates!
        </p>
        <Button size="sm" variant="secondary">
          Request New Template
        </Button>
      </Card>
    </Container>
  )
}

export default function EmailsPage() {
  return (
    <AdminWrapper>
      <EmailsPageContent />
    </AdminWrapper>
  )
}
