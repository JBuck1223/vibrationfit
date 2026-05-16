import type { Metadata } from 'next'
import { AccountLayoutClient } from '@/components/account-studio'

export const metadata: Metadata = {
  title: {
    template: '%s | Account',
    default: 'Account',
  },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountLayoutClient>{children}</AccountLayoutClient>
}

