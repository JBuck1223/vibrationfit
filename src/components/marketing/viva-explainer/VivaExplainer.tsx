'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { ArrowRight } from 'lucide-react'
import { VivaAssistantMessage, VivaThinkingIndicator, VivaUserMessage } from '@/components/viva/VivaChatMessage'
import { DualPathCtas } from '@/components/marketing/home/DualPathCtas'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

const VISION_USER = 'I want my mornings to feel like mine again. Right now they belong to everyone else.'
const VISION_REPLY =
  'That is the contrast. Here is a Health draft of the life you just described. Keep it, rewrite it, or tell me what to change.'
const VISION_DRAFT =
  'I wake before the house does. The first hour is quiet and mine. I move because I want to, then I sit with coffee while the day is still soft.'

const CONSTRAINT_USER = 'I keep saying I will rest when the work is done. The work is never done.'
const CONSTRAINT_REPLY =
  'The constraint under that is: rest has to be earned. The line above the Green Line is already in what you want. You can flip it, or leave it.'

const ALIGN_USER = 'I snapped at my kid before school, and now the whole vision feels fake.'
const ALIGN_REPLY =
  'The vision did not break. A story showed up: one sharp moment means none of this is real. I can save the moment and the truth next to it, if you want a record.'

type Pose = { x: number; y: number; opacity: number; scale: number }

const REST_POSE: Pose = { x: 36, y: 28, opacity: 0, scale: 1 }

function easeInOutQuad(p: number) {
  return p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2
}

