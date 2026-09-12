'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query/keys'
import type { MemberRoster, RosterUpdate } from '@/lib/roster/types'

async function fetchRoster(): Promise<MemberRoster | null> {
  const res = await fetch('/api/roster')
  if (!res.ok) throw new Error('Failed to load roster')
  const json = await res.json()
  return json.roster || null
}

async function patchRoster(body: { roster: RosterUpdate; confirm?: boolean }): Promise<MemberRoster> {
  const res = await fetch('/api/roster', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to save roster')
  const json = await res.json()
  return json.roster
}

export function useMemberRoster() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: keys.memberRoster,
    queryFn: fetchRoster,
    retry: 1,
  })

  const mutation = useMutation({
    mutationFn: patchRoster,
    onSuccess: (roster) => {
      queryClient.setQueryData(keys.memberRoster, roster)
    },
  })

  return {
    roster: query.data ?? null,
    isLoading: query.isLoading,
    saveRoster: (roster: RosterUpdate, confirm?: boolean) =>
      mutation.mutateAsync({ roster, confirm }),
    isSaving: mutation.isPending,
  }
}
