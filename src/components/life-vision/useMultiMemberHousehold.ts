'use client'

import { useQuery } from '@tanstack/react-query'
import { keys } from '@/lib/query/keys'

interface HouseholdMemberBrief {
  userId: string
  firstName: string | null
  displayName: string
}

interface MultiMemberHousehold {
  householdName: string
  members: HouseholdMemberBrief[]
}

export function useMultiMemberHousehold() {
  return useQuery({
    queryKey: keys.householdMembers,
    queryFn: async (): Promise<MultiMemberHousehold | null> => {
      const res = await fetch('/api/household/context')
      if (!res.ok) return null
      const json = await res.json()
      const household = json.household
      if (!household?.isMultiMember) return null
      return {
        householdName: household.householdName as string,
        members: (household.members || []).map((member: HouseholdMemberBrief) => ({
          userId: member.userId,
          firstName: member.firstName ?? null,
          displayName: member.displayName,
        })),
      }
    },
    staleTime: 5 * 60_000,
  })
}

export function visionOwnerName(
  members: HouseholdMemberBrief[] | undefined,
  userId: string,
): string {
  const member = members?.find((item) => item.userId === userId)
  const name = (member?.firstName || member?.displayName || '').trim()
  return name || 'Shared'
}
