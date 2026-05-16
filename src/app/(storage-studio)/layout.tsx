import type { Metadata } from 'next'
import { StorageLayoutClient } from '@/components/dashboard-storage/StorageLayoutClient'

export const metadata: Metadata = {
  title: {
    template: '%s | Storage',
    default: 'Storage',
  },
}

export default function StorageStudioLayout({ children }: { children: React.ReactNode }) {
  return <StorageLayoutClient>{children}</StorageLayoutClient>
}
