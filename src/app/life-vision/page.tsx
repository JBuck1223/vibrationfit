import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle, Circle, Edit3 } from 'lucide-react'
import { PageLayout, Container, Card, Button, Badge, ProgressBar } from '@/lib/design-system'

const VISION_SECTIONS = [
  'forward', 'fun', 'travel', 'home', 'family', 'romance', 
  'health', 'money', 'business', 'social', 'possessions', 
  'giving', 'spirituality', 'conclusion'
]

function calculateCompletionPercentage(vision: Record<string, unknown>) {
  const sections = VISION_SECTIONS.map(section => vision[section] as string)
  const filledSections = sections.filter(section => String(section || '').trim().length > 0).length
  const titleFilled = String(vision.title || '').trim().length > 0 ? 1 : 0
  const totalSections = VISION_SECTIONS.length + 1 // +1 for title
  return Math.round(((filledSections + titleFilled) / totalSections) * 100)
}

export default async function VisionListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: visions } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Calculate correct completion percentage for each vision
  const visionsWithCorrectCompletion = visions?.map(vision => ({
    ...vision,
    completion_percentage: calculateCompletionPercentage(vision)
  })) || []

  const visionCount = visionsWithCorrectCompletion.length
  const completedVisions = visionsWithCorrectCompletion.filter(v => v.status === 'complete').length

  return (
    <PageLayout>
      <Container size="xl" className="py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">✨ Your Life Visions</h1>
              <p className="text-secondary-500">Create and manage your conscious creation journey</p>
            </div>
            <Button asChild>
              <Link href="/life-vision/new">
                <Plus className="w-5 h-5 mr-2" />
                Create New Life Vision
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <h3 className="text-neutral-400 text-sm mb-2">Total Visions</h3>
              <p className="text-3xl font-bold text-primary-500">{visionCount}</p>
            </Card>
            
            <Card>
              <h3 className="text-neutral-400 text-sm mb-2">Completed</h3>
              <p className="text-3xl font-bold text-primary-500">{completedVisions}</p>
            </Card>
            
            <Card>
              <h3 className="text-neutral-400 text-sm mb-2">In Progress</h3>
              <p className="text-3xl font-bold text-primary-500">{visionCount - completedVisions}</p>
            </Card>
          </div>
        </div>

        {/* Visions List */}
        {visionsWithCorrectCompletion && visionsWithCorrectCompletion.length > 0 ? (
          <div className="space-y-6">
            {visionsWithCorrectCompletion.map((vision) => (
              <Card key={vision.id} className="hover:border-primary-500 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <h3 className="text-xl font-semibold text-white mr-3">
                        {vision.title || 'Untitled Vision'}
                      </h3>
                      <div className="flex items-center">
                        {vision.status === 'complete' ? (
                          <Badge variant="success">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Complete
                          </Badge>
                        ) : (
                          <Badge variant="warning">
                            <Circle className="w-4 h-4 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-neutral-400 text-sm mb-4">
                      <Calendar className="w-4 h-4 mr-2" />
                      Created {new Date(vision.created_at).toLocaleDateString()}
                      {vision.updated_at !== vision.created_at && (
                        <span className="ml-4">
                          Updated {new Date(vision.updated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <ProgressBar 
                      value={vision.completion_percentage || 0}
                      variant="primary"
                      showLabel={false}
                    />

                    {/* Preview of first section */}
                    {vision.forward && (
                      <p className="text-neutral-200 text-sm line-clamp-2 mt-4">
                        {vision.forward.substring(0, 150)}...
                      </p>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <Button asChild>
                      <Link href={`/life-vision/${vision.id}`}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        {vision.status === 'complete' ? 'View' : 'Continue'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-2xl font-bold text-white mb-4">No visions yet</h3>
              <p className="text-neutral-400 mb-8">
                Start your conscious creation journey by creating your first Life Vision. 
                Define what you want to create across all areas of your life.
              </p>
              <Button asChild size="lg">
                <Link href="/life-vision/new">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Life Vision
                </Link>
              </Button>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link 
            href="/dashboard" 
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </Container>
    </PageLayout>
  )
}