import { redirect } from 'next/navigation'
import DashboardContent from '@/components/DashboardContent'
import { getGraduateChecklist } from '@/lib/graduate-checklist'
import { getEffectiveUser } from '@/lib/impersonation'

export default async function DashboardPage() {
  const { user, supabase } = await getEffectiveUser()

  if (!user) {
    redirect('/auth/login')
  }

  // If user has a pending/in-progress intensive, send them there instead
  const { data: activeIntensive } = await supabase
    .from('intensive_checklist')
    .select('id, started_at')
    .eq('user_id', user.id)
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeIntensive) {
    redirect(activeIntensive.started_at ? '/intensive/dashboard' : '/intensive/start')
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

  // Get version numbers for all visions using RPC function
  const visionDataWithVersions = visionData ? await Promise.all(
    visionData.map(async (vision: any) => {
      const { data: versionNumber, error: visionVersionError } = await supabase
        .rpc('get_vision_version_number', { p_vision_id: vision.id })
      
      if (visionVersionError) {
        console.error('Error getting vision version number:', visionVersionError)
      }
      
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
  
  const audioSetIds = audioSets?.map((set: any) => set.id) || []
  
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

  // Get user storage quota
  const { data: storageQuotaData, error: storageQuotaError } = await supabase
    .rpc('get_user_storage_quota', { p_user_id: user.id })
  
  if (storageQuotaError) {
    console.error('Error getting storage quota:', storageQuotaError)
  }
  
  const storageQuotaGB = storageQuotaData?.[0]?.total_quota_gb || 5 // Default to 5GB if no quota found

  // Fetch calibration call server-side so the card renders with initial load (no client lag)
  let calibrationCall: { show: boolean; session?: { id: string | null; title: string; scheduled_at: string | null; join_link: string } } | null = null
  try {
    const { data: checklist } = await supabase
      .from('intensive_checklist')
      .select('id, call_scheduled, calibration_call_completed, call_scheduled_time')
      .eq('user_id', user.id)
      .eq('call_scheduled', true)
      .eq('calibration_call_completed', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (checklist) {
      let sessionIds: string[] = []
      const { data: byUserId } = await supabase
        .from('video_session_participants')
        .select('session_id')
        .eq('user_id', user.id)
      if (byUserId?.length) sessionIds = byUserId.map((p: { session_id: string }) => p.session_id)
      if (sessionIds.length === 0 && user.email) {
        const { data: byEmail } = await supabase
          .from('video_session_participants')
          .select('session_id')
          .eq('email', user.email)
        if (byEmail?.length) sessionIds = byEmail.map((p: { session_id: string }) => p.session_id)
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibrationfit.com'
      // call_scheduled_time is stored as `timestamp without time zone` but the value
      // was originally UTC (via .toISOString()). Re-append "Z" so JS parses it correctly.
      const rawTime = checklist.call_scheduled_time as string | null
      const scheduledAtUtc = rawTime && !rawTime.endsWith('Z') ? rawTime + 'Z' : rawTime
      const fallbackSession = {
        id: null,
        title: 'Calibration Call',
        scheduled_at: scheduledAtUtc,
        join_link: `${appUrl}/intensive/call-prep`,
      }

      if (sessionIds.length === 0) {
        calibrationCall = { show: true, session: fallbackSession }
      } else {
        const { data: session } = await supabase
          .from('video_sessions')
          .select('id, title, scheduled_at')
          .in('id', sessionIds)
          .eq('status', 'scheduled')
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (!session) {
          calibrationCall = { show: true, session: fallbackSession }
        } else {
          const joinLink = `${appUrl}/session/${session.id}${user.email ? `?email=${encodeURIComponent(user.email)}` : ''}`
          calibrationCall = {
            show: true,
            session: {
              id: session.id,
              title: session.title,
              scheduled_at: session.scheduled_at,
              join_link: joinLink,
            },
          }
        }
      }
    } else {
      calibrationCall = { show: false }
    }
  } catch (e) {
    console.error('Error fetching calibration call for dashboard:', e)
  }

  const graduateChecklist = await getGraduateChecklist(supabase, user.id)

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
      storageQuotaGB={storageQuotaGB}
      initialCalibrationCall={calibrationCall}
      graduateChecklist={graduateChecklist}
    />
  )
}