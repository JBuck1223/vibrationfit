import { redirect } from 'next/navigation'

// Listen sub-tab: the listening surface lives in the audio studio.
export default function ListenQueriesPage() {
  redirect('/audio/stories')
}
