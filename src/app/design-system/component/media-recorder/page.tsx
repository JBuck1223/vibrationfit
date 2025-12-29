'use client'

import { useState } from 'react'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { Card, Stack, Badge, Button, Container, PageHero } from '@/lib/design-system/components'
import { Mic, Video, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MediaRecorderShowcase() {
  const [showBasic, setShowBasic] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [showQuick, setShowQuick] = useState(false)
  const [showAudioOnly, setShowAudioOnly] = useState(false)

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
          title="Media Recorder"
          subtitle="Core recording engine with audio/video recording, transcription, IndexedDB persistence, and S3 storage"
        />

        {/* Import */}
        <Card className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xl font-semibold mb-4">Import</h2>
            <pre className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 overflow-x-auto">
              <code className="text-primary-400">
{`import { MediaRecorderComponent } from '@/components/MediaRecorder'`}
              </code>
            </pre>
          </Card>

        {/* Props */}
        <Card className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xl font-semibold mb-4">Props</h2>
            <div className="space-y-4">
              <PropRow 
                name="mode" 
                type="'audio' | 'video'" 
                defaultValue="'audio'"
                description="Recording mode - audio or video"
              />
              <PropRow 
                name="onRecordingComplete" 
                type="(blob: Blob, transcript?: string, shouldSaveFile?: boolean, s3Url?: string) => void" 
                description="Callback when recording is complete with blob, optional transcript, save flag, and S3 URL"
              />
              <PropRow 
                name="onTranscriptComplete" 
                type="(transcript: string) => void" 
                description="Callback when transcription completes (for real-time transcript updates)"
              />
              <PropRow 
                name="autoTranscribe" 
                type="boolean" 
                defaultValue="true"
                description="Automatically transcribe after recording stops"
              />
              <PropRow 
                name="maxDuration" 
                type="number" 
                defaultValue="600"
                description="Maximum recording duration in seconds (default 10 minutes)"
              />
              <PropRow 
                name="className" 
                type="string" 
                description="Additional CSS classes"
              />
              <PropRow 
                name="showSaveOption" 
                type="boolean" 
                defaultValue="true"
                description="Show 'Save Recording' checkbox for user control"
              />
              <PropRow 
                name="recordingId" 
                type="string" 
                description="Optional ID for IndexedDB persistence"
              />
              <PropRow 
                name="category" 
                type="string" 
                defaultValue="'general'"
                description="Category for IndexedDB persistence (e.g., 'fun', 'health', 'journal')"
              />
              <PropRow 
                name="instanceId" 
                type="string" 
                description="Unique identifier for this recorder instance (prevents data bleeding)"
              />
              <PropRow 
                name="storageFolder" 
                type="keyof typeof USER_FOLDERS" 
                defaultValue="'journalAudioRecordings'"
                description="S3 folder for uploads (e.g., 'journalAudioRecordings', 'lifeVisionVideoRecordings')"
              />
              <PropRow 
                name="recordingPurpose" 
                type="'quick' | 'transcriptOnly' | 'withFile' | 'audioOnly'" 
                defaultValue="'withFile'"
                description={`Recording modes:\n• quick: No S3, instant transcript\n• transcriptOnly: S3 backup, delete if discarded\n• withFile: S3 always kept\n• audioOnly: S3 storage, no transcription`}
              />
              <PropRow 
                name="enableEditor" 
                type="boolean" 
                defaultValue="true"
                description="Enable audio waveform editor for trimming/cutting"
              />
              <PropRow 
                name="initialFacingMode" 
                type="'user' | 'environment'" 
                defaultValue="'user'"
                description="Initial camera direction (front/back) for video mode"
              />
              <PropRow 
                name="allowCameraSwitch" 
                type="boolean" 
                defaultValue="true"
                description="Show camera switch button in video mode"
              />
              <PropRow 
                name="fullscreenVideo" 
                type="boolean" 
                defaultValue="true"
                description="Enable fullscreen video preview during recording"
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
                <Button 
                  onClick={() => setShowBasic(!showBasic)} 
                  variant="outline"
                  className="mb-4"
                >
                  {showBasic ? 'Hide' : 'Show'} Audio Recorder
                </Button>
                {showBasic && (
                  <MediaRecorderComponent
                    mode="audio"
                    recordingPurpose="transcriptOnly"
                    category="showcase-basic"
                    instanceId="basic-audio"
                    onRecordingComplete={(blob, transcript) => {
                      console.log('Recording complete:', { blob, transcript })
                    }}
                    onTranscriptComplete={(transcript) => {
                      console.log('Transcript:', transcript)
                    }}
                  />
                )}
              </div>

              {/* Video Recording */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Video Recording with Camera Switch</h3>
                  <Badge variant="info">withFile</Badge>
                </div>
                <Button 
                  onClick={() => setShowVideo(!showVideo)} 
                  variant="outline"
                  className="mb-4"
                >
                  {showVideo ? 'Hide' : 'Show'} Video Recorder
                </Button>
                {showVideo && (
                  <MediaRecorderComponent
                    mode="video"
                    recordingPurpose="withFile"
                    category="showcase-video"
                    instanceId="video-example"
                    allowCameraSwitch={true}
                    fullscreenVideo={true}
                    storageFolder="journalVideoRecordings"
                    onRecordingComplete={(blob, transcript, shouldSave, s3Url) => {
                      console.log('Video complete:', { blob, transcript, shouldSave, s3Url })
                    }}
                  />
                )}
              </div>

              {/* Quick Mode */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Quick Mode (VIVA Chat)</h3>
                  <Badge variant="success">quick</Badge>
                </div>
                <p className="text-sm text-neutral-400 mb-3">
                  Instant transcription, no file storage, no playback UI
                </p>
                <Button 
                  onClick={() => setShowQuick(!showQuick)} 
                  variant="outline"
                  className="mb-4"
                >
                  {showQuick ? 'Hide' : 'Show'} Quick Recorder
                </Button>
                {showQuick && (
                  <MediaRecorderComponent
                    mode="audio"
                    recordingPurpose="quick"
                    autoTranscribe={true}
                    category="showcase-quick"
                    instanceId="quick-example"
                    onRecordingComplete={(blob, transcript) => {
                      console.log('Quick recording:', { transcript })
                      // Transcript is available immediately, blob is discarded
                    }}
                  />
                )}
              </div>

              {/* Audio Only (with Editor) */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Audio Only with Waveform Editor</h3>
                  <Badge variant="primary">audioOnly</Badge>
                </div>
                <p className="text-sm text-neutral-400 mb-3">
                  Full audio editing capabilities, no transcription option
                </p>
                <Button 
                  onClick={() => setShowAudioOnly(!showAudioOnly)} 
                  variant="outline"
                  className="mb-4"
                >
                  {showAudioOnly ? 'Hide' : 'Show'} Audio Editor
                </Button>
                {showAudioOnly && (
                  <MediaRecorderComponent
                    mode="audio"
                    recordingPurpose="audioOnly"
                    enableEditor={true}
                    category="showcase-editor"
                    instanceId="editor-example"
                    storageFolder="customTracks"
                    onRecordingComplete={(blob, transcript, shouldSave, s3Url) => {
                      console.log('Audio saved:', { blob, s3Url })
                    }}
                  />
                )}
              </div>

          </Stack>
        </Card>

        {/* Features */}
        <Card className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xl font-semibold mb-4">Core Features</h2>
            <ul className="space-y-2 text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>3-Second Countdown:</strong> Visual countdown before recording starts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Pause/Resume:</strong> Pause and continue recordings without losing data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>IndexedDB Auto-Save:</strong> Recordings saved every 20-30s to survive page refreshes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Recovery System:</strong> Resume in-progress recordings after page reload</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Microphone Selection:</strong> Choose from available audio input devices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Level Meter:</strong> Real-time audio level visualization during recording</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>OpenAI Whisper:</strong> Accurate speech-to-text transcription</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>S3 Cloud Storage:</strong> Automatic upload with presigned URLs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Waveform Editor:</strong> Visual audio editor for trimming and cutting (audio mode only)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Camera Controls:</strong> Front/back camera switch and fullscreen for video mode</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Format Support:</strong> WebM with Opus codec for broad compatibility</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Error Handling:</strong> Clear error messages for permissions and device issues</span>
              </li>
            </ul>
          </Card>

        {/* Recording Modes */}
        <Card className="p-4 md:p-6 lg:p-8">
          <h2 className="text-xl font-semibold mb-4">Recording Modes Explained</h2>
          <Stack gap="md">
              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success">quick</Badge>
                  <h3 className="font-semibold">Quick Mode</h3>
                </div>
                <p className="text-sm text-neutral-400 mb-2">
                  <strong>Use Case:</strong> VIVA chat, short voice commands
                </p>
                <ul className="text-sm text-neutral-300 space-y-1">
                  <li>• No S3 upload (memory only)</li>
                  <li>• No player UI (transcript only)</li>
                  <li>• Auto-transcribe immediately</li>
                  <li>• Auto-discard blob after use</li>
                  <li>• No IndexedDB persistence</li>
                </ul>
              </div>

              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="warning">transcriptOnly</Badge>
                  <h3 className="font-semibold">Transcript Only Mode</h3>
                </div>
                <p className="text-sm text-neutral-400 mb-2">
                  <strong>Use Case:</strong> Life vision, long-form content where transcript is primary
                </p>
                <ul className="text-sm text-neutral-300 space-y-1">
                  <li>• S3 upload for reliability</li>
                  <li>• Player UI for review</li>
                  <li>• Manual transcription button</li>
                  <li>• Delete S3 file if discarded</li>
                  <li>• IndexedDB persistence</li>
                </ul>
              </div>

              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info">withFile</Badge>
                  <h3 className="font-semibold">With File Mode</h3>
                </div>
                <p className="text-sm text-neutral-400 mb-2">
                  <strong>Use Case:</strong> Journal entries, evidence, permanent recordings
                </p>
                <ul className="text-sm text-neutral-300 space-y-1">
                  <li>• S3 upload immediately on stop</li>
                  <li>• Player UI for playback</li>
                  <li>• Manual transcription button</li>
                  <li>• Keep S3 file always (even if discarded locally)</li>
                  <li>• IndexedDB persistence</li>
                </ul>
              </div>

              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="primary">audioOnly</Badge>
                  <h3 className="font-semibold">Audio Only Mode</h3>
                </div>
                <p className="text-sm text-neutral-400 mb-2">
                  <strong>Use Case:</strong> Custom audio tracks, music, narration
                </p>
                <ul className="text-sm text-neutral-300 space-y-1">
                  <li>• S3 upload on Save button click</li>
                  <li>• Player UI with editor button</li>
                  <li>• No transcription option</li>
                  <li>• Waveform editor enabled</li>
                  <li>• IndexedDB persistence</li>
                </ul>
              </div>
          </Stack>
        </Card>

        {/* IndexedDB Recovery */}
        <Card className="p-4 md:p-6 lg:p-8 bg-blue-900/10 border-blue-700/30">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">IndexedDB Recovery System</h2>
            <p className="text-neutral-300 mb-4">
              The MediaRecorder includes a sophisticated recovery system that protects recordings from data loss:
            </p>
            <ul className="space-y-2 text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">💾</span>
                <span><strong>Auto-Save:</strong> Recording chunks saved every 20-30 seconds during recording</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">🔄</span>
                <span><strong>Page Refresh:</strong> Resume in-progress recordings after page reload</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">🗂️</span>
                <span><strong>Category-Based:</strong> Recordings organized by category and instanceId</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">🧹</span>
                <span><strong>Auto-Cleanup:</strong> Old recordings (24+ hours) automatically removed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">📊</span>
                <span><strong>Storage Monitoring:</strong> Warns when browser storage is low (&gt;80% used)</span>
              </li>
          </ul>
        </Card>

        {/* Usage Notes */}
        <Card className="p-4 md:p-6 lg:p-8 bg-amber-900/10 border-amber-700/30">
            <h2 className="text-xl font-semibold text-amber-400 mb-4">Important Notes</h2>
            <ul className="space-y-2 text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">⚠</span>
                <span>This is the core recording engine - RecordingTextarea wraps this component</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">⚠</span>
                <span>Requires <code className="text-amber-400">/api/transcribe</code> endpoint for Whisper transcription</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">⚠</span>
                <span>Requires proper S3 configuration with presigned URL generation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">⚠</span>
                <span>Browser must support MediaRecorder API (Chrome, Firefox, Safari, Edge)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">⚠</span>
                <span>User must grant microphone/camera permissions when prompted</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">⚠</span>
                <span>Always provide unique <code className="text-amber-400">instanceId</code> to prevent data bleeding between fields</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">⚠</span>
                <span>Video recordings can be large - monitor storage usage</span>
              </li>
          </ul>
        </Card>

        {/* Related Components */}
        <Card className="p-4 md:p-6 lg:p-8">
            <h2 className="text-xl font-semibold mb-4">Related Components</h2>
            <Stack gap="sm">
              <Link 
                href="/design-system/component/recording-textarea"
                className="p-3 bg-neutral-900 rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="font-semibold">Recording Textarea</div>
                    <div className="text-sm text-neutral-400">Textarea wrapper with integrated MediaRecorder</div>
                  </div>
                </div>
              </Link>
              <Link 
                href="/design-system/component/audio-player"
                className="p-3 bg-neutral-900 rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-secondary-500" />
                  <div>
                    <div className="font-semibold">Audio Player</div>
                    <div className="text-sm text-neutral-400">Play back recorded audio files</div>
                  </div>
                </div>
              </Link>
          </Stack>
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

