/**
 * Suggested unlock scores and the write-ups that explain them.
 * Shared by /begin/unlock. The intensive unlock page keeps its own copy of this logic.
 */

export interface UnlockStats {
  visions_count: number
  visions_active: number
  visions_draft: number
  audio_sets_count: number
  audio_tracks_count: number
  manifestations_count: number
  vision_board_images_count: number
  journal_entries_count: number
  profile_versions_count: number
  vibe_posts_count: number
  vibe_tribe_engaged: boolean
  map_activated: boolean
  map_all_pillars_active: boolean
  map_pillar_active: {
    activations: boolean
    creations: boolean
    connections: boolean
    sessions: boolean
  }
  alignment_gym_toured: boolean
  alignment_gym_schedule_label: string
}

export interface UnlockActivity {
  label: string
  value: string | number
}

const PILLARS = [
  ['activations', 'Activations'],
  ['creations', 'Creations'],
  ['connections', 'Connections'],
  ['sessions', 'Sessions'],
] as const

function countPhrase(count: number, singular: string, pluralForm?: string) {
  return `${count} ${count === 1 ? singular : pluralForm ?? `${singular}s`}`
}

function joinList(items: string[]) {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function num(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function normalizeUnlockStats(value: unknown): UnlockStats | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const pillars =
    raw.map_pillar_active && typeof raw.map_pillar_active === 'object'
      ? (raw.map_pillar_active as Record<string, unknown>)
      : {}

  return {
    visions_count: num(raw.visions_count),
    visions_active: num(raw.visions_active),
    visions_draft: num(raw.visions_draft),
    audio_sets_count: num(raw.audio_sets_count),
    audio_tracks_count: num(raw.audio_tracks_count),
    manifestations_count: num(raw.manifestations_count),
    vision_board_images_count: num(raw.vision_board_images_count),
    journal_entries_count: num(raw.journal_entries_count),
    profile_versions_count: num(raw.profile_versions_count),
    vibe_posts_count: num(raw.vibe_posts_count),
    vibe_tribe_engaged: Boolean(raw.vibe_tribe_engaged),
    map_activated: Boolean(raw.map_activated),
    map_all_pillars_active: Boolean(raw.map_all_pillars_active),
    map_pillar_active: {
      activations: Boolean(pillars.activations),
      creations: Boolean(pillars.creations),
      connections: Boolean(pillars.connections),
      sessions: Boolean(pillars.sessions),
    },
    alignment_gym_toured: Boolean(raw.alignment_gym_toured),
    alignment_gym_schedule_label:
      typeof raw.alignment_gym_schedule_label === 'string' ? raw.alignment_gym_schedule_label : '',
  }
}

export function emptyUnlockStats(): UnlockStats {
  return {
    visions_count: 0,
    visions_active: 0,
    visions_draft: 0,
    audio_sets_count: 0,
    audio_tracks_count: 0,
    manifestations_count: 0,
    vision_board_images_count: 0,
    journal_entries_count: 0,
    profile_versions_count: 0,
    vibe_posts_count: 0,
    vibe_tribe_engaged: false,
    map_activated: false,
    map_all_pillars_active: false,
    map_pillar_active: {
      activations: false,
      creations: false,
      connections: false,
      sessions: false,
    },
    alignment_gym_toured: false,
    alignment_gym_schedule_label: '',
  }
}

/** Scores we can defend from what is already on the account. Unset questions stay blank. */
export function suggestUnlockAnswers(stats: UnlockStats): Record<string, string | number> {
  const data: Record<string, string | number> = {}

  if (stats.visions_count > 0) data.vision_clarity = 10
  if (stats.visions_active > 0) {
    data.vibrational_harmony = 10
    data.vision_iteration_ease = 10
  }
  if (stats.vibe_posts_count > 0 && stats.vibe_tribe_engaged) {
    data.vibrational_constraints_clarity = 10
  }
  if (stats.audio_sets_count > 0) {
    data.has_audio_tracks = 'yes'
    data.audio_iteration_ease = 10
  }
  if (stats.manifestations_count > 0) {
    data.has_vision_board = 'yes_both'
    data.vision_board_management = 10
  }
  if (
    stats.journal_entries_count > 0 ||
    stats.profile_versions_count > 0 ||
    stats.visions_count > 0 ||
    stats.manifestations_count > 0 ||
    (stats.vibe_posts_count > 0 && stats.vibe_tribe_engaged)
  ) {
    data.journey_capturing = 10
  }
  if (stats.map_all_pillars_active) data.roadmap_clarity = 10
  if (stats.alignment_gym_toured || stats.map_activated) data.transformation_tracking = 10

  return data
}

export function unlockScoreWriteup(
  questionId: string,
  stats: UnlockStats,
  value: string | number | null | undefined,
): string | null {
  if (questionId === 'has_vision_board' && value === 'yes_both' && stats.manifestations_count > 0) {
    return 'Our choice for you is Yes, both physical and digital, because you have a digital board and access to a downloadable PDF.'
  }

  if (questionId === 'has_audio_tracks' && value === 'yes' && stats.audio_sets_count > 0) {
    return `Our score for you is "Yes", as you have ${countPhrase(stats.audio_sets_count, 'audio set')} with ${countPhrase(stats.audio_tracks_count, 'track')}.`
  }

  if (value !== 10) return null

  switch (questionId) {
    case 'vision_clarity':
      return stats.visions_count > 0
        ? 'Our score for you is 10/10, as you have created a Life Vision.'
        : null
    case 'vibrational_harmony':
      return stats.visions_active > 0
        ? `Our score for you is 10/10, as you have ${countPhrase(stats.visions_count, 'vision')}, ${countPhrase(stats.audio_sets_count, 'audio set')}, and ${countPhrase(stats.manifestations_count, 'vision board item')}.`
        : null
    case 'vibrational_constraints_clarity':
      return stats.vibe_posts_count > 0 && stats.vibe_tribe_engaged
        ? 'Our score for you is 10/10, as you have posted in and engaged with the Vibe Tribe.'
        : null
    case 'vision_iteration_ease':
      return stats.visions_active > 0
        ? 'Our score for you is 10/10, as you can easily create and edit new versions of your active Life Vision.'
        : null
    case 'audio_iteration_ease':
      return stats.audio_sets_count > 0
        ? `Our score for you is 10/10, as you have created ${countPhrase(stats.audio_sets_count, 'audio set')} with ${countPhrase(stats.audio_tracks_count, 'track')} with new generations ready at the click of a button.`
        : null
    case 'vision_board_management':
      return stats.manifestations_count > 0
        ? `Our score for you is 10/10, as you have ${countPhrase(stats.manifestations_count, 'item')} on your vision board with easy management and downloads.`
        : null
    case 'journey_capturing': {
      const profiles = stats.profile_versions_count
      const visions = stats.visions_count
      const boardItems = stats.manifestations_count
      const journals = stats.journal_entries_count
      const hasEvidence =
        profiles > 0 || visions > 0 || boardItems > 0 || journals > 0 || stats.vibe_posts_count > 0
      if (!hasEvidence) return null
      return `Our score for you is 10/10, as you have ${countPhrase(profiles, 'profile version')}, ${countPhrase(visions, 'life vision')}, ${countPhrase(boardItems, 'vision board item')}, ${journals} journal entr${journals === 1 ? 'y' : 'ies'}, and Vibe Tribe activity on your account - each easy to create new versions or add new entries.`
    }
    case 'roadmap_clarity':
      return stats.map_all_pillars_active
        ? 'Our score for you is 10/10, because you have an active MAP (My Alignment Plan) with commitments in each of the four categories: Activations, Creations, Connections, & Sessions.'
        : null
    case 'transformation_tracking':
      return stats.alignment_gym_toured || stats.map_activated
        ? 'Our score for you is 10/10, because you completed the Alignment Gym tour, have an Alignment Gym commitment on your MAP, and have access to all session replays.'
        : null
    default:
      return null
  }
}

export function unlockActivities(questionId: string, stats: UnlockStats): UnlockActivity[] {
  switch (questionId) {
    case 'vision_clarity': {
      const items: UnlockActivity[] = [{ label: 'Visions Created', value: stats.visions_count }]
      if (stats.visions_draft > 0) items.push({ label: 'In Draft', value: stats.visions_draft })
      return items
    }
    case 'vibrational_harmony':
      return [
        { label: 'Visions', value: stats.visions_count },
        { label: 'Audio Sets', value: stats.audio_sets_count },
        { label: 'Board Items', value: stats.manifestations_count },
      ]
    case 'vision_iteration_ease':
      return [{ label: 'Active Life Vision', value: stats.visions_active > 0 ? 'Yes' : 'No' }]
    case 'has_audio_tracks':
    case 'audio_iteration_ease':
      return [
        { label: 'Audio Sets', value: stats.audio_sets_count },
        { label: 'Tracks', value: stats.audio_tracks_count },
      ]
    case 'has_vision_board':
    case 'vision_board_management':
      return [
        { label: 'Board Items', value: stats.manifestations_count },
        { label: 'With Images', value: stats.vision_board_images_count },
      ]
    case 'vibrational_constraints_clarity':
      return [
        { label: 'Vibe Tribe Posts', value: stats.vibe_posts_count },
        { label: 'Engaged', value: stats.vibe_tribe_engaged ? 'Yes' : 'No' },
      ]
    case 'journey_capturing':
      return [
        { label: 'Profile Versions', value: stats.profile_versions_count },
        { label: 'Life Visions', value: stats.visions_count },
        { label: 'Vision Board Items', value: stats.manifestations_count },
        { label: 'Journal Entries', value: stats.journal_entries_count },
        { label: 'Vibe Tribe Posts', value: stats.vibe_posts_count },
        { label: 'Vibe Tribe Engaged', value: stats.vibe_tribe_engaged ? 'Yes' : 'No' },
      ]
    case 'transformation_tracking':
      return stats.alignment_gym_schedule_label
        ? [{ label: 'Alignment Gym', value: stats.alignment_gym_schedule_label }]
        : []
    case 'roadmap_clarity':
      return PILLARS.map(([key, label]) => ({
        label,
        value: stats.map_pillar_active[key] ? 'Yes' : 'No',
      }))
    default:
      return []
  }
}

export function unlockAccomplishmentWriteup(stats: UnlockStats): string {
  const created: string[] = []
  if (stats.visions_count > 0) {
    created.push(stats.visions_active > 0 ? 'an active Life Vision' : 'a Life Vision')
  }
  if (stats.profile_versions_count > 0) {
    created.push(countPhrase(stats.profile_versions_count, 'profile version'))
  }
  if (stats.audio_sets_count > 0) {
    created.push(
      `${countPhrase(stats.audio_sets_count, 'audio set')} with ${countPhrase(stats.audio_tracks_count, 'track')}`,
    )
  }
  if (stats.manifestations_count > 0) {
    created.push(countPhrase(stats.manifestations_count, 'vision board item'))
  }
  if (stats.journal_entries_count > 0) {
    created.push(countPhrase(stats.journal_entries_count, 'journal entry', 'journal entries'))
  }

  const showedUp: string[] = []
  if (stats.vibe_posts_count > 0 && stats.vibe_tribe_engaged) {
    showedUp.push('posted in and engaged with Vibe Tribe')
  } else if (stats.vibe_posts_count > 0) {
    showedUp.push('posted in Vibe Tribe')
  }
  if (stats.alignment_gym_toured) showedUp.push('finished the Alignment Gym tour')
  if (stats.map_all_pillars_active) {
    showedUp.push('activated MAP with commitments in each area')
  } else if (stats.map_activated) {
    showedUp.push('activated MAP')
  }

  const sentences: string[] = []
  if (created.length) sentences.push(`You created ${joinList(created)}.`)
  if (showedUp.length) sentences.push(`You ${joinList(showedUp)}.`)
  if (!sentences.length) {
    return 'There is not enough on your account yet to suggest a score. Answer from today.'
  }
  sentences.push('The scores below are our read of that work. Change any number that does not feel true.')
  return sentences.join(' ')
}
