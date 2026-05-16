'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Card,
  Badge,
  Button,
  Spinner,
  Stack,
} from '@/lib/design-system/components'
import { History, AlertCircle } from 'lucide-react'

interface TokenTransaction {
  id: string
  action_type: string
  tokens_used: number
  tokens_remaining?: number
  created_at: string
  metadata: Record<string, unknown>
  source?: string
  amount_paid_cents?: number
  token_pack_id?: string
  calculated_cost_cents?: number
  input_tokens?: number
  output_tokens?: number
}

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

export default function TokensHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<TokenTransaction[]>([])
  const [fetchNonce, setFetchNonce] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/tokens')
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}))
          throw new Error(errBody.error || 'Failed to fetch token data')
        }
        const data = await response.json()
        setTransactions(data.transactions || [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [fetchNonce])

  if (loading) {
    return (
      <Container size="xl" className="pt-2 pb-6 sm:pb-8">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="xl" className="pt-2 pb-6 sm:pb-8">
        <Card variant="glass" className="border border-white/[0.06] p-6 text-center shadow-none">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-400/90" aria-hidden />
            <p className="text-sm text-neutral-300">{error}</p>
            <Button variant="primary" size="sm" onClick={() => setFetchNonce(n => n + 1)}>
              Try again
            </Button>
          </div>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        <h1 className="sr-only">Token history</h1>

        <Card variant="glass" className="border border-white/[0.06] p-4 shadow-none sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Activity</h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                Grants, purchases, and usage in one feed (most recent first, up to 50 items)
              </p>
            </div>
            <Badge variant="neutral" className="w-fit rounded-full px-2.5 py-0.5 text-[10px]">
              {transactions.length} shown
            </Badge>
          </div>

          {transactions.length === 0 ? (
            <div className="mt-8 py-6 text-center">
              <History className="mx-auto mb-3 h-10 w-10 text-neutral-600" aria-hidden />
              <p className="text-sm text-neutral-400">No activity yet</p>
              <p className="mt-1 text-xs text-neutral-500">Grants, purchases, and VIVA usage will show here.</p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-white/[0.06]">
              {transactions.map(tx => {
                const isGrant = ['admin_grant', 'subscription_grant', 'trial_grant', 'token_pack_purchase'].includes(
                  tx.action_type
                )
                const isDeduction = tx.action_type === 'admin_deduct'
                const label = ACTION_TYPE_LABELS[tx.action_type]?.label || tx.action_type.replace(/_/g, ' ')
                const colorClass = ACTION_TYPE_LABELS[tx.action_type]?.color || 'text-white'

                return (
                  <li
                    key={tx.id}
                    className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-medium ${colorClass}`}>{label}</span>
                        {tx.token_pack_id && (
                          <Badge variant="accent" className="rounded-full px-2 py-0 text-[10px]">
                            {tx.token_pack_id}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {new Date(tx.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {tx.input_tokens != null && tx.input_tokens > 0 && (
                          <span className="ml-2">In {tx.input_tokens.toLocaleString()}</span>
                        )}
                        {tx.output_tokens != null && tx.output_tokens > 0 && (
                          <span className="ml-2">Out {tx.output_tokens.toLocaleString()}</span>
                        )}
                      </p>
                      {typeof tx.metadata?.category === 'string' && (
                        <p className="mt-1 text-xs text-neutral-600">{tx.metadata.category}</p>
                      )}
                      {tx.amount_paid_cents != null && tx.amount_paid_cents > 0 && (
                        <p className="mt-1 text-xs text-neutral-500">
                          Paid ${(tx.amount_paid_cents / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div
                      className={`shrink-0 text-right text-sm font-semibold tabular-nums sm:pl-4 ${
                        isGrant ? 'text-[#39FF14]' : isDeduction ? 'text-red-400/90' : 'text-neutral-200'
                      }`}
                    >
                      <div>
                        {isGrant ? '+' : ''}
                        {formatCredits(Math.abs(tx.tokens_used), true)}
                      </div>
                      {tx.tokens_remaining != null && tx.tokens_remaining > 0 && (
                        <div className="text-[10px] font-normal text-neutral-500">
                          {formatCredits(tx.tokens_remaining, true)} after
                        </div>
                      )}
                      {tx.calculated_cost_cents != null && tx.calculated_cost_cents > 0 && (
                        <div className="text-[10px] font-normal text-neutral-500">
                          ${(tx.calculated_cost_cents / 100).toFixed(4)} est.
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </Stack>
    </Container>
  )
}
