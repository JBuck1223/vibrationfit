import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageLayout, Container, Card, Button, Badge } from '@/lib/design-system'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch vision data
  const { data: visions } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch profile completion
  const { data: profileCompletion } = await supabase
    .rpc('get_profile_completion_percentage', { user_uuid: user.id })

  // Fetch journal entries count
  const { count: journalCount } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Fetch vision board items count
  const { count: visionBoardCount } = await supabase
    .from('vision_board_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const visionCount = visions?.length || 0
  const completedVisions = visions?.filter(v => v.status === 'complete').length || 0
  const profileCompletePercentage = profileCompletion || 0

  return (
    <PageLayout>
      <Container size="xl" className="py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-secondary-500">{user.email}</p>
        </div>

        {/* Profile Completion Alert */}
        {profileCompletePercentage < 100 && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-1">Complete Your Profile</h3>
                <p className="text-neutral-300 text-sm">
                  Your profile is {profileCompletePercentage}% complete. Help your AI assistant provide better guidance.
                </p>
              </div>
              <Button asChild>
                <Link href="/profile">Complete Profile</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <h3 className="text-neutral-400 text-sm mb-2">Profile Complete</h3>
            <div className="flex items-center gap-2">
              <p className="text-4xl font-bold text-primary-500">{profileCompletePercentage}%</p>
              {profileCompletePercentage === 100 && (
                <Badge variant="success">Complete</Badge>
              )}
            </div>
          </Card>
          
          <Card>
            <h3 className="text-neutral-400 text-sm mb-2">Life Visions</h3>
            <p className="text-4xl font-bold text-primary-500">{visionCount}</p>
          </Card>
          
          <Card>
            <h3 className="text-neutral-400 text-sm mb-2">Journal Entries</h3>
            <p className="text-4xl font-bold text-primary-500">{journalCount || 0}</p>
          </Card>
          
          <Card>
            <h3 className="text-neutral-400 text-sm mb-2">Vision Board Items</h3>
            <p className="text-4xl font-bold text-primary-500">{visionBoardCount || 0}</p>
          </Card>
        </div>

        <Card>
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild className="w-full">
              <Link href="/life-vision/new">
                ✨ Create New Life Vision
              </Link>
            </Button>
            <Button variant="secondary" asChild className="w-full">
              <Link href="/life-vision">
                📋 View All Life Visions
              </Link>
            </Button>
          </div>
        </Card>

        <div className="mt-8">
          <form action="/auth/logout" method="post">
            <Button variant="ghost" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </Container>
    </PageLayout>
  )
}