function useOnScreen(ref: RefObject<HTMLElement | null>) {
  const [on, setOn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting), { threshold: 0.28 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return on
}

function useDemoPointer(stageRef: RefObject<HTMLDivElement | null>) {
  const poseRef = useRef<Pose>(REST_POSE)
  const [pose, setPose] = useState<Pose>(REST_POSE)
  const rafRef = useRef(0)
  const gen = useRef(0)

  const commit = useCallback((next: Pose) => {
    poseRef.current = next
    setPose(next)
  }, [])

  const stop = useCallback(() => {
    gen.current += 1
    cancelAnimationFrame(rafRef.current)
  }, [])

  const sleep = useCallback((ms: number, token: number) => {
    return new Promise<boolean>((resolve) => {
      window.setTimeout(() => resolve(gen.current === token), ms)
    })
  }, [])

  const travel = useCallback((el: HTMLElement, token: number) => {
    return new Promise<boolean>((resolve) => {
      const stage = stageRef.current
      if (!stage || gen.current !== token) {
        resolve(false)
        return
      }
      const area = stage.getBoundingClientRect()
      const box = el.getBoundingClientRect()
      const from = poseRef.current
      const toX = box.left - area.left + Math.min(22, box.width * 0.35)
      const toY = box.top - area.top + box.height * 0.62
      const started = performance.now()

      const step = (now: number) => {
        if (gen.current !== token) {
          resolve(false)
          return
        }
        const p = Math.min((now - started) / 680, 1)
        const eased = easeInOutQuad(p)
        commit({
          x: from.x + (toX - from.x) * eased,
          y: from.y + (toY - from.y) * eased,
          opacity: 1,
          scale: 1,
        })
        if (p < 1) rafRef.current = requestAnimationFrame(step)
        else resolve(true)
      }

      rafRef.current = requestAnimationFrame(step)
    })
  }, [commit, stageRef])

  const click = useCallback(async (
    el: HTMLElement | null,
    hooks?: { onHover?: () => void; onPress?: () => void },
  ) => {
    const token = gen.current
    if (!el) return true
    if (poseRef.current.opacity < 1) {
      commit({ ...poseRef.current, opacity: 1, scale: 1 })
      if (!(await sleep(140, token))) return false
    }
    if (!(await travel(el, token))) return false
    hooks?.onHover?.()
    if (!(await sleep(180, token))) return false
    commit({ ...poseRef.current, scale: 0.82 })
    hooks?.onPress?.()
    if (!(await sleep(90, token))) return false
    commit({ ...poseRef.current, scale: 1 })
    return sleep(160, token)
  }, [commit, sleep, travel])

  const hide = useCallback(() => {
    commit({ ...poseRef.current, opacity: 0, scale: 1, x: REST_POSE.x, y: REST_POSE.y })
  }, [commit])

  useEffect(() => stop, [stop])

  return { pose, click, hide, stop }
}

function GhostCursor({ pose }: { pose: Pose }) {
  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{
        left: pose.x,
        top: pose.y,
        opacity: pose.opacity,
        transform: `scale(${pose.scale})`,
        transition: 'opacity 140ms linear, transform 90ms ease-out',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M4 2L4 18L8.5 13.5L12 20L14 19L10.5 12.5L17 12.5L4 2Z"
          fill="white"
          stroke="#111"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function Reveal({
  children,
  className = '',
  from = 'up',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  from?: 'up' | 'left' | 'right'
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShown(true)
        observer.disconnect()
      }
    }, { threshold: 0.18 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const hidden = from === 'left' ? 'translateX(-28px)' : from === 'right' ? 'translateX(28px)' : 'translateY(20px)'

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : hidden,
        transition: `opacity 700ms ${EASE}, transform 700ms ${EASE}`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function Typed({ text, active, speed = 16 }: { text: string; active: boolean; speed?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) {
      setCount(text.length)
      return
    }
    setCount(0)
    let i = 0
    const timer = window.setInterval(() => {
      i += 1
      setCount(i)
      if (i >= text.length) window.clearInterval(timer)
    }, speed)
    return () => window.clearInterval(timer)
  }, [active, speed, text])

  const done = count >= text.length
  return (
    <>
      {text.slice(0, count)}
      {active && !done ? <span className="vf-caret ml-0.5 inline-block h-[1em] w-[2px] translate-y-0.5 bg-[#BF00FF] align-middle" /> : null}
    </>
  )
}

function Window({
  title,
  stageRef,
  pose,
  children,
}: {
  title: string
  stageRef: RefObject<HTMLDivElement | null>
  pose: Pose
  children: ReactNode
}) {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-[0_40px_90px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out hover:-translate-y-1"
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{title}</span>
      </div>
      <div ref={stageRef} className="relative flex min-h-[460px] flex-col p-4 md:p-5">
        {children}
        <GhostCursor pose={pose} />
      </div>
    </div>
  )
}

function chipClass(hot: boolean, pressed: boolean) {
  return [
    'rounded-full border px-3 py-1 text-xs transition-all duration-150',
    hot
      ? 'border-[#BF00FF] bg-[#BF00FF]/15 text-white shadow-[0_0_0_3px_rgba(191,0,255,0.22)]'
      : 'border-white/10 bg-white/[0.03] text-neutral-300',
    pressed ? 'scale-95' : '',
  ].join(' ')
}

function pillClass(hot: boolean, pressed: boolean, filled: boolean) {
  return [
    'rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150',
    filled
      ? 'bg-[#39FF14] text-black'
      : hot
        ? 'border border-[#39FF14] text-[#39FF14] shadow-[0_0_0_3px_rgba(57,255,20,0.18)]'
        : 'border border-[#39FF14]/40 text-[#39FF14]',
    pressed ? 'scale-95' : '',
  ].join(' ')
}

function wait(ms: number, alive: () => boolean) {
  return new Promise<boolean>((resolve) => {
    window.setTimeout(() => resolve(alive()), ms)
  })
}

function typingMs(text: string, speed: number) {
  return text.length * speed + 260
}

function VisionChat() {
  const stageRef = useRef<HTMLDivElement>(null)
  const chipRef = useRef<HTMLSpanElement>(null)
  const keepRef = useRef<HTMLSpanElement>(null)
  const visible = useOnScreen(stageRef)
  const { pose, click, hide, stop } = useDemoPointer(stageRef)
  const [step, setStep] = useState<'chips' | 'user' | 'think' | 'reply' | 'draft' | 'kept'>('chips')
  const [hot, setHot] = useState<'chip' | 'keep' | null>(null)
  const [pressed, setPressed] = useState<'chip' | 'keep' | null>(null)

  useEffect(() => {
    if (!visible) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep('kept')
      return
    }
    let alive = true
    const ok = () => alive

    async function loop() {
      while (alive) {
        setStep('chips')
        setHot(null)
        setPressed(null)
        hide()
        if (!(await wait(420, ok))) return
        const picked = await click(chipRef.current, {
          onHover: () => setHot('chip'),
          onPress: () => setPressed('chip'),
        })
        if (!picked) return
        setStep('user')
        if (!(await wait(typingMs(VISION_USER, 16), ok))) return
        setStep('think')
        if (!(await wait(700, ok))) return
        setStep('reply')
        if (!(await wait(typingMs(VISION_REPLY, 14), ok))) return
        setStep('draft')
        setHot(null)
        setPressed(null)
        if (!(await wait(420, ok))) return
        const kept = await click(keepRef.current, {
          onHover: () => setHot('keep'),
          onPress: () => setPressed('keep'),
        })
        if (!kept) return
        setStep('kept')
        if (!(await wait(1700, ok))) return
      }
    }

    loop()
    return () => {
      alive = false
      stop()
    }
  }, [click, hide, stop, visible])

  const showThread = step !== 'chips'
  const showDraft = step === 'draft' || step === 'kept'

  return (
    <Window title="VIVA · Life Vision" stageRef={stageRef} pose={pose}>
      {step === 'chips' ? (
        <>
          <p className="mb-3 text-xs text-neutral-500">Try one of these to get started</p>
          <div className="mb-4 flex flex-wrap gap-2">
            <span ref={chipRef} className={chipClass(hot === 'chip', pressed === 'chip')}>My mornings</span>
            {['The house I want', 'Work that fits', 'Money without bracing'].map((item) => (
              <span key={item} className={chipClass(false, false)}>{item}</span>
            ))}
          </div>
        </>
      ) : null}
      <div className="flex flex-1 flex-col justify-end gap-4">
        {showThread ? (
          <div className="vf-rise">
            <VivaUserMessage hideCopy>
              <Typed text={VISION_USER} active={step === 'user'} />
            </VivaUserMessage>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Your words and her draft will show up here.</p>
        )}
        {step === 'think' ? (
          <div className="vf-rise">
            <VivaThinkingIndicator />
          </div>
        ) : null}
        {step === 'reply' || showDraft ? (
          <div className="vf-rise">
            <VivaAssistantMessage hideCopy>
              <Typed text={VISION_REPLY} active={step === 'reply'} speed={14} />
            </VivaAssistantMessage>
          </div>
        ) : null}
        {showDraft ? (
          <div className="vf-rise rounded-xl border border-[#BF00FF]/30 bg-[#BF00FF]/[0.06] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#BF00FF]">Health · draft</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-100">{VISION_DRAFT}</p>
            <div className="mt-4 flex gap-2">
              <span ref={keepRef} className={pillClass(hot === 'keep', pressed === 'keep', step === 'kept')}>
                {step === 'kept' ? 'Kept' : 'Keep this'}
              </span>
              <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-300">Rewrite</span>
            </div>
          </div>
        ) : null}
      </div>
    </Window>
  )
}

function VisionDocument() {
  const stageRef = useRef<HTMLDivElement>(null)
  const keepRef = useRef<HTMLSpanElement>(null)
  const visible = useOnScreen(stageRef)
  const { pose, click, hide, stop } = useDemoPointer(stageRef)
  const [step, setStep] = useState<'empty' | 'type' | 'choose' | 'kept'>('empty')
  const [hot, setHot] = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    if (!visible) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep('kept')
      return
    }
    let alive = true
    const ok = () => alive

    async function loop() {
      while (alive) {
        setStep('empty')
        setHot(false)
        setPressed(false)
        hide()
        if (!(await wait(500, ok))) return
        setStep('type')
        if (!(await wait(typingMs(VISION_DRAFT, 18), ok))) return
        setStep('choose')
        if (!(await wait(280, ok))) return
        const kept = await click(keepRef.current, {
          onHover: () => setHot(true),
          onPress: () => setPressed(true),
        })
        if (!kept) return
        setStep('kept')
        if (!(await wait(1800, ok))) return
      }
    }

    loop()
    return () => {
      alive = false
      stop()
    }
  }, [click, hide, stop, visible])

  const kept = step === 'kept'

  return (
    <Window title="Life Vision · Health" stageRef={stageRef} pose={pose}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Health</p>
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">{kept ? 'Kept' : 'Draft'}</p>
      </div>
      <div className="mt-4 flex-1 rounded-xl border border-white/10 bg-black/40 p-4">
        {step === 'empty' ? (
          <p className="text-sm text-neutral-500">Waiting for the draft from your conversation.</p>
        ) : (
          <p className="text-[15px] leading-relaxed text-neutral-100">
            <Typed text={VISION_DRAFT} active={step === 'type'} speed={18} />
          </p>
        )}
      </div>
      <p className="mt-3 text-xs text-neutral-500">From your conversation about mornings.</p>
      <div className="mt-4 flex gap-2">
        <span ref={keepRef} className={pillClass(hot, pressed, kept)}>
          {kept ? 'Kept' : 'Keep this'}
        </span>
        <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-300">Rewrite</span>
      </div>
    </Window>
  )
}

