'use client'

import React from 'react'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { Container } from '@/lib/design-system/components'

export default function TestAudioEditorPage() {
  return (
    <Container size="lg" className="py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Audio Recording & Editor Test</h1>
          <p className="text-neutral-400">
            Test the new audio recording and editing feature
          </p>
        </div>

        <MediaRecorderComponent
          mode="audio"
          autoTranscribe={false} // Manual transcription - user clicks button
          maxDuration={300} // 5 minutes
          showSaveOption={true}
          recordingPurpose="withFile" // Keep files, manual transcription
          onRecordingComplete={(blob, transcript, shouldSave, s3Url) => {
            console.log('Recording complete!', {
              blobSize: blob.size,
              transcriptLength: transcript?.length,
              shouldSave,
              s3Url
            })
            if (transcript) {
              alert(`Recording complete! Transcript: ${transcript.substring(0, 100)}...`)
            } else {
              alert(`Recording complete! Blob size: ${blob.size} bytes`)
            }
          }}
        />

        <div className="bg-[#1F1F1F] border-2 border-[#333] rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">How to Test:</h2>
          <ol className="text-neutral-300 space-y-2 list-decimal list-inside">
            <li>Click "Start Recording" and record a test audio (say something with a mistake)</li>
            <li>Click "Stop Recording" when done</li>
            <li>Listen to your recording using the audio player</li>
            <li><strong>Optional:</strong> Click "Edit Recording" to fix mistakes
              <ul className="ml-6 mt-1 space-y-1 list-disc">
                <li>Click "Mark Section to Cut" to add a red region</li>
                <li>Drag the edges to select what to remove</li>
                <li>Click "Save Edited Audio"</li>
              </ul>
            </li>
            <li>Click "Transcribe Audio" button to get the transcript</li>
            <li>Wait for transcription to complete (~5-10 seconds)</li>
            <li>Click "Save Recording & Transcript" to finish</li>
          </ol>
        </div>

        <div className="bg-[#199D67]/10 border border-[#199D67]/30 rounded-lg p-4">
          <p className="text-sm text-white">
            <strong>✨ Features:</strong>
          </p>
          <ul className="text-sm text-neutral-300 mt-2 space-y-1 list-disc list-inside">
            <li>Visual waveform display with color-coded cuts</li>
            <li>Click & drag to mark sections to remove</li>
            <li>Multiple cuts supported (remove multiple mistakes)</li>
            <li>Preview audio before and after editing</li>
            <li>Manual transcription (click button when ready)</li>
            <li>All processing happens in your browser - no server uploads!</li>
          </ul>
        </div>
      </div>
    </Container>
  )
}

