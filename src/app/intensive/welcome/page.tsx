import { redirect } from 'next/navigation'

// Legacy intro screen. The canonical intensive kickoff (with working video and
// the start ceremony) lives at /intensive/start, which is where the login and
// auth-callback flows send users. Redirect to avoid a divergent/broken path.
export default function IntensiveWelcomeRedirect() {
  redirect('/intensive/start')
}
