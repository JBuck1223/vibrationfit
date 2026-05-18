// /src/app/support/page.tsx
// Support ticket creation — modern minimalist styling

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, Container, Stack, Spinner, Video, Select } from '@/lib/design-system/components'
import { CheckCircle, Paperclip, Monitor, Trash2, FileText } from 'lucide-react'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { getSupportAttachmentKind, getSupportAttachmentDisplayName } from '@/lib/support/attachment-utils'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface UserInfo {
  id: string
  email: string
  created_at: string
  full_name?: string
  profile_picture_url?: string
}

export default function SupportPage() {
  const [loading, setLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [formData, setFormData] = useState({
    guest_email: '',
    subject: '',
    description: '',
    category: 'account',
  })
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [showRecorder, setShowRecorder] = useState(false)
  const [recorderKey, setRecorderKey] = useState(0)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: account } = await supabase
            .from('user_accounts')
            .select('id, email, first_name, last_name, full_name, profile_picture_url, created_at')
            .eq('id', user.id)
            .maybeSingle()

          if (account) {
            setUserInfo({
              id: account.id,
              email: account.email || user.email || '',
              created_at: account.created_at || user.created_at,
              full_name: account.full_name || undefined,
              profile_picture_url: account.profile_picture_url || undefined
            })
            setFormData(prev => ({
              ...prev,
              guest_email: account.email || user.email || ''
            }))
          } else {
            setUserInfo({
              id: user.id,
              email: user.email || '',
              created_at: user.created_at,
              full_name: undefined,
              profile_picture_url: undefined
            })
            setFormData(prev => ({
              ...prev,
              guest_email: user.email || ''
            }))
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoadingUser(false)
      }
    }

    loadUser()
  }, [])

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
      const payload = {
        ...formData,
        ...(userInfo && { user_id: userInfo.id })
      }

      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit ticket')
      }

      const { ticket } = await response.json()

      if (userInfo && attachmentUrls.length > 0) {
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
            'Your ticket was created, but some attachments could not be linked. Open the ticket to add them.'
          )
        }
      }

      setAttachmentUrls([])
      setShowRecorder(false)
      setTicketNumber(ticket.ticket_number)
      setSubmitted(true)
    } catch (error: any) {
      console.error('Error submitting ticket:', error)
      toast.error(error.message || 'Failed to submit ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Container size="xl">
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="w-16 h-16 bg-[#39FF14]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#39FF14]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Ticket Created</h2>
          <p className="text-[13px] text-neutral-400 mb-1">
            Your support ticket has been submitted.
          </p>
          <p className="text-lg font-semibold text-primary-500 mb-6">
            {ticketNumber}
          </p>
          <p className="text-xs text-neutral-500 mb-6">
            We've sent a confirmation to {formData.guest_email}
          </p>
          <Button variant="primary" onClick={() => (window.location.href = '/support/tickets')}>
            View My Tickets
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {loadingUser ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto w-full">
            {/* User identity header */}
            {userInfo && (
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/[0.06]">
                {userInfo.profile_picture_url ? (
                  <Image
                    src={userInfo.profile_picture_url}
                    alt={userInfo.full_name || 'Profile'}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#39FF14]/20 flex items-center justify-center">
                    <span className="text-[#39FF14] text-sm font-bold">
                      {userInfo.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{userInfo.full_name || 'User'}</p>
                  <p className="text-xs text-neutral-500">{userInfo.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] text-neutral-500">Member since</p>
                  <p className="text-xs text-neutral-300">
                    {new Date(userInfo.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )}

            <div className="sm:rounded-2xl sm:border sm:border-white/[0.06] sm:bg-[#111] sm:p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email field for non-authenticated users */}
                {!userInfo && (
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.guest_email}
                      onChange={(e) => handleChange('guest_email', e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full rounded-xl bg-[#404040] border border-[#666666] hover:border-primary-500 focus:border-primary-500 pl-4 pr-4 py-2.5 text-sm text-white placeholder:text-[#9CA3AF] focus:outline-none transition-colors"
                    />
                  </div>
                )}

                {/* Category and Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Category</label>
                    <Select
                      value={formData.category}
                      onChange={(value) => handleChange('category', value)}
                      options={[
                        { value: 'bug', label: 'Bug Report' },
                        { value: 'account', label: 'Account Help' },
                        { value: 'feature', label: 'Feature Request' },
                        { value: 'technical', label: 'Technical Assistance' },
                        { value: 'other', label: 'Other' },
                      ]}
                      placeholder="Select a category"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Subject</label>
                    <input
                      value={formData.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      placeholder="Brief description"
                      required
                      className="w-full rounded-xl bg-[#404040] border border-[#666666] hover:border-primary-500 focus:border-primary-500 pl-4 pr-4 py-2.5 text-sm text-white placeholder:text-[#9CA3AF] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Description</label>
                  {userInfo ? (
                    <RecordingTextarea
                      value={formData.description}
                      onChange={(v) => handleChange('description', v)}
                      placeholder="Please provide as much detail as possible..."
                      rows={8}
                      recordingPurpose="quick"
                      storageFolder="journal"
                      category="support-new-ticket"
                      instanceId="support-new-ticket-description"
                      onAudioSaved={(audioUrl) => {
                        setAttachmentUrls((prev) => [...prev, audioUrl])
                      }}
                    />
                  ) : (
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Please provide as much detail as possible..."
                      rows={8}
                      required
                      className="w-full rounded-xl bg-[#404040] border border-[#666666] hover:border-primary-500 focus:border-primary-500 px-4 py-3 text-sm text-white placeholder:text-[#9CA3AF] focus:outline-none transition-colors resize-none"
                    />
                  )}
                </div>

                {/* Attachments area */}
                {userInfo && (
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
                          key={`support-new-screen-${recorderKey}`}
                          instanceId={`support-new-screen-${recorderKey}`}
                          mode="screen"
                          recordingPurpose="support"
                          storageFolder="supportVideoRecordings"
                          submitLabel="Attach to Ticket"
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
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />

                    <div className="flex items-center justify-center gap-3">
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
                  </div>
                )}

                {/* Submit */}
                <div className="pt-2 text-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-full bg-[#39FF14] px-8 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-[#39FF14]/80 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                  <p className="text-[11px] text-neutral-500 mt-3">
                    We typically respond within 24 hours
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </Stack>
    </Container>
  )
}
