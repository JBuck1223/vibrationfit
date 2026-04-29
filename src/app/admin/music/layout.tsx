import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Music Catalog Admin',
}

export default function MusicAdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
