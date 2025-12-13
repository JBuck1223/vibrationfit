'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  Calendar,
  Target,
  Headphones,
  Sparkles,
  Trophy
} from 'lucide-react'

import { 
  Card, 
  Button, 
  Badge,
  ProgressBar,
  Spinner,
  Container,
  Stack,
  PageHero
} from '@/lib/design-system/components'

interface ActivationProtocol {
  id: string
  intensive_id: string
  user_id: string
  status: 'pending' | 'active' | 'completed'
  start_date: string
  current_day: number
  total_days: number
  streak_count: number
  last_activity: string | null
  created_at: string
}

interface DailyActivity {
  id: string
  protocol_id: string
  day: number
  date: string
  completed: boolean
  vision_review: boolean
  affirmation_audio: boolean
  visualization: boolean
  journal_entry: boolean
  action_step: boolean
  completed_at: string | null
}

interface AudioFile {
  id: string
  title: string
  url: string
  duration: number
  type: 'morning' | 'evening' | 'calibration'
}

export default function IntensiveActivation() {
  const [protocol, setProtocol] = useState<ActivationProtocol | null>(null)
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([])
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [loading, setLoading] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [currentAudio, setCurrentAudio] = useState<AudioFile | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadActivationData()
  }, [])

  useEffect(() => {
    if (intensiveId) {
      const interval = setInterval(updateTimeRemaining, 1000)
      return () => clearInterval(interval)
    }
  }, [intensiveId])

  const loadActivationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get intensive purchase
      const { data: intensiveData, error } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_status', 'pending')
        .single()

      if (error || !intensiveData) {
        router.push('/#pricing')
        return
      }

      setIntensiveId(intensiveData.id)

      // Check if calibration is completed
      const { data: checklistData } = await supabase
        .from('intensive_checklist')
        .select('calibration_attended, audios_generated')
        .eq('intensive_id', intensiveData.id)
        .single()

      if (!checklistData?.calibration_attended || !checklistData?.audios_generated) {
        router.push('/intensive/calibration')
        return
      }

      // Load or create activation protocol
      let { data: protocolData, error: protocolError } = await supabase
        .from('activation_protocols') // You might need to create this table
        .select('*')
        .eq('intensive_id', intensiveData.id)
        .single()

      if (protocolError && protocolError.code === 'PGRST116') {
        // Create new protocol
        const { data: newProtocol, error: createError } = await supabase
          .from('activation_protocols')
          .insert({
            intensive_id: intensiveData.id,
            user_id: user.id,
            status: 'pending',
            start_date: new Date().toISOString(),
            current_day: 1,
            total_days: 7,
            streak_count: 0
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating protocol:', createError)
        } else {
          setProtocol(newProtocol)
          await createDailyActivities(newProtocol.id)
        }
      } else if (protocolData) {
        setProtocol(protocolData)
        await loadDailyActivities(protocolData.id)
      }

      // Load audio files (mock data for now)
      setAudioFiles([
        {
          id: '1',
          title: 'Morning Activation Audio',
          url: '/audio/morning-activation.mp3',
          duration: 300, // 5 minutes
          type: 'morning'
        },
        {
          id: '2',
          title: 'Evening Reflection Audio',
          url: '/audio/evening-reflection.mp3',
          duration: 240, // 4 minutes
          type: 'evening'
        },
        {
          id: '3',
          title: 'Personalized Calibration Audio',
          url: '/audio/calibration-personal.mp3',
          duration: 420, // 7 minutes
          type: 'calibration'
        }
      ])

    } catch (error) {
      console.error('Error loading activation data:', error)
    }
  }

  const createDailyActivities = async (protocolId: string) => {
    const activities: Partial<DailyActivity>[] = []
    
    for (let day = 1; day <= 7; day++) {
      const date = new Date()
      date.setDate(date.getDate() + day - 1)
      
      activities.push({
        protocol_id: protocolId,
        day: day,
        date: date.toISOString().split('T')[0],
        completed: false,
        vision_review: false,
        affirmation_audio: false,
        visualization: false,
        journal_entry: false,
        action_step: false
      })
    }

    const { data, error } = await supabase
      .from('daily_activities') // You might need to create this table
      .insert(activities)
      .select()

    if (error) {
      console.error('Error creating daily activities:', error)
    } else {
      setDailyActivities(data)
    }
  }

  const loadDailyActivities = async (protocolId: string) => {
    const { data, error } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('protocol_id', protocolId)
      .order('day')

    if (error) {
      console.error('Error loading daily activities:', error)
    } else {
      setDailyActivities(data || [])
    }
  }

  const updateTimeRemaining = async () => {
    if (!intensiveId) return

    try {
      const { data: intensiveData } = await supabase
        .from('intensive_purchases')
        .select('activation_deadline')
        .eq('id', intensiveId)
        .single()

      if (intensiveData?.activation_deadline) {
        const deadline = new Date(intensiveData.activation_deadline)
        const now = new Date()
        const diff = deadline.getTime() - now.getTime()

        if (diff <= 0) {
          setTimeRemaining('Time\'s up!')
          return
        }

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeRemaining(`${hours}h ${minutes}m`)
      }
    } catch (error) {
      console.error('Error updating time:', error)
    }
  }

  const startProtocol = async () => {
    if (!protocol) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('activation_protocols')
        .update({
          status: 'active',
          start_date: new Date().toISOString()
        })
        .eq('id', protocol.id)

      if (error) {
        console.error('Error starting protocol:', error)
        return
      }

      // Update checklist
      await supabase
        .from('intensive_checklist')
        .update({
          activation_protocol_started: true,
          activation_started_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId!)

      setProtocol(prev => prev ? { ...prev, status: 'active' } : null)

    } catch (error) {
      console.error('Error starting protocol:', error)
    } finally {
      setLoading(false)
    }
  }

  const completeDailyActivity = async (day: number, activityType: string) => {
    if (!protocol) return

    setLoading(true)
    try {
      const activity = dailyActivities.find(a => a.day === day)
      if (!activity) return

      const updates: any = { [activityType]: true }
      
      // Check if all activities are completed
      const allCompleted = Object.keys(updates).every(key => 
        key === activityType || activity[key as keyof DailyActivity]
      )

      if (allCompleted) {
        updates.completed = true
        updates.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('daily_activities')
        .update(updates)
        .eq('id', activity.id)

      if (error) {
        console.error('Error updating activity:', error)
        return
      }

      // Update protocol streak
      if (allCompleted) {
        await supabase
          .from('activation_protocols')
          .update({
            streak_count: protocol.streak_count + 1,
            current_day: Math.min(protocol.current_day + 1, 7),
            last_activity: new Date().toISOString()
          })
          .eq('id', protocol.id)
      }

      // Reload data
      await loadActivationData()

    } catch (error) {
      console.error('Error completing activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAudio = (audio: AudioFile) => {
    if (currentAudio?.id === audio.id) {
      setIsPlaying(!isPlaying)
    } else {
      setCurrentAudio(audio)
      setIsPlaying(true)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProtocolProgress = () => {
    if (!protocol) return 0
    return Math.round((protocol.streak_count / protocol.total_days) * 100)
  }

  const getCurrentDayActivity = () => {
    return dailyActivities.find(a => a.day === protocol?.current_day)
  }

  if (!protocol) {
    return (
      <>
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-6" />
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">Loading Activation</h1>
          <p className="text-sm md:text-base text-neutral-400">Setting up your activation protocol...</p>
        </div>
      </>
    )
  }

  const currentActivity = getCurrentDayActivity()
  const progress = getProtocolProgress()

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="7-Day Activation Protocol"
          subtitle="Start living your vision today. Complete daily activities to activate your transformation."
        >
          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/intensive/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            {timeRemaining && (
              <Badge variant="warning">
                <Clock className="w-4 h-4 mr-2" />
                {timeRemaining} remaining
              </Badge>
            )}
          </div>
        </PageHero>

        {/* Protocol Status */}
        <Card className="max-w-4xl mx-auto p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Protocol Progress</h2>
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-500">{protocol.streak_count}</div>
                <div className="text-sm text-neutral-400">Days Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary-500">{protocol.current_day}</div>
                <div className="text-sm text-neutral-400">Current Day</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-500">{protocol.total_days}</div>
                <div className="text-sm text-neutral-400">Total Days</div>
              </div>
            </div>
            <ProgressBar value={progress} variant="primary" className="mb-6" />
            <Badge variant={protocol.status === 'completed' ? 'success' : protocol.status === 'active' ? 'info' : 'neutral'}>
              {protocol.status === 'pending' ? 'Ready to Start' : 
               protocol.status === 'active' ? 'In Progress' : 'Completed'}
            </Badge>
          </div>

          {protocol.status === 'pending' && (
            <div className="text-center">
              <Button 
                variant="primary" 
                size="lg"
                onClick={startProtocol}
                disabled={loading}
              >
                <Play className="w-5 h-5 mr-2" />
                {loading ? 'Starting...' : 'Start 7-Day Protocol'}
              </Button>
            </div>
          )}
        </Card>

        {/* Daily Activities */}
        {protocol.status === 'active' && currentActivity && (
          <Card className="max-w-4xl mx-auto p-8 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">
              Day {protocol.current_day} Activities
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary-500" />
                  <span className="text-white">Review Your Vision</span>
                </div>
                <Button 
                  variant={currentActivity.vision_review ? "ghost" : "primary"}
                  size="sm"
                  onClick={() => completeDailyActivity(protocol.current_day, 'vision_review')}
                  disabled={currentActivity.vision_review}
                >
                  {currentActivity.vision_review ? 'Completed' : 'Review'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Headphones className="w-5 h-5 text-secondary-500" />
                  <span className="text-white">Listen to Activation Audio</span>
                </div>
                <Button 
                  variant={currentActivity.affirmation_audio ? "ghost" : "primary"}
                  size="sm"
                  onClick={() => completeDailyActivity(protocol.current_day, 'affirmation_audio')}
                  disabled={currentActivity.affirmation_audio}
                >
                  {currentActivity.affirmation_audio ? 'Completed' : 'Listen'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-accent-500" />
                  <span className="text-white">5-Minute Visualization</span>
                </div>
                <Button 
                  variant={currentActivity.visualization ? "ghost" : "primary"}
                  size="sm"
                  onClick={() => completeDailyActivity(protocol.current_day, 'visualization')}
                  disabled={currentActivity.visualization}
                >
                  {currentActivity.visualization ? 'Completed' : 'Visualize'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-energy-500" />
                  <span className="text-white">Journal Entry</span>
                </div>
                <Button 
                  variant={currentActivity.journal_entry ? "ghost" : "primary"}
                  size="sm"
                  onClick={() => completeDailyActivity(protocol.current_day, 'journal_entry')}
                  disabled={currentActivity.journal_entry}
                >
                  {currentActivity.journal_entry ? 'Completed' : 'Journal'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-primary-500" />
                  <span className="text-white">Take Action Step</span>
                </div>
                <Button 
                  variant={currentActivity.action_step ? "ghost" : "primary"}
                  size="sm"
                  onClick={() => completeDailyActivity(protocol.current_day, 'action_step')}
                  disabled={currentActivity.action_step}
                >
                  {currentActivity.action_step ? 'Completed' : 'Take Action'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Audio Player */}
        <Card className="max-w-4xl mx-auto p-8 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Your Activation Audios</h3>
          
          <div className="space-y-4">
            {audioFiles.map((audio) => (
              <div key={audio.id} className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAudio(audio)}
                    className="p-2"
                  >
                    {currentAudio?.id === audio.id && isPlaying ? (
                      <Pause className="w-5 h-5 text-primary-500" />
                    ) : (
                      <Play className="w-5 h-5 text-primary-500" />
                    )}
                  </Button>
                  <div>
                    <div className="font-semibold text-white">{audio.title}</div>
                    <div className="text-sm text-neutral-400">{formatDuration(audio.duration)}</div>
                  </div>
                </div>
                <Badge variant="info">{audio.type}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Completion Celebration */}
        {protocol.status === 'completed' && (
          <Card className="max-w-4xl mx-auto p-8 border-2 border-primary-500 bg-gradient-to-br from-primary-500/10 to-secondary-500/10">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">Activation Complete!</h2>
              <p className="text-neutral-300 mb-6">
                Congratulations! You've completed your 7-day activation protocol. 
                Your vision is now activated and you're ready to continue your transformation.
              </p>
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          </Card>
        )}

        {/* Protocol Overview */}
        <Card className="max-w-4xl mx-auto p-8 mt-8 border-2 border-secondary-500 bg-gradient-to-br from-secondary-500/10 to-primary-500/10">
          <h3 className="text-xl font-bold text-white mb-6">7-Day Protocol Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">Daily Routine:</h4>
              <ul className="text-sm text-neutral-300 space-y-1">
                <li>• Morning: Review vision + listen to audio</li>
                <li>• Midday: 5-minute visualization</li>
                <li>• Evening: Journal reflection</li>
                <li>• Anytime: Take one action step</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Expected Results:</h4>
              <ul className="text-sm text-neutral-300 space-y-1">
                <li>• Vision becomes your daily reality</li>
                <li>• Neural pathways strengthened</li>
                <li>• Habits aligned with your goals</li>
                <li>• Momentum for continued growth</li>
              </ul>
            </div>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
