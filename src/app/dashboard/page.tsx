import { redirect } from 'next/navigation'
import DashboardContent from '@/components/DashboardContent'
import { getGraduateChecklist } from '@/lib/graduate-checklist'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  // Run all independent queries in parallel for speed
  const [
    { data: profileData },
    { count: profileCount },
    { data: visionData },
    { data: visionBoardData },
    { data: journalData },
    { data: assessmentData },
    { data: refinementsData },
    { data: storageQuotaData },
    { data: accountTz },
    graduateChecklist,
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', user.id).eq('is_active', true).maybeSingle(),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('vision_versions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('vision_board_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('assessment_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.rpc('get_user_total_refinements', { p_user_id: user.id }),
    supabase.rpc('get_user_storage_quota', { p_user_id: user.id }),
    supabase.from('user_accounts').select('timezone').eq('id', user.id).single(),
    getGraduateChecklist(supabase, user.id),
  ])

  // Profile version number (depends on profileData)
  let profileWithVersion = profileData
  if (profileData?.id) {
    const { data: versionNumber } = await supabase
      .rpc('get_profile_version_number', { p_profile_id: profileData.id })
    profileWithVersion = { ...profileData, version_number: versionNumber ?? 1 }
  }

  // Vision version numbers (parallel for all visions)
  const visionDataWithVersions = visionData ? await Promise.all(
    visionData.map(async (vision: any) => {
      const { data: versionNumber } = await supabase
        .rpc('get_vision_version_number', { p_vision_id: vision.id })
      return { ...vision, version_number: versionNumber ?? 1 }
    })
  ) : []

  // Audio counts (depends on visionData)
  const visionIds = visionDataWithVersions.map((v: any) => v.id)
  let audioSetsCount = 0
  if (visionIds.length > 0) {
    const { data: audioSets } = await supabase.from('audio_sets').select('id').in('vision_id', visionIds)
    const audioSetIds = audioSets?.map((set: any) => set.id) || []
    if (audioSetIds.length > 0) {
      const { count } = await supabase.from('audio_tracks').select('*', { count: 'exact', head: true }).in('audio_set_id', audioSetIds)
      audioSetsCount = count || 0
    }
  }

  const refinementsCount = refinementsData?.[0]?.total_refinement_count || 0
  const storageQuotaGB = storageQuotaData?.[0]?.total_quota_gb || 5

  // Calibration call data
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

      const rawTime = checklist.call_scheduled_time as string | null
      const scheduledAtUtc = rawTime && !rawTime.endsWith('Z') ? rawTime + 'Z' : rawTime
      const fallbackSession = {
        id: null,
        title: 'Calibration Call',
        scheduled_at: scheduledAtUtc,
        join_link: '/intensive/call-prep',
      }

      if (sessionIds.length === 0) {
        calibrationCall = { show: true, session: fallbackSession }
      } else {
        const { data: session } = await supabase
          .from('video_sessions')
          .select('id, title, scheduled_at')
          .in('id', sessionIds)
          .in('status', ['scheduled', 'live'])
          .order('scheduled_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (!session) {
          calibrationCall = { show: true, session: fallbackSession }
        } else {
          calibrationCall = {
            show: true,
            session: {
              id: session.id,
              title: session.title,
              scheduled_at: session.scheduled_at,
              join_link: `/session/${session.id}`,
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
      userTimezone={accountTz?.timezone || null}
    />
  )
}