import { redirect } from 'next/navigation'

// Legacy route. Canonical support tickets live at /support/tickets.
export default function LegacyDashboardSupportRedirect() {
  redirect('/support/tickets')
}
