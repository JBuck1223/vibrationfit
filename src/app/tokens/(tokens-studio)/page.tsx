// /src/app/tokens/(tokens-studio)/page.tsx
// Token overview — minimal layout aligned with storage studio

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Container, Card, Badge, ProgressBar, Stack, Spinner } from '@/lib/design-system/components'
import { Zap } from 'lucide-react'

function formatCredits(credits: number, abbreviated = false): string {
  if (abbreviated) {
    if (credits >= 1_000_000) return `${(credits / 1_000_000).toFixed(1)}M`
    if (credits >= 1_000) return `${(credits / 1_000).toFixed(1)}K`
    return credits.toString()
  }
  return credits.toLocaleString()
}

const ACTION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  chat_conversation: { label: 'VIVA Conversation', color: 'text-[#00FFFF]' },
  vision_refinement: { label: 'Vision Refinement', color: 'text-[#39FF14]' },
  blueprint_generation: { label: 'Blueprint Generation', color: 'text-[#BF00FF]' },
  audio_generation: { label: 'Audio Generation', color: 'text-[#FFFF00]/90' },
  assessment_scoring: { label: 'Assessment Scoring', color: 'text-neutral-400' },
  image_generation: { label: 'Image Generation', color: 'text-[#BF00FF]/80' },
  vision_generation: { label: 'Vision Generation', color: 'text-[#39FF14]/80' },
  life_vision_category_summary: { label: 'Category Summary', color: 'text-[#39FF14]/80' },
  life_vision_master_assembly: { label: 'Master Assembly', color: 'text-[#39FF14]/80' },
  prompt_suggestions: { label: 'Prompt Suggestions', color: 'text-[#00FFFF]/80' },
  transcription: { label: 'Audio Transcription', color: 'text-[#FFFF00]/80' },
  frequency_flip: { label: 'Frequency Flip', color: 'text-[#00FFFF]/70' },
  admin_grant: { label: 'Admin Grant', color: 'text-[#39FF14]' },
  subscription_grant: { label: 'Subscription Grant', color: 'text-[#39FF14]' },
  trial_grant: { label: 'Trial Grant', color: 'text-[#39FF14]' },
  token_pack_purchase: { label: 'Token Pack Purchase', color: 'text-[#FFFF00]' },
  admin_deduct: { label: 'Admin Deduction', color: 'text-red-400' },
}

export default function TokensOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [stats, setStats] = useState<{
    totalUsed: number
    totalGranted: number
    actionBreakdown: Record<string, { count: number; tokens: number }>
  } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/tokens')
        if (!response.ok) throw new Error('Failed to load')
        const data = await response.json()
        setBalance(data.balance ?? 0)
        setStats({
          totalUsed: data.totalUsed ?? 0,
          totalGranted: data.totalGranted ?? 0,
          actionBreakdown: data.actionBreakdown || {},
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const granted = stats?.totalGranted ?? 0
  const used = stats?.totalUsed ?? 0
  /** Share of lifetime grants that have been consumed (green bar = used). */
  const usedOfGrantedPct =
    granted > 0 ? Math.min(100, Math.max(0, (used / granted) * 100)) : used > 0 ? 100 : 0

  const featureBreakdown = useMemo(() => {
    if (!stats?.actionBreakdown || Object.keys(stats.actionBreakdown).length === 0) return null
    const entries = Object.entries(stats.actionBreakdown).sort(([, a], [, b]) => b.tokens - a.tokens)
    const totalTokens = entries.reduce((sum, [, row]) => sum + row.tokens, 0)
    return { entries, totalTokens }
  }, [stats?.actionBreakdown])

  if (loading) {
    return (
      <Container size="xl" className="pt-2 pb-6 sm:pb-8">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        <h1 className="sr-only">Token overview</h1>

        <Card variant="glass" className="border border-white/[0.06] p-4 shadow-none sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">Balance</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-2xl font-semibold tabular-nums text-white sm:text-3xl">
                  {formatCredits(balance, true)}
                </span>
                <span className="text-sm text-neutral-500">available</span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {formatCredits(used, true)} used of {formatCredits(granted, true)} granted
              </p>
            </div>
            <Badge
              variant={usedOfGrantedPct > 80 && granted > 0 ? 'warning' : 'neutral'}
              className="shrink-0 self-start rounded-full px-3 py-1 text-xs font-medium"
            >
              {granted > 0 ? `${usedOfGrantedPct.toFixed(0)}% used` : 'No grants yet'}
            </Badge>
          </div>
          {granted > 0 && (
            <div className="mt-5">
              <ProgressBar
                value={usedOfGrantedPct}
                variant={usedOfGrantedPct > 80 ? 'warning' : 'primary'}
                showLabel={false}
              />
            </div>
          )}
        </Card>

        <Card variant="glass" className="border border-white/[0.06] p-4 shadow-none sm:p-5">
          <h2 className="text-sm font-semibold text-white">By feature</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Where credits have been spent</p>

          {featureBreakdown ? (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
              {featureBreakdown.entries.map(([action, row]) => {
                const pct = (row.tokens / (featureBreakdown.totalTokens || 1)) * 100
                return (
                  <div
                    key={action}
                    className="flex min-w-0 items-start gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3 sm:px-3.5"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                      <Zap className={`h-4 w-4 ${ACTION_TYPE_LABELS[action]?.color || 'text-neutral-400'}`} aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">
                        {ACTION_TYPE_LABELS[action]?.label || action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {row.count} {row.count === 1 ? 'call' : 'calls'}
                      </p>
                      <p className="mt-2 text-sm font-semibold tabular-nums text-neutral-200">
                        {formatCredits(row.tokens, true)}
                        <span className="ml-2 text-xs font-normal text-neutral-500">{pct.toFixed(0)}%</span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 py-10 text-center">
              <Zap className="mx-auto mb-3 h-10 w-10 text-neutral-600" aria-hidden />
              <p className="text-sm text-neutral-400">No usage breakdown yet</p>
              <p className="mt-1 text-xs text-neutral-500">Activity will appear after you use VIVA and other features.</p>
            </div>
          )}
        </Card>

        <Card variant="glass" className="border border-white/[0.06] p-4 shadow-none sm:p-5">
          <h2 className="text-sm font-semibold text-white">Notes</h2>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-neutral-500">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#39FF14]/70" aria-hidden />
              Full activity (grants, purchases, and usage) lives under History.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#00FFFF]/70" aria-hidden />
              Numbers reflect successful usage; failed calls may not deduct credits.
            </li>
          </ul>
        </Card>
      </Stack>
    </Container>
  )
}
