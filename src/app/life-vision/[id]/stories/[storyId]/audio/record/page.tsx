'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft,
  Mic,
  CheckCircle,
  Wand2,
  Eye,
  Volume2,
  Trash2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { 
  Container, 
  Stack, 
  Card, 
  Button, 
  Spinner, 
  PageHero,
  Text,
  Badge,
  AudioPlayer
} from '@/lib/design-system/components'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import type { Story } from '@/lib/stories'

export default function StoryAudioRecordPage({ 
  params 
}: { 
  params: Promise<{ id: string; storyId: string }> 
}) {
  const router = useRouter()
  const supabase = createClient()
  
  const [visionId, setVisionId] = useState<string>('')
  const [storyId, setStoryId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [story, setStory] = useState<Story | null>(null)
  const [existingRecording, setExistingRecording] = useState<{
    url: string
    duration: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const p = await params
      setVisionId(p.id)
      setStoryId(p.storyId)
    })()
  }, [params])

  useEffect(() => {
    if (!storyId) return
    loadData()
  }, [storyId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Load story
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single()

    if (storyError || !storyData) {
      setError('Story not found')
      setLoading(false)
      return
    }

    setStory(storyData)

    // Check for existing user recording
    if (storyData.user_audio_url) {
      setExistingRecording({
        url: storyData.user_audio_url,
        duration: storyData.user_audio_duration_seconds || 0
      })
    }

    setLoading(false)
  }

  async function handleSaveRecording(s3Url: string, duration: number) {
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Delete old recording from S3 if exists
      if (existingRecording?.url) {
        try {
          const { deleteRecording } = await import('@/lib/services/recordingService')
          await deleteRecording(existingRecording.url)
        } catch (err) {
          console.warn('Could not delete old recording:', err)
        }
      }

      // Update story with new recording
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          user_audio_url: s3Url,
          user_audio_duration_seconds: Math.floor(duration)
        })
        .eq('id', storyId)

      if (updateError) throw updateError

      setExistingRecording({
        url: s3Url,
        duration: Math.floor(duration)
      })

    } catch (err) {
      console.error('Failed to save recording:', err)
      setError(err instanceof Error ? err.message : 'Failed to save recording')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteRecording() {
    if (!existingRecording?.url) return
    if (!confirm('Are you sure you want to delete this recording?')) return

    setSaving(true)
    setError(null)

    try {
      // Delete from S3
      try {
        const { deleteRecording } = await import('@/lib/services/recordingService')
        await deleteRecording(existingRecording.url)
      } catch (err) {
        console.warn('Could not delete from S3:', err)
      }

      // Update story
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          user_audio_url: null,
          user_audio_duration_seconds: null
        })
        .eq('id', storyId)

      if (updateError) throw updateError

      setExistingRecording(null)

    } catch (err) {
      console.error('Failed to delete recording:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete recording')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (error && !story) {
    return (
      <Container size="xl">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <Text className="text-red-400 mb-4">{error}</Text>
          <Button asChild variant="outline">
            <Link href={`/life-vision/${visionId}/stories`}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Stories
            </Link>
          </Button>
        </Card>
      </Container>
    )
  }

  const wordCount = story?.word_count || 0
  const hasContent = !!story?.content?.trim()

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero */}
        <PageHero
          eyebrow="FOCUS STORY"
          title="Record Your Voice"
          subtitle="Read your focus story in your own voice"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/life-vision/${visionId}/stories/${storyId}/audio`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Audio Studio
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="default">{wordCount} words</Badge>
              {existingRecording && (
                <Badge variant="success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Recorded
                </Badge>
              )}
            </div>
          </div>
        </PageHero>

        {/* Existing Recording */}
        {existingRecording && (
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                  <Mic className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <Text className="text-white font-medium">Your Recording</Text>
                  <Text size="xs" className="text-neutral-400">
                    {Math.floor(existingRecording.duration / 60)}:{String(existingRecording.duration % 60).padStart(2, '0')} duration
                  </Text>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDeleteRecording}
                disabled={saving}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
            <AudioPlayer
              track={{
                id: 'story-recording',
                title: story?.title || 'Focus Story',
                artist: 'Your Voice',
                duration: existingRecording.duration,
                url: existingRecording.url
              }}
              autoPlay={false}
            />
          </Card>
        )}

        {/* Recording Section */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mb-3">
              <Mic className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              {existingRecording ? 'Re-record Your Story' : 'Record Your Story'}
            </h3>
            <Text size="sm" className="text-neutral-400">
              Read the text below while recording
            </Text>
          </div>

          {!hasContent ? (
            <div className="text-center p-8 bg-neutral-800/30 border border-neutral-700 border-dashed rounded-lg">
              <Text className="text-neutral-400 mb-4">
                No story content yet. Add content first.
              </Text>
              <Button asChild variant="primary">
                <Link href={`/life-vision/${visionId}/stories/${storyId}`}>
                  Edit Story
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Story Text to Read */}
              <div className="mb-6">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 p-4 pb-3 border-b border-neutral-700">
                    <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                      Your Story Text:
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({story?.content?.length || 0} characters)
                    </span>
                  </div>
                  <div className="p-4 max-h-[300px] overflow-y-auto">
                    <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {story?.content}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recorder */}
              <MediaRecorderComponent
                mode="audio"
                recordingPurpose="audioOnly"
                category="story"
                storageFolder="storyAudioRecordings"
                onRecordingComplete={async (blob, transcript, shouldSave, s3Url) => {
                  if (s3Url && shouldSave) {
                    try {
                      const blobUrl = URL.createObjectURL(blob)
                      const audio = new Audio(blobUrl)
                      
                      await new Promise<void>((resolve, reject) => {
                        audio.addEventListener('loadedmetadata', () => resolve())
                        audio.addEventListener('error', () => reject(new Error('Failed to load audio')))
                        audio.load()
                      })
                      
                      const duration = audio.duration
                      URL.revokeObjectURL(blobUrl)
                      
                      await handleSaveRecording(s3Url, duration)
                    } catch (err) {
                      console.error('Error getting duration:', err)
                      await handleSaveRecording(s3Url, 0)
                    }
                  }
                }}
                enableEditor={true}
                instanceId="story-recording"
                className="w-full"
              />
            </>
          )}
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-red-500/10 border-red-500/30">
            <Text size="sm" className="text-red-400">{error}</Text>
          </Card>
        )}

        {/* Alternative: AI Generation */}
        <Card className="p-4 md:p-6 lg:p-8 bg-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <Text className="text-white font-medium">Prefer AI narration?</Text>
              <Text size="sm" className="text-neutral-400">
                Generate professional AI audio instead of recording yourself.
              </Text>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/life-vision/${visionId}/stories/${storyId}/audio/generate`}>
                Generate AI Audio
              </Link>
            </Button>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
