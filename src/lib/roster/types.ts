/**
 * Get to Know You — member_roster + member_persona types.
 *
 * member_roster answers: "What is objectively true about my world?"
 * (people, dates, place, vocation, losses — confirm-card editable).
 *
 * member_persona answers: "What helps VIVA understand me?"
 * (identity, values, season, desires, how to be supported — a living
 * understanding with no completion concept and no confirmation UI).
 *
 * Partial dates are strings: "2018-06-12", "2018-06", or "2018".
 */

// ---------------------------------------------------------------------------
// Roster (WORLD facts)
// ---------------------------------------------------------------------------

export interface RosterPartner {
  name?: string
  birthday?: string
  married_on?: string
}

export interface RosterChild {
  name?: string
  birthday?: string
}

export interface RosterPet {
  name?: string
  kind?: string
  age?: string
}

export interface RosterPerson {
  name?: string
  /** e.g. "mom", "brother", "best friend", "business partner" */
  role?: string
  birthday?: string
  deceased?: boolean
}

export interface RosterPlace {
  city?: string
  region?: string
}

export interface RosterNamedThing {
  /** e.g. "Second Wind" */
  name?: string
  /** e.g. "their sailboat" */
  what?: string
}

export interface RosterTenderGround {
  /** who or what was lost / is tender */
  who?: string
  /** VIVA's one-line handle-with-care note, in neutral factual language */
  note?: string
  /** only if the member offered it */
  date?: string
}

export interface RosterDayThatMatters {
  date?: string
  what?: string
  weight?: 'celebrate' | 'gentle'
}

export interface MemberRoster {
  id: string
  user_id: string
  partner: RosterPartner | null
  children: RosterChild[]
  pets: RosterPet[]
  people: RosterPerson[]
  place: RosterPlace | null
  named_things: RosterNamedThing[]
  tender_ground: RosterTenderGround[]
  days_that_matter: RosterDayThatMatters[]
  vocation: string | null
  /** Only when explicitly stated or supplied elsewhere — never inferred. */
  pronouns: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
}

/** Everything the extractor / confirm card can write. */
export type RosterUpdate = Partial<
  Pick<
    MemberRoster,
    | 'partner'
    | 'children'
    | 'pets'
    | 'people'
    | 'place'
    | 'named_things'
    | 'tender_ground'
    | 'days_that_matter'
    | 'vocation'
    | 'pronouns'
  >
>

// ---------------------------------------------------------------------------
// Persona (living understanding) — every item carries provenance
// ---------------------------------------------------------------------------

export type PersonaSource = 'stated' | 'inferred'

/**
 * stated = the member said it. inferred = VIVA's working hypothesis, with
 * `evidence` holding short quotes/paraphrases that support it. Downstream
 * prompts treat stated as known and inferred as hypothesis — VIVA never
 * asserts an inferred belief to the member.
 */
export interface PersonaItem {
  value: string
  source: PersonaSource
  evidence?: string[]
}

export interface PersonaSelf {
  /** words they use about themselves ("builder", "the steady one") */
  identity_language?: PersonaItem[]
  core_values?: PersonaItem[]
  joy_sources?: PersonaItem[]
  hobbies?: PersonaItem[]
  strengths?: PersonaItem[]
  important_roles?: PersonaItem[]
  what_matters_most?: PersonaItem[]
  feels_most_like_me?: PersonaItem[]
  non_negotiables?: PersonaItem[]
  /** plural, accumulating — "moving every few years taught me to make friends fast" */
  formative_stories?: PersonaItem[]
}

export interface PersonaSeason {
  season_name?: PersonaItem
  what_is_working?: PersonaItem[]
  current_tensions?: PersonaItem[]
  ready_for_more?: PersonaItem[]
  ready_to_release?: PersonaItem[]
}

export interface PersonaDesire {
  deferred_dreams?: PersonaItem[]
  secret_wants?: PersonaItem[]
  desired_experiences?: PersonaItem[]
  /** who they are in the life they want — the becoming */
  desired_identity?: PersonaItem[]
  freedom_means?: PersonaItem
  enough_means?: PersonaItem
  success_means?: PersonaItem
}

export interface PersonaRelating {
  coaching_style?: PersonaItem
  challenge_level?: PersonaItem
  processing_style?: PersonaItem
  support_preferences?: PersonaItem[]
  /** how they think life works — discovered, never asked as a field */
  meaning_frame?: PersonaItem
  preferred_spiritual_language?: PersonaItem[]
  language_to_avoid?: PersonaItem[]
}

export interface MemberPersona {
  id: string
  user_id: string
  self: PersonaSelf
  season: PersonaSeason
  desire: PersonaDesire
  relating: PersonaRelating
  created_at: string
  updated_at: string
}

export interface PersonaUpdate {
  self?: PersonaSelf
  season?: PersonaSeason
  desire?: PersonaDesire
  relating?: PersonaRelating
}
