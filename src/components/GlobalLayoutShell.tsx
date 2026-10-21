import { Suspense } from 'react'
import { GlobalLayout } from '@/components/GlobalLayout'
import { MemberExperience } from '@/components/rooms/MemberExperience'
export function GlobalLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <MemberExperience>
        <GlobalLayout>{children}</GlobalLayout>
      </MemberExperience>
    </Suspense>
  )
}
