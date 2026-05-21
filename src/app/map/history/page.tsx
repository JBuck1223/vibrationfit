import { redirect } from 'next/navigation'

/** MAP history is date-based time travel on /map — legacy version page redirects. */
export default function MapHistoryRedirectPage() {
  redirect('/map')
}
