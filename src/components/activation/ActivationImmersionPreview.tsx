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
  Compass,
  Download,
  HelpCircle,
  Images,
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
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-[#39FF14]" />
          <Text size="sm" className="text-[#39FF14] font-semibold uppercase tracking-wider">
            {copy.categoryTitle(categoryLabel)}
          </Text>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{copy.headline}</h1>
      </div>

      <Card variant="outlined" className="bg-[#101010] border-[#BF00FF]/30 p-5 md:p-8">
        <Stack gap="md">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-[#BF00FF]" />
            <Text size="sm" className="text-white font-semibold">{copy.guideTitle}</Text>
          </div>
          <ol className="space-y-2">
            {copy.guideSteps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-neutral-300 leading-relaxed">
                <span className="text-[#BF00FF] font-semibold flex-shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
          {!showOffer && (
            <Button variant="secondary" size="sm" className="w-full sm:w-auto">
              <CheckCircle className="mr-2 h-4 w-4" />
              {copy.guideDone}
            </Button>
          )}
        </Stack>
      </Card>

      <Card variant="outlined" className="bg-[#101010] border-[#39FF14]/20 p-5 md:p-8">
        <Stack gap="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#39FF14]" />
              <Text size="sm" className="text-white font-semibold">{copy.lifeIChoose}</Text>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs font-medium">
              {sample.essence}
            </span>
          </div>
          <p className="text-base md:text-lg text-neutral-100 leading-relaxed whitespace-pre-line">
            {sample.visionStatement}
          </p>
          <div>
            <Button variant="ghost" size="sm">
              <Download className="mr-1.5 h-4 w-4" />
              {copy.download}
            </Button>
          </div>
        </Stack>
      </Card>

      <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
        <Stack gap="md">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#00FFFF]" />
            <Text size="sm" className="text-white font-semibold">{copy.story}</Text>
          </div>
          <p className="text-sm md:text-base text-neutral-200 leading-relaxed whitespace-pre-line">
            {sample.story}
          </p>
        </Stack>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
          <Stack gap="md">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-[#FFB701]" />
              <Text size="sm" className="text-white font-semibold">{copy.incantation}</Text>
            </div>
            <p className="text-xs text-neutral-500">{copy.incantationHint}</p>
            <p className="text-sm md:text-base text-neutral-100 leading-relaxed whitespace-pre-line italic">
              {sample.incantation}
            </p>
          </Stack>
        </Card>
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
          <Stack gap="md">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-[#BF00FF]" />
              <Text size="sm" className="text-white font-semibold">{copy.sparkQuery}</Text>
            </div>
            <p className="text-xs text-neutral-500">{copy.sparkHint}</p>
            <Stack gap="sm">
              {sample.sparkQuestions.map((q) => (
                <p key={q} className="text-sm md:text-base text-neutral-100 leading-relaxed">{q}</p>
              ))}
            </Stack>
          </Stack>
        </Card>
      </div>

      <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] p-5 md:p-8">
        <Stack gap="md">
          <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em]">
            {copy.arriving}
          </Text>
          <div className="flex items-center gap-3">
            <Music className="h-5 w-5 text-neutral-500" />
            <Text size="sm" className="text-white font-medium">{copy.song}</Text>
            <span className="ml-auto text-xs text-neutral-400">{copy.creating}</span>
          </div>
          <div className="flex items-center gap-3">
            <Images className="h-5 w-5 text-neutral-500" />
            <Text size="sm" className="text-white font-medium">{copy.images}</Text>
            <span className="ml-auto text-xs text-neutral-400">{copy.creating}</span>
          </div>
          <p className="text-xs text-neutral-500">{copy.keepNote}</p>
        </Stack>
      </Card>

      {showOffer && (
        <>
          <Card variant="outlined" className="bg-[#101010] border-[#39FF14]/30 p-5 md:p-8">
            <div className="text-center">
              <Stack gap="md">
                <h3 className="text-lg md:text-2xl font-bold text-white">{copy.offerTitle}</h3>
                <p className="text-sm md:text-base text-neutral-400 max-w-xl mx-auto leading-relaxed">
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
                <Text size="sm" className="text-white font-semibold">{copy.inspiredTitle}</Text>
                <p className="text-xs text-neutral-500 mt-1">{copy.inspiredHint}</p>
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