function ConstraintWindow() {
  const stageRef = useRef<HTMLDivElement>(null)
  const chipRef = useRef<HTMLSpanElement>(null)
  const flipRef = useRef<HTMLSpanElement>(null)
  const visible = useOnScreen(stageRef)
  const { pose, click, hide, stop } = useDemoPointer(stageRef)
  const [step, setStep] = useState<'chips' | 'user' | 'reply' | 'lines' | 'flipped'>('chips')
  const [hot, setHot] = useState<'chip' | 'flip' | null>(null)
  const [pressed, setPressed] = useState<'chip' | 'flip' | null>(null)

  useEffect(() => {
    if (!visible) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep('flipped')
      return
    }
    let alive = true
    const ok = () => alive

    async function loop() {
      while (alive) {
        setStep('chips')
        setHot(null)
        setPressed(null)
        hide()
        if (!(await wait(400, ok))) return
        const picked = await click(chipRef.current, {
          onHover: () => setHot('chip'),
          onPress: () => setPressed('chip'),
        })
        if (!picked) return
        setStep('user')
        if (!(await wait(typingMs(CONSTRAINT_USER, 16), ok))) return
        setStep('reply')
        if (!(await wait(typingMs(CONSTRAINT_REPLY, 14), ok))) return
        setStep('lines')
        setHot(null)
        setPressed(null)
        if (!(await wait(500, ok))) return
        const flipped = await click(flipRef.current, {
          onHover: () => setHot('flip'),
          onPress: () => setPressed('flip'),
        })
        if (!flipped) return
        setStep('flipped')
        if (!(await wait(1900, ok))) return
      }
    }

    loop()
    return () => {
      alive = false
      stop()
    }
  }, [click, hide, stop, visible])

  const showThread = step !== 'chips'
  const showLines = step === 'lines' || step === 'flipped'
  const flipped = step === 'flipped'

  return (
    <Window title="VIVA · Constraint" stageRef={stageRef} pose={pose}>
      {step === 'chips' ? (
        <>
          <p className="mb-3 text-xs text-neutral-500">Name what is in the way</p>
          <div className="mb-4 flex flex-wrap gap-2">
            <span ref={chipRef} className={chipClass(hot === 'chip', pressed === 'chip')}>I will rest later</span>
            {['I have to earn it', 'If I stop, it falls apart'].map((item) => (
              <span key={item} className={chipClass(false, false)}>{item}</span>
            ))}
          </div>
        </>
      ) : null}
      <div className="flex flex-1 flex-col justify-end gap-4">
        {showThread ? (
          <div className="vf-rise">
            <VivaUserMessage hideCopy>
              <Typed text={CONSTRAINT_USER} active={step === 'user'} />
            </VivaUserMessage>
          </div>
        ) : null}
        {step === 'reply' || showLines ? (
          <div className="vf-rise">
            <VivaAssistantMessage hideCopy>
              <Typed text={CONSTRAINT_REPLY} active={step === 'reply'} speed={14} />
            </VivaAssistantMessage>
          </div>
        ) : null}
        {showLines ? (
          <div className="vf-rise space-y-2">
            <div className={`rounded-xl border p-3 transition-all duration-300 ${flipped ? 'border-white/10 opacity-50' : 'border-[#FF0040]/40 bg-[#FF0040]/10'}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FF0040]">Below the Green Line</p>
              <p className="mt-1 text-sm text-neutral-100">Rest has to be earned.</p>
            </div>
            <div className={`rounded-xl border p-3 transition-all duration-300 ${flipped ? 'border-[#39FF14]/40 bg-[#39FF14]/10' : 'border-white/10 opacity-40'}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#39FF14]">Above the Green Line</p>
              <p className="mt-1 text-sm text-neutral-100">Rest is part of the life I choose. I stop while there is still day left.</p>
            </div>
            <div className="flex gap-2 pt-1">
              <span ref={flipRef} className={pillClass(hot === 'flip', pressed === 'flip', flipped)}>
                {flipped ? 'Flipped' : 'Flip this'}
              </span>
              <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-300">Leave it</span>
            </div>
          </div>
        ) : null}
      </div>
    </Window>
  )
}

