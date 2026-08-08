'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container, Stack, Spinner, Button, Input } from '@/lib/design-system/components'
import type { LifeCategoryKey } from '@/lib/life-explorer/types'

const CATEGORIES: LifeCategoryKey[] = [
  'fun',
  'health',
  'travel',
  'love',
  'family',
  'social',
  'home',
  'work',
  'money',
  'stuff',
  'giving',
  'spirituality',
]

export default function ChangeDirectionPage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState<string | null>(null)
  const [currentTitle, setCurrentTitle] = useState<string | null>(null)
  const [lifeCategory, setLifeCategory] = useState<LifeCategoryKey>('travel')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/life-explorer/lessons/today')
        const json = await res.json()
        setStudentId(json.student?.id || null)
        setCurrentTitle(json.expedition?.title || null)
        if (json.expedition?.life_category) {
          setLifeCategory(json.expedition.life_category)
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function startNewExpedition() {
    if (!studentId || !title.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/life-explorer/expeditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          life_category: lifeCategory,
          title: title.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to change direction')

      await fetch('/api/life-explorer/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      })

      router.push('/homeschool/life-explorer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
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

  return (
    <Container size="md" className="py-10 md:py-14">
      <Stack gap="lg">
        <div>
          <Link href="/homeschool/life-explorer" className="text-sm text-neutral-400 hover:text-white">
            ← Today
          </Link>
          <h2 className="text-3xl font-bold text-white mt-3">Change Direction</h2>
          <p className="text-neutral-400 mt-2">
            {currentTitle
              ? `Current expedition (${currentTitle}) will be paused. You are never “behind.”`
              : 'Start a new expedition when curiosity points somewhere new.'}
          </p>
        </div>

        {error && <p className="text-red-300 text-sm">{error}</p>}

        <label className="block">
          <span className="text-sm text-neutral-300 mb-2 block">Life Category</span>
          <select
            value={lifeCategory}
            onChange={(e) => setLifeCategory(e.target.value as LifeCategoryKey)}
            className="w-full rounded-xl border border-[#333] bg-[#111] text-white px-4 py-3"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-neutral-300 mb-2 block">New Expedition title</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Antarctica, Volcanoes, Our Kitchen"
          />
        </label>

        <Button
          variant="primary"
          size="lg"
          disabled={!studentId || !title.trim() || saving}
          onClick={startNewExpedition}
        >
          {saving ? 'Starting…' : 'Start New Expedition'}
        </Button>
      </Stack>
    </Container>
  )
}
