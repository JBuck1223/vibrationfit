'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getActiveIntensiveClient } from '@/lib/intensive/utils-client'
import Link from 'next/link'
import { 
  Container, 
  Stack,
  PageHero,
  Card, 
  Button, 
  Spinner,
  Inline,
  Text,
  Badge,
  IntensiveCompletionBanner
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { 
  Sun, 
  Moon, 
  Zap, 
  ArrowRight,
  Calendar,
  BookOpen,
  Image as ImageIcon,
  Music,
  Users,
  FileText,
  Eye,
  Headphones,
  CheckCircle,
  User,
  ClipboardCheck,
  Mic,
  Layers,
  Unlock
} from 'lucide-react'

// Placeholder video URL - replace with actual activation protocol video
const ACTIVATION_PROTOCOL_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/placeholder.mp4'

// Milestone data for the 28-day challenge
const MILESTONES = [
  {
    day: 3,
    label: '3-Day Activated',
    message: "You've started. You're officially someone who shows up for The Life I Choose."
  },
  {
    day: 7,
    label: '7-Day Activated',
    message: "You stayed with it past the novelty. Consistency is now part of your story."
  },
  {
    day: 14,
    label: '14-Day Activated',
    message: "You're building a new normal. Returning to alignment is what you do."
  },
  {
    day: 21,
    label: '21-Day Activated',
    message: "Old patterns are losing their grip. This version of you is sticking."
  },
  {
    day: 28,
    label: '28-Day Activated',
    message: "You completed 28 days. You have proof: you are a conscious creator in action."
  }
]

export default function ActivationProtocolPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [activeVisionId, setActiveVisionId] = useState<string | null>(null)
  
  // Intensive flow states
  const [isIntensiveFlow, setIsIntensiveFlow] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if coming from intensive flow (via query param or active intensive)
      const fromIntensive = searchParams.get('intensive') === 'true'
      
      // Check for active intensive
      const intensiveData = await getActiveIntensiveClient()

      if (intensiveData) {
        setIntensiveId(intensiveData.intensive_id)
        
        // If intensive exists but not completed, this is part of intensive flow
        if (!intensiveData.unlock_completed || fromIntensive) {
          setIsIntensiveFlow(true)
        }
        
        // Check if activation protocol step is already completed
        if (intensiveData.activation_protocol_completed) {
          setIsAlreadyCompleted(true)
          setCompletedAt(intensiveData.activation_protocol_completed_at || intensiveData.created_at)
        }
      }

      // Get active vision for linking
      const { data: visionData } = await supabase
        .from('vision_versions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (visionData) {
        setActiveVisionId(visionData.id)
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContinueToUnlock = async () => {
    if (!intensiveId) return
    
    setCompleting(true)
    try {
      const supabase = createClient()
      
      const completedTime = new Date().toISOString()
      
      // Mark activation protocol complete (step 13)
      await supabase
        .from('intensive_checklist')
        .update({
          activation_protocol_completed: true,
          activation_protocol_completed_at: completedTime
        })
        .eq('intensive_id', intensiveId)

      // Redirect to Step 14: Unlock Platform
      router.push('/intensive/intake/unlock')
      
    } catch (error) {
      console.error('Error completing:', error)
      alert('Failed to continue. Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  // Helper to build vision-specific links
  const getVisionLink = (path: string) => {
    if (activeVisionId) {
      return `/life-vision/${activeVisionId}${path}`
    }
    return '/life-vision/active'
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Completion Banner if revisiting during intensive */}
        {isIntensiveFlow && isAlreadyCompleted && completedAt && (
          <IntensiveCompletionBanner 
            stepTitle="Activation Protocol"
            completedAt={completedAt}
          />
        )}

        {/* ============================================ */}
        {/* HERO SECTION */}
        {/* ============================================ */}
        <PageHero
          eyebrow={isIntensiveFlow ? "ACTIVATION INTENSIVE • STEP 13 OF 14" : "YOUR DAILY RITUAL"}
          title="28-Day Life I Choose Activation Challenge"
          subtitle="Use this simple daily plan to make your Life I Choose your new normal."
        >
          <div className="mx-auto w-full max-w-3xl">
            <OptimizedVideo
              url={ACTIVATION_PROTOCOL_VIDEO}
              context="single"
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2 items-center">
            {isIntensiveFlow ? (
              // Intensive flow buttons
              isAlreadyCompleted ? (
                <Button 
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/dashboard')}
                  className="w-full sm:w-auto px-8"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Button>
              ) : (
                <Button 
                  variant="primary"
                  size="lg"
                  onClick={handleContinueToUnlock}
                  disabled={completing}
                  className="w-full sm:w-auto px-8"
                >
                  {completing ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Continuing...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5 mr-2" />
                      Continue to Unlock Platform
                    </>
                  )}
                </Button>
              )
            ) : (
              // Standalone page - just show dashboard link
              <Button 
                variant="primary"
                size="lg"
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto px-8"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
            )}
          </div>
        </PageHero>

        {/* ============================================ */}
        {/* INTRO CARD */}
        {/* ============================================ */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              About This Challenge
            </Text>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {isIntensiveFlow 
                ? "You finished the Intensive. Your Life Vision, audios, and tools are ready. This page shows you exactly how to use them for the next 28 days."
                : "Your Life Vision, audios, and tools are ready. This page shows you exactly how to use them for maximum impact."
              }
            </p>
            <p className="text-sm text-neutral-300 leading-relaxed">
              This challenge is optional, but our most successful members follow it. Copy them first, then customize. Don&apos;t overthink it. Follow the ritual. Let reality catch up.
            </p>
          </Stack>
        </Card>

        {/* ============================================ */}
        {/* SECTION 2: YOUR DAILY RITUAL */}
        {/* ============================================ */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <div>
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Your Daily Ritual
              </Text>
              <p className="text-sm text-neutral-500 mt-2">10-20 Minutes</p>
            </div>
            
            <p className="text-sm text-neutral-300 leading-relaxed">
              Do this every day for 28 days. Miss a day? Just restart your streak. The power is in the reps.
            </p>

            {/* Step 1: Morning */}
            <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
              <Stack gap="md">
                <Inline gap="sm" className="items-start">
                  <Sun className="h-5 w-5 text-amber-400" />
                  <div>
                    <Text size="sm" className="text-white font-semibold">
                      Step 1: Morning Vision + Daily Paper
                    </Text>
                    <Text size="xs" className="text-neutral-500">Approximately 10-15 minutes</Text>
                  </div>
                </Inline>
                
                <div className="space-y-2 text-sm text-neutral-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Open your current <strong>Life Vision Focus</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Read your Focus paragraph out loud or listen to the audio.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Ask: <em>&quot;This is who I choose to be now. How does this version of me show up/behave?&quot;</em></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Open your <strong>Vision Board</strong> and quickly scan your tiles to remember what you&apos;re creating.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Complete your <strong>Daily Paper</strong> for the day.</span>
                  </div>
                  <div className="flex items-start gap-2 text-neutral-500">
                    <span className="w-4 flex-shrink-0 mt-0.5 text-center text-xs">(Optional)</span>
                    <span>Open your <strong>Journal</strong> and capture one intention: &quot;One aligned choice I&apos;ll make today is...&quot;</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={getVisionLink('')}>
                      <Eye className="w-4 h-4 mr-2" />
                      Life Vision Focus
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/vision-board">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Vision Board
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/daily-paper">
                      <FileText className="w-4 h-4 mr-2" />
                      Daily Paper
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/journal">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Journal
                    </Link>
                  </Button>
                </div>
              </Stack>
            </div>

            {/* Step 2: Real-Time */}
            <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
              <Stack gap="md">
                <Inline gap="sm" className="items-start">
                  <Zap className="h-5 w-5 text-primary-400" />
                  <div>
                    <Text size="sm" className="text-white font-semibold">
                      Step 2: Real-Time Category Activation
                    </Text>
                    <Text size="xs" className="text-neutral-500">1+ time per day</Text>
                  </div>
                </Inline>
                
                <p className="text-sm text-neutral-300">
                  At least once today, before a key moment (work, money, health, family, love):
                </p>

                <div className="space-y-2 text-sm text-neutral-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Open your <strong>Category Audios</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Listen 1-3 minutes to the category you&apos;re about to step into.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Ask: <em>&quot;This is who I choose to be now. How does this version of me show up/behave?&quot;</em></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Make one micro decision from that place.</span>
                  </div>
                  <div className="flex items-start gap-2 text-neutral-500">
                    <span className="w-4 flex-shrink-0 mt-0.5 text-center text-xs">(Optional)</span>
                    <span>After the moment, Journal: &quot;Did anything shift in how I intentionally showed up?&quot;</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={getVisionLink('/audio')}>
                      <Music className="w-4 h-4 mr-2" />
                      Category Audios
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/journal">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Journal
                    </Link>
                  </Button>
                </div>
              </Stack>
            </div>

            {/* Step 3: Night */}
            <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
              <Stack gap="md">
                <Inline gap="sm" className="items-start">
                  <Moon className="h-5 w-5 text-purple-400" />
                  <div>
                    <Text size="sm" className="text-white font-semibold">
                      Step 3: Night Sleep Immersion + Vision Focus + Evidence Journal
                    </Text>
                    <Text size="xs" className="text-neutral-500">Approximately 10-15 minutes</Text>
                  </div>
                </Inline>

                <div className="space-y-2 text-sm text-neutral-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Open your <strong>Life Vision Focus</strong> and read your Focus paragraph or listen to the audio again.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span>Open your <strong>Journal</strong> and record (written, audio, or video):</span>
                      <ul className="mt-1 ml-4 space-y-1 text-neutral-400 text-xs">
                        <li>&quot;What matched my Life I Choose today?&quot;</li>
                        <li>&quot;What synchronicities or manifestations did I notice?&quot;</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span>Open your <strong>Vision Board</strong> (morning or evening):</span>
                      <ul className="mt-1 ml-4 space-y-1 text-neutral-400 text-xs">
                        <li>Slowly look at each tile and feel what it will be like when it&apos;s normal.</li>
                        <li>Mark items complete and add an Actualization Story for manifested items.</li>
                        <li>Add descriptions for items you have new clarity on.</li>
                        <li>Add new desires as they form.</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Press play on your <strong>All Categories Sleep Immersion</strong> track with your chosen background sound. Let it loop while you fall asleep.</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={getVisionLink('')}>
                      <Eye className="w-4 h-4 mr-2" />
                      Life Vision Focus
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/journal">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Journal
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/vision-board">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Vision Board
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={getVisionLink('/audio/sets')}>
                      <Headphones className="w-4 h-4 mr-2" />
                      Sleep Immersion
                    </Link>
                  </Button>
                </div>
              </Stack>
            </div>
          </Stack>
        </Card>

        {/* ============================================ */}
        {/* SECTION 3: WEEKLY RITUAL */}
        {/* ============================================ */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <div>
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Weekly Alignment Ritual
              </Text>
              <p className="text-sm text-neutral-500 mt-2">Every 7 Days</p>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed">
              Once a week during the challenge, do this:
            </p>

            <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
              <Stack gap="md">
                <Inline gap="sm" className="items-start">
                  <Calendar className="h-5 w-5 text-teal-400" />
                  <Text size="sm" className="text-white font-semibold">
                    Alignment Gym
                  </Text>
                </Inline>
                
                <div className="space-y-2 text-sm text-neutral-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Attend live or watch the replay.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Take session notes to &quot;Track your workout: What are my main takeaways from the gym today?&quot;</span>
                  </div>
                </div>
              </Stack>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
              <Stack gap="md">
                <Inline gap="sm" className="items-start">
                  <Users className="h-5 w-5 text-purple-400" />
                  <div>
                    <Text size="sm" className="text-white font-semibold">
                      Share to Vibe Tribe
                    </Text>
                    <Text size="xs" className="text-neutral-500">(optional)</Text>
                  </div>
                </Inline>
                
                <div className="space-y-2 text-sm text-neutral-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>Share a short post or clip with your key takeaway from Alignment Gym so others can calibrate with you.</span>
                  </div>
                </div>
              </Stack>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/alignment-gym">
                  <Users className="w-4 h-4 mr-2" />
                  Go to Alignment Gym
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/vibe-tribe">
                  <Users className="w-4 h-4 mr-2" />
                  Go to Vibe Tribe
                </Link>
              </Button>
            </div>
          </Stack>
        </Card>

        {/* ============================================ */}
        {/* SECTION 4: 28-DAY MILESTONES */}
        {/* ============================================ */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <div>
              <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
                Your 28-Day Milestones
              </Text>
              <p className="text-sm text-neutral-500 mt-2">We&apos;ll remind you of these inside Vibration Fit. Here&apos;s what to look for:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MILESTONES.map((milestone) => (
                <div 
                  key={milestone.day} 
                  className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                      <span className="text-primary-400 font-bold">{milestone.day}</span>
                    </div>
                    <Badge variant="neutral" className="text-primary-400 border-primary-500/30">
                      {milestone.label}
                    </Badge>
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    &quot;{milestone.message}&quot;
                  </p>
                </div>
              ))}
            </div>
          </Stack>
        </Card>

        {/* ============================================ */}
        {/* SECTION 5: WHEN LIFE CHANGES */}
        {/* ============================================ */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              When Everything Upgrades, Start a New Life Vision Version
            </Text>

            <p className="text-sm text-neutral-300 leading-relaxed">
              When your current Life Vision mostly manifests or life takes a sharp turn, don&apos;t force an old vision. Start a new version. If you&apos;re not sure whether it&apos;s time, bring it to The Alignment Gym and ask.
            </p>

            <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
              <Text size="sm" className="text-white font-semibold mb-3">Checklist for a new version:</Text>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="w-5 h-5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-neutral-500" />
                  </div>
                  <span>Update Profile</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="w-5 h-5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="w-3 h-3 text-neutral-500" />
                  </div>
                  <span>New Assessment</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="w-5 h-5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3 h-3 text-neutral-500" />
                  </div>
                  <span>Write your new Life Vision</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="w-5 h-5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0">
                    <Mic className="w-3 h-3 text-neutral-500" />
                  </div>
                  <span>Record fresh audios</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="w-5 h-5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-3 h-3 text-neutral-500" />
                  </div>
                  <span>Refresh your Vision Board from your new Life Vision</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-neutral-400 italic">
              Your Daily Ritual stays the same. It simply runs on your newest Life Vision Version.
            </p>
          </Stack>
        </Card>

        {/* ============================================ */}
        {/* BOTTOM CTA */}
        {/* ============================================ */}
        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F] text-center">
          <div className="py-6">
            {isIntensiveFlow && !isAlreadyCompleted ? (
              <>
                <h2 className="text-xl md:text-2xl font-bold mb-3 text-white">Ready to Unlock?</h2>
                <p className="text-sm text-neutral-300 mb-6">
                  You&apos;ve reviewed the protocol. Continue to unlock your full platform access.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleContinueToUnlock}
                  disabled={completing}
                  className="w-full sm:w-auto"
                >
                  {completing ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Continuing...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5 mr-2" />
                      Continue to Unlock Platform
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <p className="text-neutral-300 mb-4">
                  This is your daily reference. Come back anytime during your 28-Day Challenge.
                </p>
                <Button variant="primary" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </>
            )}
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
