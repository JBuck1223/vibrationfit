'use client'

import { useState } from 'react'
import { CheckCircle, Keyboard, Video } from 'lucide-react'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { RecordingTextarea } from '@/components/RecordingTextarea'

export function UnlockExperience({
  number,
  question,
  text,
  onTextChange,
  videoUrl,
  transcript,
  onVideo,
  recordingId,
}: {
  number: number
  question: string
  text: string
  onTextChange: (value: string) => void
  videoUrl: string | null
  transcript: string | null
  onVideo: (url: string, transcript?: string) => void
  recordingId?: string
}) {
  const [showText, setShowText] = useState(false)

  return (
    <div className="border-t border-white/[0.06] py-5">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 w-5 shrink-0 font-mono text-xs tabular-nums text-neutral-500">
          {number}
        </span>
        <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-white">{question}</p>
      <p className="mt-1 text-xs text-neutral-500">
        Record a video, or type it. The mic on the text field can speak it for you.
      </p>
      <div className="mt-3">
        {showText ? (
          <>
            <RecordingTextarea
              value={text}
              onChange={onTextChange}
              placeholder="Write here, or tap the mic to record."
              rows={4}
              recordingPurpose="quick"
              allowVideo={false}
              storageFolder="journal"
              instanceId="survey-unlock-shift"
              category="survey-unlock-shift"
            />
            <button
              type="button"
              onClick={() => setShowText(false)}
              className="mt-3 flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
            >
              <Video className="h-4 w-4" />
              Record a video instead
            </button>
          </>
        ) : videoUrl ? (
          <div className="rounded-xl border border-primary-500/30 bg-primary-500/10 p-4">
            <div className="flex items-center gap-2 text-primary-300">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Video recorded</span>
            </div>
            {transcript && (
              <p className="mt-2 text-sm italic text-neutral-400">
                {transcript.length > 200 ? `${transcript.slice(0, 200)}...` : transcript}
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowText(true)}
              className="mt-3 flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
            >
              <Keyboard className="h-4 w-4" />
              Type my response instead
            </button>
          </div>
        ) : (
          <>
            <MediaRecorderComponent
              mode="video"
              storageFolder="intensiveTestimonials"
              recordingPurpose="support"
              submitLabel="Send"
              recordingId={recordingId}
              enableEditor={false}
              onRecordingComplete={(_blob, nextTranscript, _save, s3Url) => {
                if (s3Url) onVideo(s3Url, nextTranscript)
              }}
            />
            <button
              type="button"
              onClick={() => setShowText(true)}
              className="mt-3 flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
            >
              <Keyboard className="h-4 w-4" />
              Type my response instead
            </button>
          </>
        )}
      </div>
        </div>
      </div>
    </div>
  )
}
