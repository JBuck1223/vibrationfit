'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, Spinner, Button } from '@/lib/design-system/components'
import Link from 'next/link'
import { Zap } from 'lucide-react'

interface TokenBalanceData {
  individualBalance: number
  householdTotalBalance: number
  isInHousehold: boolean
  isAdmin: boolean
  sharedTokensEnabled: boolean
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

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get individual token balance
      const { data: balanceData } = await supabase
        .rpc('get_user_token_balance', { p_user_id: user.id })
        .single()

      const individualBalance = (balanceData as any)?.total_active || 0

      // Get household info from user_accounts
      const { data: accountData } = await supabase
        .from('user_accounts')
        .select(`
          household_id,
          households!user_accounts_household_id_fkey(
            id,
            name,
            admin_user_id,
            shared_tokens_enabled
          )
        `)
        .eq('id', user.id)
        .single()

      if (!accountData?.household_id) {
        // Not in a household - show individual balance only
        setData({
          individualBalance,
          householdTotalBalance: individualBalance,
          isInHousehold: false,
          isAdmin: false,
          sharedTokensEnabled: false,
          householdName: '',
          memberCount: 1
        })
        return
      }

      const household = (accountData as any).households
      const isAdmin = household.admin_user_id === user.id

      // Get household token summary from view
      const { data: summaryData } = await supabase
        .from('household_token_summary')
        .select('household_tokens_remaining, member_count')
        .eq('household_id', accountData.household_id)
        .single()

      setData({
        individualBalance,
        householdTotalBalance: summaryData?.household_tokens_remaining || individualBalance,
        isInHousehold: true,
        isAdmin,
        sharedTokensEnabled: household.shared_tokens_enabled,
        householdName: household.household_name,
        memberCount: summaryData?.member_count || 1
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

  const { 
    individualBalance, 
    householdTotalBalance, 
    isInHousehold, 
    isAdmin, 
    sharedTokensEnabled,
    householdName,
    memberCount
  } = data

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  if (!isInHousehold) {
    // Solo account - show individual balance only
    return (
      <Card variant="elevated" className="bg-black">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#BF00FF]/20 rounded-xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-[#BF00FF]" />
          </div>
          <h3 className="text-lg font-semibold mt-4">Your Creation Tokens</h3>
          <p className="text-3xl font-bold text-[#BF00FF] mt-4">
            {formatNumber(individualBalance)}
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

  // Household account - show more details
  return (
    <div className="space-y-4">
      {/* Individual Balance Card */}
      <Card variant="elevated" className="bg-black">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Your Credits</h3>
            <Badge variant="info" className="text-xs">Individual</Badge>
          </div>
          <div className="w-12 h-12 bg-[#BF00FF]/20 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#BF00FF]" />
          </div>
        </div>
        
        <p className="text-3xl font-bold text-[#BF00FF] mb-2">
          {formatNumber(individualBalance)}
        </p>
        
        <p className="text-sm text-neutral-400">
          Your personal Creation Credits
        </p>
      </Card>

      {/* Household Total Card */}
      <Card variant="elevated" className="bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-2 border-primary-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{householdName}</h3>
            {isAdmin && <Badge variant="premium" className="text-xs">Admin</Badge>}
          </div>
          <div className="text-3xl">👥</div>
        </div>
        
        <p className="text-3xl font-bold text-[#BF00FF] mb-2">
          {formatNumber(householdTotalBalance)}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-400">
            Total household tokens ({memberCount} {memberCount === 1 ? 'member' : 'members'})
          </span>
          
          {sharedTokensEnabled && (
            <Badge variant="success" className="text-xs">
              Sharing Enabled
            </Badge>
          )}
        </div>

        {sharedTokensEnabled && !isAdmin && (
          <div className="mt-4 p-3 bg-primary-500/10 rounded-lg">
            <p className="text-xs text-neutral-300">
              💡 When you run out of tokens, you can use the household pool
            </p>
          </div>
        )}

        {sharedTokensEnabled && isAdmin && (
          <div className="mt-4 p-3 bg-primary-500/10 rounded-lg">
            <p className="text-xs text-neutral-300">
              💡 Members can use your credits when they run out
            </p>
          </div>
        )}

        {!sharedTokensEnabled && isAdmin && (
          <div className="mt-4 p-3 bg-neutral-600/20 rounded-lg">
            <p className="text-xs text-neutral-400">
              Shared tokens disabled. 
              <Link href="/household/settings" className="text-primary-500 hover:underline ml-1">
                Enable in settings
              </Link>
            </p>
          </div>
        )}

        {!sharedTokensEnabled && !isAdmin && (
          <div className="mt-4 p-3 bg-neutral-600/20 rounded-lg">
            <p className="text-xs text-neutral-400">
              Shared tokens are currently disabled
            </p>
          </div>
        )}
      </Card>

      {/* Settings Link */}
      <Link href="/household/settings">
        <Card variant="outlined" className="hover:-translate-y-1 transition-transform cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Household Settings</h4>
              <p className="text-sm text-neutral-400">
                Manage members and settings
              </p>
            </div>
            <span className="text-2xl">⚙️</span>
          </div>
        </Card>
      </Link>
    </div>
  )
}

