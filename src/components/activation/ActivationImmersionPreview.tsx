'use client'

import {
  Button,
  Card,
  Stack,
  Text,
  Textarea,
} from '@/lib/design-system/components'
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Download,
  HelpCircle,
  Images,
  Map,
  Mic,
  Music,
  Sparkles,
} from 'lucide-react'
import { getVisionCategoryLabel, type VisionCategoryKey } from '@/lib/design-system/vision-categories'
import { ACTIVATION_COPY, ACTIVATION_SAMPLE } from '@/lib/activation/copy'

export function ActivationImmersionPreview({
  showOffer,
}: {
  showOffer: boolean
}) {
  const copy = ACTIVATION_COPY.immersion
  const sample = ACTIVATION_SAMPLE
  const categoryLabel = getVisionCategoryLabel(sample.category as VisionCategoryKey)

  return (
    <Stack gap="lg">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#39FF14]">
          {copy.categoryTitle(categoryLabel)}
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
          {copy.headline}
        </h1>
        <div className="mx-auto mt-8 w-full max-w-3xl">
          <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-[#222] bg-[#0D0D0D] px-6">
            <p className="text-sm leading-relaxed text-neutral-500">{copy.heroVideoPlaceholder}</p>
          </div>
          <p className="mt-2 text-center text-[11px] uppercase tracking-wider text-neutral-600">
            {copy.heroVideoLabel}
          </p>
        </div>
      </div>

      <Card variant="outlined" className="bg-[#101010] border-[#BF00FF]/30 p-6 md:p-10">
        <Stack gap="lg">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#BF00FF]/10 text-[#BF00FF]">
              <Map className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">{copy.mapTitle}</h2>
              <p className="mt-2 text-base text-neutral-400">{copy.mapLead}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {copy.mapStops.map((stop, i) => (
              <div
                key={stop.id}
                className="rounded-2xl border-2 border-[#222] bg-[#0D0D0D] p-5"
              >
                <span className="text-sm font-semibold text-[#39FF14]">{i + 1}</span>
                <p className="mt-2 text-lg font-semibold text-white">{stop.title}</p>
                <p className="mt-1 text-sm text-neutral-400">{stop.use}</p>
              </div>
            ))}
          </div>
          {!showOffer && (
            <div>
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                <CheckCircle className="mr-2 h-4 w-4" />
                {copy.guideDone}
              </Button>
            </div>
          )}
        </Stack>
      </Card>

      <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-6 md:p-10">
        <Stack gap="lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#39FF14]/10 text-[#39FF14]">
                <Sparkles className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-white md:text-3xl">{copy.lifeIChoose}</h2>
                <p className="mt-2 text-base text-neutral-400">{copy.lifeIChooseHint}</p>
              </div>
            </div>
            <span className="rounded-full border border-[#39FF14]/30 bg-[#39FF14]/10 px-3 py-1 text-xs font-medium text-[#39FF14]">
              {sample.essence}
            </span>
          </div>
          <p className="text-base leading-relaxed whitespace-pre-line text-neutral-100 md:text-lg">
            {sample.visionStatement}
          </p>
        </Stack>
      </Card>

      <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-6 md:p-10">
        <Stack gap="lg">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#00FFFF]/10 text-[#00FFFF]">
              <BookOpen className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">{copy.story}</h2>
              <p className="mt-2 text-base text-neutral-400">{copy.storyHint}</p>
            </div>
          </div>
          <p className="text-base leading-relaxed whitespace-pre-line text-neutral-200 md:text-lg">
            {sample.story}
          </p>
        </Stack>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-6 md:p-10">
          <Stack gap="lg">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFB701]/10 text-[#FFB701]">
                <Mic className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-white md:text-3xl">{copy.incantation}</h2>
                <p className="mt-2 text-base text-neutral-400">{copy.incantationHint}</p>
              </div>
            </div>
            <p className="text-base italic leading-relaxed whitespace-pre-line text-neutral-100 md:text-lg">
              {sample.incantation}
            </p>
          </Stack>
        </Card>
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-6 md:p-10">
          <Stack gap="lg">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#BF00FF]/10 text-[#BF00FF]">
                <HelpCircle className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-white md:text-3xl">{copy.sparkQuery}</h2>
                <p className="mt-2 text-base text-neutral-400">{copy.sparkHint}</p>
              </div>
            </div>
            <Stack gap="sm">
              {sample.sparkQuestions.map((q) => (
                <p key={q} className="text-base leading-relaxed text-neutral-100 md:text-lg">{q}</p>
              ))}
            </Stack>
          </Stack>
        </Card>
      </div>

      <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-6 md:p-10">
        <Stack gap="md">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FF4D8D]/10 text-[#FF4D8D]">
              <Music className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">{copy.song}</h2>
              <p className="mt-2 text-base text-neutral-400">{copy.songHint}</p>
            </div>
          </div>
          <p className="text-sm text-neutral-500">{copy.creating}</p>
        </Stack>
      </Card>

      <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-6 md:p-10">
        <Stack gap="md">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#00FFFF]/10 text-[#00FFFF]">
              <Images className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">{copy.images}</h2>
              <p className="mt-2 text-base text-neutral-400">{copy.imagesHint}</p>
            </div>
          </div>
          <p className="text-sm text-neutral-500">{copy.creating}</p>
        </Stack>
      </Card>

      {showOffer && (
        <>
          <Card variant="outlined" className="bg-[#101010] border-[#39FF14]/30 p-5 md:p-8">
            <div className="text-center">
              <Stack gap="md">
                <h3 className="text-lg font-bold text-white md:text-2xl">{copy.offerTitle}</h3>
                <p className="mx-auto max-w-4xl text-base leading-relaxed text-neutral-400 md:text-lg">
                  {copy.offerBody}
                </p>
                <div className="flex justify-center">
                  <Button variant="primary" size="sm">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {copy.offerCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Stack>
            </div>
          </Card>

          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
            <Stack gap="md">
              <div>
                <Text size="sm" className="font-semibold text-white">{copy.inspiredTitle}</Text>
                <p className="mt-1 text-xs text-neutral-500">{copy.inspiredHint}</p>
              </div>
              <Textarea
                value={sample.inspiredStep}
                readOnly
                placeholder={copy.inspiredPlaceholder}
                rows={3}
              />
              <div>
                <Button variant="secondary" size="sm">{copy.inspiredSave}</Button>
              </div>
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  )
}
