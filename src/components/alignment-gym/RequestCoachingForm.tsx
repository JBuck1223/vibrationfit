// /src/components/alignment-gym/RequestCoachingForm.tsx
// On-page coaching request form (rendered inside a modal on the Alignment Gym hub).
// Submits a private "coaching" support ticket so a struggle / vibrational constraint
// can be triaged for a group session.

'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Spinner,
  Video,
  CategoryGrid,
  VISION_CATEGORIES,
} from '@/lib/design-system'
import { CheckCircle, Paperclip, Monitor, Trash2, FileText, Video as VideoIcon } from 'lucide-react'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { getSupportAttachmentKind, getSupportAttachmentDisplayName } from '@/lib/support/attachment-utils'
import { toast } from 'sonner'

// Life areas only (exclude the meta forward / conclusion categories), matching the /journal picker.
const LIFE_AREA_CATEGORIES = VISION_CATEGORIES.filter(
  (category) => category.key !== 'forward' && category.key !== 'conclusion'
)

interface RequestCoachingFormProps {
  userId: string
  onClose: () => void
  hideNavigation?: boolean
}

export function RequestCoachingForm({ userId, onClose, hideNavigation = false }: RequestCoachingFormProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')

  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [showRecorder, setShowRecorder] = useState(false)
  const [showVideoRecorder, setShowVideoRecorder] = useState(false)
  const [recorderKey, setRecorderKey] = useState(0)
  const [videoRecorderKey, setVideoRecorderKey] = useState(0)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function toggleArea(key: string) {
    setSelectedAreas((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepend selected life areas to the description so coaches have context.
      const areaLabels = LIFE_AREA_CATEGORIES
        .filter((c) => selectedAreas.includes(c.key))
        .map((c) => c.label)

      const fullDescription = [
        areaLabels.length > 0 ? `Life area(s): ${areaLabels.join(', ')}` : null,
        areaLabels.length > 0 ? '' : null,
        description,
      ]
        .filter((line) => line !== null)
        .join('\n')

      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          description: fullDescription,
          category: 'coaching',
          user_id: userId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit your request')
      }

      const { ticket } = await response.json()

      if (attachmentUrls.length > 0) {
        const attachRes = await fetch(`/api/support/tickets/${ticket.id}/replies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reply: '',
            is_internal: false,
            attachments: attachmentUrls,
          }),
        })
        if (!attachRes.ok) {
          toast.error(
            'Your request was submitted, but some attachments could not be linked. Open the request to add them.'
          )
        }
      }

      setAttachmentUrls([])
      setShowRecorder(false)
      setShowVideoRecorder(false)
      setTicketNumber(ticket.ticket_number)
      setSubmitted(true)
    } catch (error: any) {
      console.error('Error submitting coaching request:', error)
      toast.error(error.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-6 max-w-md mx-auto">
        <div className="w-16 h-16 bg-[#39FF14]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-[#39FF14]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Request Received</h3>
        <p className="text-[13px] text-neutral-400 mb-1">
          Your coaching request has been sent to your guide.
        </p>
        <p className="text-lg font-semibold text-primary-500 mb-4">{ticketNumber}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {!hideNavigation && (
            <Button variant="primary" onClick={() => router.push('/support/tickets')}>
              View My Requests
            </Button>
          )}
          <Button variant={hideNavigation ? 'primary' : 'ghost'} onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Life area selection — outside scroll so pill bleed reaches modal edges on mobile */}
      <div>
        <label className="block text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
          Which area of life is this about?
        </label>
        <CategoryGrid
          categories={LIFE_AREA_CATEGORIES}
          selectedCategories={selectedAreas}
          onCategoryClick={toggleArea}
          wrapOnDesktop
          pillLabel="scroll"
          bleedClassName="max-md:-mx-6 md:mx-0"
        />
      </div>

      <div className="max-h-[min(58vh,520px)] overflow-y-auto pr-1 space-y-5">
      {/* Subject */}
      <div>
        <label className="block text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
          What are you working through?
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="A short headline for your request"
          required
          className="w-full rounded-xl bg-[#404040] border border-[#666666] hover:border-primary-500 focus:border-primary-500 pl-4 pr-4 py-2.5 text-sm text-white placeholder:text-[#9CA3AF] focus:outline-none transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
          Tell us more
        </label>
        <RecordingTextarea
          value={description}
          onChange={(v) => setDescription(v)}
          placeholder="Describe the constraint or situation you'd like help with. The more context, the better the coaching."
          rows={6}
          recordingPurpose="quick"
          storageFolder="journal"
          category="coaching-request"
          instanceId="coaching-request-description"
          onAudioSaved={(audioUrl) => {
            setAttachmentUrls((prev) => [...prev, audioUrl])
          }}
        />
      </div>

      {/* Attachments */}
      <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4 space-y-3">
        {attachmentUrls.length > 0 && (
          <div className="space-y-2">
            {attachmentUrls.map((url, idx) => {
              const kind = getSupportAttachmentKind(url)
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-black/40 p-3"
                >
                  {kind === 'audio' ? (
                    <div className="min-w-0 flex-1">
                      <audio src={url} controls className="w-full h-8" preload="metadata" />
                    </div>
                  ) : kind === 'image' ? (
                    <div className="w-20 h-14 shrink-0 rounded-lg overflow-hidden">
                      <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                    </div>
                  ) : kind === 'document' ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-neutral-500" />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-sm text-cyan-400 hover:underline"
                      >
                        {getSupportAttachmentDisplayName(url)}
                      </a>
                    </div>
                  ) : (
                    <div className="w-32 shrink-0 rounded-lg overflow-hidden">
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
          <MediaRecorderComponent
            key={`coaching-screen-${recorderKey}`}
            instanceId={`coaching-screen-${recorderKey}`}
            mode="screen"
            recordingPurpose="support"
            storageFolder="supportVideoRecordings"
            submitLabel="Attach to Request"
            fullscreenVideo={false}
            showSaveOption={false}
            onRecordingComplete={(_blob, _transcript, _save, s3Url) => {
              if (s3Url) {
                setAttachmentUrls((prev) => [...prev, s3Url])
                setShowRecorder(false)
              }
            }}
          />
        )}

        {showVideoRecorder && (
          <MediaRecorderComponent
            key={`coaching-video-${videoRecorderKey}`}
            instanceId={`coaching-video-${videoRecorderKey}`}
            mode="video"
            recordingPurpose="support"
            storageFolder="supportVideoRecordings"
            submitLabel="Attach to Request"
            fullscreenVideo={false}
            showSaveOption={false}
            onRecordingComplete={(_blob, _transcript, _save, s3Url) => {
              if (s3Url) {
                setAttachmentUrls((prev) => [...prev, s3Url])
                setShowVideoRecorder(false)
              }
            }}
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (!showVideoRecorder) {
                setVideoRecorderKey((k) => k + 1)
                setShowRecorder(false)
              }
              setShowVideoRecorder(!showVideoRecorder)
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700 hover:text-white hover:border-neutral-500 transition-colors"
          >
            <VideoIcon className="h-3.5 w-3.5" />
            {showVideoRecorder ? 'Hide Recorder' : 'Record Video'}
          </button>
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
              if (!showRecorder) {
                setRecorderKey((k) => k + 1)
                setShowVideoRecorder(false)
              }
              setShowRecorder(!showRecorder)
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700 hover:text-white hover:border-neutral-500 transition-colors"
          >
            <Monitor className="h-3.5 w-3.5" />
            {showRecorder ? 'Hide Recorder' : 'Record Screen'}
          </button>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2 text-center">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full bg-[#39FF14] px-8 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-[#39FF14]/80 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
        <p className="text-[11px] text-neutral-500 mt-3">
          Your request is private and goes straight to your guide.
        </p>
      </div>
      </div>
    </form>
  )
}
