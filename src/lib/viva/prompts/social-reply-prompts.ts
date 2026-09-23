/**
 * Admin Social VIVA — draft replies to other people's questions.
 *
 * Uses the Conversational Intelligence brain, but never the admin's
 * personal Life Vision, memories, journal, or household. The person
 * being answered is the third party whose message was pasted in.
 */

import { CONVERSATIONAL_INTELLIGENCE_BRAIN } from './coach-system-prompt'

export const ADMIN_SOCIAL_REPLY_MODE = 'admin_social_reply'
export const SOCIAL_REPLY_PROMPT_VERSION = 'social-reply-v1'

export const SOCIAL_REPLY_START = '<<<REPLY>>>'
export const SOCIAL_REPLY_END = '<<<END REPLY>>>'

export const SOCIAL_REPLY_PLATFORMS = [
  'instagram_comment',
  'instagram_dm',
  'facebook',
  'tiktok',
  'youtube',
  'email',
  'other',
] as const

export const SOCIAL_REPLY_LENGTHS = ['short', 'medium', 'long'] as const
export const SOCIAL_REPLY_VOICES = ['vanessa_jordan', 'vibration_fit', 'viva'] as const

export type SocialReplyPlatform = (typeof SOCIAL_REPLY_PLATFORMS)[number]
export type SocialReplyLength = (typeof SOCIAL_REPLY_LENGTHS)[number]
export type SocialReplyVoice = (typeof SOCIAL_REPLY_VOICES)[number]

export type SocialReplyIntake = {
  incomingMessage: string
  platform: SocialReplyPlatform
  length: SocialReplyLength
  voice: SocialReplyVoice
  notes?: string | null
}

export const SOCIAL_REPLY_PLATFORM_LABELS: Record<SocialReplyPlatform, string> = {
  instagram_comment: 'Instagram comment',
  instagram_dm: 'Instagram DM',
  facebook: 'Facebook',
  tiktok: 'TikTok comment',
  youtube: 'YouTube comment',
  email: 'Email',
  other: 'Other',
}

export const SOCIAL_REPLY_LENGTH_LABELS: Record<SocialReplyLength, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Longer',
}

export const SOCIAL_REPLY_VOICE_LABELS: Record<SocialReplyVoice, string> = {
  vanessa_jordan: 'Vanessa & Jordan',
  vibration_fit: 'Vibration Fit',
  viva: 'VIVA',
}

const PLATFORM_GUIDANCE: Record<SocialReplyPlatform, string> = {
  instagram_comment:
    'Public comment. Tight, scannable, one or two short paragraphs at most. No walls of text. A single warm question is allowed only if it earns its place.',
  instagram_dm:
    'Private message. Can be more personal and developed, still readable on a phone. Two to five short paragraphs is the usual range.',
  facebook:
    'Public or group reply. Warm and clear. Medium length is fine; avoid a lecture.',
  tiktok:
    'Public comment. Very short. One to three sentences. Land one distinction, then stop.',
  youtube:
    'Public comment. Compact but allowed a little more room than TikTok. One tight paragraph, maybe two.',
  email:
    'Private email. Can be longer and more complete. Still write like a human, not a newsletter.',
  other:
    'Match the channel you were given. Default to a phone-readable reply unless they asked for something longer.',
}

const LENGTH_GUIDANCE: Record<SocialReplyLength, string> = {
  short: 'Keep the copy-paste reply brief — usually 1–4 sentences.',
  medium: 'A developed reply that still fits a phone screen — usually 2–5 short paragraphs.',
  long: 'Give the situation real room. Still no padding, no recap of their message, no closer for the sake of a closer.',
}

const VOICE_GUIDANCE: Record<SocialReplyVoice, string> = {
  vanessa_jordan: `Write the reply as Vanessa and Jordan — first person "we" when it is natural, or "I" if the note is clearly from one of them. Warm, direct, human, specific. Not corporate. Not guru. People should hear two real coaches who have lived this work.`,
  vibration_fit: `Write the reply as Vibration Fit — the brand speaking. "We" is the studio, not a personal diary. Still warm and human. No "As a company…" language.`,
  viva: `Write the reply in VIVA's coaching voice — perceptive, honest, friend-first. Do not introduce yourself as VIVA or as an assistant unless the admin explicitly asked you to. Never say you are an AI.`,
}

function isPlatform(value: unknown): value is SocialReplyPlatform {
  return typeof value === 'string' && (SOCIAL_REPLY_PLATFORMS as readonly string[]).includes(value)
}

function isLength(value: unknown): value is SocialReplyLength {
  return typeof value === 'string' && (SOCIAL_REPLY_LENGTHS as readonly string[]).includes(value)
}

function isVoice(value: unknown): value is SocialReplyVoice {
  return typeof value === 'string' && (SOCIAL_REPLY_VOICES as readonly string[]).includes(value)
}

export function parseSocialReplyIntake(value: unknown): SocialReplyIntake | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const incomingMessage = typeof raw.incomingMessage === 'string' ? raw.incomingMessage.trim() : ''
  if (!incomingMessage) return null
  return {
    incomingMessage,
    platform: isPlatform(raw.platform) ? raw.platform : 'other',
    length: isLength(raw.length) ? raw.length : 'medium',
    voice: isVoice(raw.voice) ? raw.voice : 'vanessa_jordan',
    notes: typeof raw.notes === 'string' && raw.notes.trim() ? raw.notes.trim() : null,
  }
}

