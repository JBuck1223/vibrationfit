// Reusable household context for collaborative features.
//
// This is the shared building block for the "household lens" across the app:
// given a user, it returns their household, the active members, and a quick
// lookup map for attributing shared content (who created what) with display
// names and avatars. Used by API routes and server components so that Vision
// Boards, Life Visions, and the Household hub all attribute content the same way.

import { getUserHousehold, getHouseholdWithMembers } from '@/lib/supabase/household'

export interface HouseholdMemberSummary {
  userId: string
  role: 'admin' | 'member'
  firstName: string | null
  lastName: string | null
  displayName: string
  email: string | null
  avatarUrl: string | null
  isAdmin: boolean
  isSelf: boolean
}

export interface HouseholdContext {
  householdId: string
  householdName: string
  planType: 'solo' | 'household'
  /** true when the household has more than one active member (a real collaboration) */
  isMultiMember: boolean
  /** true when the requesting user is the household admin */
  isAdmin: boolean
  sharedTokensEnabled: boolean
  members: HouseholdMemberSummary[]
  /** userId -> member summary, for attributing shared content */
  memberMap: Record<string, HouseholdMemberSummary>
}

function buildDisplayName(
  firstName: string | null,
  lastName: string | null,
  email: string | null
): string {
  const first = (firstName || '').trim()
  const last = (lastName || '').trim()
  if (first && last) return `${first} ${last.charAt(0).toUpperCase()}.`
  if (first) return first
  if (email) return email.split('@')[0]
  return 'Member'
}

/**
 * Resolve the requesting user's household context, including active members
 * with display names and avatars. Returns null if the user has no household
 * (should be rare — every account gets a solo household via DB trigger).
 *
 * Uses the service-role-backed helpers internally to avoid household_members
 * RLS recursion, so this MUST only be called server-side after authenticating
 * the user.
 */
export async function getHouseholdContext(
  userId: string
): Promise<HouseholdContext | null> {
  const household = await getUserHousehold(userId)
  if (!household) return null

  const detail = await getHouseholdWithMembers(household.id)
  if (!detail) return null

  const members: HouseholdMemberSummary[] = detail.members.map((m) => {
    const profile = m.profile || {}
    const firstName = profile.first_name ?? null
    const lastName = profile.last_name ?? null
    const email = profile.email ?? null
    return {
      userId: m.user_id,
      role: m.role,
      firstName,
      lastName,
      displayName: buildDisplayName(firstName, lastName, email),
      email,
      avatarUrl: profile.profile_picture_url ?? null,
      isAdmin: m.role === 'admin',
      isSelf: m.user_id === userId,
    }
  })

  const memberMap: Record<string, HouseholdMemberSummary> = {}
  for (const member of members) {
    memberMap[member.userId] = member
  }

  const isAdmin = members.some((m) => m.isSelf && m.isAdmin)

  return {
    householdId: household.id,
    householdName: household.name,
    planType: household.plan_type,
    isMultiMember: members.length > 1,
    isAdmin,
    sharedTokensEnabled: household.shared_tokens_enabled,
    members,
    memberMap,
  }
}
