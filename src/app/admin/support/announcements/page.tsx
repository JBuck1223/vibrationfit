// /src/app/admin/support/announcements/page.tsx
// Admin page for creating and managing support announcements

'use client'

import { useEffect, useState, useRef } from 'react'
import { Button, Card, Input, Textarea, Container, Stack, Badge, Spinner, Select, Video, type BadgeProps } from '@/lib/design-system/components'
import { Plus, Megaphone, Pin, PinOff, Trash2, Paperclip, Monitor, FileText, Eye, EyeOff, Pencil, X, Check } from 'lucide-react'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { getSupportAttachmentKind, getSupportAttachmentDisplayName } from '@/lib/support/attachment-utils'
import { toast } from 'sonner'

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  attachments: string[]
  is_pinned: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { value: 'update', label: 'Platform Update' },
  { value: 'how-to', label: 'How-To Guide' },
  { value: 'known-issue', label: 'Known Issue' },
  { value: 'tip', label: 'Tip & Trick' },
]

function getCategoryVariant(category: string): BadgeProps['variant'] {
  switch (category) {
    case 'update': return 'primary'
    case 'how-to': return 'secondary'
    case 'known-issue': return 'warning'
    case 'tip': return 'accent'
    default: return 'neutral'
  }
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'update',
  })
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [showRecorder, setShowRecorder] = useState(false)
  const [recorderKey, setRecorderKey] = useState(0)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function fetchAnnouncements() {
    try {
      const response = await fetch('/api/support/announcements?limit=100&include_drafts=true')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setAnnouncements(data.announcements || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({ title: '', content: '', category: 'update' })
    setAttachmentUrls([])
    setShowRecorder(false)
    setShowCreateForm(false)
    setEditingId(null)
  }

  function startEdit(announcement: Announcement) {
    setEditingId(announcement.id)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
    })
    setAttachmentUrls(announcement.attachments || [])
    setShowCreateForm(true)
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadingFile(true)
    try {
      for (const file of Array.from(files)) {
        const { url } = await uploadUserFile('announcementAttachments', file)
        setAttachmentUrls((prev) => [...prev, url])
      }
      toast.success(files.length > 1 ? 'Files attached' : 'File attached')
    } catch (error) {
      console.error('File upload error:', error)
      toast.error('Failed to upload file')
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave(publish: boolean) {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        const response = await fetch(`/api/support/announcements/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            attachments: attachmentUrls,
            ...(publish ? { publish: true } : {}),
          }),
        })
        if (!response.ok) throw new Error('Failed to update')
        toast.success('Announcement updated')
      } else {
        const response = await fetch('/api/support/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            attachments: attachmentUrls,
            publish,
          }),
        })
        if (!response.ok) throw new Error('Failed to create')
        toast.success(publish ? 'Announcement published' : 'Draft saved')
      }
      resetForm()
      fetchAnnouncements()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save announcement')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePin(id: string, currentlyPinned: boolean) {
    try {
      const response = await fetch(`/api/support/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !currentlyPinned }),
      })
      if (!response.ok) throw new Error('Failed to update')
      toast.success(currentlyPinned ? 'Unpinned' : 'Pinned')
      fetchAnnouncements()
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  async function handleTogglePublish(id: string, isPublished: boolean) {
    try {
      const response = await fetch(`/api/support/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isPublished ? { unpublish: true } : { publish: true }),
      })
      if (!response.ok) throw new Error('Failed to update')
      toast.success(isPublished ? 'Unpublished' : 'Published')
      fetchAnnouncements()
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement? This cannot be undone.')) return
    try {
      const response = await fetch(`/api/support/announcements/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Announcement deleted')
      fetchAnnouncements()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Support Announcements</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Post updates, how-tos, and known issues visible to all members
            </p>
          </div>
          {!showCreateForm && (
            <Button variant="primary" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          )}
        </div>

        {showCreateForm && (
          <Card className="p-6 border-primary-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-400 mb-2">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement title..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">Category</label>
                  <Select
                    value={formData.category}
                    onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    options={CATEGORIES}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2">Content</label>
                <RecordingTextarea
                  value={formData.content}
                  onChange={(v) => setFormData(prev => ({ ...prev, content: v }))}
                  placeholder="Write your announcement... explain what members need to know. You can also record audio with the mic button."
                  rows={10}
                  recordingPurpose="quick"
                  storageFolder="journal"
                  category="announcement"
                  instanceId="admin-announcement-content"
                  onAudioSaved={(audioUrl) => {
                    setAttachmentUrls((prev) => [...prev, audioUrl])
                  }}
                />
              </div>

              {/* Attachments area */}
              <div className="space-y-4 rounded-xl border border-[#333] p-4">
                {attachmentUrls.length > 0 && (
                  <div className="space-y-2">
                    {attachmentUrls.map((url, idx) => {
                      const kind = getSupportAttachmentKind(url)
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#333] bg-neutral-900 p-3"
                        >
                          {kind === 'audio' ? (
                            <div className="min-w-0 flex-1">
                              <audio src={url} controls className="w-full" preload="metadata" />
                            </div>
                          ) : kind === 'image' ? (
                            <div className="w-40 shrink-0">
                              <img src={url} alt="Attachment" className="w-full rounded-lg object-cover" />
                            </div>
                          ) : kind === 'document' ? (
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <FileText className="h-5 w-5 shrink-0 text-neutral-400" />
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate text-sm text-secondary-400 hover:underline"
                              >
                                {getSupportAttachmentDisplayName(url)}
                              </a>
                            </div>
                          ) : (
                            <div className="w-60 shrink-0">
                              <Video src={url} variant="card" preload="metadata" />
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => setAttachmentUrls((prev) => prev.filter((_, i) => i !== idx))}
                            className="shrink-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {showRecorder && (
                  <div className="rounded-xl border border-[#333] p-4">
                    <MediaRecorderComponent
                      key={`announcement-screen-${recorderKey}`}
                      instanceId={`announcement-screen-${recorderKey}`}
                      mode="screen"
                      recordingPurpose="support"
                      storageFolder="announcementVideoRecordings"
                      submitLabel="Attach Recording"
                      fullscreenVideo={false}
                      showSaveOption={false}
                      onRecordingComplete={(_blob, _transcript, _save, s3Url) => {
                        if (s3Url) {
                          setAttachmentUrls((prev) => [...prev, s3Url])
                          setShowRecorder(false)
                        }
                      }}
                    />
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white"
                  >
                    {uploadingFile ? <Spinner size="sm" /> : <Paperclip className="h-4 w-4" />}
                    {uploadingFile ? 'Uploading...' : 'Attach File'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      if (!showRecorder) setRecorderKey((k) => k + 1)
                      setShowRecorder(!showRecorder)
                    }}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white"
                  >
                    <Monitor className="h-4 w-4" />
                    {showRecorder ? 'Hide Recorder' : 'Record Screen'}
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-[#333]">
                <Button
                  variant="primary"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                >
                  {saving ? <Spinner size="sm" /> : <Check className="w-4 h-4 mr-2" />}
                  {editingId ? 'Save & Publish' : 'Publish Now'}
                </Button>
                {!editingId && (
                  <Button
                    variant="outline"
                    onClick={() => handleSave(false)}
                    disabled={saving}
                  >
                    Save as Draft
                  </Button>
                )}
                <Button variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Existing announcements list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : announcements.length === 0 && !showCreateForm ? (
          <Card className="p-8 text-center">
            <Megaphone className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Announcements Yet</h3>
            <p className="text-neutral-400 mb-6">
              Create your first announcement to share with all members.
            </p>
            <Button variant="primary" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Announcement
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {announcement.is_pinned && (
                        <Pin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                      )}
                      <h3 className="text-base font-semibold text-white truncate">
                        {announcement.title}
                      </h3>
                      <Badge variant={getCategoryVariant(announcement.category)} className="shrink-0">
                        {announcement.category}
                      </Badge>
                      {!announcement.published_at && (
                        <Badge variant="neutral" className="shrink-0">Draft</Badge>
                      )}
                    </div>
                    <p className="text-sm text-neutral-400 line-clamp-1">
                      {announcement.content || 'No content'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                      <span>
                        {announcement.published_at
                          ? `Published ${formatDate(announcement.published_at)}`
                          : `Created ${formatDate(announcement.created_at)}`}
                      </span>
                      {announcement.attachments.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {announcement.attachments.length} attachment{announcement.attachments.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePin(announcement.id, announcement.is_pinned)}
                      title={announcement.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      {announcement.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(announcement.id, !!announcement.published_at)}
                      title={announcement.published_at ? 'Unpublish' : 'Publish'}
                    >
                      {announcement.published_at ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(announcement)}
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                      title="Delete"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Stack>
    </Container>
  )
}
