import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageLayout, Container, Card, Button } from '@/lib/design-system'
import Link from 'next/link'

export default async function DashboardPage() {
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

  const visionCount = visions?.length || 0
  const completedVisions = visions?.filter(v => v.status === 'complete').length || 0

  return (
    <PageLayout>
      <Container size="xl" className="py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-secondary-500">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <h3 className="text-neutral-400 text-sm mb-2">Total Visions</h3>
            <p className="text-4xl font-bold text-primary-500">{visionCount}</p>
          </Card>
          
          <Card>
            <h3 className="text-neutral-400 text-sm mb-2">Completed</h3>
            <p className="text-4xl font-bold text-primary-500">{completedVisions}</p>
          </Card>
          
          <Card>
            <h3 className="text-neutral-400 text-sm mb-2">Current Streak</h3>
            <p className="text-4xl font-bold text-primary-500">0 days</p>
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