'use client'
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getPageType } from '@/lib/navigation'
import { ROOM_TABS, toolForHref, roomForHref } from '@/lib/rooms/catalog'
import {
  EMPTY_CONTINUITY,
  normalizeContinuity,
  playbackSchema,
  type Continuity,
  type ContinuityAction,
} from '@/lib/rooms/continuity'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
const Context = createContext<{
  state: Continuity
  saving: boolean
  error: string
  dispatch: (action: ContinuityAction) => Promise<void>
}>({
  state: EMPTY_CONTINUITY,
  saving: false,
  error: '',
  dispatch: async () => {},
})
export const useMemberExperience = () => useContext(Context)
export function MemberExperience({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const search = useSearchParams()
  const active =
    getPageType(pathname) === 'USER' &&
    !pathname.includes('/print') &&
    !pathname.startsWith('/session/')
  const [state, setState] = useState<Continuity>(EMPTY_CONTINUITY)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [keyboard, setKeyboard] = useState(false)
  const revision = useRef(0)
  const identity = useRef<string | null>(null)
  const chain = useRef(Promise.resolve())
  const lastVisit = useRef('')
  useEffect(() => {
    const client = createClient()
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null
      if (identity.current !== id) {
        revision.current++
        identity.current = id
        setUserId(id)
        setState(EMPTY_CONTINUITY)
        lastVisit.current = ''
        useGlobalAudioStore.getState().stop()
      }
    })
    return () => subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!active || !userId) return
    let cancelled = false
    const refresh = () => {
      const started = revision.current
      fetch('/api/member-home', { cache: 'no-store' })
        .then(async (r) => {
          if (!r.ok) throw Error()
          return r.json()
        })
        .then((data) => {
          if (
            !cancelled &&
            data.userId === identity.current &&
            started === revision.current
          )
            setState(normalizeContinuity(data.state))
        })
        .catch(() => {
          if (!cancelled)
            setError(
              'Saved activity is unavailable. Your tools are still ready to use.',
            )
        })
    }
    refresh()
    window.addEventListener('focus', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('focus', refresh)
    }
  }, [active, userId])
  const dispatch = useCallback(async (action: ContinuityAction) => {
    const owner = identity.current
    if (!owner) return
    chain.current = chain.current.then(async () => {
      if (identity.current !== owner) return
      revision.current++
      setSaving(true)
      try {
        const r = await fetch('/api/member-home', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
          keepalive: action.type === 'playback',
        })
        if (!r.ok) throw Error()
        const data = await r.json()
        if (identity.current === owner) {
          revision.current++
          setState(normalizeContinuity(data.state))
          setError('')
        }
      } catch {
        if (identity.current === owner)
          setError(
            'Your latest activity could not be saved. Check your connection and try again.',
          )
      } finally {
        if (identity.current === owner) setSaving(false)
      }
    })
    return chain.current
  }, [])
  useEffect(() => {
    if (!active || !userId) return
    // Store only navigation identifiers, never message text or arbitrary query values.
    const params = new URLSearchParams()
    for (const key of ['thread', 'kind', 'step']) {
      const v = search.get(key)
      if (v && /^[a-zA-Z0-9_-]+$/.test(v)) params.set(key, v)
    }
    const href = pathname + (params.size ? '?' + params.toString() : '')
    const tool = toolForHref(href)
    if (!tool || lastVisit.current === href) return
    lastVisit.current = href
    void dispatch({
      type: 'visit',
      id: crypto.randomUUID(),
      toolId: tool.id,
      href,
      at: Date.now(),
    })
  }, [pathname, search, active, userId, dispatch])
  useEffect(() => {
    if (!userId) return
    let lastSaved = 0
    const save = () => {
      const s = useGlobalAudioStore.getState()
      if (!s.tracks.length) return
      const parsed = playbackSchema.safeParse({
        ...s,
        updatedAt: Date.now(),
        tracks: s.tracks.map((t) => ({ ...t, duration: t.duration || 0 })),
      })
      if (parsed.success) {
        lastSaved = Date.now()
        void dispatch({ type: 'playback', checkpoint: parsed.data })
      }
    }
    const unsubscribe = useGlobalAudioStore.subscribe((s, prev) => {
      if (
        s.tracks.length &&
        (s.isPlaying !== prev.isPlaying ||
          s.currentIndex !== prev.currentIndex ||
          Date.now() - lastSaved > 15000)
      )
        save()
    })
    const onHidden = () => {
      if (document.visibilityState === 'hidden') save()
    }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', save)
    return () => {
      unsubscribe()
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', save)
    }
  }, [userId, dispatch])
  useEffect(() => {
    const vv = window.visualViewport
    const update = () =>
      setKeyboard(Boolean(vv && window.innerHeight - vv.height > 150))
    vv?.addEventListener('resize', update)
    return () => vv?.removeEventListener('resize', update)
  }, [])
  useEffect(() => {
    document.body.classList.toggle('member-navigation', active && !keyboard)
    return () => document.body.classList.remove('member-navigation')
  }, [active, keyboard])
  return (
    <Context.Provider value={{ state, saving, error, dispatch }}>
      {children}
      {active && !keyboard && (
        <nav className="room-nav" aria-label="Main rooms">
          {ROOM_TABS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              aria-current={roomForHref(pathname) === t.id ? 'page' : undefined}
            >
              <t.icon size={21} />
              <span>{t.name}</span>
            </Link>
          ))}
        </nav>
      )}
    </Context.Provider>
  )
}
