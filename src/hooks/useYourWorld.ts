'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query/keys'
import type { WorldIdentity } from '@/lib/your-world/identity'
import type { WorldVersion, YourWorldSnapshot, YourWorldState } from '@/lib/your-world/types'

export interface YourWorldResponse extends YourWorldState {
  identity: WorldIdentity
  firstName: string
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error || 'Something went wrong')
  return body as T
}

export function useYourWorld() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: keys.yourWorld })

  const query = useQuery({
    queryKey: keys.yourWorld,
    queryFn: () => call<YourWorldResponse>('/api/your-world'),
  })

  const saveVersion = useMutation({
    mutationFn: (input: { snapshot: YourWorldSnapshot; identity?: WorldIdentity; source?: 'getting_started' | 'member' }) =>
      call<{ version: WorldVersion; changed: boolean }>('/api/your-world', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  })

  const startDraft = useMutation({
    mutationFn: () => call<{ draft: WorldVersion }>('/api/your-world/draft', { method: 'POST' }),
    onSuccess: invalidate,
  })

  const saveDraft = useMutation({
    mutationFn: (input: { id: string; snapshot: YourWorldSnapshot }) =>
      call<{ draft: WorldVersion }>('/api/your-world/draft', { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: invalidate,
  })

  const discardDraft = useMutation({
    mutationFn: (id: string) =>
      call<{ ok: boolean }>(`/api/your-world/draft?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })

  const commitDraft = useMutation({
    mutationFn: (input: { id: string; notes?: string; identity?: WorldIdentity }) =>
      call<{ version: WorldVersion }>('/api/your-world/draft/commit', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  })

  const activate = useMutation({
    mutationFn: (id: string) =>
      call<{ version: WorldVersion }>(`/api/your-world/versions/${id}/activate`, { method: 'POST' }),
    onSuccess: invalidate,
  })

  return { ...query, saveVersion, startDraft, saveDraft, discardDraft, commitDraft, activate }
}