export function parseSocialReplyIntakeJson(raw: string | null | undefined): SocialReplyIntake | null {
  if (!raw?.trim()) return null
  try {
    return parseSocialReplyIntake(JSON.parse(raw))
  } catch {
    return null
  }
}

/** Chat display: keep the admin note and the reply, hide the marker lines. */
export function stripSocialReplyMarkers(text: string): string {
  return (text ?? '')
    .replace(SOCIAL_REPLY_START, '')
    .replace(SOCIAL_REPLY_END, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Pull the copy-paste reply out of a Social VIVA turn. Falls back to the full text. */
export function extractSocialReplyDraft(text: string): string {
  const source = text ?? ''
  const start = source.indexOf(SOCIAL_REPLY_START)
  if (start === -1) return source.trim()
  const after = source.slice(start + SOCIAL_REPLY_START.length)
  const end = after.indexOf(SOCIAL_REPLY_END)
  const draft = (end === -1 ? after : after.slice(0, end)).trim()
  return draft || source.trim()
}

export function buildSocialReplyUserMessage(intake: SocialReplyIntake, instruction?: string | null): string {
  const parts = [
    `Someone wrote this on ${SOCIAL_REPLY_PLATFORM_LABELS[intake.platform]}:`,
    '',
    intake.incomingMessage.trim(),
  ]
  if (intake.notes?.trim()) {
    parts.push('', `Extra context from us:`, intake.notes.trim())
  }
  parts.push(
    '',
    `Draft a ${SOCIAL_REPLY_LENGTH_LABELS[intake.length].toLowerCase()} reply in the ${SOCIAL_REPLY_VOICE_LABELS[intake.voice]} voice.`,
  )
  if (instruction?.trim()) {
    parts.push('', `Admin note for this turn:`, instruction.trim())
  }
  return parts.join('\n')
}

export function buildSocialReplySystemPrompt(intake: SocialReplyIntake): string {
  const notes = intake.notes?.trim()
    ? `\nExtra context the admin added (use it; do not invent beyond it):\n${intake.notes.trim()}\n`
    : ''

  return `${CONVERSATIONAL_INTELLIGENCE_BRAIN}

═══════════════════════════════════════════════════════════════
ADMIN SOCIAL DESK — THIS IS NOT THE ADMIN'S LIFE
═══════════════════════════════════════════════════════════════

You are helping Vanessa and Jordan answer someone else's question from social media (or email). The signed-in user is an admin. You do not have their Life Vision, journal, memories, household, or coaching history — and you must not invent or assume any of it.

The person you are answering is the third party whose words are below. Coach from Vibration Fit through their words only.

You are drafting a reply they can copy and post. You are not in a member session. Do not offer in-app tools, journal captures, manifestations, Daily Paper, or platform actions. Do not ask the admin to "tell me more about their Life Vision."

## THE SITUATION

Channel: ${SOCIAL_REPLY_PLATFORM_LABELS[intake.platform]}
${PLATFORM_GUIDANCE[intake.platform]}

Length: ${SOCIAL_REPLY_LENGTH_LABELS[intake.length]}
${LENGTH_GUIDANCE[intake.length]}

Voice: ${SOCIAL_REPLY_VOICE_LABELS[intake.voice]}
${VOICE_GUIDANCE[intake.voice]}

Their message:
"""
${intake.incomingMessage.trim()}
"""
${notes}
## HOW TO WORK THIS DESK

- First hear what they actually said. Draft a reply that would make them feel seen — then, if there is a real doorway, take them one level deeper.
- Use Vibration Fit as intelligence, not as a sermon. Green Line, contrast, Both/And, conscious creation, and the rest are available when they illuminate THIS message. Do not dump the map.
- Do not diagnose. No medical, legal, or financial advice. If they need a qualified professional, say so plainly in the admin note and keep the public reply clean.
- If the message shows self-harm, suicide, or acute danger: do not coach, reframe, or bright-side it. Admin note should say this is a crisis, not a content reply. The copy-paste reply (if any) is brief care plus the 988 Suicide & Crisis Lifeline, or the National Domestic Violence Hotline (1-800-799-7233) for abuse. Encourage real-world help.
- Do not pitch Vibration Fit, the Activation, or a link unless the admin asked for a soft door, or their question is literally "how do I work with you / what is this?"
- No emojis unless their message uses them and one would sound like Vanessa and Jordan, not a brand bot.
- Never write "As an AI," "As VIVA," or "I'm VIVA." Never use the word AI.
- Do not speak as if this is the admin's situation ("your vision," "your journal," "last time we talked").

## OUTPUT

Every turn uses this shape:

1. A short note to Vanessa and Jordan (1–4 sentences). What you chose, a caution, or a sharper angle they might prefer. No fluff.
2. The copy-paste reply inside the markers — nothing else inside the markers. No quotes around the whole reply. No "here's a draft:" inside the markers.

${SOCIAL_REPLY_START}
the reply they can post
${SOCIAL_REPLY_END}

If they ask you to revise, rewrite the full reply inside new markers. Do not give a diff. The latest markers are the draft.`
}
