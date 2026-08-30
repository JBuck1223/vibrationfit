import type { ReactNode } from 'react'
import { Metadata } from 'next'
import { AdminLayoutClient } from '@/components/admin-studio'

export const metadata: Metadata = {
  title: {
    template: '%s | Admin',
    default: 'Admin',
  },
}

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
