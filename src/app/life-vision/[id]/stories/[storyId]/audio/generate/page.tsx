'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft,
  Play,
  X,
  CheckCircle,
  Wand2,
  Mic,
  Eye,
  Volume2
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
import type { Story } from '@/lib/stories'

interface Voice {
  id: string
  name: string
  previewUrl?: string
}

export default function StoryAudioGeneratePage({ 
  params 
}: { 
  params: Promise<{ id: string; storyId: string }> 
}) {
  const router = useRouter()
  const supabase = createClient()
  
  const [visionId, setVisionId] = useState<string>('')
  const [storyId, setStoryId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [story, setStory] = useState<Story | null>(null)
  const [voices, setVoices] = useState<Voice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('alloy')
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewProgress, setPreviewProgress] = useState(0)
  const [existingAudioUrl, setExistingAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

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

    // Check for existing audio
    if (storyData.audio_set_id) {
      const { data: track } = await supabase
        .from('audio_tracks')
        .select('audio_url')
        .eq('audio_set_id', storyData.audio_set_id)
        .eq('status', 'completed')
        .maybeSingle()

      if (track?.audio_url) {
        setExistingAudioUrl(track.audio_url)
      }
    }

    // Load voices
    try {
      const resp = await fetch('/api/audio/voices', { cache: 'no-store' })
      const data = await resp.json()
      const voiceList = (data.voices || []).map((v: any) => ({ 
        id: v.id, 
        name: `${v.brandName || v.name} (${v.gender})`,
        previewUrl: v.previewUrl
      }))
      setVoices(voiceList)
    } catch (err) {
      console.error('Failed to load voices:', err)
    }

    setLoading(false)
  }

  async function handleGenerate() {
    if (!story?.content || generating) return

    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/viva/focus/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionId,
          storyId,
          storyContent: story.content,
          voice: selectedVoice
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate audio')
      }

      const data = await response.json()
      
      if (data.audioUrl) {
        setExistingAudioUrl(data.audioUrl)
      }

      // Reload story to get updated audio_set_id
      const { data: updatedStory } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single()

      if (updatedStory) {
        setStory(updatedStory)
      }

    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate audio')
    } finally {
      setGenerating(false)
    }
  }

  async function handlePreviewVoice() {
    if (!selectedVoice) return
    
    const selectedVoiceData = voices.find(v => v.id === selectedVoice)
    if (!selectedVoiceData?.previewUrl) return

    if (isPreviewing) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current.currentTime = 0
      }
      setIsPreviewing(false)
      setPreviewProgress(0)
    } else {
      setIsPreviewing(true)
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio(selectedVoiceData.previewUrl)
      } else {
        previewAudioRef.current.src = selectedVoiceData.previewUrl
      }
      
      previewAudioRef.current.addEventListener('timeupdate', () => {
        if (previewAudioRef.current) {
          const progress = (previewAudioRef.current.currentTime / previewAudioRef.current.duration) * 100
          setPreviewProgress(progress)
        }
      })
      
      previewAudioRef.current.addEventListener('ended', () => {
        setIsPreviewing(false)
        setPreviewProgress(0)
      })
      
      await previewAudioRef.current.play()
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
  const estimatedDuration = Math.max(1, Math.ceil(wordCount / 150)) // ~150 words per minute for TTS

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero */}
        <PageHero
          eyebrow="FOCUS STORY"
          title="Generate Audio"
          subtitle="Create AI-narrated audio of your focus story"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/life-vision/${visionId}/stories/${storyId}/audio`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Audio Studio
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{wordCount} words</Badge>
              <Badge variant="info">~{estimatedDuration} min</Badge>
            </div>
          </div>
        </PageHero>

        {/* Voice Selection */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
              <Wand2 className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Select Voice</h3>
            <Text size="sm" className="text-neutral-400">Choose a voice for your story narration</Text>
          </div>

          <div className="max-w-md mx-auto space-y-4">
            {/* Voice Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                className="w-full pl-6 pr-12 py-3 rounded-full bg-[#1F1F1F] text-white text-sm border-2 border-[#333] hover:border-purple-500 focus:border-purple-500 focus:outline-none transition-colors cursor-pointer text-left"
              >
                {voices.find(v => v.id === selectedVoice)?.name || selectedVoice}
              </button>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isVoiceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {isVoiceDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsVoiceDropdownOpen(false)}
                  />
                  <div className="absolute z-20 w-full mt-2 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                    {voices.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => {
                          setSelectedVoice(voice.id)
                          setIsVoiceDropdownOpen(false)
                          if (previewAudioRef.current) {
                            previewAudioRef.current.pause()
                            previewAudioRef.current.currentTime = 0
                          }
                          setIsPreviewing(false)
                          setPreviewProgress(0)
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-[#2A2A2A] transition-colors border-b border-[#333] last:border-b-0 ${
                          selectedVoice === voice.id ? 'bg-purple-500/10' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{voice.name}</span>
                          {selectedVoice === voice.id && (
                            <CheckCircle className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Preview Button */}
            <Button 
              variant="outline"
              onClick={handlePreviewVoice}
              disabled={!selectedVoice || !voices.find(v => v.id === selectedVoice)?.previewUrl}
              className="w-full"
            >
              {isPreviewing ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Stop Preview
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Preview Voice
                </>
              )}
            </Button>

            {/* Generate Button */}
            <Button 
              variant="primary"
              onClick={handleGenerate}
              disabled={generating || !story?.content}
              className="w-full"
            >
              {generating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Generating Audio...
                </>
              ) : existingAudioUrl ? (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Regenerate Audio
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Audio
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-red-500/10 border-red-500/30">
            <Text size="sm" className="text-red-400">{error}</Text>
          </Card>
        )}

        {/* Existing Audio Player */}
        {existingAudioUrl && (
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <Text className="text-white font-medium">Generated Audio</Text>
                <Text size="xs" className="text-neutral-400">Your story narration</Text>
              </div>
            </div>
            <AudioPlayer
              track={{
                id: 'story-audio',
                title: story?.title || 'Focus Story',
                artist: 'VIVA',
                duration: 0,
                url: existingAudioUrl
              }}
              autoPlay={false}
            />
          </Card>
        )}

        {/* Story Preview */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Story Preview</h3>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/life-vision/${visionId}/stories/${storyId}`}>
                <Eye className="w-4 h-4 mr-1" />
                Edit Story
              </Link>
            </Button>
          </div>
          <div className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-800 max-h-[300px] overflow-y-auto">
            <Text className="text-neutral-300 whitespace-pre-wrap text-sm leading-relaxed">
              {story?.content || 'No content yet. Add content to your story first.'}
            </Text>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
