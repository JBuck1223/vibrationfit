// /src/app/support/tickets/[id]/page.tsx
// User's single ticket view

'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Button,
  Card,
  Badge,
  type BadgeProps,
  Container,
  Spinner,
  Stack,
  Video,
} from '@/lib/design-system/components'
import { ArrowLeft, Send, Paperclip, Monitor, Trash2, FileText } from 'lucide-react'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { getSupportAttachmentKind, getSupportAttachmentDisplayName } from '@/lib/support/attachment-utils'
import { toast } from 'sonner'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
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
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string

  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
  const [recorderKey, setRecorderKey] = useState(0)
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
    }
  }, [ticketId])

  async function fetchTicket() {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`)
      if (!response.ok) throw new Error('Failed to fetch ticket')

      const data = await response.json()
      setTicket(data.ticket)
      setReplies(data.replies.filter((r: Reply) => !r.is_internal) || [])
    } catch (error) {
      console.error('Error fetching ticket:', error)
      toast.error('Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadingFile(true)
    try {
      for (const file of Array.from(files)) {
        const { url } = await uploadUserFile('supportAttachments', file)
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

  async function handleSendReply() {
    const trimmed = replyText.trim()
    if (!trimmed && attachmentUrls.length === 0) return

    setSending(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: trimmed,
          is_internal: false,
          attachments: attachmentUrls,
        }),
      })

      if (!response.ok) throw new Error('Failed to send reply')

      setReplyText('')
      setAttachmentUrls([])
      setShowRecorder(false)
      await fetchTicket()
      toast.success('Reply sent')
    } catch (error) {
      console.error('Error sending reply:', error)
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
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

  function getStatusVariant(status: string): BadgeProps['variant'] {
    switch (status) {
      case 'open': return 'accent'
      case 'in_progress': return 'warning'
      case 'waiting_reply': return 'secondary'
      case 'resolved': return 'primary'
      case 'closed': return 'neutral'
      default: return 'neutral'
    }
  }

  function getPriorityVariant(priority: string): BadgeProps['variant'] {
    switch (priority) {
      case 'urgent': return 'danger'
      case 'high': return 'warning'
      case 'low': return 'neutral'
      default: return 'neutral'
    }
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
          <Button variant="secondary" onClick={() => router.push('/support/tickets')}>
            Back to Tickets
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
            onClick={() => router.push('/support/tickets')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Button>
        </div>

        {/* Ticket Header Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-white">{ticket.subject}</h1>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Badge variant={getStatusVariant(ticket.status)}>
                {ticket.status.replace('_', ' ')}
              </Badge>
              {ticket.priority !== 'normal' && (
                <Badge variant={getPriorityVariant(ticket.priority)}>
                  {ticket.priority}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-neutral-500 pt-3 border-t border-[#333]">
            <span>Ticket: {ticket.ticket_number}</span>
            <span className="text-neutral-700">|</span>
            <div className="flex items-center gap-2">
              <span>Category:</span>
              <Badge variant="neutral">{ticket.category}</Badge>
            </div>
            <span className="text-neutral-700">|</span>
            <span>Submitted: {formatDate(ticket.created_at)}</span>
          </div>
        </Card>

        {/* Original Message */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Description</h2>
          <div className="bg-neutral-900 p-4 rounded-xl">
            <p className="text-neutral-300 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </Card>

        {/* Replies */}
        {replies.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-white mb-4">Conversation</h2>
            <Stack gap="md">
              {replies.map((reply) => {
                const hasVideo = reply.attachments?.length > 0
                return (
                  <div key={reply.id} className="bg-neutral-900 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-primary-500">
                        {reply.admin_id ? 'Support Team' : 'You'}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatDate(reply.created_at)}
                      </span>
                    </div>
                    <div className={hasVideo ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : ''}>
                      <div>
                        <p className="text-neutral-300 whitespace-pre-wrap">{reply.reply}</p>
                      </div>
                      {hasVideo && (
                        <div className="space-y-3">
                          {reply.attachments.map((url, idx) => {
                            const kind = getSupportAttachmentKind(url)
                            if (kind === 'audio') {
                              return <audio key={idx} src={url} controls className="w-full" preload="metadata" />
                            }
                            if (kind === 'image') {
                              return <img key={idx} src={url} alt="Attachment" className="w-full rounded-lg object-cover" />
                            }
                            if (kind === 'document') {
                              return (
                                <div key={idx} className="flex items-center gap-2 p-3 bg-neutral-800 rounded-lg">
                                  <FileText className="w-5 h-5 text-neutral-400 shrink-0" />
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-secondary-400 hover:underline truncate"
                                  >
                                    {getSupportAttachmentDisplayName(url)}
                                  </a>
                                </div>
                              )
                            }
                            return <Video key={idx} src={url} variant="card" preload="metadata" />
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </Stack>
          </Card>
        )}

        {/* Reply Box */}
        {ticket.status !== 'closed' && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-primary-500" />
              Add a Reply
            </h2>

            <div className="space-y-4">
              <RecordingTextarea
                value={replyText}
                onChange={setReplyText}
                placeholder="Type your reply here... or use the mic for a voice memo"
                rows={6}
                recordingPurpose="quick"
                storageFolder="journal"
                category="support-reply"
                instanceId={`member-support-reply-${ticketId}`}
                onAudioSaved={(audioUrl) => {
                  setAttachmentUrls((prev) => [...prev, audioUrl])
                }}
              />

              {attachmentUrls.length > 0 && (
                <div className="space-y-2">
                  {attachmentUrls.map((url, idx) => {
                    const kind = getSupportAttachmentKind(url)
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-900 rounded-xl border border-[#333]">
                        {kind === 'audio' ? (
                          <div className="flex-1 min-w-0">
                            <audio src={url} controls className="w-full" preload="metadata" />
                          </div>
                        ) : kind === 'image' ? (
                          <div className="w-48 shrink-0">
                            <img src={url} alt="Attachment" className="w-full rounded-lg object-cover" />
                          </div>
                        ) : kind === 'document' ? (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-5 h-5 text-neutral-400 shrink-0" />
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-secondary-400 hover:underline truncate"
                            >
                              {getSupportAttachmentDisplayName(url)}
                            </a>
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
                            onClick={() => setAttachmentUrls((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {showRecorder && (
                <div className="border border-[#333] rounded-xl p-4">
                  <MediaRecorderComponent
                    key={`member-reply-recorder-${recorderKey}`}
                    instanceId={`member-support-screen-${recorderKey}`}
                    mode="screen"
                    recordingPurpose="support"
                    storageFolder="supportVideoRecordings"
                    submitLabel="Attach to Reply"
                    fullscreenVideo={false}
                    maxDuration={300}
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

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white"
                  >
                    {uploadingFile ? <Spinner size="sm" /> : <Paperclip className="w-4 h-4" />}
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
                    <Monitor className="w-4 h-4" />
                    {showRecorder ? 'Hide Recorder' : 'Record Screen'}
                  </Button>
                </div>

                <Button
                  variant="primary"
                  onClick={handleSendReply}
                  disabled={sending || (!replyText.trim() && attachmentUrls.length === 0)}
                  className="flex items-center gap-2 shrink-0"
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
        )}

        {ticket.status === 'closed' && (
          <Card className="p-6 bg-neutral-900 border-neutral-700">
            <p className="text-neutral-400 text-center">
              This ticket has been closed. If you need further assistance, please create a new ticket.
            </p>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
