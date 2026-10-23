'use client'

import { toast } from 'sonner'
import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getFlow, resolveHref } from '@/lib/flows/catalog'
import type { FlowContext, FlowStep } from '@/lib/flows/types'
import { useActiveFlow } from '@/hooks/useActiveFlow'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import { FlowComplete } from './FlowComplete'

function stepTarget(step: FlowStep, ctx: FlowContext, choice?: string | null): string | null {
  if (step.choices?.length) {
    const picked = step.choices.find((c) => c.id === choice)
    return picked ? resolveHref(picked.href, ctx) : null
  }
  return resolveHref(step.href, ctx)
}

function samePage(pathname: string, href: string | null) {
  if (!href) return false
  return pathname === href.split('?')[0]
}

/**
 * The guide that rides along while a member is in a flow: which path, which
 * step, and what to do next. It sits above the pill on phones and as a strip
 * under the header on desktop, over the real tools. Steps advance on their
 * own when the app reports the matching action; Next and Skip always work.
 */
export function FlowBar() {
  const pathname = usePathname() ?? ''
  // The floating mini player sits just above the bottom bar; ride above it.
  const hasPlayer = useGlobalAudioStore((st) => st.tracks.length > 0)
  const router = useRouter()
  const { data, update } = useActiveFlow()
  const [expanded, setExpanded] = React.useState(false)
  const lastStepRef = React.useRef<string | null>(null)
  const [justAdvanced, setJustAdvanced] = React.useState(false)

  const run = data?.run ?? null
  const flow = getFlow(run?.flow_id)
  const step = flow?.steps.find((s) => s.id === run?.current_step) ?? null
  const ctx: FlowContext = run?.context ?? {}
  const choice = step ? run?.steps?.[step.id]?.choice ?? null : null
  const target = step ? stepTarget(step, ctx, choice) : null
  const index = flow && step ? flow.steps.findIndex((s) => s.id === step.id) : -1

  // When the step changes underneath us (an action completed it), celebrate briefly and open.
  React.useEffect(() => {
    if (!run) return
    if (lastStepRef.current && lastStepRef.current !== run.current_step) {
      setJustAdvanced(true)
      setExpanded(true)
      const t = window.setTimeout(() => setJustAdvanced(false), 6000)
      lastStepRef.current = run.current_step
      return () => window.clearTimeout(t)
    }
    lastStepRef.current = run.current_step
  }, [run])

  // A new step with choices opens itself so the choice is visible.
  React.useEffect(() => {
    if (step?.choices?.length && !choice) setExpanded(true)
  }, [step?.id, step?.choices?.length, choice])

  if (data?.justCompleted && !run) return <FlowComplete run={data.justCompleted} />
  if (!run || !flow || !step) return null

  const onThisStep = samePage(pathname, target)
  // On a VIVA step in the chat itself, the way forward is saving the
  // conversation to the Journal (VIVA drafts the entry from it).
  const vivaStepHere = onThisStep && !!target?.startsWith('/viva')
  const journalTag = flow.state === 'below' ? 'wobble' : flow.state === 'above' ? 'win' : null
  const saveChatToJournal = () => {
    const thread = new URLSearchParams(window.location.search).get('thread')
    if (!thread) {
      toast('Talk with VIVA first, then save it to your Journal.')
      return
    }
    const q = new URLSearchParams({ fromViva: thread })
    if (journalTag) q.set('tag', journalTag)
    router.push(`/journal/new?${q.toString()}`)
  }
  // On full-height pages with a composer at the bottom (VIVA), ride at the top instead.
  const atTop = pathname.startsWith('/viva')

  const choose = async (choiceId: string) => {
    const picked = step.choices?.find((c) => c.id === choiceId)
    await update.mutateAsync({ runId: run.id, action: 'choose', stepId: step.id, choice: choiceId })
    const href = picked ? resolveHref(picked.href, ctx) : null
    setExpanded(false)
    if (href) router.push(href)
  }

  return (
    <div
      data-flow-bar
      className={cn(
        'fixed inset-x-3 z-40 lg:left-[280px] lg:right-6',
        atTop
          ? 'top-[calc(var(--native-inset-top,0px)+var(--shell-header-height)+8px)]'
          : hasPlayer
            ? 'bottom-[calc(var(--shell-nav-height)+env(safe-area-inset-bottom,0px)+100px)] lg:bottom-[92px]'
            : 'bottom-[calc(var(--shell-nav-height)+env(safe-area-inset-bottom,0px)+20px)] lg:bottom-6',
      )}
    >
      <div className="glass-chrome mx-auto max-w-xl overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex shrink-0 gap-1" aria-hidden>
            {flow.steps.map((s, i) => {
              const record = run.steps?.[s.id]
              return (
                <span
                  key={s.id}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === index ? 'w-5 bg-[#39FF14]' : record?.done_at ? 'w-1.5 bg-[#39FF14]/70' : 'w-1.5 bg-white/25',
                  )}
                />
              )
            })}
          </div>
          <button type="button" onClick={() => setExpanded((e) => !e)} className="min-w-0 flex-1 text-left">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              {justAdvanced ? 'Nice — next up' : `${flow.title} · Step ${index + 1} of ${flow.steps.length}`}
            </p>
            <p className="truncate text-sm font-semibold text-white">{step.title}</p>
          </button>
          {!expanded && vivaStepHere && (
            <button type="button" onClick={saveChatToJournal} className="flex shrink-0 items-center gap-1 rounded-full bg-[#39FF14] px-3 py-1.5 text-xs font-semibold text-black">
              Save to Journal <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {!expanded && target && !onThisStep && (
            <Link href={target} className="flex shrink-0 items-center gap-1 rounded-full bg-[#39FF14] px-3 py-1.5 text-xs font-semibold text-black">
              Go <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Hide details' : 'Show details'}
            className="rounded-full p-1 text-white/60 hover:text-white"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => void update.mutateAsync({ runId: run.id, action: 'abandon' })}
            aria-label="Leave this path"
            className="rounded-full p-1 text-white/50 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {expanded && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3">
            <p className="text-sm text-white/75">{step.body}</p>

            {step.choices?.length ? (
              <ul className="mt-3 space-y-2">
                {step.choices.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => void choose(c.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                        choice === c.id ? 'border-[#39FF14]/60 bg-[rgba(57,255,20,0.10)]' : 'border-white/10 hover:border-white/25 hover:bg-white/[0.04]',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-white">{c.label}</span>
                        <span className="block text-xs text-white/60">{c.description}</span>
                      </span>
                      {choice === c.id ? <Check className="h-4 w-4 text-[#39FF14]" /> : <ArrowRight className="h-4 w-4 text-white/40" />}
                    </button>
                  </li>
                ))}
              </ul>
            ) : vivaStepHere ? (
              <button type="button" onClick={saveChatToJournal} className="btn btn-primary mt-3 w-full !py-2.5 text-sm">
                Save this to my Journal <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              target &&
              !onThisStep && (
                <Link href={target} className="btn btn-primary mt-3 w-full !py-2.5 text-sm">
                  Go to {step.title.toLowerCase()} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              )
            )}

            <div className="mt-3 flex items-center justify-between text-xs">
              {step.optional && index === flow.steps.length - 1 ? (
                // An optional last step (e.g. "talk it through, if you want"): stopping here is a complete path.
                <button
                  type="button"
                  onClick={() => void update.mutateAsync({ runId: run.id, action: 'complete' })}
                  className="text-white/55 hover:text-white"
                >
                  I&apos;m good, finish here
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void update.mutateAsync({ runId: run.id, action: 'skip_step', stepId: step.id })}
                  className="text-white/55 hover:text-white"
                >
                  Skip this step
                </button>
              )}
              <button
                type="button"
                onClick={() => void update.mutateAsync({ runId: run.id, action: 'complete_step', stepId: step.id })}
                className="flex items-center gap-1 font-semibold text-[#39FF14] hover:text-white"
              >
                <Check className="h-3.5 w-3.5" /> I did this
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
