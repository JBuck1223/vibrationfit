'use client'

import { useState } from 'react'
import { ArrowRight, Plus, X } from 'lucide-react'
import { LIFE_AREAS, type LifeAreaKey } from './life-areas'
import { trackToolUse } from './track'

type Card = { area: LifeAreaKey; desire: string; feeling: string }

export function VisionBoardBuilder({ startHref }: { startHref: string }) {
  const [cards, setCards] = useState<Card[]>([])
  const [area, setArea] = useState<LifeAreaKey>('health')
  const [desire, setDesire] = useState('')
  const [feeling, setFeeling] = useState('')

  const active = LIFE_AREAS.find(item => item.key === area)!

  function addCard() {
    const text = desire.trim() || active.prompt
    setCards(current => [...current.filter(card => card.area !== area), { area, desire: text, feeling: feeling.trim() }])
    setDesire('')
    setFeeling('')
    trackToolUse('vision-board-builder', { area, cards: cards.length + 1 })
  }

  return (
    <div className="grid gap-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div>
        <p className="text-sm font-semibold text-neutral-300">1. Pick an area of life</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LIFE_AREAS.map(item => {
            const done = cards.some(card => card.area === item.key)
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setArea(item.key)}
                aria-pressed={area === item.key}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  area === item.key ? 'border-[#39FF14] bg-[#39FF14]/10 text-[#39FF14]' : 'border-white/15 text-neutral-300 hover:border-white/40'
                }`}
              >
                {done ? '✓ ' : ''}
                {item.label}
              </button>
            )
          })}
        </div>

        <label className="mt-6 block text-sm font-semibold text-neutral-300" htmlFor="vb-desire">
          2. What do you choose in {active.label.toLowerCase()}?
        </label>
        <input
          id="vb-desire"
          value={desire}
          onChange={event => setDesire(event.target.value)}
          placeholder={active.prompt}
          maxLength={90}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-white placeholder:text-neutral-600 focus:border-[#39FF14] focus:outline-none"
        />

        <label className="mt-5 block text-sm font-semibold text-neutral-300" htmlFor="vb-feeling">
          3. How will it feel when it is real?
        </label>
        <input
          id="vb-feeling"
          value={feeling}
          onChange={event => setFeeling(event.target.value)}
          placeholder="Free, light, proud, safe…"
          maxLength={60}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-white placeholder:text-neutral-600 focus:border-[#39FF14] focus:outline-none"
        />

        <button
          type="button"
          onClick={addCard}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#39FF14] px-5 py-2.5 text-sm font-semibold text-[#39FF14] transition hover:bg-[#39FF14]/10"
        >
          <Plus className="h-4 w-4" /> Add to my board
        </button>
      </div>

      <div>
        <p className="text-sm font-semibold text-neutral-300">
          Your vision board <span className="text-neutral-500">({cards.length} of 12 areas)</span>
        </p>
        {cards.length === 0 ? (
          <div className="mt-3 flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/15 p-6 text-center text-neutral-500">
            Your first card will appear here. Start with the area of life that feels most alive right now.
          </div>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cards.map(card => {
              const meta = LIFE_AREAS.find(item => item.key === card.area)!
              return (
                <li key={card.area} className="relative rounded-2xl border bg-black p-4" style={{ borderColor: `${meta.color}55` }}>
                  <button
                    type="button"
                    aria-label={`Remove ${meta.label}`}
                    onClick={() => setCards(current => current.filter(item => item.area !== card.area))}
                    className="absolute right-3 top-3 text-neutral-600 hover:text-neutral-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: meta.color }}>{meta.label}</p>
                  <p className="mt-2 pr-5 font-semibold leading-snug text-white">{card.desire}</p>
                  {card.feeling && <p className="mt-2 text-sm text-neutral-400">Feels: {card.feeling}</p>}
                </li>
              )
            })}
          </ul>
        )}
        {cards.length > 0 && (
          <div className="mt-6 rounded-2xl border border-[#39FF14]/25 bg-[#39FF14]/[0.05] p-5">
            <p className="font-semibold text-white">Keep this board and bring it to life</p>
            <p className="mt-1 text-sm text-neutral-300">
              Save it to your free account to add images, inspired actions and a journal for every card.
            </p>
            <a
              href={startHref}
              onClick={() => trackToolUse('vision-board-builder', { action: 'save', cards: cards.length })}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#39FF14] px-5 py-2.5 text-sm font-semibold text-black"
            >
              Save my board free <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
