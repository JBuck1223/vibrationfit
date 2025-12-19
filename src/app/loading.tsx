import { Spinner } from '@/lib/design-system/components'

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Spinner size="lg" />
    </div>
  )
}



