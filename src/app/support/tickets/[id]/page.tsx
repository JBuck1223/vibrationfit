// /src/app/support/tickets/[id]/page.tsx
// User's single ticket view

'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Button,
  Container,
  Spinner,
  Video,
} from '@/lib/design-system/components'
import { Send, Paperclip, Monitor, Trash2, FileText } from 'lucide-react'
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


  if (loading) {
    return (
      <Container size="xl">
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  function parseLifeAreas(description: string): { areas: string[]; body: string } {
    const match = description.match(/^Life area\(s\):\s*(.+?)(?:\n\n|\n|$)/)
    if (!match) return { areas: [], body: description }
    const areas = match[1].split(',').map(a => a.trim()).filter(Boolean)
    const body = description.slice(match[0].length).trim()
    return { areas, body }
  }

  if (!ticket) {
    return (
      <Container size="xl">
        <div className="text-center py-16">
          <p className="text-neutral-400 mb-4">Ticket not found</p>
          <Button variant="secondary" onClick={() => router.push('/support/tickets')}>
            Back to Tickets
          </Button>
        </div>
      </Container>
    )
  }

  const { areas: lifeAreas, body: descriptionBody } = parseLifeAreas(ticket.description)

  return (
    <Container size="xl" className="pb-8">
      <div className="space-y-6">
        {/* Metadata row */}
        <div className="flex items-center justify-center gap-3 flex-wrap px-1 text-[11px]">
          <span className="text-neutral-500">
            {ticket.ticket_number} · {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="inline-flex px-1.5 py-0.5 rounded-full border border-neutral-600/50 text-neutral-300 bg-neutral-800/50">
            {ticket.category}
          </span>
          <span className={`inline-flex px-2 py-0.5 rounded-full border font-medium capitalize ${
            ticket.status === 'open' ? 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30' :
            ticket.status === 'in_progress' ? 'text-amber-400 bg-amber-500/20 border-amber-500/30' :
            ticket.status === 'waiting_reply' ? 'text-purple-400 bg-purple-500/20 border-purple-500/30' :
            ticket.status === 'resolved' ? 'text-[#39FF14] bg-[#39FF14]/20 border-[#39FF14]/30' :
            'text-neutral-400 bg-neutral-800 border-neutral-700'
          }`}>
            {ticket.status.replace(/_/g, ' ')}
          </span>
          {ticket.priority !== 'normal' && (
            <span className={`inline-flex px-2 py-0.5 rounded-full border font-medium capitalize ${
              ticket.priority === 'urgent' ? 'text-[#FF0040] bg-[#FF0040]/20 border-[#FF0040]/30' :
              ticket.priority === 'high' ? 'text-amber-400 bg-amber-500/20 border-amber-500/30' :
              'text-neutral-400 bg-neutral-800 border-neutral-700'
            }`}>
              {ticket.priority}
            </span>
          )}
        </div>

        {/* Title + Life Areas + Description */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-5 space-y-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white">{ticket.subject}</h1>
          {lifeAreas.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Life Areas</p>
              <div className="flex flex-wrap gap-2">
                {lifeAreas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium border border-[#00FFFF]/30 bg-[#00FFFF]/10 text-[#00FFFF]"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Description</p>
            <p className="text-[13px] text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {descriptionBody || ticket.description}
            </p>
          </div>
        </div>

        {/* Conversation */}
        {replies.length > 0 && (
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              Conversation ({replies.length})
            </p>
            <div className="rounded-2xl border border-white/[0.06] bg-[#111] overflow-hidden divide-y divide-white/[0.06]">
              {replies.map((reply) => {
                const isAdmin = !!reply.admin_id
                const hasAttachments = reply.attachments?.length > 0
                return (
                  <div key={reply.id} className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[12px] font-semibold ${isAdmin ? 'text-[#39FF14]' : 'text-[#00FFFF]'}`}>
                        {isAdmin ? 'Support Team' : 'You'}
                      </span>
                      <span className="text-[10px] text-neutral-600">{formatDate(reply.created_at)}</span>
                    </div>
                    {reply.reply && (
                      <p className="text-[13px] text-neutral-300 leading-relaxed whitespace-pre-wrap">
                        {reply.reply}
                      </p>
                    )}
                    {hasAttachments && (
                      <div className="mt-3 space-y-2">
                        {reply.attachments.map((url, idx) => {
                          const kind = getSupportAttachmentKind(url)
                          if (kind === 'audio') {
                            return <audio key={idx} src={url} controls className="w-full max-w-sm h-8" preload="metadata" />
                          }
                          if (kind === 'image') {
                            return <img key={idx} src={url} alt="" className="rounded-xl max-w-xs border border-white/[0.06]" />
                          }
                          if (kind === 'document') {
                            return (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[12px] text-[#00FFFF] hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {getSupportAttachmentDisplayName(url)}
                              </a>
                            )
                          }
                          return (
                            <div key={idx} className="rounded-xl overflow-hidden border border-white/[0.06] max-w-sm">
                              <Video src={url} variant="card" preload="metadata" />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Reply Box */}
        {ticket.status !== 'closed' && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-5 space-y-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Reply</p>

            <RecordingTextarea
              value={replyText}
              onChange={setReplyText}
              placeholder="Type your reply here... or use the mic for a voice memo"
              rows={5}
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
                    <div key={idx} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
                      {kind === 'audio' ? (
                        <div className="flex-1 min-w-0">
                          <audio src={url} controls className="w-full h-8" preload="metadata" />
                        </div>
                      ) : kind === 'image' ? (
                        <div className="w-16 h-12 shrink-0 rounded-lg overflow-hidden">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : kind === 'document' ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
                          <span className="text-sm text-[#00FFFF] truncate">{getSupportAttachmentDisplayName(url)}</span>
                        </div>
                      ) : (
                        <div className="w-24 shrink-0 rounded-lg overflow-hidden">
                          <Video src={url} variant="card" preload="metadata" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setAttachmentUrls((prev) => prev.filter((_, i) => i !== idx))}
                        className="shrink-0 p-1.5 text-neutral-500 hover:text-[#FF0040] transition-colors rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {showRecorder && (
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <MediaRecorderComponent
                  key={`member-reply-recorder-${recorderKey}`}
                  instanceId={`member-support-screen-${recorderKey}`}
                  mode="screen"
                  recordingPurpose="support"
                  storageFolder="supportVideoRecordings"
                  submitLabel="Attach to Reply"
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700 hover:text-white hover:border-neutral-500 transition-colors"
                >
                  {uploadingFile ? <Spinner size="sm" /> : <Paperclip className="h-3.5 w-3.5" />}
                  {uploadingFile ? 'Uploading...' : 'Attach File'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!showRecorder) setRecorderKey((k) => k + 1)
                    setShowRecorder(!showRecorder)
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700 hover:text-white hover:border-neutral-500 transition-colors"
                >
                  <Monitor className="h-3.5 w-3.5" />
                  {showRecorder ? 'Hide Recorder' : 'Record Screen'}
                </button>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSendReply}
                disabled={sending || (!replyText.trim() && attachmentUrls.length === 0)}
              >
                {sending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {ticket.status === 'closed' && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-5 text-center">
            <p className="text-sm text-neutral-400">
              This ticket has been closed. If you need further assistance, please create a new ticket.
            </p>
          </div>
        )}
      </div>
    </Container>
  )
}
