import { Suspense } from 'react'
import { ToolsDirectory } from '@/components/app-shell/tools/ToolsDirectory'

export const metadata = { title: 'Tools | Vibration Fit' }

export default function ToolsPage() {
  return (
    <Suspense fallback={null}>
      <ToolsDirectory />
    </Suspense>
  )
}
