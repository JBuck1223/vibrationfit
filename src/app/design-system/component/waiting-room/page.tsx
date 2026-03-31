'use client'

import { useState } from 'react'
import { WaitingRoom } from '@/components/video/WaitingRoom'
import { Button, Card } from '@/lib/design-system/components'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'

export default function WaitingRoomPreview() {
  const [fired, setFired] = useState(false)

  return (
    <div className="min-h-screen bg-black">
      {/* Toolbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/90 backdrop-blur border-b border-neutral-800 px-4 py-2 flex items-center justify-between">
        <Link href="/design-system" className="text-neutral-400 hover:text-white text-sm flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Design System
        </Link>
        <span className="text-xs text-neutral-500">WaitingRoom Preview</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFired(false)}
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Reset
        </Button>
      </div>

      {/* Preview */}
      <div className="pt-12">
        {fired ? (
          <div className="min-h-screen flex items-center justify-center">
            <Card className="p-8 text-center max-w-sm">
              <p className="text-white font-medium mb-1">onSessionLive fired</p>
              <p className="text-neutral-400 text-sm mb-4">In production this transitions the user into the video call.</p>
              <Button variant="primary" size="sm" onClick={() => setFired(false)}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Show Again
              </Button>
            </Card>
          </div>
        ) : (
          <WaitingRoom
            sessionId="preview-fake-id"
            sessionTitle="Calibration Call with Jordan"
            hostName="Jordan Buckingham"
            scheduledAt={new Date(Date.now() + 5 * 60 * 1000).toISOString()}
            onSessionLive={() => setFired(true)}
          />
        )}
      </div>
    </div>
  )
}
