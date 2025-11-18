'use client'

import React from 'react'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { Container } from '@/lib/design-system/components'

export default function TestAudioOnlyPage() {
  return (
    <Container size="lg" className="py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Audio Recording Tool (No Transcription)</h1>
          <p className="text-neutral-400">
            Test audio recording with editing - No transcription needed
          </p>
        </div>

        <MediaRecorderComponent
          mode="audio"
          autoTranscribe={false}
          maxDuration={600} // 10 minutes
          showSaveOption={false} // No checkbox for audioOnly mode
          recordingPurpose="audioOnly" // No transcription option
          storageFolder="journalAudioRecordings"
          onRecordingComplete={(blob, transcript, shouldSave, s3Url) => {
            console.log('Recording complete!', {
              blobSize: blob.size,
              s3Url
            })
            alert(`Recording saved! Blob size: ${blob.size} bytes\nS3 URL: ${s3Url || 'Not uploaded yet'}`)
          }}
        />

        <div className="bg-[#1F1F1F] border-2 border-[#333] rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">How to Use:</h2>
          <ol className="text-neutral-300 space-y-2 list-decimal list-inside">
            <li>Click "Start Recording" to begin recording audio</li>
            <li>Click "Stop Recording" when done</li>
            <li>Listen to your recording using the audio player</li>
            <li><strong>Optional:</strong> Click "Edit Recording" to trim or cut sections
              <ul className="ml-6 mt-1 space-y-1 list-disc">
                <li>Click "Mark Section to Cut" to add a red region</li>
                <li>Drag the edges to select what to remove</li>
                <li>Click "Cut Marked Sections" to apply the edits</li>
                <li>Click "Save & Close" when finished editing</li>
              </ul>
            </li>
            <li>Click "Save Recording" to save the audio file</li>
            <li>Or click "Discard" to delete and start over</li>
          </ol>
        </div>

        <div className="bg-[#199D67]/10 border border-[#199D67]/30 rounded-lg p-4">
          <p className="text-sm text-white">
            <strong>✨ audioOnly Mode Features:</strong>
          </p>
          <ul className="text-sm text-neutral-300 mt-2 space-y-1 list-disc list-inside">
            <li><strong>No transcription:</strong> Perfect for when you only need the audio file</li>
            <li><strong>Edit capabilities:</strong> Trim and cut sections as needed</li>
            <li><strong>S3 storage:</strong> Audio files are automatically saved to cloud storage</li>
            <li><strong>Simple workflow:</strong> Record → Edit (optional) → Save or Discard</li>
            <li><strong>No transcript requirement:</strong> Save button is always enabled after recording</li>
          </ul>
        </div>

        <div className="bg-[#14B8A6]/10 border border-[#14B8A6]/30 rounded-lg p-4">
          <p className="text-sm text-white mb-2">
            <strong>💡 Use Cases:</strong>
          </p>
          <ul className="text-sm text-neutral-300 space-y-1 list-disc list-inside">
            <li>Voice memos and notes</li>
            <li>Audio logs and documentation</li>
            <li>Podcast recording</li>
            <li>Interview recordings</li>
            <li>Music or sound effect recording</li>
            <li>Any audio capture where text transcription isn't needed</li>
          </ul>
        </div>
      </div>
    </Container>
  )
}

