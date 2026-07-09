'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Card, Button, Spinner, Container } from '@/lib/design-system/components'
import { useLifeVisionStudio } from '@/components/life-vision-studio/LifeVisionStudioContext'

/** Dev / flagged QA: see hub UI without fighting auto-redirect */
function useHubPreviewFlags() {
  const searchParams = useSearchParams()
  const allowPreview = useMemo(
    () =>
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_LIFE_VISION_HUB_PREVIEW === 'true',
    []
  )
  const preview = searchParams.get('preview')
  const previewEmpty = preview === 'empty'
  const previewDebug = preview === 'debug'
  const skipRedirect = allowPreview && (previewEmpty || previewDebug)
  return { allowPreview, previewEmpty, previewDebug, skipRedirect }
}

export default function VisionListPage() {
  const router = useRouter()
  const { visions, loading, activeVisionId } = useLifeVisionStudio()
  const redirected = useRef(false)
  const { allowPreview, previewEmpty, previewDebug, skipRedirect } = useHubPreviewFlags()

  useEffect(() => {
    if (skipRedirect) return
    if (loading || redirected.current) return

    if (activeVisionId) {
      redirected.current = true
      router.replace(`/life-vision/${activeVisionId}`)
      return
    }

    // Prefer the user's own personal vision; fall back to a household vision
    // they participate in. A partner's shared personal vision never hijacks
    // the redirect - without a vision of their own, users see the create CTA.
    const firstVision = visions.find(v => !v.is_draft && v.is_mine && !v.is_household)
      || visions.find(v => !v.is_draft && v.is_household)
    if (firstVision?.id) {
      redirected.current = true
      router.replace(`/life-vision/${firstVision.id}`)
    }
  }, [loading, activeVisionId, visions, router, skipRedirect])

  const showSpinner =
    !skipRedirect && (loading || activeVisionId || visions.some(v => !v.is_draft && (v.is_mine || v.is_household)))

  if (showSpinner) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (skipRedirect && loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (previewDebug && allowPreview) {
    return (
      <Container size="xl" className="py-8">
        <Card className="mb-6 border-amber-500/35 bg-amber-500/10 p-4 text-left">
          <p className="text-sm font-semibold text-amber-200 mb-2">Life Vision hub — QA preview (debug)</p>
          <p className="text-xs text-neutral-400 mb-4">
            Normal hub auto-redirects when any non-draft vision exists. Use the links below to inspect states without
            changing data.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/life-vision?preview=empty" className="text-primary-400 hover:text-primary-300 underline">
              ?preview=empty — force &quot;No vision yet&quot; UI
            </Link>
            <span className="text-neutral-600">|</span>
            <Link href="/life-vision" className="text-neutral-400 hover:text-white underline">
              Clear preview (normal redirect)
            </Link>
          </div>
        </Card>

        <Card className="p-4 mb-4">
          <p className="text-xs text-neutral-500 mb-2">
            Context: <span className="text-neutral-300">activeVisionId</span> ={' '}
            <code className="text-primary-400">{activeVisionId ?? 'null'}</code>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead>
                <tr className="border-b border-neutral-700 text-neutral-500 text-xs uppercase tracking-wide">
                  <th className="py-2 pr-4">Version #</th>
                  <th className="py-2 pr-4">id</th>
                  <th className="py-2 pr-4">is_active</th>
                  <th className="py-2 pr-4">is_draft</th>
                  <th className="py-2">Open</th>
                </tr>
              </thead>
              <tbody>
                {visions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-neutral-500">
                      No rows in vision_versions for this user.
                    </td>
                  </tr>
                ) : (
                  visions.map((v) => (
                    <tr key={v.id} className="border-b border-neutral-800/80">
                      <td className="py-2 pr-4 tabular-nums">{v.version_number}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-neutral-400 max-w-[200px] truncate">{v.id}</td>
                      <td className="py-2 pr-4">{String(v.is_active)}</td>
                      <td className="py-2 pr-4">{String(v.is_draft)}</td>
                      <td className="py-2">
                        <Link href={`/life-vision/${v.id}`} className="text-primary-400 hover:underline">
                          /life-vision/{v.id.slice(0, 8)}…
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Container>
    )
  }

  if (previewEmpty && allowPreview) {
    return (
      <Container size="xl" className="py-12">
        {visions.some((v) => !v.is_draft) && (
          <Card className="max-w-lg mx-auto mb-6 border-amber-500/35 bg-amber-500/10 p-4 text-center">
            <p className="text-sm text-amber-200">
              Preview: showing the empty hub even though you have non-draft vision(s). Normal behavior would redirect.
            </p>
            <Link href="/life-vision?preview=debug" className="text-xs text-primary-400 hover:underline mt-2 inline-block">
              Open vision debug instead
            </Link>
          </Card>
        )}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">No vision yet</h3>
            <p className="text-neutral-400 mb-8">
              Start your conscious creation journey by creating your first Life Vision.
            </p>
            <Button asChild size="lg">
              <Link href="/life-vision/new">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Life Vision
              </Link>
            </Button>
          </Card>
        </div>
      </Container>
    )
  }

  if (!allowPreview && (searchParamsSnapshot(previewEmpty, previewDebug))) {
    return null
  }

  return (
    <Container size="xl" className="py-12">
      <div className="text-center">
        <Card className="max-w-md mx-auto">
          <h3 className="text-2xl font-bold text-white mb-4">No vision yet</h3>
          <p className="text-neutral-400 mb-8">
            Start your conscious creation journey by creating your first Life Vision.
          </p>
          <Button asChild size="lg">
            <Link href="/life-vision/new">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Life Vision
            </Link>
          </Button>
        </Card>
      </div>
    </Container>
  )
}

function searchParamsSnapshot(empty: boolean, debug: boolean) {
  return empty || debug
}
