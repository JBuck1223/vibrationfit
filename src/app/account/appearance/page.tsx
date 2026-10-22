import { Card } from '@/lib/design-system/components'
import { AppearancePicker } from '@/components/app-shell/account/AppearancePicker'

export const metadata = { title: 'Appearance | Vibration Fit' }

export default function AppearancePage() {
  return (
    <Card>
      <AppearancePicker />
    </Card>
  )
}
