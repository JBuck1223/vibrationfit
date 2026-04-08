'use client'

import { useState, useEffect, useRef } from 'react'
import { Container, Card, Button, Badge, Input, Stack, PageHero } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  Copy, Check, Image as ImageIcon, Video, Music, File as FileIcon,
  Folder, ChevronRight, ArrowLeft, Search, Grid, List, RefreshCw,
  Users, HardDrive, Play, Pause, ExternalLink, FileText, X,
  ChevronLeft,
} from 'lucide-react'
import Image from 'next/image'

interface UserSummary {
  userId: string
  name: string
  email: string
  profilePictureUrl: string | null
  fileCount: number
  totalSize: number
}

interface FolderSummary {
  name: string
  fileCount: number
  totalSize: number
}

interface MemberFile {
  key: string
  url: string
  name: string
  size: number
  lastModified?: string
}

type View = 'users' | 'folders' | 'files'

const FOLDER_LABELS: Record<string, string> = {
  'vision-board': 'Vision Board',
  'journal': 'Journal',
  'life-vision': 'Life Vision',
  'alignment-plan': 'Alignment Plan',
  'profile': 'Profile',
  'custom-tracks': 'Custom Tracks',
  'voice-clone-samples': 'Voice Clone Samples',
  'intensive': 'Intensive',
  'vibe-tribe': 'Vibe Tribe',
  'abundance': 'Abundance',
  'stories': 'Stories',
  'support': 'Support',
}

function getFolderLabel(name: string): string {
  return FOLDER_LABELS[name] || name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileType(name: string): 'image' | 'video' | 'audio' | 'pdf' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].includes(ext)) return 'audio'
  if (ext === 'pdf') return 'pdf'
  return 'other'
}

function getFileTypeIcon(name: string) {
  const type = getFileType(name)
  switch (type) {
    case 'image': return <ImageIcon className="w-5 h-5 text-blue-400" />
    case 'video': return <Video className="w-5 h-5 text-purple-400" />
    case 'audio': return <Music className="w-5 h-5 text-green-400" />
    case 'pdf': return <FileText className="w-5 h-5 text-red-400" />
    default: return <FileIcon className="w-5 h-5 text-neutral-400" />
  }
}

function getFolderIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('vision') || lower.includes('profile')) return <ImageIcon className="w-5 h-5 text-blue-400" />
  if (lower.includes('video') || lower.includes('recording')) return <Video className="w-5 h-5 text-purple-400" />
  if (lower.includes('audio') || lower.includes('voice') || lower.includes('track')) return <Music className="w-5 h-5 text-green-400" />
  return <Folder className="w-5 h-5 text-yellow-400" />
}

