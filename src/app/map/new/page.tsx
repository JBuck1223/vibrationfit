'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Container,
  Stack,
  Card,
  Button,
  Spinner,
} from '@/lib/design-system/components'
import {
  ArrowLeft,
  Target,
  RotateCw,
  FolderKanban,
  ChevronRight,
  Check,
} from 'lucide-react'
import { useMapStudio } from '@/components/map-studio'
import { LIFE_CATEGORY_KEYS, getVisionCategory } from '@/lib/design-system/vision-categories'
import type { CommitmentType, CadenceKind } from '@/lib/map/types'

type Step = 'choose-type' | 'target-or-commitment' | 'pick-target' | 'new-target' | 'commitment-details' | 'review'

const CADENCE_OPTIONS: { label: string; kind: CadenceKind; count?: number }[] = [
  { label: 'Daily', kind: 'daily' },
  { label: '6x / week', kind: 'days_per_week', count: 6 },
  { label: '5x / week', kind: 'days_per_week', count: 5 },
  { label: '4x / week', kind: 'days_per_week', count: 4 },
  { label: '3x / week', kind: 'days_per_week', count: 3 },
  { label: '2x / week', kind: 'days_per_week', count: 2 },
  { label: '1x / week', kind: 'days_per_week', count: 1 },
]

