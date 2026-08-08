import { redirect } from 'next/navigation'

/**
 * VIVA Coach has merged into the unified conversational home at /viva.
 */
export default function VivaCoachRedirect() {
  redirect('/viva')
}