const KIT = [
  { id: 'voice', label: 'Voice', detail: 'Health, in your voice' },
  { id: 'song', label: 'Song', detail: 'Morning, unhurried' },
  { id: 'manifestation', label: 'Manifestation', detail: 'The first hour is mine' },
  { id: 'incantation', label: 'Incantation', detail: 'The day can start with me' },
]

function ActivationWindow() {
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])
  const visible = useOnScreen(stageRef)
  const { pose, click, hide, stop } = useDemoPointer(stageRef)
  const [count, setCount] = useState(0)
  const [checked, setChecked] = useState(-1)
  const [hotCard, setHotCard] = useState(-1)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!visible) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(KIT.length)
      setChecked(KIT.length - 1)
      setReady(true)
      return
    }
    let alive = true
    const ok = () => alive

    async function loop() {
      while (alive) {
        setCount(0)
        setChecked(-1)
        setHotCard(-1)
        setReady(false)
        hide()
        if (!(await wait(500, ok))) return
        for (let i = 0; i < KIT.length; i += 1) {
          setCount(i + 1)
          if (!(await wait(260, ok))) return
          const hit = await click(cardRefs.current[i], {
            onHover: () => setHotCard(i),
            onPress: () => setChecked(i),
          })
          if (!hit) return
        }
        setReady(true)
        if (!(await wait(1800, ok))) return
      }
    }

    loop()
    return () => {
      alive = false
      stop()
    }
  }, [click, hide, stop, visible])

  return (
    <Window title="VIVA · Activation" stageRef={stageRef} pose={pose}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Health kit</p>
        <p className={`text-[11px] uppercase tracking-[0.16em] ${ready ? 'text-[#39FF14]' : 'text-neutral-500'}`}>
          {ready ? 'Ready when you are' : 'Building'}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {count === 0 ? (
          <p className="text-sm text-neutral-500">She waits until you keep the vision. Then you choose what gets made.</p>
        ) : null}
        {KIT.slice(0, count).map((item, index) => (
          <div
            key={item.id}
            ref={(node) => { cardRefs.current[index] = node }}
            className={`vf-rise flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-150 ${
              index <= checked
                ? 'border-[#00FFFF]/40 bg-[#00FFFF]/[0.06]'
                : index === hotCard
                  ? 'border-[#BF00FF]/50 shadow-[0_0_0_3px_rgba(191,0,255,0.2)]'
                  : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            <div>
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-xs text-neutral-400">{item.detail}</p>
            </div>
            <span className={`text-[11px] uppercase tracking-[0.14em] ${index <= checked ? 'text-[#00FFFF]' : 'text-neutral-600'}`}>
              {index <= checked ? 'Ready' : ''}
            </span>
          </div>
        ))}
      </div>
    </Window>
  )
}

function AlignmentWindow() {
  const stageRef = useRef<HTMLDivElement>(null)
  const saveRef = useRef<HTMLSpanElement>(null)
  const visible = useOnScreen(stageRef)
  const { pose, click, hide, stop } = useDemoPointer(stageRef)
  const [step, setStep] = useState<'user' | 'think' | 'reply' | 'journal' | 'saved'>('user')
  const [hot, setHot] = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    if (!visible) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep('saved')
      return
    }
    let alive = true
    const ok = () => alive

    async function loop() {
      while (alive) {
        setStep('user')
        setHot(false)
        setPressed(false)
        hide()
        if (!(await wait(typingMs(ALIGN_USER, 16), ok))) return
        setStep('think')
        if (!(await wait(700, ok))) return
        setStep('reply')
        if (!(await wait(typingMs(ALIGN_REPLY, 14), ok))) return
        setStep('journal')
        if (!(await wait(460, ok))) return
        const saved = await click(saveRef.current, {
          onHover: () => setHot(true),
          onPress: () => setPressed(true),
        })
        if (!saved) return
        setStep('saved')
        if (!(await wait(1700, ok))) return
      }
    }

    loop()
    return () => {
      alive = false
      stop()
    }
  }, [click, hide, stop, visible])

  const saved = step === 'saved'
  const showReply = step === 'reply' || step === 'journal' || saved
  const showJournal = step === 'journal' || saved

  return (
    <Window title="VIVA · Alignment" stageRef={stageRef} pose={pose}>
      <div className="flex flex-1 flex-col justify-end gap-4">
        <div className="vf-rise">
          <VivaUserMessage hideCopy>
            <Typed text={ALIGN_USER} active={step === 'user'} />
          </VivaUserMessage>
        </div>
        {step === 'think' ? (
          <div className="vf-rise">
            <VivaThinkingIndicator />
          </div>
        ) : null}
        {showReply ? (
          <div className="vf-rise">
            <VivaAssistantMessage hideCopy>
              <Typed text={ALIGN_REPLY} active={step === 'reply'} speed={14} />
            </VivaAssistantMessage>
          </div>
        ) : null}
        {showJournal ? (
          <div className="vf-rise rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Journal</p>
            <p className="mt-2 text-sm text-neutral-200">
              <span className="text-neutral-500">Moment. </span>
              I snapped before school.
            </p>
            <p className="mt-2 text-sm text-[#FF0040]">
              <span className="text-neutral-500">Story. </span>
              One sharp moment means the vision is fake.
            </p>
            <p className="mt-2 text-sm text-[#39FF14]">
              <span className="text-neutral-500">What is true. </span>
              I can repair, and the life I choose is still mine.
            </p>
            <div className="mt-4 flex gap-2">
              <span
                ref={saveRef}
                className={[
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                  saved ? 'bg-[#39FF14] text-black' : 'bg-[#BF00FF] text-white',
                  !saved && hot ? 'shadow-[0_0_0_3px_rgba(191,0,255,0.28)]' : '',
                  pressed && !saved ? 'scale-95' : '',
                ].join(' ')}
              >
                {saved ? 'Saved' : 'Save to journal'}
              </span>
              <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-300">Leave it</span>
            </div>
          </div>
        ) : null}
      </div>
    </Window>
  )
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-base leading-snug text-neutral-200">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#39FF14] shadow-[0_0_10px_#39FF14]" />
      <span>{children}</span>
    </li>
  )
}

function Feature({
  id,
  eyebrow,
  title,
  body,
  points,
  demo,
  flip = false,
}: {
  id: string
  eyebrow: string
  title: string
  body: string
  points: string[]
  demo: ReactNode
  flip?: boolean
}) {
  return (
    <section id={id} className="border-t border-white/10">
      <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-6 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
        <Reveal from={flip ? 'right' : 'left'} className={flip ? 'lg:order-2' : undefined}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#BF00FF]">{eyebrow}</p>
          <h2 className="mt-4 text-3xl font-extrabold leading-[1.15] text-white md:text-4xl">{title}</h2>
          <p className="mt-5 text-lg leading-relaxed text-neutral-300">{body}</p>
          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <Bullet key={point}>{point}</Bullet>
            ))}
          </ul>
        </Reveal>
        <Reveal from={flip ? 'left' : 'right'} delay={120} className={flip ? 'lg:order-1' : undefined}>
          {demo}
        </Reveal>
      </div>
    </section>
  )
}

export function VivaExplainer() {
  return (
    <div className="-mx-4 -mt-6 overflow-x-clip bg-[#070707] sm:-mx-6 md:-mt-12 lg:-mx-8 lg:-mt-8">
      <style>{`
        @keyframes vf-rise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes vf-caret {
          0%, 45% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .vf-rise { animation: vf-rise 0.32s ${EASE} both; }
        .vf-caret { animation: vf-caret 0.85s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .vf-rise, .vf-caret { animation: none; }
        }
      `}</style>
      <section className="mx-auto grid max-w-[1120px] items-center gap-12 px-6 pb-16 pt-12 md:pb-24 md:pt-20 lg:grid-cols-2 lg:gap-16">
        <Reveal from="left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#BF00FF]">VIVA</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] text-white md:text-5xl lg:text-[3.4rem]">
            She shows her work. You decide what stays.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-neutral-300">
            VIVA drafts the Life You Choose with you. You see the line, the reason, and the draft. You keep it,
            change it, or leave it. Nothing becomes yours until you say so.
          </p>
          <DualPathCtas align="start" className="mt-8" />
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {[
              ['Visible', 'Every draft is on the page'],
              ['Editable', 'You can change any line'],
              ['Yours', 'It waits until you keep it'],
            ].map(([label, caption]) => (
              <div key={label}>
                <p className="text-sm font-semibold text-white md:text-base">{label}</p>
                <p className="mt-1 text-xs leading-snug text-neutral-500 md:text-sm">{caption}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal from="right" delay={160}>
          <VisionChat />
        </Reveal>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-[1120px] px-6 py-16 md:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#39FF14]">How she works</p>
          <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight text-white md:text-4xl">
            You stay the author.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['See the draft', 'Every category, constraint, and tool shows the words. There is no hidden decision.'],
              ['Change any line', 'The first draft is hers. The version that stays is the one you edit.'],
              ['Keep only what you choose', 'A vision, a flip, a journal line, an activation. Each one waits for you.'],
            ].map(([title, body], index) => (
              <Reveal key={title} delay={index * 90}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:border-white/20">
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-400">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Feature
        id="vision"
        eyebrow="Life Vision"
        title="A conversation becomes a category."
        body="Talk about what is true now and what you would love instead. VIVA drafts that area of your Life Vision in the present tense, and leaves it on the page for you to keep or rewrite."
        points={[
          'Twelve areas, written so they can agree with each other',
          'The draft stays next to the conversation that made it',
          'Keep it, rewrite it, or keep talking',
        ]}
        demo={<VisionDocument />}
      />

      <Feature
        id="constraints"
        eyebrow="Vibrational Constraints"
        title="She names what is competing with the life you chose."
        body="A constraint is the belief pulling you below the Green Line. VIVA says it plainly, then offers the line above it. You decide whether to flip it."
        points={[
          'The belief is written out, not implied',
          'You see both lines before anything changes',
          'Flip it, or leave it where it is',
        ]}
        demo={<ConstraintWindow />}
        flip
      />

      <Feature
        id="activation"
        eyebrow="Activation"
        title="The vision becomes something you can hear, see, and say."
        body="When a category is yours, VIVA can build the activation around it. Your voice, a song, a manifestation, an incantation. You pick what gets made."
        points={[
          'Nothing generates until the vision is kept',
          'Each piece is tied to the category you just wrote',
          'You enter it when you are ready',
        ]}
        demo={<ActivationWindow />}
      />

      <Feature
        id="alignment"
        eyebrow="Alignment"
        title="Bring the day. She helps you sort it."
        body="A sharp moment does not erase the vision. VIVA separates what happened from the story about what happened, and can save both to your journal when you want a record."
        points={[
          'The moment, the story, and what is true sit side by side',
          'Below the Green Line and above it, both visible',
          'Saving it is a choice, not a side effect',
        ]}
        demo={<AlignmentWindow />}
        flip
      />

      <section className="border-t border-white/10">
        <Reveal className="mx-auto max-w-[720px] px-6 py-20 text-center md:py-28">
          <h2 className="text-3xl font-extrabold leading-tight text-white md:text-5xl">
            See it before it is yours.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-neutral-300">
            Start with one area of your life. VIVA will draft it with you, and you will see every line before you keep it.
          </p>
          <DualPathCtas className="mt-8" />
          <a
            href="#vision"
            className="mt-6 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"
          >
            Watch the draft again
            <ArrowRight className="h-4 w-4" />
          </a>
        </Reveal>
      </section>
    </div>
  )
}
