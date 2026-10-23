import type { Metadata } from 'next'
import { SeoAdminChrome } from '@/components/admin-seo/SeoAdminChrome'

export const metadata: Metadata = { title: { default: 'SEO & PPC', template: '%s · SEO & PPC | Admin' } }

export default function SeoAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoAdminChrome />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</div>
    </>
  )
}
