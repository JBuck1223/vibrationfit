import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarLayout } from '@/lib/design-system'
import DashboardContent from '@/components/DashboardContent'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch profile data
  const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
    .single()

  // Fetch vision data
  const { data: visionData } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch vision board items
  const { data: visionBoardData } = await supabase
      .from('vision_board_items')
      .select('*')
      .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch journal entries
  const { data: journalData } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch assessment data
  const { data: assessmentData } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <SidebarLayout>
      <DashboardContent 
        user={user}
        profileData={profileData}
        visionData={visionData || []}
        visionBoardData={visionBoardData || []}
        journalData={journalData || []}
        assessmentData={assessmentData || []}
      />
    </SidebarLayout>
  )
}