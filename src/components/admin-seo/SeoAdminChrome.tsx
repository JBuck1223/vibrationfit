'use client'

import { BarChart3, FileText, Globe, KeyRound, Megaphone } from 'lucide-react'
import { useAdminStudioChrome } from '@/components/admin-studio'

const TABS = [
  { label: 'Overview', path: '/admin/seo', icon: Globe, exactPath: true },
  { label: 'Pages', path: '/admin/seo/pages', icon: FileText },
  { label: 'Keywords', path: '/admin/seo/keywords', icon: KeyRound },
  { label: 'Ads', path: '/admin/seo/ads', icon: Megaphone },
  { label: 'Performance', path: '/admin/seo/performance', icon: BarChart3 },
]

export function SeoAdminChrome() {
  useAdminStudioChrome({
    title: 'SEO & PPC',
    icon: Globe,
    tabs: TABS,
    contextText: 'Every landing page, ready for Google, AI search and Google Ads.',
  })
  return null
}
