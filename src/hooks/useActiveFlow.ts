'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ArrivalState, FlowContext, FlowSignal, FlowsResponse } from '@/lib/flows/types'

export const FLOWS_KEY = ['flows', 'active'] as const

async function call(method: 'POST' | 'PATCH', body: unknown): Promise<FlowsResponse> {
  const res = await fetch('/api/flows', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Could not update your flow')
  return res.json()
}

/** Tell the open flow that something happened (for actions saved straight from the browser). */
export function reportFlowSignal(signal: FlowSignal, artifactLink?: string | null) {
  void fetch('/api/flows', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'signal', signal, artifactLink: artifactLink ?? null }),
  })
    .then(() => window.dispatchEvent(new CustomEvent('vf:flow-refresh')))
    .catch(() => {})
}

/**
 * The member's open flow, a just-finished one, and today's check-in.
 * Refreshes when an action anywhere in the app might have moved the flow.
 */
export function useActiveFlow() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: FLOWS_KEY,
    queryFn: async (): Promise<FlowsResponse> => {
      const res = await fetch('/api/flows')
      if (!res.ok) return { run: null, justCompleted: null, todayCheckin: null }
      return res.json()
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  })

  const running = Boolean(query.data?.run)

  useEffect(() => {
    const refresh = () => void queryClient.invalidateQueries({ queryKey: FLOWS_KEY })
    window.addEventListener('map:occurrence-verified', refresh)
    window.addEventListener('vf:flow-refresh', refresh)
    // While a flow is open, catch steps finished by server-side actions (VIVA tools).
    const timer = running ? window.setInterval(refresh, 15_000) : undefined
    return () => {
      window.removeEventListener('map:occurrence-verified', refresh)
      window.removeEventListener('vf:flow-refresh', refresh)
      if (timer) window.clearInterval(timer)
    }
  }, [queryClient, running])

  const setData = (data: FlowsResponse) => queryClient.setQueryData(FLOWS_KEY, data)

  const checkIn = useMutation({
    mutationFn: (input: { state: ArrivalState; feeling?: string; flowId?: string; context?: FlowContext }) => call('POST', input),
    onSuccess: setData,
  })

  const update = useMutation({
    mutationFn: (input: {
      runId: string
      action: 'complete_step' | 'skip_step' | 'choose' | 'complete' | 'abandon' | 'seen'
      stepId?: string
      choice?: string
    }) => call('PATCH', input),
    onSuccess: setData,
  })

  return { ...query, checkIn, update }
}
