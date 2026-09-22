import { redirect } from 'next/navigation'

// The 72-hour kickoff is retired. Getting Started is the door.
export default function IntensiveStartRedirect() {
  redirect('/begin')
}
