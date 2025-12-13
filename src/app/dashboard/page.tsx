import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardContent from '@/components/DashboardContent'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch active profile data
  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  // Get total profile count
  const { count: profileCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get profile version number if profile exists
  let profileWithVersion = profileData
  if (profileData?.id) {
    const { data: versionNumber, error: versionError } = await supabase
      .rpc('get_profile_version_number', { p_profile_id: profileData.id })
    
    if (versionError) {
      console.error('Error getting profile version number:', versionError)
    }
    
    console.log('Profile version number from RPC:', versionNumber, 'for profile ID:', profileData.id)
    
    profileWithVersion = { 
      ...profileData, 
      version_number: versionNumber ?? 1 
    }
  }

  // Fetch vision data
  const { data: visionData } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Get version numbers for all visions
  const visionDataWithVersions = visionData ? await Promise.all(
    visionData.map(async (vision) => {
      const { data: versionNumber, error: visionVersionError } = await supabase
        .rpc('get_vision_version_number', { p_vision_version_id: vision.id })
      
      if (visionVersionError) {
        console.error('Error getting vision version number:', visionVersionError)
      }
      
      console.log('Vision version number from RPC:', versionNumber, 'for vision ID:', vision.id, 'is_active:', vision.is_active)
      
      return { ...vision, version_number: versionNumber ?? 1 }
    })
  ) : []

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
      .from('assessment_results')
      .select('*')
      .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Get audio tracks count for the user's visions
  const visionIds = visionDataWithVersions.map(v => v.id)
  
  // Get all audio sets for these visions
  const { data: audioSets } = await supabase
    .from('audio_sets')
    .select('id')
    .in('vision_id', visionIds)
  
  const audioSetIds = audioSets?.map(set => set.id) || []
  
  // Count all audio tracks in these sets
  const { count: audioSetsCount } = await supabase
    .from('audio_tracks')
    .select('*', { count: 'exact', head: true })
    .in('audio_set_id', audioSetIds)

  // Get total refinements count across all versions (using RPC function)
  const { data: refinementsData, error: refinementsError } = await supabase
    .rpc('get_user_total_refinements', { p_user_id: user.id })
  
  if (refinementsError) {
    console.error('Error getting refinements count:', refinementsError)
  }
  
  const refinementsCount = refinementsData?.[0]?.total_refinement_count || 0

  return (
    <DashboardContent 
      user={user}
      profileData={profileWithVersion}
      visionData={visionDataWithVersions}
      visionBoardData={visionBoardData || []}
      journalData={journalData || []}
      assessmentData={assessmentData || []}
      profileCount={profileCount || 0}
      audioSetsCount={audioSetsCount || 0}
      refinementsCount={refinementsCount || 0}
    />
  )
}