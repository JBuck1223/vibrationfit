import assert from 'node:assert/strict'
import test from 'node:test'
import {
  emptyUnlockStats,
  suggestUnlockAnswers,
  unlockAccomplishmentWriteup,
  unlockScoreWriteup,
  type UnlockStats,
} from './unlock-scoring'

function finished(): UnlockStats {
  return {
    ...emptyUnlockStats(),
    visions_count: 1,
    visions_active: 1,
    audio_sets_count: 1,
    audio_tracks_count: 12,
    manifestations_count: 4,
    vision_board_images_count: 4,
    profile_versions_count: 1,
    vibe_posts_count: 1,
    vibe_tribe_engaged: true,
    map_activated: true,
    map_all_pillars_active: true,
    map_pillar_active: {
      activations: true,
      creations: true,
      connections: true,
      sessions: true,
    },
    alignment_gym_toured: true,
    alignment_gym_schedule_label: 'Committed to 1 live group coaching session per week',
  }
}

test('suggests a 10 for each piece of finished work', () => {
  const answers = suggestUnlockAnswers(finished())
  assert.equal(answers.vision_clarity, 10)
  assert.equal(answers.vibrational_harmony, 10)
  assert.equal(answers.vision_iteration_ease, 10)
  assert.equal(answers.has_audio_tracks, 'yes')
  assert.equal(answers.audio_iteration_ease, 10)
  assert.equal(answers.has_vision_board, 'yes_both')
  assert.equal(answers.vision_board_management, 10)
  assert.equal(answers.journey_capturing, 10)
  assert.equal(answers.vibrational_constraints_clarity, 10)
  assert.equal(answers.roadmap_clarity, 10)
  assert.equal(answers.transformation_tracking, 10)
})

test('leaves a score blank when that work is missing', () => {
  const answers = suggestUnlockAnswers(emptyUnlockStats())
  assert.deepEqual(answers, {})
})

test('write-up names the Life Vision, audio, board, tribe, gym, and MAP', () => {
  const stats = finished()
  assert.match(
    unlockScoreWriteup('vision_clarity', stats, 10) ?? '',
    /created a Life Vision/,
  )
  assert.match(
    unlockScoreWriteup('audio_iteration_ease', stats, 10) ?? '',
    /1 audio set with 12 tracks/,
  )
  assert.match(
    unlockScoreWriteup('roadmap_clarity', stats, 10) ?? '',
    /Activations, Creations, Connections, & Sessions/,
  )
  assert.equal(unlockScoreWriteup('vision_clarity', stats, 7), null)

  const summary = unlockAccomplishmentWriteup(stats)
  assert.match(summary, /active Life Vision/)
  assert.match(summary, /posted in and engaged with Vibe Tribe/)
  assert.match(summary, /Alignment Gym tour/)
  assert.match(summary, /activated MAP/)
})
