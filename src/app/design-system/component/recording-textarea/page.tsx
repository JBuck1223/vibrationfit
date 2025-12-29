'use client'

import { useState } from 'react'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { Card, Stack, Badge, Button, Container, PageHero } from '@/lib/design-system/components'
import { Mic, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RecordingTextareaShowcase() {
  const [basicValue, setBasicValue] = useState('')
  const [videoValue, setVideoValue] = useState('')
  const [quickValue, setQuickValue] = useState('')
  const [transcriptOnlyValue, setTranscriptOnlyValue] = useState('')
  const [withFileValue, setWithFileValue] = useState('')

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Back Link */}
        <Link 
          href="/design-system" 
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Design System
        </Link>

        {/* Hero */}
        <PageHero
          eyebrow="DESIGN SYSTEM"
          title="Recording Textarea"
          subtitle="Textarea with integrated audio/video recording, transcription, and S3 storage"
        />

        {/* Import */}
        <Card className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xl font-semibold mb-4">Import</h2>
            <pre className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 overflow-x-auto">
              <code className="text-primary-400">
{`import { RecordingTextarea } from '@/components/RecordingTextarea'`}
              </code>
            </pre>
          </Card>

        {/* Props */}
        <Card className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xl font-semibold mb-4">Props</h2>
            <div className="space-y-4">
              <PropRow 
                name="value" 
                type="string" 
                required 
                description="The current text value"
              />
              <PropRow 
                name="onChange" 
                type="(value: string) => void" 
                required 
                description="Callback when text changes"
              />
              <PropRow 
                name="onRecordingSaved" 
                type="(url: string, transcript: string, type: 'audio' | 'video', updatedText: string) => Promise<void>" 
                description="Callback when recording is saved (with S3 URL, transcript, recording type, and updated text value)"
              />
              <PropRow 
                name="placeholder" 
                type="string" 
                description="Placeholder text"
              />
              <PropRow 
                name="rows" 
                type="number" 
                defaultValue="4" 
                description="Number of rows"
              />
              <PropRow 
                name="label" 
                type="string" 
                description="Label text above textarea"
              />
              <PropRow 
                name="allowVideo" 
                type="boolean" 
                defaultValue="false" 
                description="Show video recording button"
              />
              <PropRow 
                name="disabled" 
                type="boolean" 
                defaultValue="false" 
                description="Disable the textarea and recording buttons"
              />
              <PropRow 
                name="storageFolder" 
                type="'journal' | 'visionBoard' | 'lifeVision' | 'alignmentPlan' | 'profile' | 'customTracks'" 
                defaultValue="'journal'" 
                description="S3 folder for recording storage"
              />
              <PropRow 
                name="category" 
                type="string" 
                description="Category for IndexedDB persistence (e.g., 'fun', 'health', 'journal')"
              />
              <PropRow 
                name="instanceId" 
                type="string" 
                description="Unique identifier for this field (prevents recordings from bleeding across fields)"
              />
              <PropRow 
                name="onUploadProgress" 
                type="(progress: number, status: string, fileName: string, fileSize: number) => void" 
                description="Callback for upload progress tracking"
              />
              <PropRow 
                name="recordingPurpose" 
                type="'quick' | 'transcriptOnly' | 'withFile' | 'audioOnly'" 
                defaultValue="'transcriptOnly'" 
                description={`Recording behavior:\n• 'quick': No S3, instant transcript, discard immediately\n• 'transcriptOnly': S3 for reliability, delete if discarded\n• 'withFile': S3 always, keep file for playback\n• 'audioOnly': S3 storage, no transcription option`}
              />
            </div>
          </Card>

        {/* Examples */}
        <Card className="p-4 md:p-6 lg:p-8">
          <h2 className="text-xl font-semibold mb-6">Examples</h2>
          <Stack gap="lg">
              
              {/* Basic Audio */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Basic Audio Recording</h3>
                  <Badge variant="success">transcriptOnly</Badge>
                </div>
                <RecordingTextarea
                  value={basicValue}
                  onChange={setBasicValue}
                  label="Your Thoughts"
                  placeholder="Type or record audio..."
                  rows={4}
                  recordingPurpose="transcriptOnly"
                  category="showcase-basic"
                  instanceId="basic-example"
                />
              </div>

              {/* With Video */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Audio + Video Recording</h3>
                  <Badge variant="success">transcriptOnly</Badge>
                </div>
                <RecordingTextarea
                  value={videoValue}
                  onChange={setVideoValue}
                  label="Record Your Story"
                  placeholder="Type or record audio/video..."
                  allowVideo={true}
                  rows={4}
                  recordingPurpose="transcriptOnly"
                  category="showcase-video"
                  instanceId="video-example"
                />
              </div>

              {/* Quick Mode */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Quick Mode (VIVA Chat)</h3>
                  <Badge variant="success">quick</Badge>
                </div>
                <p className="text-sm text-neutral-400 mb-3">
                  Instant transcription, no S3 upload, no player UI - perfect for short voice commands
                </p>
                <RecordingTextarea
                  value={quickValue}
                  onChange={setQuickValue}
                  label="Quick Voice Note"
                  placeholder="Type or record a quick message..."
                  rows={3}
                  recordingPurpose="quick"
                  category="showcase-quick"
                  instanceId="quick-example"
                />
              </div>

              {/* Transcript Only Mode */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Transcript Only (Life Vision)</h3>
                  <Badge variant="warning">transcriptOnly</Badge>
                </div>
                <p className="text-sm text-neutral-400 mb-3">
                  Long-form audio recordings that are backed up to S3 but deleted if discarded
                </p>
                <RecordingTextarea
                  value={transcriptOnlyValue}
                  onChange={setTranscriptOnlyValue}
                  label="Life Vision Category"
                  placeholder="Describe your vision or record audio..."
                  rows={6}
                  recordingPurpose="transcriptOnly"
                  storageFolder="lifeVision"
                  category="showcase-transcript"
                  instanceId="transcript-example"
                />
              </div>

              {/* With File Mode */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Full File Storage (Journal)</h3>
                  <Badge variant="info">withFile</Badge>
                </div>
                <p className="text-sm text-neutral-400 mb-3">
                  Recordings are always saved to S3 and kept for playback
                </p>
                <RecordingTextarea
                  value={withFileValue}
                  onChange={setWithFileValue}
                  label="Journal Entry"
                  placeholder="Write your entry or record..."
                  allowVideo={true}
                  rows={8}
                  recordingPurpose="withFile"
                  storageFolder="journal"
                  category="showcase-withfile"
                  instanceId="withfile-example"
                  onRecordingSaved={async (url, transcript, type, updatedText) => {
                    console.log('Recording saved:', { url, transcript, type, updatedText })
                    // Handle the saved recording
                  }}
                />
              </div>

          </Stack>
        </Card>

        {/* Features */}
        <Card className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xl font-semibold mb-4">Key Features</h2>
            <ul className="space-y-2 text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Integrated Recording:</strong> Audio and optional video recording with countdown and visual feedback</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Auto-transcription:</strong> Powered by OpenAI Whisper for accurate speech-to-text</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>IndexedDB Persistence:</strong> Auto-saves recordings every 20-30s to survive page refreshes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>S3 Cloud Storage:</strong> Reliable backup with automatic upload and retrieval</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Multiple Recording Modes:</strong> quick, transcriptOnly, withFile, audioOnly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Audio Editing:</strong> Built-in waveform editor for trimming and cutting audio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Microphone Selection:</strong> Choose from available audio input devices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Pause/Resume:</strong> Pause and resume recordings without losing data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Auto-resize Textarea:</strong> Textarea grows automatically with content</span>
              </li>
            </ul>
          </Card>

        {/* Recording Modes */}
        <Card className="p-4 md:p-6 lg:p-8">
          <h2 className="text-xl font-semibold mb-4">Recording Modes</h2>
          <Stack gap="md">
              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success">quick</Badge>
                  <h3 className="font-semibold">Quick Mode</h3>
                </div>
                <p className="text-sm text-neutral-400">
                  Small snippets for VIVA chat - No S3, no player, instant transcript, discard immediately
                </p>
              </div>

              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="warning">transcriptOnly</Badge>
                  <h3 className="font-semibold">Transcript Only Mode</h3>
                </div>
                <p className="text-sm text-neutral-400">
                  Long audio for life-vision - S3 for reliability, delete if discarded (default)
                </p>
              </div>

              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info">withFile</Badge>
                  <h3 className="font-semibold">With File Mode</h3>
                </div>
                <p className="text-sm text-neutral-400">
                  Full recordings for journal - S3 always, keep file for playback, manual transcription
                </p>
              </div>

              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="primary">audioOnly</Badge>
                  <h3 className="font-semibold">Audio Only Mode</h3>
                </div>
                <p className="text-sm text-neutral-400">
                  Audio recording with editing - S3 storage, no transcription option
                </p>
              </div>
          </Stack>
        </Card>

        {/* Usage Notes */}
        <Card className="p-4 md:p-6 lg:p-8 bg-amber-900/10 border-amber-700/30">
            <h2 className="text-xl font-semibold text-amber-400 mb-4">Important Notes</h2>
            <ul className="space-y-2 text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">⚠</span>
                <span>The component uses <code className="text-amber-400">MediaRecorderComponent</code> internally for all recording logic</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">⚠</span>
                <span>Requires proper S3 bucket configuration and API routes for upload/transcription</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">⚠</span>
                <span>Browser must support MediaRecorder API and getUserMedia (modern browsers only)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">⚠</span>
                <span>User must grant microphone/camera permissions when recording starts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">⚠</span>
                <span>IndexedDB auto-save happens every 20-30 seconds during recording</span>
              </li>
          </ul>
        </Card>

      </Stack>
    </Container>
  )
}

function PropRow({ 
  name, 
  type, 
  required = false, 
  defaultValue, 
  description 
}: { 
  name: string
  type: string
  required?: boolean
  defaultValue?: string
  description?: string
}) {
  return (
    <div className="border-b border-neutral-800 pb-4 last:border-0">
      <div className="flex items-start gap-2 mb-1">
        <code className="text-primary-400 font-mono text-sm">{name}</code>
        {required && (
          <Badge variant="danger" className="text-xs">Required</Badge>
        )}
      </div>
      <div className="text-sm text-neutral-500 mb-1">
        <code className="font-mono">{type}</code>
      </div>
      {defaultValue && (
        <div className="text-sm text-neutral-400 mb-1">
          Default: <code className="text-neutral-300">{defaultValue}</code>
        </div>
      )}
      {description && (
        <p className="text-sm text-neutral-300 whitespace-pre-line">{description}</p>
      )}
    </div>
  )
}

