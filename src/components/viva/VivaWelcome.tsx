'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, FileText, Headphones, Lightbulb, Mic, Music2, Sun, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useInShell } from '@/components/app-shell/ShellContext'

export interface VivaWelcomeThread {
  id: string
  title: string | null
  preview_message?: string | null
  last_message_at?: string | null
}

interface Suggestion {
  icon: LucideIcon
  label: string
  message: string
}

const SUGGESTIONS: Suggestion[] = [
  { icon: Sun, label: 'Help me feel better now', message: 'Help me feel better right now.' },
  { icon: Target, label: 'Get aligned with my vision', message: 'Help me get aligned with my Life Vision today.' },
  { icon: FileText, label: 'Create a daily plan', message: 'Help me create a simple, aligned plan for today.' },
  { icon: Music2, label: 'Play something for my state', message: 'Suggest something to listen to for the state I am in right now.' },
]

const TOOLS: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: Target, label: 'Life Vision', href: '/life-vision' },
  { icon: Headphones, label: 'Meditations', href: '/meditations' },
  { icon: Music2, label: 'Songs', href: '/audio/songs' },
  { icon: Mic, label: 'Incantations', href: '/story?kind=incantation' },
  { icon: Lightbulb, label: 'Queries', href: '/story?kind=spark_query' },
  { icon: FileText, label: 'Journal', href: '/journal' },
]

interface VivaWelcomeProps {
  firstName?: string | null
  threads: VivaWelcomeThread[]
  onSuggest: (message: string) => void
  onOpenThread: (id: string) => void
}

/**
 * The empty state of a VIVA conversation: her mark, who she is, four ways to
 * begin, recent conversations and the tools she most often reaches for.
 */
export function VivaWelcome({ firstName, threads, onSuggest, onOpenThread }: VivaWelcomeProps) {
  const inShell = useInShell()
  const recent = threads.slice(0, 3)

  return (
    <div className="space-y-6" data-section="viva">
      <section className={inShell ? 'relative' : 'glass-panel relative overflow-hidden'}>
        <div className="relative flex flex-col items-center px-6 pb-4 pt-4 text-center md:pt-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(191,0,255,0.22)] shadow-[0_0_60px_rgba(191,0,255,0.45)] ring-1 ring-[#BF00FF]/60">
            <span className="hp-display text-[28px] leading-none text-[#BF00FF]">viva</span>
          </span>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">Your Coach</p>
          <h2 className="mt-1 text-[30px] font-extrabold leading-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] md:text-[36px]">VIVA</h2>
          <p className="mt-3 max-w-md text-base text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">
            {firstName ? `${firstName}, I ` : 'I '}
            know your vision, your patterns, your journey. I&apos;m here to help you feel better now and create the
            life you love.
          </p>
        </div>
      </section>

      <ul className="grid gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map(({ icon: Icon, label, message }) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => onSuggest(message)}
              className="glass-panel flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-white transition-colors hover:border-[#BF00FF]/70"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(191,0,255,0.18)] text-[#BF00FF]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[15px] font-medium">{label}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
            </button>
          </li>
        ))}
      </ul>

      {recent.length > 0 && (
        <section>
          <h3 className="mb-3 text-base font-semibold text-white">Recent conversations</h3>
          <ul className="grid gap-3 sm:grid-cols-3">
            {recent.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onOpenThread(t.id)}
                  className="glass-panel flex h-full w-full flex-col items-start gap-1 px-4 py-4 text-left transition-colors hover:border-[#BF00FF]/70"
                >
                  <span className="line-clamp-1 text-[15px] font-semibold text-white">{t.title || 'Conversation'}</span>
                  {t.preview_message && <span className="line-clamp-2 text-sm text-white/65">{t.preview_message}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">Suggested tools</h3>
        <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {TOOLS.map(({ icon: Icon, label, href }) => (
            <li key={label} className="shrink-0">
              <Link
                href={href}
                className="glass-panel flex w-[120px] flex-col items-center gap-2 px-3 py-4 text-center transition-colors hover:border-[#39FF14]/60"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(57,255,20,0.16)] text-[#39FF14]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium text-white">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
