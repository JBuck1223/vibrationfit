// /src/app/admin/crm/support/[id]/page.tsx
// Support ticket detail page for admins

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Button,
  Card,
  Badge,
  Container,
  Spinner,
  Stack,
  Textarea,
  Select,
  Video,
} from '@/lib/design-system/components'
import { ArrowLeft, Send, MessageSquare, User, Calendar, Hash, Monitor, Pencil, X, Check, Trash2, Mic } from 'lucide-react'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { toast } from 'sonner'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
  user_id: string | null
  guest_email: string | null
  created_at: string
  updated_at: string
}

interface Reply {
  id: string
  ticket_id: string
  admin_id: string | null
  reply: string
  is_internal: boolean
  attachments: string[]
  created_at: string
  admin?: {
    email: string
  }
}

export default function SupportTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string

  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [replyText, setReplyText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
  const [recorderKey, setRecorderKey] = useState(0)
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editAttachments, setEditAttachments] = useState<string[]>([])
  const [showEditRecorder, setShowEditRecorder] = useState(false)
  const [editRecorderKey, setEditRecorderKey] = useState(0)
  const [showEditAudioRecorder, setShowEditAudioRecorder] = useState(false)
  const [editAudioRecorderKey, setEditAudioRecorderKey] = useState(0)
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
      fetchReplies()
    }
  }, [ticketId])

  async function fetchTicket() {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`)
      if (!response.ok) throw new Error('Failed to fetch ticket')

      const data = await response.json()
      setTicket(data.ticket)
    } catch (error) {
      console.error('Error fetching ticket:', error)
      toast.error('Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  async function fetchReplies() {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/replies`)
      if (!response.ok) throw new Error('Failed to fetch replies')

      const data = await response.json()
      setReplies(data.replies || [])
    } catch (error) {
      console.error('Error fetching replies:', error)
    }
  }

  async function handleSendReply() {
    if (!replyText.trim()) return

    setSending(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: replyText,
          is_internal: isInternal,
          attachments: attachmentUrls,
        }),
      })

      if (!response.ok) throw new Error('Failed to send reply')

      setReplyText('')
      setIsInternal(false)
      setAttachmentUrls([])
      setShowRecorder(false)
      await fetchReplies()
    } catch (error) {
      console.error('Error sending reply:', error)
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  function startEditReply(reply: Reply) {
    setEditingReplyId(reply.id)
    setEditText(reply.reply)
    setEditAttachments(reply.attachments || [])
    setShowEditRecorder(false)
  }

  function cancelEdit() {
    setEditingReplyId(null)
    setEditText('')
    setEditAttachments([])
    setShowEditRecorder(false)
    setShowEditAudioRecorder(false)
  }

  async function handleSaveEdit() {
    if (!editingReplyId || !editText.trim()) return

    setSavingEdit(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/replies`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyId: editingReplyId,
          message: editText,
          attachments: editAttachments,
        }),
      })

      if (!response.ok) throw new Error('Failed to update reply')

      cancelEdit()
      await fetchReplies()
      toast.success('Reply updated')
    } catch (error) {
      console.error('Error updating reply:', error)
      toast.error('Failed to update reply')
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleUpdateStatus(newStatus: string) {
    if (!ticket) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')

      setTicket({ ...ticket, status: newStatus })
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  async function handleUpdatePriority(newPriority: string) {
    if (!ticket) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      })

      if (!response.ok) throw new Error('Failed to update priority')

      setTicket({ ...ticket, priority: newPriority })
    } catch (error) {
      console.error('Error updating priority:', error)
      toast.error('Failed to update priority')
    } finally {
      setUpdating(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'open':
        return 'bg-[#8B5CF6] text-white'
      case 'in_progress':
        return 'bg-[#FFB701] text-black'
      case 'waiting_reply':
        return 'bg-secondary-500 text-black'
      case 'resolved':
        return 'bg-primary-500 text-black'
      case 'closed':
        return 'bg-[#666666] text-white'
      default:
        return 'bg-neutral-600 text-white'
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'urgent':
        return 'bg-[#D03739]'
      case 'high':
        return 'bg-[#FFB701]'
      case 'normal':
        return 'bg-secondary-500'
      case 'low':
        return 'bg-[#666666]'
      default:
        return 'bg-neutral-600'
    }
  }

  function isAudioAttachment(url: string) {
    const lower = url.toLowerCase()
    return lower.includes('audio-recording') || lower.endsWith('.mp3') ||
      lower.endsWith('.wav') || lower.endsWith('.ogg') || lower.endsWith('.m4a')
  }

  if (loading) {
    return (
      <Container size="xl" className="py-8">
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!ticket) {
    return (
      <Container size="xl" className="py-8">
        <Card className="p-8 text-center">
          <p className="text-neutral-400 mb-4">Ticket not found</p>
          <Button variant="outline" onClick={() => router.push('/admin/crm/support/board')}>
            Back to Support Board
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl" className="py-8">
      <Stack gap="lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/crm/support/board')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Board
          </Button>
        </div>

        {/* Ticket Header Card */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{ticket.subject}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Hash className="w-4 h-4" />
                <span>{ticket.ticket_number}</span>
                <span>•</span>
                <Calendar className="w-4 h-4" />
                <span>{formatDate(ticket.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Status and Priority Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Status</label>
              <Select
                value={ticket.status}
                onChange={handleUpdateStatus}
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'waiting_reply', label: 'Waiting Reply' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
                disabled={updating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Priority</label>
              <Select
                value={ticket.priority}
                onChange={handleUpdatePriority}
                options={[
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'high', label: 'High' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'low', label: 'Low' },
                ]}
                disabled={updating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Category</label>
              <Badge className={`${getStatusColor(ticket.status)} px-3 py-1.5`}>
                {ticket.category}
              </Badge>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t border-neutral-700 pt-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-400">Customer:</span>
              <span className="text-white font-medium">
                {ticket.guest_email || ticket.user_id || 'Unknown'}
              </span>
            </div>
          </div>
        </Card>

        {/* Original Message */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            Original Request
          </h2>
          <div className="bg-neutral-900 p-4 rounded-xl">
            <p className="text-neutral-300 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </Card>

        {/* Reply Box */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-primary-500" />
            Add Reply
          </h2>

          <div className="space-y-4">
            <RecordingTextarea
              value={replyText}
              onChange={setReplyText}
              placeholder="Type your reply here... or tap the mic to record a voice memo"
              rows={6}
              recordingPurpose="quick"
              storageFolder="journal"
              category="support-reply"
              instanceId={`support-reply-${ticketId}`}
              onAudioSaved={(audioUrl) => {
                setAttachmentUrls(prev => [...prev, audioUrl])
              }}
            />

            {/* Attachment previews */}
            {attachmentUrls.length > 0 && (
              <div className="space-y-2">
                {attachmentUrls.map((url, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-900 rounded-xl border border-[#333]">
                    {isAudioAttachment(url) ? (
                      <div className="flex-1 min-w-0">
                        <audio src={url} controls className="w-full" preload="metadata" />
                      </div>
                    ) : (
                      <div className="w-48 shrink-0">
                        <Video src={url} variant="card" preload="metadata" />
                      </div>
                    )}
                    <div className="shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttachmentUrls(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Screen recorder */}
            {showRecorder && (
              <div className="border border-[#333] rounded-xl p-4">
                <MediaRecorderComponent
                  key={`reply-recorder-${recorderKey}`}
                  instanceId={`support-reply-${recorderKey}`}
                  mode="screen"
                  recordingPurpose="support"
                  storageFolder="supportVideoRecordings"
                  submitLabel="Attach to Reply"
                  fullscreenVideo={false}
                  maxDuration={300}
                  showSaveOption={false}
                  onRecordingComplete={(_blob, _transcript, _save, s3Url) => {
                    if (s3Url) {
                      setAttachmentUrls(prev => [...prev, s3Url])
                      setShowRecorder(false)
                    }
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-neutral-300">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 text-primary-500 focus:ring-primary-500"
                  />
                  Internal note
                </label>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!showRecorder) setRecorderKey(k => k + 1)
                    setShowRecorder(!showRecorder)
                  }}
                  className="flex items-center gap-2 text-neutral-400 hover:text-white"
                >
                  <Monitor className="w-4 h-4" />
                  {showRecorder ? 'Hide Recorder' : 'Record Screen'}
                </Button>
              </div>

              <Button
                variant="primary"
                onClick={handleSendReply}
                disabled={sending || !replyText.trim()}
                className="flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <Spinner size="sm" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Replies */}
        {replies.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              Replies ({replies.length})
            </h2>
            <Stack gap="md">
              {replies.map((reply) => {
                const isEditing = editingReplyId === reply.id
                const hasVideo = reply.attachments?.length > 0

                return (
                  <div key={reply.id} className="bg-neutral-900 p-4 rounded-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-primary-500">
                        {reply.admin_id ? 'Support Team' : 'Customer'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">
                          {formatDate(reply.created_at)}
                        </span>
                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditReply(reply)}
                            className="text-neutral-500 hover:text-white p-1"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={4}
                          className="w-full"
                        />

                        {/* Existing attachments in edit mode */}
                        {editAttachments.map((url, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-800 rounded-lg">
                            {isAudioAttachment(url) ? (
                              <div className="flex-1 min-w-0">
                                <audio src={url} controls className="w-full" preload="metadata" />
                              </div>
                            ) : (
                              <div className="w-48 shrink-0">
                                <Video src={url} variant="card" preload="metadata" />
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditAttachments(editAttachments.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </Button>
                          </div>
                        ))}

                        {/* Add video in edit mode */}
                        {showEditRecorder && (
                          <div className="border border-[#333] rounded-xl p-4">
                            <MediaRecorderComponent
                              key={`edit-recorder-${editRecorderKey}`}
                              instanceId={`support-edit-${editRecorderKey}`}
                              mode="screen"
                              recordingPurpose="support"
                              storageFolder="supportVideoRecordings"
                              submitLabel="Attach Video"
                              fullscreenVideo={false}
                              maxDuration={300}
                              showSaveOption={false}
                              onRecordingComplete={(_blob, _transcript, _save, s3Url) => {
                                if (s3Url) {
                                  setEditAttachments([...editAttachments, s3Url])
                                  setShowEditRecorder(false)
                                }
                              }}
                            />
                          </div>
                        )}

                        {/* Add voice memo in edit mode */}
                        {showEditAudioRecorder && (
                          <div className="border border-[#333] rounded-xl p-4">
                            <MediaRecorderComponent
                              key={`edit-audio-${editAudioRecorderKey}`}
                              instanceId={`support-edit-audio-${editAudioRecorderKey}`}
                              mode="audio"
                              recordingPurpose="support"
                              storageFolder="supportAudioRecordings"
                              submitLabel="Attach Voice Memo"
                              fullscreenVideo={false}
                              maxDuration={300}
                              showSaveOption={false}
                              enableEditor={false}
                              onRecordingComplete={(_blob, _transcript, _save, s3Url) => {
                                if (s3Url) {
                                  setEditAttachments([...editAttachments, s3Url])
                                  setShowEditAudioRecorder(false)
                                }
                              }}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (!showEditAudioRecorder) setEditAudioRecorderKey(k => k + 1)
                                setShowEditAudioRecorder(!showEditAudioRecorder)
                                setShowEditRecorder(false)
                              }}
                              className="flex items-center gap-2 text-neutral-400 hover:text-white"
                            >
                              <Mic className="w-4 h-4" />
                              {showEditAudioRecorder ? 'Hide Recorder' : 'Voice Memo'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (!showEditRecorder) setEditRecorderKey(k => k + 1)
                                setShowEditRecorder(!showEditRecorder)
                                setShowEditAudioRecorder(false)
                              }}
                              className="flex items-center gap-2 text-neutral-400 hover:text-white"
                            >
                              <Monitor className="w-4 h-4" />
                              {showEditRecorder ? 'Hide Recorder' : 'Add Video'}
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                              className="flex items-center gap-1"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={savingEdit || !editText.trim()}
                              className="flex items-center gap-1"
                            >
                              {savingEdit ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode - text left, media right */
                      <div className={hasVideo ? 'grid grid-cols-2 gap-6' : ''}>
                        <div>
                          <p className="text-neutral-300 whitespace-pre-wrap">{reply.reply}</p>
                        </div>
                        {hasVideo && (
                          <div className="space-y-3">
                            {reply.attachments.map((url, idx) =>
                              isAudioAttachment(url) ? (
                                <audio key={idx} src={url} controls className="w-full" preload="metadata" />
                              ) : (
                                <Video key={idx} src={url} variant="card" preload="metadata" />
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  )
}

