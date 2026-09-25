import type { Metadata } from 'next'
import { VivaExplainer } from '@/components/marketing/viva-explainer/VivaExplainer'

export const metadata: Metadata = {
  title: 'VIVA',
  description:
    'VIVA drafts the Life You Choose with you. You see every line, change any of it, and nothing becomes yours until you keep it.',
  robots: { index: false, follow: false },
}

export default function VivaExplainerPage() {
  return <VivaExplainer />
}
