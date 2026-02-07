'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import {
  Container,
  Card,
  Button,
  Stack,
  PageHero,
  Badge,
  ProgressBar,
  Spinner,
  Select,
  Input
} from '@/lib/design-system/components'
import {
  Rocket,
  Settings,
  FileText,
  User,
  ClipboardCheck,
  Sparkles,
  Wand2,
  Music,
  Mic,
  Sliders,
  ImageIcon,
  BookOpen,
  Calendar,
  Unlock,
  CheckCircle,
  Circle,
  Lock,
  RefreshCw,
  UserPlus,
  ChevronRight,
  AlertCircle
} from 'lucide-react'

interface IntensiveUser {
  userId: string
  email: string
  firstName: string | null
  lastName: string | null
  displayName: string
  status: string
  startedAt: string | null
  createdAt: string
}

interface StepDefinition {
  step: number
  name: string
  checklistField: string | null
}

interface Progress {
  [key: string]: boolean
}

const STEP_ICONS = [
  Rocket,     // 0 - Start
  Settings,   // 1 - Settings
  FileText,   // 2 - Intake
  User,       // 3 - Profile
  ClipboardCheck, // 4 - Assessment
  Sparkles,   // 5 - Build Vision
  Wand2,      // 6 - Refine Vision
  Music,      // 7 - Generate Audio
  Mic,        // 8 - Record Voice
  Sliders,    // 9 - Audio Mix
  ImageIcon,  // 10 - Vision Board
  BookOpen,   // 11 - Journal
  Calendar,   // 12 - Book Call
  Rocket,     // 13 - Activation Protocol
  Unlock      // 14 - Unlock
]

const STEP_PHASES: Record<number, string> = {
  0: 'Start',
  1: 'Setup',
  2: 'Setup',
  3: 'Foundation',
  4: 'Foundation',
  5: 'Vision Creation',
  6: 'Vision Creation',
  7: 'Audio',
  8: 'Audio',
  9: 'Audio',
  10: 'Activation',
  11: 'Activation',
  12: 'Activation',
  13: 'Completion',
  14: 'Completion'
}

