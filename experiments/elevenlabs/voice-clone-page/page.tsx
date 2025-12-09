"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Stack, Badge, Spinner } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { Mic, Sparkles, CheckCircle, Trash2, AlertCircle, AlertTriangle, X } from 'lucide-react'
import Link from 'next/link'

interface VoiceClone {
  id: string
  voice_name: string
  elevenlabs_voice_id: string
  sample_audio_url: string
  sample_duration_seconds: number
  is_active: boolean
  created_at: string
}

export default function VoiceClonePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [voiceClones, setVoiceClones] = useState<VoiceClone[]>([])
  const [showRecorder, setShowRecorder] = useState(false)
  const [cloning, setCloning] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    loadVoiceClones()
  }, [])

  async function loadVoiceClones() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('audio_voice_clones')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading voice clones:', error)
    } else {
      setVoiceClones(data || [])
    }
    
    setLoading(false)
  }

  async function handleRecordingComplete(blob: Blob, transcript?: string, shouldSaveFile?: boolean, s3Url?: string) {
    if (!s3Url) {
      alert('Recording upload failed. Please try again.')
      return
    }

    setCloning(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('You must be logged in')
        setCloning(false)
        return
      }

      // Send audio to ElevenLabs for voice cloning
      const response = await fetch('/api/audio/clone-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: s3Url,
          voiceName: 'My Voice'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Voice cloning failed: ${error.error || 'Unknown error'}`)
        setCloning(false)
        return
      }

      const { voiceId, voiceName } = await response.json()

      // Save to database
      const { error: dbError } = await supabase
        .from('audio_voice_clones')
        .insert({
          user_id: user.id,
          elevenlabs_voice_id: voiceId,
          voice_name: voiceName,
          sample_audio_url: s3Url,
          sample_duration_seconds: Math.round(blob.size / 16000), // Rough estimate
          is_active: true
        })

      if (dbError) {
        console.error('Error saving voice clone:', dbError)
        alert('Failed to save voice clone. Please try again.')
        setCloning(false)
        return
      }

      // Refresh list
      await loadVoiceClones()
      setShowRecorder(false)
      setCloning(false)
      
      // Show success dialog
      setShowSuccessDialog(true)
    } catch (error) {
      console.error('Voice cloning error:', error)
      alert('An error occurred. Please try again.')
      setCloning(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return

    setDeleting(deleteConfirm.id)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('audio_voice_clones')
        .delete()
        .eq('id', deleteConfirm.id)

      if (error) {
        console.error('Error deleting voice clone:', error)
        alert('Failed to delete voice clone. Please try again.')
      } else {
        setVoiceClones(voiceClones.filter(v => v.id !== deleteConfirm.id))
      }
    } catch (error) {
      console.error('Error deleting voice clone:', error)
      alert('Failed to delete voice clone. Please try again.')
    } finally {
      setDeleting(null)
      setDeleteConfirm(null)
    }
  }

  if (loading) {
    return (
      <Container size="lg">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <>
      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="max-w-md w-full p-8 relative">
            {/* Close button */}
            <button
              onClick={() => setShowSuccessDialog(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-primary-500" />
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-3">
                Voice Cloned Successfully!
              </h3>
              
              {/* Message */}
              <p className="text-neutral-300 mb-6 leading-relaxed">
                Your voice has been cloned and is ready to use. You can now generate personalized audio 
                for your life vision using your own voice.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowSuccessDialog(false)}
                  className="px-6"
                >
                  Stay Here
                </Button>
                
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowSuccessDialog(false)
                    router.push('/life-vision')
                  }}
                  className="gap-2 px-6"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Audio
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="max-w-md w-full p-8">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-3">
                Delete Voice Clone
              </h3>
              
              {/* Message */}
              <p className="text-neutral-300 mb-2">
                Are you sure you want to delete <strong className="text-white">"{deleteConfirm.name}"</strong>?
              </p>
              <p className="text-neutral-400 text-sm mb-6">
                This action cannot be undone.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={!!deleting}
                  className="px-6"
                >
                  Cancel
                </Button>
                
                <Button
                  variant="danger"
                  onClick={handleDeleteConfirm}
                  disabled={!!deleting}
                  className="gap-2 px-6"
                >
                  {deleting ? (
                    <>
                      <Spinner size="sm" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Voice
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Container size="lg">
        <Stack gap="lg">
        {/* Hero Header */}
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#8B5CF6]/30 via-[#14B8A6]/20 to-[#39FF14]/30">
          <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="relative z-10">
              <div className="text-center mb-4">
                <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-purple-400/80 font-semibold">
                  VOICE CLONING
                </div>
              </div>
              
              <div className="text-center mb-4">
                <h1 className="text-2xl md:text-5xl font-bold leading-tight text-white">
                  Clone Your Voice
                </h1>
                <p className="text-sm md:text-base text-neutral-300 mt-2">
                  Create personalized audio with your actual voice
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card variant="elevated" className="bg-blue-500/5 border-blue-500/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">How Voice Cloning Works</h3>
              <ul className="space-y-2 text-sm text-neutral-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Record 3-5 minutes</strong> of yourself reading the provided script</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span><strong>AI analyzes your voice</strong> (takes ~30 seconds)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Voice saved forever</strong> - use for all future visions!</span>
                </li>
              </ul>
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-300">
                  <strong>💡 Tips for best results:</strong> Record in a quiet room, speak naturally and clearly, maintain consistent volume
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Existing Voice Clones */}
        {voiceClones.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Your Cloned Voices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {voiceClones.map((clone) => (
                <Card key={clone.id} variant="elevated">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                        <Mic className="w-5 h-5 text-primary-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{clone.voice_name}</p>
                        <p className="text-xs text-neutral-400">
                          Created {new Date(clone.created_at).toLocaleDateString()}
                        </p>
                        {clone.is_active && (
                          <Badge variant="success" className="text-xs mt-1">Active</Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => setDeleteConfirm({ id: clone.id, name: clone.voice_name })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {clone.sample_audio_url && (
                    <div className="mt-3">
                      <audio 
                        controls 
                        src={clone.sample_audio_url}
                        className="w-full"
                        style={{ height: '40px' }}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recording Section */}
        {!showRecorder ? (
          <Card variant="elevated" className="p-8 text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {voiceClones.length === 0 ? 'Clone Your Voice' : 'Add Another Voice'}
            </h3>
            <p className="text-neutral-400 mb-6">
              Record yourself reading a script to create a personalized voice for your life vision audio
            </p>
            <Button variant="primary" onClick={() => setShowRecorder(true)}>
              <Mic className="w-4 h-4 mr-2" />
              Start Voice Cloning
            </Button>
          </Card>
        ) : (
          <Card variant="elevated">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-2">Record Your Voice Sample</h2>
              <p className="text-sm text-neutral-400">Read the following script clearly and naturally. Aim for 3-5 minutes of audio.</p>
            </div>

            {/* Script to Read */}
            <Card variant="glass" className="p-4 mb-6 max-h-64 overflow-y-auto">
              <p className="text-white text-sm leading-relaxed">
                This is a sample of my voice. I'm recording this to create a personalized audio version of my life vision. 
                The more I speak, the better VIVA will understand my unique voice patterns, tone, and speaking style. 
                I'm excited to hear my vision in my own voice. This technology allows me to create truly personalized 
                affirmations and visualizations. My voice carries my energy, my intention, and my personal power. 
                When I listen to my vision in my own voice, it resonates deeper within me. I am the conscious creator 
                of my reality, and this is my voice declaring the life I choose. I speak with clarity, confidence, and 
                conviction about the incredible life I am creating. This voice clone will serve me for years to come, 
                reading every version of my evolving vision as I grow and expand into new possibilities.
              </p>
            </Card>

            {/* Recorder */}
            <div className="mb-6">
              {cloning ? (
                <Card variant="glass" className="p-8 text-center">
                  <Spinner size="lg" className="mx-auto mb-4" />
                  <p className="text-white font-medium">Cloning your voice...</p>
                  <p className="text-sm text-neutral-400 mt-2">This takes about 30 seconds</p>
                </Card>
              ) : (
                <MediaRecorderComponent
                  mode="audio"
                  recordingPurpose="audioOnly"
                  maxDuration={600}
                  storageFolder="voiceCloneSamples"
                  onRecordingComplete={handleRecordingComplete}
                  showSaveOption={false}
                  enableEditor={true}
                />
              )}
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRecorder(false)
                  setCloning(false)
                }}
                disabled={cloning}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Tips Card */}
        <Card variant="elevated" className="bg-yellow-500/5 border-yellow-500/30">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-white mb-2">Recording Tips</h3>
              <ul className="space-y-1 text-sm text-neutral-300">
                <li>• Record in a <strong>quiet environment</strong> with minimal background noise</li>
                <li>• Use a <strong>good microphone</strong> (headset or external mic recommended)</li>
                <li>• Speak <strong>naturally and clearly</strong> at your normal pace</li>
                <li>• Maintain <strong>consistent volume</strong> throughout</li>
                <li>• Aim for <strong>3-5 minutes</strong> of continuous speech</li>
                <li>• <strong>One voice per recording</strong> - avoid multiple speakers</li>
              </ul>
            </div>
          </div>
        </Card>
      </Stack>
    </Container>
    </>
  )
}

