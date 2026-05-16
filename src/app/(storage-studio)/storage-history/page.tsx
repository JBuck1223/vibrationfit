'use client'

import { useState, useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Container, Card, Button, Badge, Spinner, Stack, Select } from '@/lib/design-system/components'
import {
  HardDrive,
  Calendar,
  Filter,
  AlertCircle,
  Image,
  Video,
  Music,
  FileText,
  Folder,
  Upload,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react'

const ICON_COMPONENTS: Record<string, LucideIcon> = {
  Image,
  Video,
  Music,
  FileText,
  Folder,
  Upload,
  Trash2,
  Plus,
  Minus,
}

const FOLDER_LABELS: Record<string, string> = {
  profile: 'Profile',
  'vision-board': 'Vision Board',
  journal: 'Journal',
  'life-vision': 'Life Vision',
  'alignment-plan': 'Alignment Plans',
  'custom-tracks': 'Custom Audio',
  other: 'Other',
}

const FILTERABLE_FOLDERS: readonly string[] = [
  'profile',
  'vision-board',
  'journal',
  'life-vision',
  'alignment-plan',
  'custom-tracks',
]

const RANGE_SELECT_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

const FOLDER_SELECT_OPTIONS = [
  { value: 'all', label: 'All folders' },
  ...FILTERABLE_FOLDERS.map(f => ({
    value: f,
    label: FOLDER_LABELS[f] || f,
  })),
]

interface StorageRecord {
  id: string
  action_type: string
  file_path: string
  file_size: number
  folder_type?: string
  success: boolean
  error_message?: string
  created_at: string
}

export default function StorageHistoryPage() {
  const [records, setRecords] = useState<StorageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)
  const [folder, setFolder] = useState<string>('all')
  const [fetchNonce, setFetchNonce] = useState(0)

  useEffect(() => {
    const fetchStorageHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({ days: days.toString() })
        if (folder !== 'all') params.set('action_type', folder)
        const response = await fetch(`/api/storage/history?${params}`)
        if (!response.ok) throw new Error('Failed to fetch storage history')
        const data = await response.json()
        setRecords(data.records || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    void fetchStorageHistory()
  }, [days, folder, fetchNonce])

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      file_upload: 'Upload',
      file_delete: 'Delete',
      admin_grant: 'Admin grant',
      admin_deduct: 'Admin deduction',
      storage_pack_purchase: 'Pack purchase',
    }
    return labels[actionType] || actionType.replace(/_/g, ' ')
  }

  const getActionIcon = (actionType: string): string => {
    const icons: Record<string, string> = {
      file_upload: 'Upload',
      file_delete: 'Trash2',
      admin_grant: 'Plus',
      admin_deduct: 'Minus',
      storage_pack_purchase: 'Plus',
    }
    return icons[actionType] || 'Folder'
  }

  const getFolderIcon = (folderType?: string): string => {
    const folderIcons: Record<string, string> = {
      profile: 'Image',
      'vision-board': 'Image',
      journal: 'FileText',
      'life-vision': 'Music',
      'alignment-plan': 'FileText',
      'custom-tracks': 'Music',
    }
    return folderType ? folderIcons[folderType] || 'Folder' : 'Folder'
  }

  if (loading) {
    return (
      <Container size="xl" className="pt-2 pb-6 sm:pb-8">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="xl" className="pt-2 pb-6 sm:pb-8">
        <Card variant="glass" className="border border-white/[0.06] p-6 text-center shadow-none">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-400/90" aria-hidden />
            <p className="text-sm text-neutral-300">{error}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setError(null)
                setFetchNonce(n => n + 1)
              }}
            >
              Try again
            </Button>
          </div>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="md">
        <h1 className="sr-only">Storage history</h1>

        <Card variant="glass" className="border border-white/[0.06] p-4 shadow-none sm:p-5">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-5">
            <div className="flex items-center gap-2">
              <div className="flex shrink-0 items-center gap-2 text-neutral-400">
                <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Range</span>
              </div>
              <div className="w-[11rem] min-w-0 sm:w-44">
                <Select
                  options={RANGE_SELECT_OPTIONS}
                  value={String(days)}
                  onChange={v => setDays(parseInt(v, 10))}
                />
              </div>
            </div>

            <div className="hidden h-9 w-px shrink-0 bg-neutral-700/80 sm:block" aria-hidden />

            <div className="flex items-center gap-2">
              <div className="flex shrink-0 items-center gap-2 text-neutral-400">
                <Filter className="h-4 w-4 shrink-0" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Folder</span>
              </div>
              <div className="w-[13rem] min-w-0 sm:w-52">
                <Select options={FOLDER_SELECT_OPTIONS} value={folder} onChange={setFolder} />
              </div>
            </div>
          </div>
        </Card>

        {records.length === 0 ? (
          <Card variant="glass" className="border border-white/[0.06] p-8 text-center shadow-none">
            <HardDrive className="mx-auto mb-3 h-10 w-10 text-neutral-600" aria-hidden />
            <p className="text-sm text-neutral-400">No activity in this range</p>
            <p className="mt-1 text-xs text-neutral-500">Try a longer range or clear the folder filter.</p>
          </Card>
        ) : (
          <Card variant="glass" className="border border-white/[0.06] p-3 shadow-none sm:p-4">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Events</span>
              <span className="text-xs text-neutral-500">{records.length} shown</span>
            </div>
            <ul className="divide-y divide-white/[0.06]">
              {records.map(record => {
                const ActionIcon = ICON_COMPONENTS[getActionIcon(record.action_type)] || Folder
                const FolderIcon = record.folder_type
                  ? ICON_COMPONENTS[getFolderIcon(record.folder_type)]
                  : null
                const isDown = record.action_type === 'file_delete' || record.action_type === 'admin_deduct'

                return (
                  <li key={record.id} className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                        <ActionIcon
                          className={`h-4 w-4 ${isDown ? 'text-red-400/90' : 'text-[#39FF14]'}`}
                          aria-hidden
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white">{getActionLabel(record.action_type)}</span>
                          <Badge variant={record.success ? 'neutral' : 'danger'} className="rounded-full px-2 py-0 text-[10px]">
                            {record.success ? 'OK' : 'Failed'}
                          </Badge>
                          {FolderIcon && record.folder_type && (
                            <span className="flex items-center gap-1 text-xs text-neutral-500">
                              <FolderIcon className="h-3 w-3" aria-hidden />
                              {FOLDER_LABELS[record.folder_type] || record.folder_type}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-neutral-500">{record.file_path}</p>
                        <p className="mt-0.5 text-xs text-neutral-600">{formatDate(record.created_at)}</p>
                        {record.error_message && (
                          <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-1.5 text-xs text-red-300">
                            {record.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div
                      className={`shrink-0 text-right text-sm font-semibold tabular-nums sm:pl-4 ${
                        isDown ? 'text-red-400/90' : 'text-neutral-200'
                      }`}
                    >
                      {isDown ? '-' : '+'}
                      {formatBytes(record.file_size)}
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