export default function IntensiveTesterPage() {
  const router = useRouter()
  const { isSuperAdmin, isLoading: authLoading } = useAdminAuth()
  
  const [users, setUsers] = useState<IntensiveUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [progress, setProgress] = useState<Progress | null>(null)
  const [stepDefinitions, setStepDefinitions] = useState<StepDefinition[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [totalSteps, setTotalSteps] = useState(15)
  const [percentage, setPercentage] = useState(0)
  
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [resetLoading, setResetLoading] = useState(false)
  const [createUserLoading, setCreateUserLoading] = useState(false)
  
  const [newUserEmail, setNewUserEmail] = useState('')
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/dashboard')
    }
  }, [authLoading, isSuperAdmin, router])

  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers()
    }
  }, [isSuperAdmin])

  useEffect(() => {
    if (selectedUserId) {
      loadUserProgress(selectedUserId)
    } else {
      setProgress(null)
    }
  }, [selectedUserId])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/intensive/create-test-user')
      if (!response.ok) throw new Error('Failed to load users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const loadUserProgress = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/intensive/advance-step?userId=${userId}`)
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to load progress')
      }
      const data = await response.json()
      setProgress(data.progress)
      setStepDefinitions(data.stepDefinitions || [])
      setCompletedCount(data.completedCount)
      setTotalSteps(data.totalSteps)
      setPercentage(data.percentage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress')
      setProgress(null)
    }
  }

  const handleAdvanceStep = async (stepNumber: number) => {
    if (!selectedUserId) return
    
    setActionLoading(stepNumber)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const response = await fetch('/api/admin/intensive/advance-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, stepNumber })
      })
      
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to advance step')
      }
      
      const data = await response.json()
      setSuccessMessage(data.message)
      
      // Reload progress
      await loadUserProgress(selectedUserId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance step')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetUser = async () => {
    if (!selectedUserId) return
    
    if (!confirm('Are you sure you want to reset this user? All their intensive data will be deleted.')) {
      return
    }
    
    setResetLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const response = await fetch('/api/admin/intensive/reset-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId })
      })
      
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to reset user')
      }
      
      setSuccessMessage('User reset successfully')
      
      // Reload progress
      await loadUserProgress(selectedUserId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset user')
    } finally {
      setResetLoading(false)
    }
  }

  const handleCreateTestUser = async () => {
    if (!newUserEmail.trim()) {
      setError('Please enter an email address')
      return
    }
    
    setCreateUserLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const response = await fetch('/api/admin/intensive/create-test-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail.trim() })
      })
      
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to create user')
      }
      
      const data = await response.json()
      setSuccessMessage(`Created test user: ${data.email}`)
      setNewUserEmail('')
      setShowCreateUser(false)
      
      // Reload users and select new one
      await loadUsers()
      setSelectedUserId(data.userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setCreateUserLoading(false)
    }
  }

  const isStepLocked = (stepNumber: number): boolean => {
    if (!progress) return true
    if (stepNumber === 0) return false
    
    // Check if previous step is complete
    const prevKey = `step${stepNumber - 1}`
    return !progress[prevKey]
  }

  const isStepComplete = (stepNumber: number): boolean => {
    if (!progress) return false
    return progress[`step${stepNumber}`] || false
  }

  const getNextAvailableStep = (): number | null => {
    if (!progress) return null
    for (let i = 0; i <= 14; i++) {
      if (!isStepComplete(i) && !isStepLocked(i)) {
        return i
      }
    }
    return null
  }

  if (authLoading || loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!isSuperAdmin) {
    return (
      <Container size="xl">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-neutral-400">Super admin access required.</p>
        </Card>
      </Container>
    )
  }

  // Group steps by phase
  const phases = ['Start', 'Setup', 'Foundation', 'Vision Creation', 'Audio', 'Activation', 'Completion']

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="ADMIN TOOLS"
          title="Intensive Tester"
          subtitle="Advance test users through intensive steps with sample data"
        />

        {/* Messages */}
        {error && (
          <Card className="p-4 bg-red-500/10 border-red-500/30">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </Card>
        )}
        
        {successMessage && (
          <Card className="p-4 bg-primary-500/10 border-primary-500/30">
            <div className="flex items-center gap-3 text-primary-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{successMessage}</span>
            </div>
          </Card>
        )}

        {/* User Selection */}
        <Card className="p-4 md:p-6">
          <Stack gap="md">
            <h3 className="text-lg font-semibold">Select User</h3>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Select
                  value={selectedUserId}
                  onChange={(value) => setSelectedUserId(value)}
                  placeholder="-- Select a user --"
                  options={users.map((user) => ({
                    value: user.userId,
                    label: `${user.displayName} (${user.status})`
                  }))}
                  className="w-full"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateUser(!showCreateUser)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Test User
              </Button>
            </div>

            {/* Create User Form */}
            {showCreateUser && (
              <Card className="p-4 bg-neutral-800/50 border-neutral-700">
                <Stack gap="sm">
                  <label className="text-sm text-neutral-400">New User Email</label>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Input
                      type="email"
                      placeholder="test@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCreateTestUser}
                      disabled={createUserLoading}
                    >
                      {createUserLoading ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Create
                    </Button>
                  </div>
                  <p className="text-xs text-neutral-500">
                    User will be able to log in via magic link sent to this email.
                  </p>
                </Stack>
              </Card>
            )}
          </Stack>
        </Card>

        {/* Progress Overview */}
        {selectedUserId && progress && (
          <>
            <Card className="p-4 md:p-6 bg-primary-500/10 border-primary-500/30">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Progress Overview</h3>
                  <p className="text-sm text-neutral-400">
                    {completedCount} of {totalSteps} steps complete
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-primary-500">{percentage}%</span>
                </div>
              </div>
              <ProgressBar value={percentage} variant="primary" className="h-3" />
            </Card>

            {/* Steps Grid by Phase */}
            <div className="space-y-6">
              {phases.map((phase) => {
                const phaseSteps = stepDefinitions.filter(
                  (_, index) => STEP_PHASES[index] === phase
                )
                
                if (phaseSteps.length === 0) return null

                return (
                  <Card key={phase} className="p-4 md:p-6">
                    <h3 className="text-lg font-semibold mb-4">{phase}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {stepDefinitions.map((step, index) => {
                        if (STEP_PHASES[index] !== phase) return null
                        
                        const Icon = STEP_ICONS[index]
                        const complete = isStepComplete(index)
                        const locked = isStepLocked(index)
                        const isNext = getNextAvailableStep() === index

                        return (
                          <div
                            key={index}
                            className={`
                              flex items-center justify-between p-3 rounded-xl border-2 transition-all
                              ${complete 
                                ? 'bg-primary-500/10 border-primary-500/50' 
                                : locked 
                                  ? 'bg-neutral-800/30 border-neutral-700/50 opacity-50' 
                                  : isNext
                                    ? 'bg-accent-500/10 border-accent-500/50'
                                    : 'bg-neutral-800/50 border-neutral-700'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                                ${complete 
                                  ? 'bg-primary-500' 
                                  : locked 
                                    ? 'bg-neutral-700' 
                                    : isNext
                                      ? 'bg-accent-500'
                                      : 'bg-neutral-700'
                                }
                              `}>
                                {complete ? (
                                  <CheckCircle className="w-5 h-5 text-black" />
                                ) : locked ? (
                                  <Lock className="w-5 h-5 text-neutral-500" />
                                ) : (
                                  <Icon className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-neutral-500">
                                    {index}
                                  </span>
                                  <span className="font-medium text-sm">
                                    {step.name}
                                  </span>
                                </div>
                                {index === 8 && (
                                  <span className="text-xs text-neutral-500">(Optional)</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {complete && (
                                <Badge variant="success" className="text-xs">
                                  Done
                                </Badge>
                              )}
                              {!complete && !locked && (
                                <Button
                                  variant={isNext ? 'primary' : 'outline'}
                                  size="sm"
                                  onClick={() => handleAdvanceStep(index)}
                                  disabled={actionLoading !== null}
                                >
                                  {actionLoading === index ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    <>
                                      Advance
                                      <ChevronRight className="w-4 h-4 ml-1" />
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Actions */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="text-sm text-neutral-400">
                  Selected: {users.find(u => u.userId === selectedUserId)?.displayName}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadUserProgress(selectedUserId)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleResetUser}
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Reset User
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* No user selected */}
        {!selectedUserId && (
          <Card className="p-8 text-center">
            <User className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No User Selected</h3>
            <p className="text-neutral-400 text-sm">
              Select a user from the dropdown above, or create a new test user.
            </p>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
