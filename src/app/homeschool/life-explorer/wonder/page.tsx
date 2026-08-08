'use client'

import { useCallback, useEffect, useState } from 'react'
import { Container, Stack, Spinner, Button, Input } from '@/lib/design-system/components'
import type { LeWonderItem } from '@/lib/life-explorer/types'

type Tab = 'know' | 'wonder' | 'learned'

export default function WonderWallPage() {
  const [tab, setTab] = useState<Tab>('wonder')
  const [expeditionId, setExpeditionId] = useState<string | null>(null)
  const [wall, setWall] = useState<{
    know: LeWonderItem[]
    wonder: LeWonderItem[]
    learned: LeWonderItem[]
  }>({ know: [], wonder: [], learned: [] })
  const [loading, setLoading] = useState(true)
  const [statement, setStatement] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const today = await fetch('/api/life-explorer/lessons/today').then((r) => r.json())
      if (!today.expedition?.id) {
        setExpeditionId(null)
        setWall({ know: [], wonder: [], learned: [] })
        return
      }
      setExpeditionId(today.expedition.id)
      const res = await fetch(`/api/life-explorer/wonder?expedition_id=${today.expedition.id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setWall(json.wonder_wall)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function addItem() {
    if (!expeditionId || !statement.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/wonder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expedition_id: expeditionId,
          kind: tab,
          statement: statement.trim(),
          interest_level: tab === 'wonder' ? 4 : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')
      setStatement('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container size="md" className="py-20 flex justify-center">
        <Spinner />
      </Container>
    )
  }

  const items = wall[tab]

  return (
    <Container size="md" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <h2 className="text-3xl font-bold text-white">Wonder Wall</h2>
          <p className="text-neutral-400 mt-2">
            Preserve Oliver&apos;s language. Don&apos;t auto-correct &ldquo;Know&rdquo; statements.
          </p>
        </div>

        {!expeditionId && (
          <p className="text-amber-200 text-sm">
            No active expedition yet. Start from Today to create Travel → Antarctica.
          </p>
        )}

        <div className="flex gap-2">
          {(['know', 'wonder', 'learned'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-sm capitalize border ${
                tab === t
                  ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
                  : 'border-[#333] text-neutral-300'
              }`}
            >
              {t === 'know' ? 'Know' : t === 'wonder' ? 'Wonder' : 'Learned'}
            </button>
          ))}
        </div>

        {error && <p className="text-red-300 text-sm">{error}</p>}

        <ul className="space-y-3">
          {items.length === 0 && (
            <li className="text-neutral-500 text-sm">Nothing here yet.</li>
          )}
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[#222] bg-[#111] px-4 py-3 text-neutral-200"
            >
              <p>{item.statement}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {item.status}
                {item.interest_level ? ` · interest ${item.interest_level}/5` : ''}
              </p>
            </li>
          ))}
        </ul>

        {expeditionId && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder={
                tab === 'know'
                  ? 'What does he already believe?'
                  : tab === 'wonder'
                    ? 'What does he wonder?'
                    : 'What did he learn?'
              }
            />
            <Button onClick={addItem} disabled={saving || !statement.trim()} variant="primary">
              {saving ? 'Saving…' : 'Add'}
            </Button>
          </div>
        )}
      </Stack>
    </Container>
  )
}
