import { redirect } from 'next/navigation'
import { CaptureHome } from '@/components/app-shell/capture/CaptureHome'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Capture | Vibration Fit' }

export default async function CapturePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: account } = await supabase.from('user_accounts').select('timezone').eq('id', user.id).maybeSingle()
  return <CaptureHome timezone={account?.timezone ?? null} />
}
