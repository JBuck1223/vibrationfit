import { redirect } from 'next/navigation'
import { MemberHome } from '@/components/app-shell/home/MemberHome'
import { BEGIN_HOME, resolveMemberHome } from '@/lib/life-activation/home'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Home | Vibration Fit' }

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Members stay in Getting Started until Life Activation onboarding is complete.
  if ((await resolveMemberHome(supabase, user.id)) === BEGIN_HOME) {
    redirect(BEGIN_HOME)
  }

  const { data: account } = await supabase
    .from('user_accounts')
    .select('first_name, timezone')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <MemberHome
      firstName={account?.first_name ?? null}
      timezone={account?.timezone ?? null}
    />
  )
}
