import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Container, Spinner } from '@/lib/design-system/components'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import { BEGIN_HOME, resolveMemberHome } from '@/lib/life-activation/home'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Members stay in Getting Started until Life Activation onboarding is complete
  if ((await resolveMemberHome(supabase, user.id)) === BEGIN_HOME) {
    redirect(BEGIN_HOME)
  }

  const [{ data: account }, annualUpgradeOffer] = await Promise.all([
    supabase.from('user_accounts').select('first_name, timezone').eq('id', user.id).maybeSingle(),
    resolveAnnualUpgradeOffer(supabase, user.id),
  ])

  return (
    <Suspense
      fallback={
        <Container size="xl">
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </Container>
      }
    >
      <DashboardHome
        server={{
          userId: user.id,
          userEmail: user.email ?? null,
          firstName: account?.first_name ?? null,
          userTimezone: account?.timezone ?? null,
        }}
        annualUpgradeOffer={annualUpgradeOffer}
      />
    </Suspense>
  )
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>

/** Annual upgrade offer: days 21-25 of the first 28-day Vision Pro cycle. */
async function resolveAnnualUpgradeOffer(
  supabase: SupabaseServer,
  userId: string,
): Promise<{ planType: 'solo' | 'household'; trialEnd: string | null } | null> {
  try {
    const { data: sub } = await supabase
      .from('customer_subscriptions')
      .select('status, trial_start, trial_end, created_at, cancel_at_period_end, membership_tiers!inner(tier_type, is_household_plan)')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!sub || sub.cancel_at_period_end) return null
    const tier = sub.membership_tiers as unknown as { tier_type: string; is_household_plan: boolean }
    const is28DayTier = tier?.tier_type === 'vision_pro_28day' || tier?.tier_type === 'vision_pro_household_28day'
    if (!is28DayTier) return null

    const anchor = sub.trial_start || sub.created_at
    const dayNumber = Math.floor((Date.now() - new Date(anchor).getTime()) / 86400000) + 1
    if (dayNumber < 21 || dayNumber > 25) return null

    return { planType: tier.is_household_plan ? 'household' : 'solo', trialEnd: sub.trial_end }
  } catch (e) {
    console.error('Error computing annual upgrade offer:', e)
    return null
  }
}