function MemberStorageContent() {
  const [view, setView] = useState<View>('users')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  // User list state
  const [users, setUsers] = useState<UserSummary[]>([])

  // Selected user state
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null)
  const [folders, setFolders] = useState<FolderSummary[]>([])

  // File browser state
  const [currentFolder, setCurrentFolder] = useState<string[]>([])
  const [subfolders, setSubfolders] = useState<string[]>([])
  const [files, setFiles] = useState<MemberFile[]>([])

  // Media viewer state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [videoModalUrl, setVideoModalUrl] = useState('')
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/member-storage?action=list-users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching member storage users:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectUser = async (user: UserSummary) => {
    setSelectedUser(user)
    setView('folders')
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/member-storage?action=user-summary&userId=${user.userId}`)
      if (!res.ok) throw new Error('Failed to fetch user folders')
      const data = await res.json()
      setFolders(data.folders || [])
    } catch (error) {
      console.error('Error fetching user folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const openFolder = async (folderPath: string[]) => {
    setCurrentFolder(folderPath)
    setView('files')
    setLoading(true)
    try {
      const folder = folderPath.join('/')
      const res = await fetch(
        `/api/admin/member-storage?action=browse&userId=${selectedUser!.userId}&folder=${encodeURIComponent(folder)}`
      )
      if (!res.ok) throw new Error('Failed to browse folder')
      const data = await res.json()
      setSubfolders(data.subfolders || [])
      setFiles(data.files || [])
    } catch (error) {
      console.error('Error browsing folder:', error)
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    if (view === 'files' && currentFolder.length > 1) {
      openFolder(currentFolder.slice(0, -1))
    } else if (view === 'files') {
      setView('folders')
      setCurrentFolder([])
      setSubfolders([])
      setFiles([])
    } else if (view === 'folders') {
      setView('users')
      setSelectedUser(null)
      setFolders([])
    }
  }

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch {
      console.error('Failed to copy URL')
    }
  }

  const toggleAudio = (url: string) => {
    if (playingAudio === url) {
      audioRef.current?.pause()
      setPlayingAudio(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(url)
      audio.onended = () => setPlayingAudio(null)
      audio.play()
      audioRef.current = audio
      setPlayingAudio(url)
    }
  }

  const imageFiles = files.filter(f => getFileType(f.name) === 'image')

  const openLightbox = (url: string) => {
    const idx = imageFiles.findIndex(f => f.url === url)
    setLightboxIndex(idx >= 0 ? idx : 0)
    setLightboxUrl(url)
    setLightboxOpen(true)
  }

  const lightboxNav = (dir: -1 | 1) => {
    const newIdx = lightboxIndex + dir
    if (newIdx >= 0 && newIdx < imageFiles.length) {
      setLightboxIndex(newIdx)
      setLightboxUrl(imageFiles[newIdx].url)
    }
  }

  const filteredUsers = searchQuery
    ? users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users

  const filteredFolders = searchQuery
    ? folders.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getFolderLabel(f.name).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : folders

  const filteredFiles = searchQuery
    ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : files

  const filteredSubfolders = searchQuery
    ? subfolders.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
    : subfolders

  // Breadcrumb
  const breadcrumbs: Array<{ label: string; action: () => void }> = [
    {
      label: 'Member Storage',
      action: () => {
        setView('users')
        setSelectedUser(null)
        setFolders([])
        setCurrentFolder([])
        setFiles([])
        setSubfolders([])
        setSearchQuery('')
      },
    },
  ]

  if (selectedUser) {
    breadcrumbs.push({
      label: selectedUser.name,
      action: () => {
        setView('folders')
        setCurrentFolder([])
        setFiles([])
        setSubfolders([])
        setSearchQuery('')
      },
    })
  }

  if (currentFolder.length > 0) {
    currentFolder.forEach((segment, i) => {
      breadcrumbs.push({
        label: i === 0 ? getFolderLabel(segment) : segment,
        action: () => {
          openFolder(currentFolder.slice(0, i + 1))
          setSearchQuery('')
        },
      })
    })
  }

  return (
    <>
      <PageHero
        eyebrow="ADMIN"
        title="Member Storage"
        subtitle="Browse and view member uploaded files across all storage folders"
      />
      <Container className="py-8">
        <Stack gap="lg">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm flex-wrap">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-neutral-500" />}
                  <button
                    onClick={crumb.action}
                    className={`hover:text-[#39FF14] transition-colors ${
                      i === breadcrumbs.length - 1 ? 'text-white font-semibold' : 'text-neutral-400'
                    }`}
                  >
                    {crumb.label}
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    view === 'users' ? 'Search members...'
                    : view === 'folders' ? 'Search folders...'
                    : 'Search files...'
                  }
                  className="pl-10"
                />
              </div>
              {view === 'files' && (
                <div className="flex items-center border border-neutral-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}
              {view !== 'users' && (
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <Button variant="ghost" onClick={() => {
                if (view === 'users') fetchUsers()
                else if (view === 'folders' && selectedUser) selectUser(selectedUser)
                else if (view === 'files') openFolder(currentFolder)
              }}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Summary stats */}
          {view === 'users' && !loading && users.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card variant="elevated" className="p-4 text-center">
                <Users className="w-6 h-6 text-[#39FF14] mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-xs text-neutral-400">Members with uploads</p>
              </Card>
              <Card variant="elevated" className="p-4 text-center">
                <FileIcon className="w-6 h-6 text-[#00FFFF] mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {users.reduce((sum, u) => sum + u.fileCount, 0).toLocaleString()}
                </p>
                <p className="text-xs text-neutral-400">Total files</p>
              </Card>
              <Card variant="elevated" className="p-4 text-center">
                <HardDrive className="w-6 h-6 text-[#BF00FF] mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {formatFileSize(users.reduce((sum, u) => sum + u.totalSize, 0))}
                </p>
                <p className="text-xs text-neutral-400">Total storage used</p>
              </Card>
            </div>
          )}

          {/* Main content */}
          {loading ? (
            <Card variant="elevated">
              <div className="text-center py-16">
                <RefreshCw className="w-8 h-8 text-neutral-500 mx-auto mb-4 animate-spin" />
                <p className="text-neutral-400">
                  {view === 'users' ? 'Loading member storage data...' : 'Loading...'}
                </p>
              </div>
            </Card>
          ) : view === 'users' ? (
            /* ========== USER LIST ========== */
            filteredUsers.length === 0 ? (
              <Card variant="elevated">
                <div className="text-center py-16">
                  <Users className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400">
                    {searchQuery ? 'No members match your search' : 'No members with uploads found'}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Card
                    key={user.userId}
                    variant="elevated"
                    className="p-4 cursor-pointer hover:border-[#39FF14]/30 transition-all duration-200"
                    onClick={() => selectUser(user)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 flex-shrink-0 overflow-hidden">
                        {user.profilePictureUrl ? (
                          <Image
                            src={user.profilePictureUrl}
                            alt={user.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-500 text-sm font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">{user.fileCount.toLocaleString()}</p>
                          <p className="text-xs text-neutral-500">files</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">{formatFileSize(user.totalSize)}</p>
                          <p className="text-xs text-neutral-500">storage</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-500" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : view === 'folders' ? (
            /* ========== FOLDER LIST ========== */
            filteredFolders.length === 0 ? (
              <Card variant="elevated">
                <div className="text-center py-16">
                  <Folder className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400">
                    {searchQuery ? 'No folders match your search' : 'No folders found for this member'}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFolders.map((folder) => (
                  <Card
                    key={folder.name}
                    variant="elevated"
                    className="p-6 cursor-pointer hover:border-[#39FF14]/30 transition-all duration-200"
                    onClick={() => openFolder([folder.name])}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                        {getFolderIcon(folder.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {getFolderLabel(folder.name)}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">{folder.name}/</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {folder.fileCount} {folder.fileCount === 1 ? 'file' : 'files'}
                          </Badge>
                          <span className="text-xs text-neutral-400">
                            {formatFileSize(folder.totalSize)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-1" />
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            /* ========== FILE BROWSER ========== */
            <div>
              {/* Subfolders */}
              {filteredSubfolders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-neutral-400 mb-3">Folders</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredSubfolders.map((sub) => (
                      <Card
                        key={sub}
                        variant="elevated"
                        className="p-4 cursor-pointer hover:border-[#39FF14]/30 transition-all duration-200"
                        onClick={() => openFolder([...currentFolder, sub])}
                      >
                        <div className="flex items-center gap-3">
                          <Folder className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                          <span className="text-sm text-white truncate">{sub}</span>
                          <ChevronRight className="w-3 h-3 text-neutral-500 flex-shrink-0 ml-auto" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {filteredFiles.length === 0 && filteredSubfolders.length === 0 ? (
                <Card variant="elevated">
                  <div className="text-center py-16">
                    <FileIcon className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">
                      {searchQuery ? 'No files match your search' : 'This folder is empty'}
                    </p>
                  </div>
                </Card>
              ) : filteredFiles.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-neutral-400 mb-3">
                    Files ({filteredFiles.length})
                  </h3>

                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredFiles.map((file) => {
                        const fileType = getFileType(file.name)
                        const isCopied = copiedUrl === file.url
                        return (
                          <Card
                            key={file.key}
                            variant="elevated"
                            className="overflow-hidden group hover:border-[#39FF14]/30 transition-all duration-200"
                          >
                            {/* Preview */}
                            <div
                              className="aspect-square bg-neutral-900 flex items-center justify-center cursor-pointer relative overflow-hidden"
                              onClick={() => {
                                if (fileType === 'image') openLightbox(file.url)
                                else if (fileType === 'video') { setVideoModalUrl(file.url); setVideoModalOpen(true) }
                                else if (fileType === 'audio') toggleAudio(file.url)
                              }}
                            >
                              {fileType === 'image' ? (
                                <Image
                                  src={file.url}
                                  alt={file.name}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                />
                              ) : fileType === 'video' ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Video className="w-10 h-10 text-purple-400" />
                                  <Play className="w-5 h-5 text-neutral-400" />
                                </div>
                              ) : fileType === 'audio' ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Music className="w-10 h-10 text-green-400" />
                                  {playingAudio === file.url ? (
                                    <Pause className="w-5 h-5 text-[#39FF14]" />
                                  ) : (
                                    <Play className="w-5 h-5 text-neutral-400" />
                                  )}
                                </div>
                              ) : fileType === 'pdf' ? (
                                <FileText className="w-10 h-10 text-red-400" />
                              ) : (
                                <FileIcon className="w-10 h-10 text-neutral-600" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="p-3">
                              <p className="text-xs font-medium text-white truncate" title={file.name}>
                                {file.name}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-neutral-500">
                                  {formatFileSize(file.size)}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); copyToClipboard(file.url) }}
                                  className="text-neutral-500 hover:text-[#39FF14] transition-colors"
                                  title="Copy CDN URL"
                                >
                                  {isCopied ? (
                                    <Check className="w-3.5 h-3.5 text-[#39FF14]" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    /* List view */
                    <div className="space-y-2">
                      {filteredFiles.map((file) => {
                        const fileType = getFileType(file.name)
                        const isCopied = copiedUrl === file.url
                        return (
                          <Card
                            key={file.key}
                            variant="elevated"
                            className="p-3 hover:border-[#39FF14]/30 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3">
                              {/* Thumbnail */}
                              <div
                                className="w-12 h-12 rounded-lg bg-neutral-900 flex-shrink-0 overflow-hidden flex items-center justify-center cursor-pointer"
                                onClick={() => {
                                  if (fileType === 'image') openLightbox(file.url)
                                  else if (fileType === 'video') { setVideoModalUrl(file.url); setVideoModalOpen(true) }
                                  else if (fileType === 'audio') toggleAudio(file.url)
                                }}
                              >
                                {fileType === 'image' ? (
                                  <Image
                                    src={file.url}
                                    alt={file.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  getFileTypeIcon(file.name)
                                )}
                              </div>

                              {/* File info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-neutral-500">{formatFileSize(file.size)}</span>
                                  {file.lastModified && (
                                    <span className="text-xs text-neutral-600">
                                      {new Date(file.lastModified).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {fileType === 'audio' && (
                                  <Button variant="ghost" size="sm" onClick={() => toggleAudio(file.url)}>
                                    {playingAudio === file.url ? (
                                      <Pause className="w-4 h-4 text-[#39FF14]" />
                                    ) : (
                                      <Play className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                                {fileType === 'video' && (
                                  <Button variant="ghost" size="sm" onClick={() => { setVideoModalUrl(file.url); setVideoModalOpen(true) }}>
                                    <Play className="w-4 h-4" />
                                  </Button>
                                )}
                                {fileType === 'pdf' && (
                                  <Button variant="ghost" size="sm" onClick={() => window.open(file.url, '_blank')}>
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(file.url)}
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-4 h-4 mr-1" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-4 h-4 mr-1" />
                                      Copy Link
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Stack>
      </Container>

      {/* Image Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-neutral-300 z-10"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-8 h-8" />
          </button>

          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-neutral-300 z-10"
              onClick={(e) => { e.stopPropagation(); lightboxNav(-1) }}
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}
          {lightboxIndex < imageFiles.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-neutral-300 z-10"
              onClick={(e) => { e.stopPropagation(); lightboxNav(1) }}
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          )}

          <div className="max-w-[90vw] max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white truncate">
                  {imageFiles[lightboxIndex]?.name}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(lightboxUrl)}
                >
                  {copiedUrl === lightboxUrl ? (
                    <><Check className="w-4 h-4 mr-1" /> Copied</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-1" /> Copy Link</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {videoModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setVideoModalOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-neutral-300 z-10"
            onClick={() => setVideoModalOpen(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <div
            className="w-full max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={videoModalUrl}
              controls
              autoPlay
              className="w-full rounded-lg"
            />
            <div className="flex justify-end mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(videoModalUrl)}
              >
                {copiedUrl === videoModalUrl ? (
                  <><Check className="w-4 h-4 mr-1" /> Copied</>
                ) : (
                  <><Copy className="w-4 h-4 mr-1" /> Copy Link</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function MemberStoragePage() {
  return (
    <AdminWrapper>
      <MemberStorageContent />
    </AdminWrapper>
  )
}
