'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, Spinner, Button } from '@/lib/design-system/components'
import Link from 'next/link'
import { Zap, Users } from 'lucide-react'

interface TokenBalanceData {
  totalActive: number
  isInHousehold: boolean
  isAdmin: boolean
  householdName: string
  memberCount: number
}

export default function HouseholdTokenBalance() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TokenBalanceData | null>(null)

  useEffect(() => {
    loadTokenData()
  }, [])

  async function loadTokenData() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: balanceData } = await supabase
        .rpc('get_user_token_balance', { p_user_id: user.id })
        .single()

      const totalActive = (balanceData as any)?.total_active || 0
      const isHousehold = (balanceData as any)?.is_household_shared || false

      if (!isHousehold) {
        setData({
          totalActive,
          isInHousehold: false,
          isAdmin: false,
          householdName: '',
          memberCount: 1
        })
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('household_id')
        .eq('user_id', user.id)
        .single()

      let householdName = ''
      let isAdmin = false
      let memberCount = 1

      if (profile?.household_id) {
        const { data: household } = await supabase
          .from('households')
          .select('name, admin_user_id')
          .eq('id', profile.household_id)
          .single()

        householdName = household?.name || ''
        isAdmin = household?.admin_user_id === user.id

        const { count } = await supabase
          .from('household_members')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', profile.household_id)
          .eq('status', 'active')

        memberCount = count || 1
      }

      setData({
        totalActive,
        isInHousehold: true,
        isAdmin,
        householdName,
        memberCount
      })
    } catch (error) {
      console.error('Error loading token data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card variant="elevated">
        <div className="flex items-center justify-center py-8">
          <Spinner variant="primary" size="md" />
        </div>
      </Card>
    )
  }

  if (!data) return null

  const formatNumber = (num: number) => num.toLocaleString()

  if (!data.isInHousehold) {
    return (
      <Card variant="elevated" className="bg-black">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#BF00FF]/20 rounded-xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-[#BF00FF]" />
          </div>
          <h3 className="text-lg font-semibold mt-4">Your Creation Tokens</h3>
          <p className="text-3xl font-bold text-[#BF00FF] mt-4">
            {formatNumber(data.totalActive)}
          </p>
          <p className="text-sm text-neutral-400 mt-2">Creation Tokens available</p>
          <Button variant="accent" size="sm" asChild className="mt-6">
            <Link href="/dashboard/tokens">
              Token Dashboard
            </Link>
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="elevated" className="bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-2 border-primary-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{data.householdName || 'Household'}</h3>
          {data.isAdmin && <Badge variant="premium" className="text-xs">Admin</Badge>}
        </div>
        <div className="w-12 h-12 bg-[#BF00FF]/20 rounded-xl flex items-center justify-center">
          <Zap className="w-6 h-6 text-[#BF00FF]" />
        </div>
      </div>

      <p className="text-3xl font-bold text-[#BF00FF] mb-2">
        {formatNumber(data.totalActive)}
      </p>

      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <Users className="w-4 h-4" />
        <span>
          Shared pool ({data.memberCount} {data.memberCount === 1 ? 'member' : 'members'})
        </span>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <Button variant="accent" size="sm" asChild>
          <Link href="/dashboard/tokens">
            Token Dashboard
          </Link>
        </Button>
        {data.isAdmin && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/household/settings">
              Settings
            </Link>
          </Button>
        )}
      </div>
    </Card>
  )
}