export default function MapNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedTarget = searchParams.get('target')
  const { targets, refreshAll } = useMapStudio()

  const [step, setStep] = useState<Step>(preselectedTarget ? 'commitment-details' : 'target-or-commitment')
  const [saving, setSaving] = useState(false)

  // Target fields
  const [targetId, setTargetId] = useState<string | null>(preselectedTarget)
  const [targetTitle, setTargetTitle] = useState('')
  const [targetDescription, setTargetDescription] = useState('')
  const [targetCategory, setTargetCategory] = useState('')

  // Commitment fields
  const [commitmentType, setCommitmentType] = useState<CommitmentType>('recurring')
  const [commitmentTitle, setCommitmentTitle] = useState('')
  const [commitmentDescription, setCommitmentDescription] = useState('')
  const [commitmentCategory, setCommitmentCategory] = useState('')
  const [cadenceIndex, setCadenceIndex] = useState(0)
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (preselectedTarget) {
      const t = targets.find(t => t.id === preselectedTarget)
      if (t) {
        setCommitmentCategory(t.category)
      }
    }
  }, [preselectedTarget, targets])

  const handleCreateTarget = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/map/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: targetTitle,
          description: targetDescription || null,
          category: targetCategory,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setTargetId(data.target.id)
        setCommitmentCategory(targetCategory)
        setStep('commitment-details')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCommitment = async () => {
    setSaving(true)
    try {
      const cadenceOpt = CADENCE_OPTIONS[cadenceIndex]
      const cadence = commitmentType === 'recurring'
        ? cadenceOpt.kind === 'daily'
          ? { kind: 'daily' as const }
          : { kind: 'days_per_week' as const, count: cadenceOpt.count! }
        : null

      const res = await fetch('/api/map/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision_target_id: targetId,
          category: commitmentCategory || 'health',
          type: commitmentType,
          title: commitmentTitle,
          description: commitmentDescription || null,
          cadence,
          end_date: endDate || null,
        }),
      })
      if (res.ok) {
        await refreshAll()
        await fetch('/api/map/generate-occurrences', { method: 'POST' })
        router.push(targetId ? `/map/t/${targetId}` : '/map/portfolio')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Back */}
        <button
          onClick={() => {
            if (step === 'target-or-commitment') router.push('/map/portfolio')
            else if (step === 'pick-target') setStep('target-or-commitment')
            else if (step === 'new-target') setStep('target-or-commitment')
            else if (step === 'choose-type') setStep('pick-target')
            else if (step === 'commitment-details') {
              if (preselectedTarget) router.push(`/map/t/${preselectedTarget}`)
              else setStep('choose-type')
            }
            else router.back()
          }}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Step: Choose Target or New Target */}
        {step === 'target-or-commitment' && (
          <>
            <h1 className="text-2xl font-bold text-white">What do you want to create?</h1>
            <div className="space-y-3">
              <OptionCard
                icon={<Target className="w-5 h-5 text-primary-400" />}
                title="New Vision Target"
                description="A meaningful goal tied to your Life Vision"
                onClick={() => setStep('new-target')}
              />
              <OptionCard
                icon={<RotateCw className="w-5 h-5 text-blue-400" />}
                title="Add Commitment to Existing Target"
                description="A recurring or project-based commitment under an existing target"
                onClick={() => {
                  if (targets.filter(t => t.status === 'active').length === 0) {
                    setStep('new-target')
                  } else {
                    setStep('pick-target')
                  }
                }}
              />
            </div>
          </>
        )}

        {/* Step: Pick Existing Target */}
        {step === 'pick-target' && (
          <>
            <h1 className="text-xl font-bold text-white">Choose a Target</h1>
            <div className="space-y-2">
              {targets
                .filter(t => t.status === 'active')
                .map(t => (
                  <Card
                    key={t.id}
                    variant="outlined"
                    className="bg-[#101010] border-[#1F1F1F] cursor-pointer hover:border-primary-500/30 transition-colors"
                    onClick={() => {
                      setTargetId(t.id)
                      setCommitmentCategory(t.category)
                      setStep('choose-type')
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-primary-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{t.title}</p>
                        <p className="text-xs text-neutral-500 capitalize">{t.category}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </div>
                  </Card>
                ))}
            </div>
          </>
        )}

        {/* Step: New Target Form */}
        {step === 'new-target' && (
          <>
            <h1 className="text-xl font-bold text-white">Create Vision Target</h1>
            <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
              <Stack gap="md">
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1.5">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {LIFE_CATEGORY_KEYS.map(key => {
                      const cat = getVisionCategory(key)
                      return (
                        <button
                          key={key}
                          onClick={() => setTargetCategory(key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            targetCategory === key
                              ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/50'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                          }`}
                        >
                          {cat?.label || key}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1.5">Title</label>
                  <input
                    value={targetTitle}
                    onChange={e => setTargetTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500/50"
                    placeholder="e.g., Run a half marathon"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1.5">Description (optional)</label>
                  <textarea
                    value={targetDescription}
                    onChange={e => setTargetDescription(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-primary-500/50"
                    rows={3}
                    placeholder="What does achieving this look like?"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={handleCreateTarget}
                    disabled={saving || !targetTitle.trim() || !targetCategory}
                  >
                    {saving ? <Spinner size="sm" /> : 'Create Target'}
                  </Button>
                  <Button variant="ghost" onClick={() => {
                    setTargetTitle(''); setTargetDescription(''); setTargetCategory('')
                    setStep('target-or-commitment')
                  }}>
                    Cancel
                  </Button>
                </div>
              </Stack>
            </Card>
          </>
        )}

        {/* Step: Choose Commitment Type */}
        {step === 'choose-type' && (
          <>
            <h1 className="text-xl font-bold text-white">What kind of commitment?</h1>
            <div className="space-y-3">
              <OptionCard
                icon={<RotateCw className="w-5 h-5 text-blue-400" />}
                title="Recurring"
                description="Something you do regularly (daily, 3x/week, etc.)"
                onClick={() => { setCommitmentType('recurring'); setStep('commitment-details') }}
              />
              <OptionCard
                icon={<FolderKanban className="w-5 h-5 text-amber-400" />}
                title="Project"
                description="A one-time goal with a start and end date"
                onClick={() => { setCommitmentType('project'); setStep('commitment-details') }}
              />
            </div>
          </>
        )}

        {/* Step: Commitment Details */}
        {step === 'commitment-details' && (
          <>
            <h1 className="text-xl font-bold text-white">
              {commitmentType === 'recurring' ? 'Recurring Commitment' : 'Project Commitment'}
            </h1>
            <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
              <Stack gap="md">
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1.5">Title</label>
                  <input
                    value={commitmentTitle}
                    onChange={e => setCommitmentTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500/50"
                    placeholder={commitmentType === 'recurring' ? 'e.g., Run 3 miles' : 'e.g., Complete fitness program'}
                  />
                </div>

                {!commitmentCategory && (
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1.5">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {LIFE_CATEGORY_KEYS.map(key => {
                        const cat = getVisionCategory(key)
                        return (
                          <button
                            key={key}
                            onClick={() => setCommitmentCategory(key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              commitmentCategory === key
                                ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/50'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                            }`}
                          >
                            {cat?.label || key}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {commitmentType === 'recurring' && (
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1.5">Cadence</label>
                    <div className="flex flex-wrap gap-2">
                      {CADENCE_OPTIONS.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => setCadenceIndex(i)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            cadenceIndex === i
                              ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/50'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {commitmentType === 'project' && (
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1.5">Target End Date (optional)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500/50"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1.5">Description (optional)</label>
                  <textarea
                    value={commitmentDescription}
                    onChange={e => setCommitmentDescription(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-primary-500/50"
                    rows={2}
                    placeholder="Any details or notes"
                  />
                </div>

                <Button
                  variant="primary"
                  onClick={handleCreateCommitment}
                  disabled={saving || !commitmentTitle.trim() || (!commitmentCategory && !preselectedTarget)}
                >
                  {saving ? <Spinner size="sm" /> : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Create Commitment
                    </>
                  )}
                </Button>
              </Stack>
            </Card>
          </>
        )}
      </Stack>
    </Container>
  )
}

function OptionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <Card
      variant="outlined"
      className="bg-[#101010] border-[#1F1F1F] cursor-pointer hover:border-primary-500/30 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-neutral-500">{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />
      </div>
    </Card>
  )
}
