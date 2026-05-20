import { IntensiveStepBar } from '@/components/intensive-studio/IntensiveStepBar'

export default function IntensiveVibeTribeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IntensiveStepBar />
      {children}
    </>
  )
}
