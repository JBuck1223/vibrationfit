// /src/app/dashboard/(storage-studio)/storage/page.tsx
// Storage usage — minimal layout aligned with account overview

'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Badge, ProgressBar, Stack, Spinner } from '@/lib/design-system/components'
import { HardDrive, Image, Music, FileText, Folder, ExternalLink, X } from 'lucide-react'

interface StorageData {
  totalFiles: number
  totalSize: number
  storageByType: Record<
    string,
    {
      count: number
      totalSize: number
      files: unknown[]
    }
  >
  recentFiles: Array<{
    name: string
    path: string
    size: number
    created_at: string
  }>
  storageQuotaGB: number
  storageQuotaBytes: number
}

const FOLDER_LABELS: Record<string, { label: string; icon: typeof Image; color: string }> = {
  profile: { label: 'Profile', icon: Image, color: 'text-[#39FF14]' },
  'vision-board': { label: 'Vision Board', icon: Image, color: 'text-[#BF00FF]' },
  journal: { label: 'Journal', icon: FileText, color: 'text-[#FFFF00]/90' },
  'life-vision': { label: 'Life Vision', icon: Music, color: 'text-[#00FFFF]' },
  'alignment-plan': { label: 'Alignment Plans', icon: FileText, color: 'text-[#39FF14]/80' },
  'custom-tracks': { label: 'Custom Audio', icon: Music, color: 'text-[#BF00FF]/80' },
  other: { label: 'Other', icon: Folder, color: 'text-neutral-400' },
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default function StoragePage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<StorageData | null>(null)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null)

  useEffect(() => {
    const fetchStorageData = async () => {
      try {
        const response = await fetch('/api/storage/usage')
        if (!response.ok) throw new Error('Failed to fetch storage data')
        const storageData = await response.json()
        setData(storageData)
      } catch (error) {
        console.error('Error fetching storage data:', error)
      } finally {
        setLoading(false)
      }
    }
    void fetchStorageData()
  }, [])

  const storageLimit = data?.storageQuotaBytes || 5 * 1024 * 1024 * 1024
  const usagePercentage = data ? Math.min(100, (data.totalSize / storageLimit) * 100) : 0

  if (loading) {
    return (
      <Container size="xl" className="pt-2 pb-6 sm:pb-8">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        <h1 className="sr-only">Storage usage</h1>

        <Card variant="glass" className="border border-white/[0.06] p-4 shadow-none sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">Usage</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-2xl font-semibold tabular-nums text-white sm:text-3xl">
                  {formatBytes(data?.totalSize || 0)}
                </span>
                <span className="text-sm text-neutral-500">
                  of {formatBytes(storageLimit)}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {data?.totalFiles ?? 0} {(data?.totalFiles ?? 0) === 1 ? 'file' : 'files'} tracked in your workspace
              </p>
            </div>
            <Badge
              variant={usagePercentage > 80 ? 'warning' : 'neutral'}
              className="shrink-0 self-start rounded-full px-3 py-1 text-xs font-medium"
            >
              {usagePercentage.toFixed(1)}% used
            </Badge>
          </div>
          <div className="mt-5">
            <ProgressBar
              value={usagePercentage}
              variant={usagePercentage > 80 ? 'warning' : 'primary'}
              showLabel={false}
            />
          </div>
        </Card>

        <Card variant="glass" className="border border-white/[0.06] p-4 shadow-none sm:p-5">
          <h2 className="text-sm font-semibold text-white">By folder</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Where your uploads live in storage</p>

          {data?.storageByType && Object.keys(data.storageByType).length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
              {Object.entries(data.storageByType)
                .sort(([, a], [, b]) => b.totalSize - a.totalSize)
                .map(([folder, stats]) => {
                  const config = FOLDER_LABELS[folder] || FOLDER_LABELS.other
                  const IconComponent = config.icon
                  const pct = (stats.totalSize / (data.totalSize || 1)) * 100
                  return (
                    <div
                      key={folder}
                      className="flex min-w-0 items-start gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3 sm:px-3.5"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                        <IconComponent className={`h-4 w-4 ${config.color}`} aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{config.label}</p>
                        <p className="text-xs text-neutral-500">
                          {stats.count} {stats.count === 1 ? 'file' : 'files'}
                        </p>
                        <p className="mt-2 text-sm font-semibold tabular-nums text-neutral-200">
                          {formatBytes(stats.totalSize)}
                          <span className="ml-2 text-xs font-normal text-neutral-500">{pct.toFixed(0)}%</span>
                        </p>
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="mt-6 py-10 text-center">
              <HardDrive className="mx-auto mb-3 h-10 w-10 text-neutral-600" aria-hidden />
              <p className="text-sm text-neutral-400">No files yet</p>
              <p className="mt-1 text-xs text-neutral-500">Uploads from profile, journal, and other tools appear here.</p>
            </div>
          )}
        </Card>

        <Card variant="glass" className="border border-white/[0.06] p-4 shadow-none sm:p-5">
          <h2 className="text-sm font-semibold text-white">Notes</h2>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-neutral-500">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#39FF14]/70" aria-hidden />
              Large images stay snappier under about 2MB; uploads are optimized where possible.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#00FFFF]/70" aria-hidden />
              Video is processed for efficient streaming; voice memos often use compact WebM.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neutral-500" aria-hidden />
              Included quota is about {data?.storageQuotaGB ?? 5} GB. Reach out if you need more space.
            </li>
          </ul>
        </Card>

        {data?.recentFiles && data.recentFiles.length > 0 && (
          <Card variant="glass" className="border border-white/[0.06] p-4 shadow-none sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Recent uploads</h2>
              <span className="text-xs text-neutral-500">{data.recentFiles.length} shown</span>
            </div>
            <div className="mt-3 space-y-1.5">
              {data.recentFiles.map((file, index) => {
                const pathParts = file.path.split('/')
                const folder = pathParts[2] || 'other'
                const folderConfig = FOLDER_LABELS[folder] || FOLDER_LABELS.other
                const IconComponent = folderConfig.icon
                const fileUrl = `https://media.vibrationfit.com/${file.path}`
                const fileType = file.name.split('.').pop()?.toLowerCase() || ''
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)
                const isVideo = ['mp4', 'mov', 'webm'].includes(fileType)
                const isAudio = ['mp3', 'wav', 'ogg', 'webm'].includes(fileType)

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      if (isImage || isVideo || isAudio) {
                        setPreviewFile({
                          url: fileUrl,
                          name: file.name,
                          type: isImage ? 'image' : isVideo ? 'video' : 'audio',
                        })
                      } else {
                        window.open(fileUrl, '_blank')
                      }
                    }}
                    className="group flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2.5 text-left transition-colors hover:border-neutral-600 hover:bg-white/[0.03]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                        <IconComponent className={`h-4 w-4 ${folderConfig.color}`} aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-white">{file.name}</p>
                          <Badge variant="neutral" className="shrink-0 rounded-full px-2 py-0 text-[10px]">
                            {folderConfig.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-500">{new Date(file.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs font-medium tabular-nums text-neutral-300">{formatBytes(file.size)}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-neutral-600 transition-colors group-hover:text-[#39FF14]" aria-hidden />
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        )}

      </Stack>

      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setPreviewFile(null)}
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/[0.08] bg-neutral-950 shadow-2xl"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="File preview"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <h3 className="min-w-0 truncate pr-3 text-sm font-medium text-white">{previewFile.name}</h3>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-center bg-black px-4 py-6">
              {previewFile.type === 'image' && (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-[65vh] max-w-full rounded-lg object-contain"
                />
              )}
              {previewFile.type === 'video' && (
                <video src={previewFile.url} controls className="max-h-[65vh] max-w-full rounded-lg" />
              )}
              {previewFile.type === 'audio' && (
                <div className="w-full max-w-md space-y-4 text-center">
                  <Music className="mx-auto h-12 w-12 text-[#39FF14]" aria-hidden />
                  <p className="truncate text-xs text-neutral-500">{previewFile.name}</p>
                  <audio src={previewFile.url} controls className="w-full" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/[0.06] px-4 py-3">
              <Button variant="ghost" size="sm" onClick={() => setPreviewFile(null)}>
                Close
              </Button>
              <Button variant="primary" size="sm" onClick={() => window.open(previewFile.url, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}
