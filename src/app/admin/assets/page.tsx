'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Badge, Input } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Upload, Copy, Check, Image as ImageIcon, Video, Music, File, Folder, Plus, ChevronRight, ArrowLeft, CheckCircle2, X, Search, Trash2 } from 'lucide-react'

interface AssetFile {
  key: string
  url: string
  name: string
  size: number
  lastModified?: Date
  category: string
  path?: string
  variants?: VideoVariant[]
  isVariant?: boolean
  baseKey?: string
}

interface VideoVariant {
  type: 'original' | '1080p' | '720p' | 'thumb'
  key: string
  url: string
  size?: number
}

interface ImageDimensions {
  width: number
  height: number
  loaded: boolean
}

interface CategoryData {
  category?: string
  categories?: string[]
  subfolders?: string[]
  files?: AssetFile[]
  filesByCategory?: Record<string, AssetFile[]>
}

function AssetsAdminContent() {
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [currentPath, setCurrentPath] = useState<string[]>([]) // Breadcrumb path
  const [categories, setCategories] = useState<string[]>([])
  const [subfolders, setSubfolders] = useState<string[]>([])
  const [files, setFiles] = useState<AssetFile[]>([])
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [newFolder, setNewFolder] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadCategory, setUploadCategory] = useState('')
  const [imageDimensions, setImageDimensions] = useState<Record<string, ImageDimensions>>({})
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'pending' | 'uploading' | 'success' | 'error'>>({})
  const [successMessage, setSuccessMessage] = useState<{ title: string; details?: string[] } | null>(null)
  const [errorMessage, setErrorMessage] = useState<{ title: string; details?: string[] } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFileKeys, setSelectedFileKeys] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchAssets()
  }, [])

  useEffect(() => {
    fetchCurrentPathAssets()
  }, [currentPath])

  // Load image dimensions when files change
  useEffect(() => {
    files.forEach(file => {
      const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
      if (isImage && !imageDimensions[file.key]?.loaded) {
        loadImageDimensions(file.url, file.key)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/assets/list')
      if (!response.ok) throw new Error('Failed to fetch assets')
      
      const data: CategoryData = await response.json()
      setCategories(data.categories || [])
      setSubfolders([])
      setFiles([])
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentPathAssets = async () => {
    try {
      const categoryPath = currentPath.join('/')
      const response = await fetch(`/api/admin/assets/list?category=${encodeURIComponent(categoryPath)}`)
      if (!response.ok) throw new Error('Failed to fetch assets')
      
      const data: CategoryData = await response.json()
      setSubfolders(data.subfolders || [])
      
      // Group video variants together
      const groupedFiles = groupVideoVariants(data.files || [])
      setFiles(groupedFiles)
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  const groupVideoVariants = (files: AssetFile[]): AssetFile[] => {
    const fileMap = new Map<string, AssetFile>()
    const variantMap = new Map<string, VideoVariant[]>()

    files.forEach(file => {
      // Check if this is a video variant (-original, -1080p, -720p, -thumb)
      const variantMatch = file.name.match(/^(.+)-(original|1080p|720p|thumb)\.(mp4|jpg|jpeg)$/i)
      
      if (variantMatch) {
        const baseName = variantMatch[1]
        const variantType = variantMatch[2].toLowerCase() as 'original' | '1080p' | '720p' | 'thumb'
        const baseKey = file.key.replace(/-(original|1080p|720p|thumb)\.(mp4|jpg|jpeg)$/i, '')

        // Store variant
        if (!variantMap.has(baseKey)) {
          variantMap.set(baseKey, [])
        }
        variantMap.get(baseKey)!.push({
          type: variantType,
          key: file.key,
          url: file.url,
          size: file.size
        })

        // If this is the original or first variant, create the base file entry
        if (!fileMap.has(baseKey)) {
          fileMap.set(baseKey, {
            ...file,
            name: baseName + (variantType === 'thumb' ? '.jpg' : '.mp4'),
            key: baseKey,
            variants: []
          })
        }
      } else {
        // Not a variant, add as-is
        fileMap.set(file.key, file)
      }
    })

    // Attach variants to their base files
    variantMap.forEach((variants, baseKey) => {
      const baseFile = fileMap.get(baseKey)
      if (baseFile) {
        baseFile.variants = variants
      }
    })

    return Array.from(fileMap.values())
  }

  const navigateToPath = (path: string[]) => {
    setCurrentPath(path)
  }

  const navigateToSubfolder = (subfolder: string) => {
    setCurrentPath([...currentPath, subfolder])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedFiles(files)
      
      // Initialize upload status for all files
      const status: Record<string, 'pending'> = {}
      const progress: Record<string, number> = {}
      files.forEach(file => {
        status[file.name] = 'pending'
        progress[file.name] = 0
      })
      setUploadStatus(status)
      setUploadProgress(progress)
      
      // Auto-set upload path to current path if not set
      if (!uploadCategory && currentPath.length > 0) {
        setUploadCategory(currentPath.join('/'))
      } else if (!uploadCategory && files.length > 0) {
        // Auto-detect category from first file type if at root
        const firstFile = files[0]
        if (firstFile.type.startsWith('image/')) {
          setUploadCategory('images')
        } else if (firstFile.type.startsWith('video/')) {
          setUploadCategory('video')
        } else if (firstFile.type.startsWith('audio/')) {
          setUploadCategory('audio')
        }
      }
    }
  }

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName))
    setUploadStatus(prev => {
      const next = { ...prev }
      delete next[fileName]
      return next
    })
    setUploadProgress(prev => {
      const next = { ...prev }
      delete next[fileName]
      return next
    })
  }

  const uploadFileWithProgress = (file: File, category: string) => {
    return new Promise<{ url: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/admin/assets/upload')

      xhr.upload.onloadstart = () => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
      }

      xhr.upload.onprogress = event => {
        const totalBytes = event.lengthComputable && event.total ? event.total : file.size
        const loaded = event.loaded
        const percentComplete = totalBytes
          ? Math.min(99, Math.max(0, Math.round((loaded / totalBytes) * 100)))
          : 0

        setUploadProgress(prev => ({
          ...prev,
          [file.name]: Number.isFinite(percentComplete) ? percentComplete : 0,
        }))
      }

      xhr.onerror = () => {
        reject(new Error('Network error during upload'))
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (error) {
            reject(new Error('Invalid response from server'))
          }
        } else {
          let errorMessage = 'Upload failed'
          try {
            const parsed = JSON.parse(xhr.responseText)
            errorMessage = parsed.error || parsed.message || errorMessage
          } catch {
            errorMessage = xhr.statusText || errorMessage
          }
          reject(new Error(errorMessage))
        }
      }

      xhr.onloadend = () => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)

      xhr.send(formData)
    })
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !uploadCategory) {
      setErrorMessage({
        title: 'Upload Error',
        details: ['Please select at least one file and category/path'],
      })
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    try {
      setUploading(true)
      const uploadedFiles: string[] = []
      const errors: string[] = []

      // Upload files one by one
      for (const file of selectedFiles) {
        try {
          setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }))
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

          const result = await uploadFileWithProgress(file, uploadCategory)
          uploadedFiles.push(result.url)
          setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }))
        } catch (error) {
          console.error(`Upload error for ${file.name}:`, error)
          setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }))
          errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      
      // Refresh current view
      await fetchCurrentPathAssets()
      
      // Show results
      if (errors.length === 0) {
        setSuccessMessage({
          title: `✨ ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} uploaded successfully!`,
        })
        // Reset form after successful upload
        setSelectedFiles([])
        setUploadCategory('')
        setUploadStatus({})
        setUploadProgress({})
        // Auto-dismiss after 4 seconds
        setTimeout(() => setSuccessMessage(null), 4000)
      } else if (uploadedFiles.length > 0) {
        setSuccessMessage({
          title: `✨ ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} uploaded successfully!`,
          details: [`${errors.length} file${errors.length > 1 ? 's' : ''} failed to upload`, ...errors],
        })
      } else {
        setErrorMessage({
          title: `Upload failed`,
          details: errors,
        })
        setTimeout(() => setErrorMessage(null), 5000)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setErrorMessage({
        title: 'Upload failed',
        details: [error instanceof Error ? error.message : 'Unknown error'],
      })
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = async (url: string) => {
    try {
      // Encode the URL properly for clipboard (spaces become %20)
      // Parse the URL to encode just the path portion
      const urlObj = new URL(url)
      const encodedPath = urlObj.pathname.split('/').map(segment => encodeURIComponent(segment)).join('/')
      const encodedUrl = `${urlObj.origin}${encodedPath}${urlObj.search}${urlObj.hash}`
      
      await navigator.clipboard.writeText(encodedUrl)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setErrorMessage({
        title: 'Copy Failed',
        details: ['Failed to copy to clipboard'],
      })
      setTimeout(() => setErrorMessage(null), 3000)
    }
  }

  const toggleFileSelection = (fileKey: string) => {
    setSelectedFileKeys(prev => {
      const next = new Set(prev)
      if (next.has(fileKey)) {
        next.delete(fileKey)
      } else {
        next.add(fileKey)
      }
      return next
    })
  }

  const selectAllFiles = () => {
    if (selectedFileKeys.size === filteredFiles.length) {
      setSelectedFileKeys(new Set())
    } else {
      setSelectedFileKeys(new Set(filteredFiles.map(f => f.key)))
    }
  }

  const handleDeleteFiles = async () => {
    if (selectedFileKeys.size === 0) {
      setErrorMessage({
        title: 'No files selected',
        details: ['Please select at least one file to delete'],
      })
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    // Show custom confirmation dialog
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setShowDeleteConfirm(false)

    try {
      setDeleting(true)
      const filesToDelete = Array.from(selectedFileKeys)
      const deletedFiles: string[] = []
      const errors: string[] = []

      for (const fileKey of filesToDelete) {
        try {
          setDeletingKeys(prev => new Set(prev).add(fileKey))
          
          // Find the file to check if it has variants
          const file = files.find(f => f.key === fileKey)
          const keysToDelete: string[] = [fileKey]
          
          // If this file has variants, collect all variant keys to delete
          if (file?.variants && file.variants.length > 0) {
            file.variants.forEach(variant => {
              keysToDelete.push(variant.key)
            })
          }

          // Delete all keys (main file + variants)
          for (const key of keysToDelete) {
            const response = await fetch('/api/admin/assets/upload', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ s3Key: key }),
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Delete failed')
            }
          }

          deletedFiles.push(fileKey)
        } catch (error) {
          console.error(`Delete error for ${fileKey}:`, error)
          const fileName = files.find(f => f.key === fileKey)?.name || fileKey
          errors.push(`${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
          setDeletingKeys(prev => {
            const next = new Set(prev)
            next.delete(fileKey)
            return next
          })
        }
      }

      // Refresh current view
      await fetchCurrentPathAssets()
      
      // Clear selection
      setSelectedFileKeys(new Set())
      
      // Show results
      if (errors.length === 0) {
        setSuccessMessage({
          title: `✨ ${deletedFiles.length} file${deletedFiles.length > 1 ? 's' : ''} deleted successfully!`,
        })
        setTimeout(() => setSuccessMessage(null), 4000)
      } else if (deletedFiles.length > 0) {
        setSuccessMessage({
          title: `✨ ${deletedFiles.length} file${deletedFiles.length > 1 ? 's' : ''} deleted successfully!`,
          details: [`${errors.length} file${errors.length > 1 ? 's' : ''} failed to delete`, ...errors],
        })
      } else {
        setErrorMessage({
          title: `Delete failed`,
          details: errors,
        })
        setTimeout(() => setErrorMessage(null), 5000)
      }
    } catch (error) {
      console.error('Delete error:', error)
      setErrorMessage({
        title: 'Delete failed',
        details: [error instanceof Error ? error.message : 'Unknown error'],
      })
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setDeleting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return ImageIcon
    }
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext || '')) {
      return Video
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) {
      return Music
    }
    return File
  }

  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toUpperCase()
    return ext || 'Unknown'
  }

  // Filter files based on search query
  const filteredFiles = files.filter(file => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase().trim()
    const fileName = file.name.toLowerCase()
    const fileType = getFileType(file.name).toLowerCase()
    const category = file.category?.toLowerCase() || ''
    const path = file.path?.toLowerCase() || ''
    
    return (
      fileName.includes(query) ||
      fileType.includes(query) ||
      category.includes(query) ||
      path.includes(query)
    )
  })

  const filteredSubfolders = subfolders.filter(folder => {
    if (!searchQuery.trim()) return true
    return folder.toLowerCase().includes(searchQuery.toLowerCase().trim())
  })

  const loadImageDimensions = (url: string, key: string) => {
    if (imageDimensions[key]?.loaded) return
    
    const img = new window.Image()
    img.onload = () => {
      setImageDimensions(prev => ({
        ...prev,
        [key]: {
          width: img.width,
          height: img.height,
          loaded: true,
        },
      }))
    }
    img.onerror = () => {
      setImageDimensions(prev => ({
        ...prev,
        [key]: {
          width: 0,
          height: 0,
          loaded: true,
        },
      }))
    }
    img.src = url
  }

  return (
    <>
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card variant="elevated" className="max-w-md w-full border-red-500/30 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Delete {selectedFileKeys.size} File{selectedFileKeys.size !== 1 ? 's' : ''}?
                  </h3>
                  <p className="text-sm text-neutral-300">
                    This action cannot be undone. The selected file{selectedFileKeys.size !== 1 ? 's' : ''} will be permanently removed from storage.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={confirmDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300 max-w-md">
          <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/10 to-[#14B8A6]/10 border-[#39FF14]/30 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-[#39FF14] rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-[#39FF14] mb-1">
                  {successMessage.title}
                </h3>
                {successMessage.details && successMessage.details.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {successMessage.details.map((detail, idx) => (
                      <p key={idx} className="text-sm text-neutral-300">
                        {detail}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="flex-shrink-0 text-neutral-400 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300 max-w-md">
          <Card variant="elevated" className="bg-gradient-to-br from-red-500/10 to-[#D03739]/10 border-red-500/30 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-red-400 mb-1">
                  {errorMessage.title}
                </h3>
                {errorMessage.details && errorMessage.details.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {errorMessage.details.map((detail, idx) => (
                      <p key={idx} className="text-sm text-neutral-300">
                        {detail}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="flex-shrink-0 text-neutral-400 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </Card>
        </div>
      )}

      <Container size="xl">
      <div className="mb-6 md:mb-8 lg:mb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">Site Assets Manager</h1>
            <p className="text-xs md:text-sm lg:text-base text-neutral-400">Upload and manage site assets organized by category</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Asset
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name, type, or folder..."
            className="w-full pl-12 pr-4"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-neutral-400 mt-2">
            Showing {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} 
            {filteredSubfolders.length > 0 && ` and ${filteredSubfolders.length} folder${filteredSubfolders.length !== 1 ? 's' : ''}`}
            {' '}matching "{searchQuery}"
          </p>
        )}
      </div>

      {/* Selection Toolbar */}
      {filteredFiles.length > 0 && (
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 md:p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllFiles}
              className="w-full sm:w-auto"
            >
              {selectedFileKeys.size === filteredFiles.length ? 'Deselect All' : 'Select All'}
            </Button>
            <span className="text-xs md:text-sm text-neutral-400 text-center sm:text-left">
              {selectedFileKeys.size > 0 ? `${selectedFileKeys.size} selected` : 'No files selected'}
            </span>
          </div>
          {selectedFileKeys.size > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteFiles}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? 'Deleting...' : `Delete ${selectedFileKeys.size} File(s)`}
            </Button>
          )}
        </div>
      )}

      {/* Breadcrumb Navigation */}
      {currentPath.length > 0 && (
        <Card variant="outlined" className="p-4 md:p-6 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateToPath([])}
            >
              <Folder className="w-4 h-4 mr-1" />
              Root
            </Button>
            {currentPath.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-neutral-500" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToPath(currentPath.slice(0, index + 1))}
                >
                  {segment}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <Card variant="elevated" className="p-4 md:p-6 mb-6 md:mb-8">
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-white">Upload New Asset</h2>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Category
              </label>
              <Input
                type="text"
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                placeholder={currentPath.length > 0 
                  ? `e.g., ${currentPath.join('/')}/filename` 
                  : "e.g., video/marketing/hero or images/brand"}
                className="w-full"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Use forward slashes for nested folders. Examples: video/marketing/hero, images/brand, audio/mixing-tracks
              </p>
              {currentPath.length > 0 && (
                <p className="text-xs text-primary-400 mt-1">
                  Current location: <span className="font-mono">{currentPath.join('/')}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Files (Multiple Selection Enabled)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="block w-full text-sm text-neutral-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-500 file:text-black
                  hover:file:bg-primary-400
                  cursor-pointer"
              />
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {selectedFiles.map((file) => {
                    const status = uploadStatus[file.name] || 'pending'
                    const progress = uploadProgress[file.name] || 0
                    return (
                      <div
                        key={file.name}
                        className="flex items-center justify-between p-2 bg-neutral-800 rounded-lg border border-neutral-700"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-white truncate" title={file.name}>
                              {file.name}
                            </p>
                            <span className="text-xs text-neutral-500">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                          {status === 'uploading' && (
                            <div className="mt-1 w-full bg-neutral-700 rounded-full h-1.5">
                              <div
                                className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                          {status === 'success' && (
                            <p className="text-xs text-[#39FF14] mt-1">✓ Uploaded</p>
                          )}
                          {status === 'error' && (
                            <p className="text-xs text-red-400 mt-1">✕ Failed</p>
                          )}
                        </div>
                        {status === 'pending' && (
                          <button
                            onClick={() => removeFile(file.name)}
                            className="ml-2 text-neutral-500 hover:text-red-400 transition-colors"
                            type="button"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || !uploadCategory || uploading}
              >
                {uploading ? `Uploading... (${Object.values(uploadStatus).filter(s => s === 'uploading' || s === 'success').length}/${selectedFiles.length})` : `Upload ${selectedFiles.length} File(s)`}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadForm(false)
                  setSelectedFiles([])
                  setUploadCategory('')
                  setUploadStatus({})
                  setUploadProgress({})
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Folders Sidebar */}
        <Card variant="elevated" className="p-4 md:p-6 lg:sticky lg:top-4 lg:self-start">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white mb-4">
              {currentPath.length === 0 ? 'Categories' : 'Folders'}
            </h2>
            
            {/* Back button when in a subfolder */}
            {currentPath.length > 0 && (
              <Button
                variant="ghost"
                className="w-full justify-start mb-2"
                onClick={() => navigateToPath(currentPath.slice(0, -1))}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            {/* Root button */}
            <Button
              variant={currentPath.length === 0 ? 'primary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => navigateToPath([])}
            >
              <Folder className="w-4 h-4 mr-2" />
              Root
            </Button>

            {loading ? (
              <p className="text-sm text-neutral-400">Loading...</p>
            ) : (
              <>
                {/* Show categories at root, or subfolders when in a folder */}
                {(currentPath.length === 0 ? categories : (searchQuery ? filteredSubfolders : subfolders)).map((folder) => (
                  <Button
                    key={folder}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      if (currentPath.length === 0) {
                        navigateToPath([folder])
                      } else {
                        navigateToSubfolder(folder)
                      }
                    }}
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    {folder}
                  </Button>
                ))}
                {searchQuery && (currentPath.length === 0 ? categories : subfolders).length > 0 && (currentPath.length === 0 ? categories : filteredSubfolders).length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-2">No folders match your search</p>
                )}
                
                {/* Create new folder */}
                <div className="pt-4 border-t border-neutral-700">
                  <Input
                    type="text"
                    value={newFolder}
                    onChange={(e) => setNewFolder(e.target.value)}
                    placeholder="New folder..."
                    className="mb-2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      if (newFolder.trim()) {
                        try {
                          const response = await fetch('/api/admin/assets/create-folder', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              folderName: newFolder.trim(),
                              parentPath: currentPath,
                            }),
                          })

                          const result = await response.json()

                          if (!response.ok) {
                            throw new Error(result.error || 'Failed to create folder')
                          }

                          const folderName = newFolder.trim()
                          setNewFolder('')
                          // Refresh to see new folder
                          await fetchCurrentPathAssets()
                          
                          // Show success message
                          setSuccessMessage({
                            title: `✨ Folder "${folderName}" created successfully!`,
                          })
                          setTimeout(() => setSuccessMessage(null), 3000)
                        } catch (error) {
                          console.error('Error creating folder:', error)
                          setErrorMessage({
                            title: 'Failed to create folder',
                            details: [error instanceof Error ? error.message : 'Unknown error'],
                          })
                          setTimeout(() => setErrorMessage(null), 5000)
                        }
                      }
                    }}
                  >
                    Create Folder
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Assets Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-neutral-400">Loading assets...</p>
              </div>
            </Card>
          ) : currentPath.length === 0 && categories.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Folder className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400 mb-2">No folders found</p>
                <p className="text-sm text-neutral-500">
                  Upload a file to create your first folder structure
                </p>
              </div>
            </Card>
          ) : filteredFiles.length === 0 && !searchQuery ? (
            <Card>
              <div className="text-center py-12">
                <File className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400 mb-2">No assets in this folder</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadForm(true)
                    setUploadCategory(currentPath.join('/'))
                  }}
                >
                  Upload to {currentPath.length > 0 ? currentPath.join('/') : 'root'}
                </Button>
              </div>
            </Card>
          ) : filteredFiles.length === 0 && searchQuery ? (
            <Card>
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400 mb-2">No files match your search</p>
                <p className="text-sm text-neutral-500 mb-4">Try a different search term</p>
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredFiles.map((file) => {
                const FileIcon = getFileIcon(file.name)
                const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                const isVideo = file.variants && file.variants.length > 0
                const isCopied = copiedUrl === file.url
                const fileType = getFileType(file.name)
                const dimensions = imageDimensions[file.key]

                const isSelected = selectedFileKeys.has(file.key)
                const isDeleting = deletingKeys.has(file.key)

                // Get thumbnail URL for videos
                const thumbnailVariant = file.variants?.find(v => v.type === 'thumb')
                const thumbnailUrl = thumbnailVariant?.url

                return (
                  <Card key={file.key} variant="elevated" className={`overflow-hidden ${isSelected ? 'ring-2 ring-primary-500 border-primary-500' : ''} ${isDeleting ? 'opacity-50' : ''}`}>
                    <div className="relative aspect-square bg-neutral-800 flex items-center justify-center mb-3 overflow-hidden group cursor-pointer" onClick={() => toggleFileSelection(file.key)}>
                      {isVideo && thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={file.name}
                          className="max-w-full max-h-full object-cover"
                        />
                      ) : isImage ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="max-w-full max-h-full object-contain"
                          onLoad={(e) => {
                            const img = e.currentTarget
                            if (!dimensions) {
                              setImageDimensions(prev => ({
                                ...prev,
                                [file.key]: {
                                  width: img.naturalWidth,
                                  height: img.naturalHeight,
                                  loaded: true,
                                },
                              }))
                            }
                          }}
                        />
                      ) : (
                        <FileIcon className="w-16 h-16 text-neutral-600" />
                      )}
                      {/* Checkbox overlay */}
                      <div className={`absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-primary-500 border-primary-500' 
                          : 'bg-black/50 border-neutral-500 group-hover:border-primary-500'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-black" />}
                      </div>
                      {/* Video badge */}
                      {isVideo && (
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded-lg flex items-center gap-1">
                          <Video className="w-3 h-3 text-primary-400" />
                          <span className="text-xs text-white font-medium">
                            {file.variants?.length} variants
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-white truncate" title={file.name}>
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {fileType}
                          </Badge>
                          <span className="text-xs text-neutral-500">
                            {formatFileSize(file.size)}
                          </span>
                          {isImage && dimensions?.loaded && dimensions.width > 0 && (
                            <span className="text-xs text-white">
                              {dimensions.width} × {dimensions.height}px
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Video variants dropdown */}
                      {isVideo && file.variants && file.variants.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs text-neutral-400 font-medium">Available Versions:</p>
                          {file.variants
                            .sort((a, b) => {
                              const order = { 'original': 0, '1080p': 1, '720p': 2, 'thumb': 3 }
                              return order[a.type] - order[b.type]
                            })
                            .filter(v => v.type !== 'thumb')
                            .map((variant) => (
                              <Button
                                key={variant.type}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-between"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(variant.url)
                                }}
                              >
                                <span className="flex items-center gap-2">
                                  <Badge variant={variant.type === 'original' ? 'primary' : 'secondary'} className="text-xs">
                                    {variant.type.toUpperCase()}
                                  </Badge>
                                  {variant.size && (
                                    <span className="text-xs text-neutral-500">
                                      {formatFileSize(variant.size)}
                                    </span>
                                  )}
                                </span>
                                {copiedUrl === variant.url ? (
                                  <Check className="w-4 h-4 text-primary-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            ))}
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(file.url)
                          }}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy CloudFront Link
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Container>
    </>
  )
}

export default function AssetsAdminPage() {
  return (
    <AdminWrapper>
      <AssetsAdminContent />
    </AdminWrapper>
  )
}

