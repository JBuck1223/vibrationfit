import { GlobalLayout } from '@/components/GlobalLayout'

export function GlobalLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <GlobalLayout>
      {children}
    </GlobalLayout>
  )
}
