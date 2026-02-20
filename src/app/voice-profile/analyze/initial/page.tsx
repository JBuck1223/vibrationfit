'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  Stack,
  Inline,
  Button,
  Spinner,
  Badge,
  PageHero,
} from '@/lib/design-system/components'
import { Sparkles } from 'lucide-react'

export default function InitialVoiceAnalyzerPage() {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [samplesAnalyzed, setSamplesAnalyzed] = useState<number | null>(null)

  const handleRunInitialAnalysis = async () => {
    try {
      setRunning(true)
      setStatusMessage(null)
      setErrorMessage(null)
      setSamplesAnalyzed(null)

      const response = await fetch('/api/voice-profile/analyze/initial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to run initial analysis.')
      }

      const data = await response.json()
      setSamplesAnalyzed(data.samples_analyzed ?? 0)
      setStatusMessage('Initial voice profile created! Redirecting to voice profile page...')
      
      setTimeout(() => {
        router.push('/voice-profile')
      }, 2000)
    } catch (error) {
      console.error('initial voice analysis error', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to run initial analysis.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        <PageHero
          title="Initial Voice Analyzer"
          subtitle="Generate your first voice profile based on your clarity statements from your active profile. This gives VIVA a starting point to write in your voice before you have scenes, journals, or vision paragraphs."
        />

        <Card className="p-6 space-y-6">
          <Stack gap="sm">
            <h2 className="text-xl md:text-2xl font-semibold text-white">How It Works</h2>
            <ul className="space-y-2 text-neutral-300 text-sm md:text-base">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>We analyze your clarity statements from your active profile</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>VIVA infers your natural writing style from these statements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>A new voice profile is created and set as your active profile</span>
              </li>
            </ul>
          </Stack>

          <Stack gap="sm">
            <h3 className="text-lg font-semibold text-white">Requirements</h3>
            <p className="text-neutral-400 text-sm">
              You must have completed at least some of your clarity fields in your active profile. The more fields you've filled out, the better the analysis will be.
            </p>
          </Stack>

          <Stack gap="sm">
            <h3 className="text-lg font-semibold text-white">When to Use This</h3>
            <Badge variant="info" className="w-fit">Create From Active Profile</Badge>
            <ul className="space-y-2 text-neutral-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-secondary-500 mt-1">✓</span>
                <span>You're new to Vibration Fit and don't have scenes or journals yet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary-500 mt-1">✓</span>
                <span>You want a quick voice profile to get started immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary-500 mt-1">✓</span>
                <span>You've recently updated your profile and want to refresh your voice</span>
              </li>
            </ul>
          </Stack>

          <div className="border-t border-neutral-800 pt-6">
            <Inline gap="sm" wrap justify="between" align="center">
              <div>
                <p className="text-sm text-neutral-400">
                  Ready to generate your voice profile?
                </p>
              </div>
              <Button 
                variant="primary" 
                size="md" 
                onClick={handleRunInitialAnalysis} 
                loading={running}
                className="flex items-center gap-2"
              >
                {running ? (
                  <>
                    <Spinner variant="primary" size="sm" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Run Initial Analysis
                  </>
                )}
              </Button>
            </Inline>
          </div>

          {samplesAnalyzed !== null && (
            <div className="bg-primary-500/10 border border-primary-500/40 rounded-xl p-4 text-sm text-primary-200">
              Analyzed {samplesAnalyzed} clarity statements from your profile.
            </div>
          )}

          {statusMessage && (
            <div className="bg-primary-500/10 border border-primary-500/40 rounded-xl p-4 text-sm text-primary-200">
              {statusMessage}
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 text-sm text-red-200">
              {errorMessage}
            </div>
          )}
        </Card>

        <Card className="p-6 bg-neutral-900/60">
          <Stack gap="sm">
            <h3 className="text-lg font-semibold text-white">What's Next?</h3>
            <p className="text-neutral-400 text-sm">
              After running the initial analysis, you can:
            </p>
            <ul className="space-y-2 text-neutral-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-neutral-500">→</span>
                <span>View and edit your voice profile manually</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neutral-500">→</span>
                <span>Manually edit your voice profile sliders for precise control</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neutral-500">→</span>
                <span>Start creating scenes, journals, or visions, then re-run the analyzer with those samples</span>
              </li>
            </ul>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

