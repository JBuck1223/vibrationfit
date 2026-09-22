import { redirect } from 'next/navigation'

// Legacy intro. Getting Started replaced the 72-hour kickoff.
export default function IntensiveWelcomeRedirect() {
  redirect('/begin')
}
