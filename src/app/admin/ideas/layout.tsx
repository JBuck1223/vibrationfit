import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Idea Hub',
}

export default function IdeasLayout({ children }: { children: React.ReactNode }) {
  return children
}
