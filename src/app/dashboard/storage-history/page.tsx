'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Badge, Spinner, Stack, PageHero } from '@/lib/design-system/components'
import { 
  ArrowLeft, HardDrive, Calendar, Filter,
  Image, Video, Music, FileText, Folder, Upload, Trash2,
  Plus, Minus
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Icon component mapping
const ICON_COMPONENTS: Record<string, any> = {
  'Image': Image,
  'Video': Video,
  'Music': Music,
  'FileText': FileText,
  'Folder': Folder,
  'Upload': Upload,
  'Trash2': Trash2,
  'Plus': Plus,
  'Minus': Minus,
}

interface StorageRecord {
  id: string
  action_type: string
  file_path: string
  file_size: number
  folder_type?: string
  success: boolean
  error_message?: string
  metadata?: any
  created_at: string
}

export default function StorageHistoryPage() {
  const router = useRouter()
  const [records, setRecords] = useState<StorageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchStorageHistory()
  }, [days, filter])

  const fetchStorageHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        days: days.toString(),
        ...(filter !== 'all' && { action_type: filter })
      })

      const response = await fetch(`/api/storage/history?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch storage history')
      }

      const data = await response.json()
      setRecords(data.records || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'file_upload': 'File Upload',
      'file_delete': 'File Delete',
      'admin_grant': 'Admin Storage Grant',
      'admin_deduct': 'Admin Storage Deduction',
      'storage_pack_purchase': 'Storage Pack Purchase',
    }
    return labels[actionType] || actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getActionIcon = (actionType: string): string => {
    const icons: Record<string, string> = {
      'file_upload': 'Upload',
      'file_delete': 'Trash2',
      'admin_grant': 'Plus',
      'admin_deduct': 'Minus',
      'storage_pack_purchase': 'Plus',
    }
    return icons[actionType] || 'Folder'
  }

  const getFolderIcon = (folderType?: string): string => {
    const folderIcons: Record<string, string> = {
      'profile': 'Image',
      'vision-board': 'Image',
      'journal': 'FileText',
      'life-vision': 'Music',
      'alignment-plan': 'FileText',
      'custom-tracks': 'Music',
    }
    return folderType ? (folderIcons[folderType] || 'Folder') : 'Folder'
  }

  const uniqueActionTypes = Array.from(new Set(records.map(r => r.action_type)))

  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner variant="primary" size="lg" />
        <span className="ml-3 text-neutral-400">Loading storage history...</span>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="xl">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <div className="text-red-400 mb-4">⚠️ Error loading storage history</div>
          <p className="text-neutral-300 mb-6">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchStorageHistory}>
            Try Again
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          title="Storage History"
          subtitle="Track your file uploads, deletions, and storage changes"
        >
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Back
          </Button>
        </PageHero>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All Actions</option>
              {uniqueActionTypes.map(actionType => (
                <option key={actionType} value={actionType}>
                  {getActionLabel(actionType)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Records List */}
        {records.length === 0 ? (
          <Card className="p-4 md:p-6 lg:p-8 text-center">
            <HardDrive className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Storage History Found</h3>
            <p className="text-neutral-400">
              Start uploading files to see your storage history here.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map((record) => {
              const IconComponent = ICON_COMPONENTS[getActionIcon(record.action_type)] || Folder
              const FolderIconComponent = record.folder_type 
                ? ICON_COMPONENTS[getFolderIcon(record.folder_type)] 
                : null
              
              return (
              <Card key={record.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <IconComponent className={`w-6 h-6 ${
                        record.action_type === 'file_delete' || record.action_type === 'admin_deduct'
                          ? 'text-red-500'
                          : 'text-primary-500'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">
                          {getActionLabel(record.action_type)}
                        </span>
                        <Badge variant={record.success ? 'success' : 'error'} className="text-xs">
                          {record.success ? 'Success' : 'Failed'}
                        </Badge>
                        {FolderIconComponent && (
                          <div className="flex items-center gap-1 text-neutral-400">
                            <FolderIconComponent className="w-3 h-3" />
                            <span className="text-xs">{record.folder_type}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-400">
                        <span>{formatDate(record.created_at)}</span>
                        {record.file_path && (
                          <span className="truncate max-w-md">{record.file_path}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      record.action_type === 'file_delete' || record.action_type === 'admin_deduct'
                        ? 'text-red-400'
                        : 'text-white'
                    }`}>
                      {record.action_type === 'file_delete' || record.action_type === 'admin_deduct' ? '-' : '+'}
                      {formatBytes(record.file_size)}
                    </div>
                  </div>
                </div>
                
                {record.error_message && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{record.error_message}</p>
                  </div>
                )}
              </Card>
            )})}
          </div>
        )}
      </Stack>
    </Container>
  )
}
