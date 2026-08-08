import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildInterpretationSection,
  buildOverlaySection,
} from './coach-response-guidance'
import type { CoachInterpretation } from './coach-interpreter'

function interpretation(overrides: Partial<CoachInterpretation> = {}): CoachInterpretation {
  return {
    response_design: {
      stance: 'challenge',
      emotional_intensity: 'quiet',
      directness: 'blunt',
      depth: 'deep',
      pacing: 'slow',
      challenge_support: 'challenge_led',
      question_usage: 'none',
      approach: 'coaching',
      response_length: 'brief',
    },
    overlay: 'none',
    emotional_state: 'below',
    surface_topic: 'work frustration',
    stated_desire: null,
    key_signal: 'I keep waiting',
    tension: null,
    possible_underlying_belief: null,
    relevant_lenses: [],
    selected_memories: [],
    selected_constraints: [],
    selected_recall: [],
    recommended_move: 'Name the waiting pattern directly.',
    avoid: [],
    next_question: 'What are you waiting for permission to do?',
    confidence: 0.9,
    fallback: false,
    ...overrides,
  }
}

test('renders independent response controls and suppresses an unrequested question', () => {
  const section = buildInterpretationSection(interpretation())

  assert.match(section, /challenge; quiet intensity; blunt directness; deep depth; slow pacing/)
  assert.match(section, /Usually 1-3 sentences/)
  assert.match(section, /Depth and length are separate/)
  assert.doesNotMatch(section, /What are you waiting for permission/)
})

test('includes a precise question only when the response design calls for one', () => {
  const value = interpretation()
  value.response_design.question_usage = 'one_precise'

  assert.match(buildInterpretationSection(value), /What are you waiting for permission/)
})

test('keeps exceptional overlays separate from normal conversational design', () => {
  assert.equal(buildOverlaySection('none'), '')
  assert.match(buildOverlaySection('platform_guide'), /PLATFORM GUIDANCE OVERLAY/)
  assert.match(buildOverlaySection('crisis'), /Are safe right now|safe right now/i)
})
