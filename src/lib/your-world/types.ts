/**
 * Your World — the facts the Life Vision writing cannot collect.
 *
 * A snapshot is one full version. The active version is copied into
 * member_roster (and the address into user_accounts), so every tool reads one
 * current row and never has to understand versions.
 */

import type { RosterChild, RosterMoney, RosterPartner, RosterPet, RosterWork } from '@/lib/roster/types'

export interface WorldAddress {
  line1?: string
  line2?: string
  city?: string
  region?: string
  postal_code?: string
  country?: string
}

export interface YourWorldSnapshot {
  /** How to say the member's own first name. */
  say_as?: string
  gender?: string
  ethnicity?: string
  partner: RosterPartner
  children: RosterChild[]
  pets: RosterPet[]
  social_preference?: string
  hobbies: string[]
  address: WorldAddress
  living_situation?: string
  time_at_location?: string
  work: RosterWork
  money: RosterMoney
}

export type WorldVersionSource = 'member' | 'getting_started' | 'viva' | 'profile_port'

export interface WorldVersion {
  id: string
  user_id: string
  version_number: number
  is_draft: boolean
  is_active: boolean
  parent_id: string | null
  snapshot: YourWorldSnapshot
  version_notes: string | null
  source: WorldVersionSource
  created_at: string
  updated_at: string
  committed_at: string | null
}

export interface YourWorldState {
  active: WorldVersion | null
  draft: WorldVersion | null
  versions: WorldVersion[]
  /** What the editor starts from when there is no version yet. */
  seed: YourWorldSnapshot
}
