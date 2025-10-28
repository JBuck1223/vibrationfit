'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Badge, Input } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { Upload, Copy, Check, Image as ImageIcon, Video, Music, File, Folder, Plus, ChevronRight, ArrowLeft, CheckCircle2, X, Search } from 'lucide-react'

interface AssetFile {
  key: string
  url: string
  name: string
  size: number
  lastModified?: Date
  category: string
  path?: string
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
      setFiles(data.files || [])
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
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

          const formData = new FormData()
          formData.append('file', file)
          formData.append('category', uploadCategory)

          const response = await fetch('/api/admin/assets/upload', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Upload failed')
          }

          const result = await response.json()
          uploadedFiles.push(result.url)
          setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }))
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
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

      <Container size="xl" className="py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Site Assets Manager</h1>
            <p className="text-neutral-400">Upload and manage site assets organized by category</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowUploadForm(!showUploadForm)}
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

      {/* Breadcrumb Navigation */}
      {currentPath.length > 0 && (
        <Card variant="outlined" className="mb-6">
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
        <Card variant="elevated" className="mb-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Upload New Asset</h2>
            
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folders Sidebar */}
        <Card variant="elevated">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => {
                const FileIcon = getFileIcon(file.name)
                const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                const isCopied = copiedUrl === file.url
                const fileType = getFileType(file.name)
                const dimensions = imageDimensions[file.key]

                return (
                  <Card key={file.key} variant="elevated" className="overflow-hidden">
                    <div className="relative aspect-square bg-neutral-800 flex items-center justify-center mb-3 overflow-hidden">
                      {isImage ? (
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

                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => copyToClipboard(file.url)}
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

                      <div className="text-xs text-white font-mono break-all" title={file.url}>
                        {file.url}
                      </div>
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

