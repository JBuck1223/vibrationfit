'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Copy, RefreshCw } from 'lucide-react'
import { trackToolUse } from './track'

/**
 * Affirmations pitched one rung above where the visitor is now (Emotional
 * Guidance Scale): a heavy starting point gets bridging "I am learning to…"
 * statements; a good one gets full present-tense statements.
 */
const AREAS = ['Self', 'Money', 'Love', 'Health', 'Work', 'Home'] as const
type Area = (typeof AREAS)[number]

const LEVELS = [
  { key: 'heavy', label: 'Heavy', hint: 'stuck, worried, frustrated' },
  { key: 'mixed', label: 'Mixed', hint: 'some days good, some not' },
  { key: 'good', label: 'Good', hint: 'hopeful, ready for more' },
] as const
type Level = (typeof LEVELS)[number]['key']

const LIBRARY: Record<Area, Record<Level, string[]>> = {
  Self: {
    heavy: ['I am allowed to go easy on myself today.', 'I am learning to speak to myself kindly.', 'One small step is enough for today.', 'I have gotten through hard days before.'],
    mixed: ['I am proud of how far I have come.', 'I keep promises to myself, one at a time.', 'I am becoming someone I admire.', 'My best is enough.'],
    good: ['I am enough exactly as I am.', 'I trust myself completely.', 'I love who I am becoming.', 'I take up space with joy.'],
  },
  Money: {
    heavy: ['I am learning to feel calm about money.', 'I am open to new ways money can come to me.', 'I can take one good step with money today.', 'Things can get better, and I am willing to let them.'],
    mixed: ['Every day I feel a little more abundant.', 'I am getting better and better with money.', 'I enjoy giving and receiving.', 'Money is starting to feel easy.'],
    good: ['Money comes to me in expected and unexpected ways.', 'I pay every bill with ease and a smile.', 'I am a generous, abundant person.', 'I love how money flows through my life.'],
  },
  Love: {
    heavy: ['I am open to feeling loved again.', 'I am learning that I deserve gentle love.', 'My heart is healing at its own pace.', 'I can give myself the love I am looking for.'],
    mixed: ['I give love freely and it comes back to me.', 'I am becoming easier to love, starting with me.', 'I attract people who see the real me.', 'Love is showing up for me more and more.'],
    good: ['I am easy to love.', 'My relationships feel safe and fun.', 'I am adored, seen and celebrated.', 'Love surrounds me.'],
  },
  Health: {
    heavy: ['I am willing to listen to what my body needs.', 'Rest is allowed, and rest is part of strength.', 'I can do one kind thing for my body today.', 'My body is always working for me.'],
    mixed: ['I love how it feels to move my body.', 'I am building habits that feel good.', 'I choose foods that make me feel alive.', 'I am getting stronger every week.'],
    good: ['I feel vibrant, strong and clear.', 'My body thrives.', 'I wake up rested and ready.', 'I love living in this body.'],
  },
  Work: {
    heavy: ['I am open to work that feels better than this.', 'I am learning what I truly want to do.', 'I can do today well enough.', 'Every job teaches me what I prefer.'],
    mixed: ['My work matters and I do it well.', 'Opportunities are finding me.', 'I am becoming the person who leads this.', 'I bring good energy into every room.'],
    good: ['I love the work I do.', 'I am paid beautifully for the value I create.', 'Doors open easily for me.', 'My work lights me up.'],
  },
  Home: {
    heavy: ['I am learning to make my space feel calm.', 'One clear corner is a good start.', 'I am open to a home that feels like me.', 'I can find a little peace here today.'],
    mixed: ['My home is becoming my sanctuary.', 'I fill my space with things I love.', 'My home feels more like me every day.', 'Coming home feels good.'],
    good: ['My home is a deep exhale.', 'I love where I live.', 'My home is full of light and laughter.', 'Everything I need is here.'],
  },
}

export function AffirmationGenerator({ startHref }: { startHref: string }) {
  const [area, setArea] = useState<Area>('Self')
  const [level, setLevel] = useState<Level>('mixed')
  const [shuffle, setShuffle] = useState(0)
  const [copied, setCopied] = useState(false)

  const affirmations = useMemo(() => {
    const list = [...LIBRARY[area][level]]
    for (let i = 0; i < shuffle % list.length; i++) list.push(list.shift()!)
    return list.slice(0, 3)
  }, [area, level, shuffle])

  function choose(nextArea: Area, nextLevel: Level) {
    setArea(nextArea)
    setLevel(nextLevel)
    setCopied(false)
    trackToolUse('affirmation-generator', { area: nextArea, level: nextLevel })
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(affirmations.join('\n'))
      setCopied(true)
      trackToolUse('affirmation-generator', { action: 'copy', area, level })
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="grid gap-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-8 lg:grid-cols-2">
      <div>
        <p className="text-sm font-semibold text-neutral-300">1. Which area of life?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {AREAS.map(item => (
            <button
              key={item}
              type="button"
              aria-pressed={area === item}
              onClick={() => choose(item, level)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                area === item ? 'border-[#39FF14] bg-[#39FF14]/10 text-[#39FF14]' : 'border-white/15 text-neutral-300 hover:border-white/40'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="mt-6 text-sm font-semibold text-neutral-300">2. How does it feel right now?</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {LEVELS.map(item => (
            <button
              key={item.key}
              type="button"
              aria-pressed={level === item.key}
              onClick={() => choose(area, item.key)}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                level === item.key ? 'border-[#00FFFF] bg-[#00FFFF]/10' : 'border-white/15 hover:border-white/40'
              }`}
            >
              <span className="block text-sm font-semibold text-white">{item.label}</span>
              <span className="block text-xs text-neutral-400">{item.hint}</span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-sm text-neutral-500">
          These are pitched one step above how you feel, so they land as believable instead of a stretch.
        </p>
      </div>

      <div className="flex flex-col">
        <p className="text-sm font-semibold text-neutral-300">Say these out loud, slowly, with feeling:</p>
        <ul className="mt-3 space-y-3" aria-live="polite">
          {affirmations.map(text => (
            <li key={text} className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-lg font-semibold leading-snug text-white">
              {text}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => setShuffle(n => n + 1)} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-neutral-200 hover:border-white/50">
            <RefreshCw className="h-4 w-4" /> Show me others
          </button>
          <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-neutral-200 hover:border-white/50">
            <Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="mt-6 rounded-2xl border border-[#39FF14]/25 bg-[#39FF14]/[0.05] p-5">
          <p className="font-semibold text-white">Hear them in your own voice every morning</p>
          <p className="mt-1 text-sm text-neutral-300">Save these as Incantations in your free account, record them, and listen anywhere.</p>
          <a
            href={startHref}
            onClick={() => trackToolUse('affirmation-generator', { action: 'save', area, level })}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#39FF14] px-5 py-2.5 text-sm font-semibold text-black"
          >
            Save my affirmations free <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
