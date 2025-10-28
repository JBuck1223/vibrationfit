// /src/app/dashboard/storage/page.tsx
// Storage usage tracking and management

'use client'

import { useState, useEffect } from 'react'
import { PageLayout, Card, Button, Badge, ProgressBar } from '@/lib/design-system/components'
import { HardDrive, Image, Video, Music, FileText, Folder, Clock, Trash2, ExternalLink, X } from 'lucide-react'
import Link from 'next/link'

interface StorageData {
  totalFiles: number
  totalSize: number
  storageByType: Record<string, {
    count: number
    totalSize: number
    files: any[]
  }>
  recentFiles: Array<{
    name: string
    path: string
    size: number
    created_at: string
  }>
}

const FOLDER_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  profile: { label: 'Profile', icon: Image, color: 'text-primary-500' },
  'vision-board': { label: 'Vision Board', icon: Image, color: 'text-accent-500' },
  journal: { label: 'Journal', icon: FileText, color: 'text-energy-500' },
  'life-vision': { label: 'Life Vision', icon: Music, color: 'text-secondary-500' },
  'alignment-plan': { label: 'Alignment Plans', icon: FileText, color: 'text-primary-400' },
  'custom-tracks': { label: 'Custom Audio', icon: Music, color: 'text-accent-400' },
  other: { label: 'Other', icon: Folder, color: 'text-neutral-500' },
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export default function StoragePage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<StorageData | null>(null)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null)

  useEffect(() => {
    fetchStorageData()
  }, [])

  const fetchStorageData = async () => {
    try {
      const response = await fetch('/api/storage/usage')
      
      if (!response.ok) {
        throw new Error('Failed to fetch storage data')
      }

      const storageData = await response.json()
      setData(storageData)

    } catch (error) {
      console.error('Error fetching storage data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Assuming 10GB storage limit per user
  const STORAGE_LIMIT = 10 * 1024 * 1024 * 1024 // 10GB in bytes
  const usagePercentage = data ? (data.totalSize / STORAGE_LIMIT) * 100 : 0

  return (
    <>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">Storage Usage</h1>
          <p className="text-neutral-400">
            Track your file storage across all features
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-neutral-400 mt-4">Loading storage data...</p>
          </div>
        ) : (
          <>
            {/* Overview Card */}
            <Card className="p-8 mb-8 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-2 border-primary-500/30">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-primary-500/20 rounded-xl">
                      <HardDrive className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white">Storage Overview</h2>
                      <p className="text-sm text-neutral-400">Your file usage summary</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-neutral-400 mb-1">Total Files</p>
                      <p className="text-3xl font-bold text-white">{data?.totalFiles || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400 mb-1">Total Storage Used</p>
                      <p className="text-3xl font-bold text-white">{formatBytes(data?.totalSize || 0)}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        of {formatBytes(STORAGE_LIMIT)} limit
                      </p>
                    </div>
                  </div>
                </div>

                <Badge 
                  variant={usagePercentage > 80 ? 'warning' : 'success'}
                  className="text-lg px-4 py-2"
                >
                  {usagePercentage.toFixed(1)}% Used
                </Badge>
              </div>

              {/* Progress Bar */}
              <ProgressBar
                value={usagePercentage}
                variant={usagePercentage > 80 ? 'warning' : 'primary'}
                showLabel={false}
              />
            </Card>

            {/* Storage by Type */}
            <Card className="p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Storage by Type</h2>
              
              {data?.storageByType && Object.keys(data.storageByType).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(data.storageByType)
                    .sort(([, a], [, b]) => b.totalSize - a.totalSize)
                    .map(([folder, stats]) => {
                      const config = FOLDER_LABELS[folder] || FOLDER_LABELS.other
                      const IconComponent = config.icon
                      const folderPercentage = (stats.totalSize / (data.totalSize || 1)) * 100

                      return (
                        <div
                          key={folder}
                          className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-neutral-800 rounded-lg">
                              <IconComponent className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-sm">
                                {config.label}
                              </h3>
                              <p className="text-xs text-neutral-500">
                                {stats.count} {stats.count === 1 ? 'file' : 'files'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <div className="flex items-baseline justify-between mb-1">
                              <span className="text-xl font-bold text-white">
                                {formatBytes(stats.totalSize)}
                              </span>
                              <span className="text-xs text-neutral-500">
                                {folderPercentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                                style={{ width: `${folderPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HardDrive className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400">No files uploaded yet</p>
                  <p className="text-sm text-neutral-500 mt-2">
                    Start creating to see your storage usage!
                  </p>
                </div>
              )}
            </Card>

            {/* Recent Files */}
            {data?.recentFiles && data.recentFiles.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Recent Uploads</h2>
                  <Badge variant="info">{data.recentFiles.length} files</Badge>
                </div>

                <div className="space-y-2">
                  {data.recentFiles.map((file, index) => {
                    // Extract folder from path to determine which tool was used
                    const pathParts = file.path.split('/')
                    const folder = pathParts[2] || 'other'
                    const folderConfig = FOLDER_LABELS[folder] || FOLDER_LABELS.other
                    const IconComponent = folderConfig.icon
                    
                    // Construct file URL
                    const fileUrl = `https://media.vibrationfit.com/${file.path}`
                    const fileType = file.name.split('.').pop()?.toLowerCase() || ''
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)
                    const isVideo = ['mp4', 'mov', 'webm'].includes(fileType)
                    const isAudio = ['mp3', 'wav', 'ogg', 'webm'].includes(fileType)
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (isImage || isVideo || isAudio) {
                            setPreviewFile({
                              url: fileUrl,
                              name: file.name,
                              type: isImage ? 'image' : isVideo ? 'video' : 'audio'
                            })
                          } else {
                            window.open(fileUrl, '_blank')
                          }
                        }}
                        className="w-full flex items-center justify-between p-4 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-primary-500 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className="p-2 bg-neutral-800 rounded-lg group-hover:bg-neutral-700 transition-colors">
                              <IconComponent className={`w-4 h-4 ${folderConfig.color}`} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-white truncate">
                                {file.name}
                              </p>
                              <Badge variant="neutral" className="text-xs flex-shrink-0">
                                {folderConfig.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-neutral-500">
                              {new Date(file.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          <p className="text-sm font-bold text-white">
                            {formatBytes(file.size)}
                          </p>
                          <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-primary-500 transition-colors" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Storage Tips */}
            <Card className="p-6 bg-neutral-900 mt-8">
              <h2 className="text-xl font-bold text-white mb-4">Storage Tips</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-500/10 rounded-lg mt-1">
                    <Image className="w-4 h-4 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Optimize Images</h3>
                    <p className="text-xs text-neutral-400">
                      Compress large images before uploading to save space. Most images under 2MB work great!
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-secondary-500/10 rounded-lg mt-1">
                    <Video className="w-4 h-4 text-secondary-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Video Compression</h3>
                    <p className="text-xs text-neutral-400">
                      Videos are automatically compressed on upload to save storage and bandwidth.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent-500/10 rounded-lg mt-1">
                    <Music className="w-4 h-4 text-accent-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Audio Recordings</h3>
                    <p className="text-xs text-neutral-400">
                      Voice notes and recordings are stored in WebM format for efficiency.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-energy-500/10 rounded-lg mt-1">
                    <HardDrive className="w-4 h-4 text-energy-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Storage Limit</h3>
                    <p className="text-xs text-neutral-400">
                      Each account includes 10GB of storage. Contact us if you need more!
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* File Preview Modal */}
        {previewFile && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewFile(null)}
          >
            <div 
              className="relative max-w-4xl max-h-[90vh] w-full bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                <h3 className="text-lg font-semibold text-white truncate pr-4">
                  {previewFile.name}
                </h3>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Preview Content */}
              <div className="p-6 flex items-center justify-center bg-black">
                {previewFile.type === 'image' && (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                )}
                
                {previewFile.type === 'video' && (
                  <video
                    src={previewFile.url}
                    controls
                    className="max-w-full max-h-[70vh] rounded-lg"
                  />
                )}
                
                {previewFile.type === 'audio' && (
                  <div className="w-full max-w-2xl">
                    <div className="p-8 bg-neutral-900 rounded-xl text-center mb-4">
                      <Music className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                      <p className="text-neutral-400 text-sm">{previewFile.name}</p>
                    </div>
                    <audio
                      src={previewFile.url}
                      controls
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-neutral-800 flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setPreviewFile(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => window.open(previewFile.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </div>
        )}
    </>
  )
}

