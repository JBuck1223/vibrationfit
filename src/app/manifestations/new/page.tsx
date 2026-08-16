'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Input, Textarea, Stack, CategoryGrid } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query/keys'
import { GatherFromLibrary } from '@/components/manifestations-studio/GatherFromLibrary'

const LIFE_CATEGORIES = VISION_CATEGORIES.filter(
  c => c.key !== 'forward' && c.key !== 'conclusion',
)

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[#2A2A2A]" />
      <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{children}</p>
      <div className="h-px flex-1 bg-[#2A2A2A]" />
    </div>
  )
}

export default function NewManifestationPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [chosenReality, setChosenReality] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [kitId, setKitId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const create = async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/manifestations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        chosen_reality: chosenReality.trim() || null,
        life_categories: categories,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      setError('Could not open this manifestation.')
      return
    }
    const data = await res.json()
    setKitId(data.kit.id)
    void queryClient.invalidateQueries({ queryKey: keys.manifestationKits })
  }

  return (
    <Container size="xl">
      <Card
        variant="outlined"
        className="!p-0 md:!p-6 lg:!p-8 !bg-transparent !border-transparent !rounded-none md:!rounded-2xl md:!bg-[#101010] md:!border-[#1F1F1F]"
      >
        <Stack gap="lg">
          {!kitId ? (
            <>
              <section className="space-y-3">
                <SectionLabel>Name</SectionLabel>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Japan · the body I choose · $1M Vibration Fit"
                />
              </section>
              <section className="space-y-3">
                <SectionLabel>Chosen reality</SectionLabel>
                <Textarea
                  value={chosenReality}
                  onChange={e => setChosenReality(e.target.value)}
                  placeholder="One sentence of the identity you are practicing"
                  rows={3}
                />
              </section>
              <section className="space-y-3">
                <SectionLabel>Categories</SectionLabel>
                <CategoryGrid
                  categories={LIFE_CATEGORIES}
                  selectedCategories={categories}
                  onCategoryClick={(key) => {
                    setCategories(prev =>
                      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key],
                    )
                  }}
                  mode="selection"
                  lifeVisionCategoryStrip
                  desktopColumnCount={6}
                />
              </section>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button variant="primary" onClick={create} disabled={!title.trim() || saving}>
                {saving ? 'Opening…' : 'Open'}
              </Button>
            </>
          ) : (
            <>
              <section className="space-y-3">
                <SectionLabel>Gather</SectionLabel>
                <p className="text-sm text-neutral-400 text-center">
                  Life Vision, stories, journal, and board items in these categories. Uncheck anything that is not this reality.
                </p>
              </section>
              <GatherFromLibrary
                kitId={kitId}
                categories={categories}
                query={title}
                onPinned={() => router.push(`/manifestations/${kitId}`)}
              />
              <Button variant="ghost" onClick={() => router.push(`/manifestations/${kitId}`)}>
                Continue without gathering
              </Button>
            </>
          )}
        </Stack>
      </Card>
    </Container>
  )
}
