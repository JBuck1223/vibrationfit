import type { Metadata } from 'next'

export const metadata: Metadata = {
  // Root layout template appends "| Vibration Fit"
  title: 'One Active Vision Away',
  description:
    'The Universe doesn’t respond to a vibe you reach once. It responds to the one you train and maintain. You are one active vision away from the life of your dreams.',
  // Staging page: keep out of search until promoted to the homepage.
  // Remove this block as part of the promotion step.
  robots: { index: false, follow: false },
}

export default function LifeFirstLayout({ children }: { children: React.ReactNode }) {
  return children
}
