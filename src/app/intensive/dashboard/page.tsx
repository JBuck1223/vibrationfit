import { redirect } from 'next/navigation'

// The Intensive dashboard is legacy. Open checklists continue in Getting Started.
export default function IntensiveDashboardRedirect() {
  redirect('/begin')
}
