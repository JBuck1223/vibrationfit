'use client'

import React, { useState } from 'react'
import { Container, Card, Button } from '@/lib/design-system/components'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { ArrowLeft, Mic, Video } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TestRecordingPage() {
  const router = useRouter()
  const [audioRecording, setAudioRecording] = useState<Blob | null>(null)
  const [videoRecording, setVideoRecording] = useState<Blob | null>(null)
  const [audioTranscript, setAudioTranscript] = useState<string>('')
  const [storyText, setStoryText] = useState<string>('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <Container size="xl" className="py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2">
            Recording & Transcription Test
          </h1>
          <p className="text-neutral-400">
            Test the audio/video recording and AI transcription features
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audio Recording */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Audio Recording</h2>
                <p className="text-sm text-neutral-400">Record and transcribe audio</p>
              </div>
            </div>

            <MediaRecorderComponent
              mode="audio"
              onRecordingComplete={(blob, transcript) => {
                setAudioRecording(blob)
                if (transcript) setAudioTranscript(transcript)
              }}
              autoTranscribe={true}
              maxDuration={600} // 10 minutes
            />

            {audioTranscript && (
              <div className="mt-4 p-4 bg-neutral-800 border border-neutral-700 rounded-lg">
                <p className="text-sm text-neutral-400 mb-2">Transcript:</p>
                <p className="text-white">{audioTranscript}</p>
              </div>
            )}
          </Card>

          {/* Video Recording */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-secondary-500 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Video Recording</h2>
                <p className="text-sm text-neutral-400">Record video with audio</p>
              </div>
            </div>

            <MediaRecorderComponent
              mode="video"
              onRecordingComplete={(blob, transcript) => {
                setVideoRecording(blob)
                if (transcript) {
                  console.log('Video transcript:', transcript)
                }
              }}
              autoTranscribe={true} // Now transcribes video audio too!
              maxDuration={600} // 10 minutes
            />
          </Card>
        </div>

        {/* Integrated Recording Textarea */}
        <Card className="p-6 mt-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Recording Textarea Component
          </h2>
          <p className="text-neutral-400 mb-6">
            This component combines text input with recording capabilities - perfect for profile stories!
          </p>

          <RecordingTextarea
            label="Your Story"
            value={storyText}
            onChange={setStoryText}
            placeholder="Type your story or click the microphone to record..."
            rows={8}
            allowVideo={true}
          />

          {storyText && (
            <div className="mt-4 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
              <p className="text-sm text-primary-400 mb-2">Current Story:</p>
              <p className="text-white whitespace-pre-wrap">{storyText}</p>
            </div>
          )}
        </Card>

        {/* Feature Info */}
        <Card className="p-6 mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">✨ Audio Recording</h3>
              <ul className="text-sm text-neutral-400 space-y-1">
                <li>• Record high-quality audio</li>
                <li>• Automatic AI transcription</li>
                <li>• Pause/resume functionality</li>
                <li>• Max duration limits</li>
              </ul>
            </div>

            <div className="p-4 bg-neutral-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">🎥 Video Recording</h3>
              <ul className="text-sm text-neutral-400 space-y-1">
                <li>• Record video with audio</li>
                <li>• Live camera preview</li>
                <li>• Pause/resume support</li>
                <li>• WebM format output</li>
              </ul>
            </div>

            <div className="p-4 bg-neutral-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">🤖 AI Transcription</h3>
              <ul className="text-sm text-neutral-400 space-y-1">
                <li>• OpenAI Whisper API</li>
                <li>• High accuracy</li>
                <li>• $0.006 per minute</li>
                <li>• Word-level timestamps</li>
              </ul>
            </div>

            <div className="p-4 bg-neutral-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">☁️ Cloud Storage</h3>
              <ul className="text-sm text-neutral-400 space-y-1">
                <li>• Direct S3 upload</li>
                <li>• CDN delivery</li>
                <li>• Secure presigned URLs</li>
                <li>• Automatic cleanup</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Usage Info */}
        <Card className="p-6 mt-8 bg-primary-500/5 border-primary-500/20">
          <h2 className="text-xl font-bold text-white mb-2">💡 How to Use</h2>
          <div className="text-neutral-300 space-y-2">
            <p>
              <strong>1. Audio Recording:</strong> Click "Start Recording" to begin. Speak clearly into your microphone. 
              Click "Stop" when done. The audio will automatically transcribe.
            </p>
            <p>
              <strong>2. Video Recording:</strong> Click "Start Recording" and allow camera access. You'll see a live preview. 
              Click "Stop" to finish.
            </p>
            <p>
              <strong>3. Integrated Textarea:</strong> Type normally or click the microphone icon to record. 
              The transcript will be appended to your text.
            </p>
          </div>
        </Card>
      </Container>
    </div>
  )
}

