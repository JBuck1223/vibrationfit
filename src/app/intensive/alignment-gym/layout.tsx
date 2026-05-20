import { IntensiveStepBar } from '@/components/intensive-studio/IntensiveStepBar'

export default function IntensiveAlignmentGymLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IntensiveStepBar />
      {children}
    </>
  )
}
