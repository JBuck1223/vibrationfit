import type { Metadata } from 'next'
import { DailyPaperShell } from './DailyPaperShell'

export const metadata: Metadata = {
  title: 'Daily Paper',
}

export default function DailyPaperLayout({ children }: { children: React.ReactNode }) {
  return <DailyPaperShell>{children}</DailyPaperShell>
}
