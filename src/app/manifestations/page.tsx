'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Layers, Plus, Filter } from 'lucide-react'
import { Container, Card, Button, ButtonLink, Spinner, Stack, CategoryGrid } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { useManifestationsStudio } from '@/components/manifestations-studio'
import type { KitStatus } from '@/lib/manifestations/types'

const LIFE_CATEGORIES = VISION_CATEGORIES.filter(
  c => c.key !== 'forward' && c.key !== 'conclusion',
)

export default function ManifestationsPage() {
  const { kits, loading } = useManifestationsStudio()
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])
  const [statusFilter, setStatusFilter] = useState<'all' | KitStatus>('all')

  const filtered = useMemo(() => {
    return kits.filter(kit => {
      if (statusFilter !== 'all' && kit.status !== statusFilter) return false
      if (selectedCategories.includes('all')) return true
      return selectedCategories.some(c => kit.life_categories.includes(c))
    })
  }, [kits, selectedCategories, statusFilter])

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="flex items-center justify-between">
          <Link
            href="/manifestations/new"
            className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-[#39FF14]/30 transition-all duration-200"
            aria-label="New manifestation"
          >
            <Plus className="w-6 h-6 text-[#39FF14]" />
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {showFilters && (
          <div className="animate-in slide-in-from-top duration-300">
            <Card variant="elevated" className="p-4 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white text-center mb-4">Status</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {(['all', 'open', 'actualized'] as const).map(value => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        statusFilter === value
                          ? 'bg-[#39FF14]/20 text-white border-[#39FF14]/30'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white hover:border-neutral-500'
                      }`}
                    >
                      {value === 'all' ? 'All' : value === 'actualized' ? 'Actualized' : 'Open'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Categories</h3>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (selectedCategories.includes('all')) setSelectedCategories([])
                      else setSelectedCategories(['all'])
                    }}
                  >
                    {selectedCategories.includes('all') ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <CategoryGrid
                  categories={LIFE_CATEGORIES}
                  selectedCategories={
                    selectedCategories.includes('all')
                      ? LIFE_CATEGORIES.map(c => c.key)
                      : selectedCategories
                  }
                  onCategoryClick={(key) => {
                    if (selectedCategories.includes(key)) {
                      setSelectedCategories(prev => prev.filter(c => c !== key))
                    } else {
                      setSelectedCategories(prev => [...prev.filter(c => c !== 'all'), key])
                    }
                  }}
                  mode="selection"
                  lifeVisionCategoryStrip
                  desktopColumnCount={6}
                />
              </div>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Layers className="mx-auto h-8 w-8 text-neutral-600" />
            <p className="mt-4 text-white">No manifestations yet.</p>
            <p className="mt-2 text-sm text-neutral-400">
              Open one yourself, gather what you already have, or ask VIVA to help.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/manifestations/new" variant="primary" size="sm">New</ButtonLink>
              <ButtonLink href="/viva" variant="ghost" size="sm">Talk with VIVA</ButtonLink>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-[#111] overflow-hidden divide-y divide-white/[0.06]">
            {filtered.map(kit => (
              <Link
                key={kit.id}
                href={`/manifestations/${kit.id}`}
                className="block hover:bg-white/[0.03] transition-colors"
              >
                <div className="px-4 py-3.5 md:px-5 md:py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white truncate">{kit.title}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        kit.status === 'actualized'
                          ? 'text-primary-400 bg-primary-500/10 border-primary-500/30'
                          : 'text-neutral-400 bg-[#1A1A1A] border-[#282828]'
                      }`}>
                        {kit.status === 'actualized' ? 'Actualized' : 'Open'}
                      </span>
                    </div>
                    {kit.chosen_reality && (
                      <p className="mt-1 text-sm text-neutral-400 line-clamp-2">{kit.chosen_reality}</p>
                    )}
                    <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      {kit.life_categories.join(' · ') || 'Uncategorized'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-[11px] uppercase tracking-[0.16em] text-neutral-500 space-y-1">
                    <p>{kit.activations_this_week} this week</p>
                    <p>{kit.project_count} projects</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Stack>
    </Container>
  )
}
