import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { assessmentQuestions, filterQuestionsByProfile } from '@/lib/assessment/questions'
import { triggerEvent } from '@/lib/messaging/events'

// Create admin client that bypasses RLS
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Step definitions for the 14-step intensive
const STEP_DEFINITIONS = [
  { step: 0, name: 'Start Intensive', checklistField: 'started_at' },
  { step: 1, name: 'Account Settings', checklistField: null }, // Uses user_accounts
  { step: 2, name: 'Baseline Intake', checklistField: 'intake_completed' },
  { step: 3, name: 'Profile', checklistField: 'profile_completed' },
  { step: 4, name: 'Assessment', checklistField: 'assessment_completed' },
  { step: 5, name: 'Build Vision', checklistField: 'vision_built' },
  { step: 6, name: 'Refine Vision', checklistField: 'vision_refined' },
  { step: 7, name: 'Generate Audio', checklistField: 'audio_generated' },
  { step: 8, name: 'Record Voice', checklistField: 'audio_generated' }, // Optional, shares with 7
  { step: 9, name: 'Audio Mix', checklistField: 'audios_generated' },
  { step: 10, name: 'Vision Board', checklistField: 'vision_board_completed' },
  { step: 11, name: 'Journal', checklistField: 'first_journal_entry' },
  { step: 12, name: 'Book Call', checklistField: 'call_scheduled' },
  { step: 13, name: 'My Activation Plan', checklistField: 'activation_protocol_completed' },
  { step: 14, name: 'Unlock Platform', checklistField: 'unlock_completed' },
]

// Life categories for vision and other features
const LIFE_CATEGORIES = [
  'fun', 'travel', 'home', 'family', 'love', 'health',
  'money', 'work', 'social', 'stuff', 'giving', 'spirituality'
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify super_admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminAccount } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminAccount?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const { userId, stepNumber } = await request.json()

    if (!userId || stepNumber === undefined) {
      return NextResponse.json({ error: 'userId and stepNumber are required' }, { status: 400 })
    }

    if (stepNumber < 0 || stepNumber > 14) {
      return NextResponse.json({ error: 'stepNumber must be between 0 and 14' }, { status: 400 })
    }

    // Use admin client to bypass RLS
    const adminClient = getAdminClient()

    // Get user's intensive checklist
    const { data: checklist, error: checklistError } = await adminClient
      .from('intensive_checklist')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (checklistError || !checklist) {
      return NextResponse.json({ error: 'No active intensive found for this user' }, { status: 404 })
    }

    const now = new Date().toISOString()

    // Execute step-specific logic
    switch (stepNumber) {
      case 0:
        await advanceStep0_StartIntensive(adminClient, checklist, now)
        break
      case 1:
        await advanceStep1_Settings(adminClient, userId, now)
        break
      case 2:
        await advanceStep2_Intake(adminClient, userId, checklist.intensive_id, now)
        break
      case 3:
        await advanceStep3_Profile(adminClient, userId, now)
        break
      case 4:
        await advanceStep4_Assessment(adminClient, userId, now)
        break
      case 5:
        await advanceStep5_BuildVision(adminClient, userId, now)
        break
      case 6:
        await advanceStep6_RefineVision(adminClient, userId, now)
        break
      case 7:
        await advanceStep7_GenerateAudio(adminClient, userId, now)
        break
      case 8:
        // Step 8 is optional and shares completion with step 7
        break
      case 9:
        await advanceStep9_AudioMix(adminClient, userId, now)
        break
      case 10:
        await advanceStep10_VisionBoard(adminClient, userId, now)
        break
      case 11:
        await advanceStep11_Journal(adminClient, userId, now)
        break
      case 12:
        await advanceStep12_BookCall(adminClient, checklist.id, now)
        break
      case 13:
        await advanceStep13_ActivationProtocol(adminClient, checklist.id, now)
        break
      case 14:
        await advanceStep14_Unlock(adminClient, checklist, now)

        // Fire exit event to cancel the onboarding sequence
        {
          const { data: userAuth } = await adminClient.auth.admin.getUserById(userId)
          const { data: profile } = await adminClient
            .from('user_profiles')
            .select('first_name')
            .eq('user_id', userId)
            .maybeSingle()

          triggerEvent('intensive.completed', {
            email: userAuth?.user?.email || '',
            userId,
            firstName: profile?.first_name || userAuth?.user?.email?.split('@')[0] || '',
          }).catch(err => console.error('triggerEvent intensive.completed error:', err))
        }
        break
    }

    // Mark the step complete in checklist
    const stepDef = STEP_DEFINITIONS[stepNumber]
    if (stepDef.checklistField && stepDef.checklistField !== 'started_at') {
      const updateData: Record<string, unknown> = {
        [stepDef.checklistField]: true,
        [`${stepDef.checklistField}_at`]: now,
        updated_at: now
      }

      await adminClient
        .from('intensive_checklist')
        .update(updateData)
        .eq('id', checklist.id)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Step ${stepNumber} (${stepDef.name}) completed`,
      stepNumber,
      stepName: stepDef.name
    })

  } catch (error) {
    console.error('Error advancing step:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Step 0: Start the intensive
async function advanceStep0_StartIntensive(
  supabase: Awaited<ReturnType<typeof createClient>>,
  checklist: { id: string; intensive_id: string },
  now: string
) {
  // Update checklist
  await supabase
    .from('intensive_checklist')
    .update({
      started_at: now,
      status: 'in_progress',
      updated_at: now
    })
    .eq('id', checklist.id)

  // Update purchase
  await supabase
    .from('order_items')
    .update({
      started_at: now,
      activation_deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      completion_status: 'in_progress',
    })
    .eq('id', checklist.intensive_id)
}

// Step 1: Fill in account settings
async function advanceStep1_Settings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  now: string
) {
  await supabase
    .from('user_accounts')
    .update({
      first_name: 'Test',
      last_name: 'User',
      phone: '+15551234567',
      updated_at: now
    })
    .eq('id', userId)
}

// Step 2: Create intake responses
async function advanceStep2_Intake(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  intensiveId: string,
  now: string
) {
  // Check if intake response already exists
  const { data: existing } = await supabase
    .from('intensive_responses')
    .select('id')
    .eq('user_id', userId)
    .eq('phase', 'pre_intensive')
    .maybeSingle()

  if (!existing) {
    await supabase.from('intensive_responses').insert({
      user_id: userId,
      intensive_id: intensiveId,
      phase: 'pre_intensive',
      vision_clarity: 4,
      vibrational_harmony: 3,
      vibrational_constraints_clarity: 2,
      vision_iteration_ease: 3,
      has_audio_tracks: 'no',
      audio_iteration_ease: 1,
      has_vision_board: 'no',
      vision_board_management: 0,
      journey_capturing: 3,
      roadmap_clarity: 2,
      transformation_tracking: 2,
      previous_attempts: 'I have tried journaling and meditation apps, but nothing comprehensive.'
    })
  }
}

// Step 3: Create profile
async function advanceStep3_Profile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  now: string
) {
  // Check if profile exists
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    // Values must match CHECK constraints in user_profiles table
    const { error } = await supabase.from('user_profiles').insert({
      user_id: userId,
      
      // Demographics
      gender: 'Female',
      ethnicity: 'White',
      relationship_status: 'Married',
      relationship_length: '5-10 years',
      partner_name: 'Michael',
      has_children: true,
      children: JSON.stringify([
        { name: 'Emma', age: 8, gender: 'Female' },
        { name: 'Jack', age: 5, gender: 'Male' }
      ]),
      
      // Physical
      units: 'US',
      height: 65,
      weight: 145,
      exercise_frequency: '3-4x',
      
      // Location
      living_situation: 'Own',
      time_at_location: '3-5 years',
      city: 'Los Angeles',
      state: 'CA',
      postal_code: '90210',
      country: 'United States',
      
      // Education & Work
      education: "Bachelor's Degree",
      education_description: 'Computer Science from UCLA',
      employment_type: 'Employee',
      occupation: 'Software Developer',
      company: 'Tech Startup Inc.',
      time_in_role: '2-3 years',
      
      // Financial
      currency: 'USD',
      household_income: '100,000-249,999',
      savings_retirement: '50,000-99,999',
      assets_equity: '100,000-249,999',
      consumer_debt: '10,000-24,999',
      
      // Lifestyle
      hobbies: ['yoga', 'hiking', 'reading', 'cooking', 'photography'],
      leisure_time_weekly: '10-15 hours',
      passport: true,
      countries_visited: 12,
      has_vehicle: true,
      vehicles: JSON.stringify([
        { make: 'Tesla', model: 'Model Y', year: 2023 }
      ]),
      items: JSON.stringify([
        { name: 'MacBook Pro', category: 'Electronics', value: 2500 },
        { name: 'Peloton Bike', category: 'Fitness', value: 1500 }
      ]),
      trips: JSON.stringify([
        { destination: 'Paris, France', date: '2024-06', type: 'vacation' },
        { destination: 'Tokyo, Japan', date: '2023-10', type: 'vacation' }
      ]),
      
      // Social
      close_friends_count: '5-10',
      
      // Spiritual & Giving
      spiritual_practice: 'Meditation and mindfulness',
      meditation_frequency: 'Daily',
      personal_growth_focus: true,
      volunteer_status: 'Monthly',
      charitable_giving: '5-10% of income',
      legacy_mindset: true,
      
      // Clarity statements (what they want)
      clarity_love: 'I want a deeply connected partnership filled with adventure, growth, and unwavering support. We travel together, grow together, and our love deepens with each passing year.',
      clarity_family: 'Quality time with my kids, creating lasting memories and strong bonds. Family dinners, weekend adventures, and being fully present for their milestones.',
      clarity_work: 'Meaningful work that challenges me and creates positive impact. Leading a team that innovates and builds products that matter.',
      clarity_money: 'Financial freedom to travel, invest, and give generously. Multiple income streams and complete peace of mind about our future.',
      clarity_home: 'A beautiful, spacious home with natural light, a chef\'s kitchen, and a backyard where the kids can play. A sanctuary that inspires creativity.',
      clarity_health: 'Vibrant energy, strong body, clear mind. Running 5Ks, doing yoga daily, sleeping deeply, and aging gracefully with vitality.',
      clarity_fun: 'Regular adventures, spontaneous road trips, learning new skills, and belly laughs with friends. Life should feel like play.',
      clarity_travel: 'Exploring new countries every year. Immersive experiences, luxury stays, and creating memories that enrich our souls.',
      clarity_social: 'A tight circle of inspiring friends who lift each other up. Deep conversations, shared experiences, and genuine connection.',
      clarity_stuff: 'High-quality possessions that bring joy and serve a purpose. A Tesla, beautiful art, and experiences over things.',
      clarity_giving: 'Generously supporting causes I believe in. Mentoring others, volunteering time, and leaving the world better than I found it.',
      clarity_spirituality: 'Daily meditation, deep intuition, and living with purpose. Feeling connected to something greater and trusting the journey.',
      
      // Contrast statements (what they want to move away from)
      contrast_love: 'Feeling disconnected or taken for granted. Routine without romance. Growing apart instead of together.',
      contrast_family: 'Being too busy for the kids. Missing moments. Distracted parenting and guilt.',
      contrast_work: 'Unfulfilling work that drains energy. Toxic environments. Trading time for money without meaning.',
      contrast_money: 'Financial stress and scarcity mindset. Living paycheck to paycheck. Worry about the future.',
      contrast_home: 'Cramped spaces, clutter, and chaos. A home that feels temporary rather than intentional.',
      contrast_health: 'Low energy, poor sleep, and neglecting my body. Feeling older than my years.',
      contrast_fun: 'All work and no play. Forgetting to have fun. Life feeling like a grind.',
      contrast_travel: 'Being stuck. Never exploring. Putting off adventures until "someday."',
      contrast_social: 'Superficial relationships. Loneliness despite being busy. No one to truly confide in.',
      contrast_stuff: 'Accumulating junk. Buying cheap things that break. Clutter that weighs me down.',
      contrast_giving: 'Being too self-focused. Not making a difference. Living small.',
      contrast_spirituality: 'Disconnection from purpose. Racing through life. Ignoring my inner voice.',
      
      // Version metadata
      is_active: true,
      is_draft: false,
      created_at: now,
      updated_at: now
    })
    
    if (error) {
      console.error('Error creating profile:', error)
      throw new Error(`Failed to create profile: ${error.message}`)
    }
  }
}

// Step 4: Create assessment using real question bank + profile-based filtering
async function advanceStep4_Assessment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  now: string
) {
  // Get the user's full profile (needed for conditional question filtering)
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (profileError || !profile) {
    throw new Error('No active profile found. Complete Step 3 (Profile) first.')
  }

  // Check if active assessment already exists
  const { data: existing } = await supabase
    .from('assessment_results')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (existing) return // Assessment already exists

  // Deactivate any previous assessments
  await supabase
    .from('assessment_results')
    .update({ is_active: false })
    .eq('user_id', userId)

  // Create assessment as in_progress (matching normal flow)
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessment_results')
    .insert({
      user_id: userId,
      profile_version_id: profile.id,
      status: 'in_progress',
      assessment_version: 1,
      max_possible_score: 420,
      started_at: now,
      is_active: false,
      is_draft: true
    })
    .select()
    .single()

  if (assessmentError || !assessment) {
    console.error('Failed to create assessment:', assessmentError)
    throw new Error(`Failed to create assessment: ${assessmentError?.message || 'No data returned'}`)
  }

  // Filter real questions by the user's profile (handles conditional logic
  // for has_children, relationship_status, employment_type)
  const allQuestions = assessmentQuestions.flatMap(cat => cat.questions)
  const filteredQuestions = filterQuestionsByProfile(allQuestions, profile)

  // Realistic score patterns per category for the mock user profile:
  // - Married, 2 kids, Employee, $100-250k income, active lifestyle
  // - Generally above the green line, with money & health as growth areas
  const categoryScoreTargets: Record<string, number[]> = {
    fun:          [4, 4, 5, 3, 4, 4, 3],  // 27 - transition/above
    travel:       [4, 5, 4, 3, 4, 4, 3],  // 27 - transition/above
    home:         [4, 4, 3, 4, 5, 4, 4],  // 28 - above
    family:       [4, 3, 4, 5, 3, 4, 4],  // 27 - transition/above
    love:         [4, 4, 5, 3, 4, 4, 5],  // 29 - above
    health:       [3, 4, 3, 3, 3, 4, 3],  // 23 - transition
    money:        [3, 3, 4, 3, 3, 3, 3],  // 22 - transition
    work:         [4, 4, 3, 4, 5, 4, 3],  // 27 - transition/above
    social:       [4, 4, 5, 3, 4, 4, 3],  // 27 - transition/above
    stuff:        [4, 5, 3, 4, 4, 4, 3],  // 27 - transition/above
    giving:       [4, 3, 4, 5, 3, 4, 4],  // 27 - transition/above
    spirituality: [4, 4, 5, 3, 4, 4, 4],  // 28 - above
  }

  // Track question index per category for score assignment
  const categoryIndices: Record<string, number> = {}

  // Build responses from real questions with realistic option selections
  const responses = filteredQuestions.map(question => {
    const category = question.category
    if (categoryIndices[category] === undefined) categoryIndices[category] = 0
    const qIndex = categoryIndices[category]++

    const targetValue = categoryScoreTargets[category]?.[qIndex] ?? 4

    // Find the real option matching the target value (skip custom "None of these" option)
    const option = question.options.find(o => o.value === targetValue && !o.isCustom)
      || question.options.find(o => !o.isCustom && o.value > 0)!

    return {
      assessment_id: assessment.id,
      question_id: question.id,
      question_text: question.text,
      category: question.category,
      response_value: option.value,
      response_text: option.text,
      response_emoji: option.emoji || null,
      green_line: option.greenLine
    }
  })

  if (responses.length !== 84) {
    console.warn(`Expected 84 responses but got ${responses.length} after profile filtering`)
  }

  // Insert all responses (DB trigger auto-recalculates scores)
  const { error: responsesError } = await supabase
    .from('assessment_responses')
    .insert(responses)

  if (responsesError) {
    console.error('Failed to create assessment responses:', responsesError)
    throw new Error(`Failed to create assessment responses: ${responsesError.message}`)
  }

  // Complete the assessment (matching normal PATCH flow)
  await supabase
    .from('assessment_results')
    .update({ is_active: false })
    .eq('user_id', userId)
    .neq('id', assessment.id)

  const { error: completeError } = await supabase
    .from('assessment_results')
    .update({
      status: 'completed',
      completed_at: now,
      is_draft: false,
      is_active: true,
      updated_at: now
    })
    .eq('id', assessment.id)

  if (completeError) {
    console.error('Failed to complete assessment:', completeError)
    throw new Error(`Failed to complete assessment: ${completeError.message}`)
  }
}

// Step 5: Create vision
async function advanceStep5_BuildVision(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  now: string
) {
  // Check if active vision exists
  const { data: existing } = await supabase
    .from('vision_versions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (existing) return

  await supabase.from('vision_versions').insert({
    user_id: userId,
    title: 'My Ideal Life Vision',
    is_draft: false,
    is_active: true,
    forward: 'I am living my most vibrant, purposeful life. Every day I wake up excited about the possibilities ahead. I am aligned with my highest self and creating from a place of joy and abundance.',
    fun: 'In my ideal life, I experience joy and play daily. I laugh often, try new creative hobbies, and make time for activities that light me up. My life is filled with spontaneous adventures and moments of pure delight.',
    travel: 'I travel to beautiful destinations around the world at least 4 times per year. I experience new cultures, taste incredible food, and collect memories that enrich my soul. Travel is a natural part of my abundant lifestyle.',
    home: 'My home is a peaceful sanctuary filled with natural light, beautiful plants, and thoughtful design. It is a place where I feel completely at ease, inspired, and deeply connected to my loved ones.',
    family: 'My family relationships are deeply loving and supportive. We share quality time together, communicate openly, and celebrate each other\'s successes. I am present and engaged with my children and partner.',
    love: 'My romantic partnership is passionate, playful, and deeply intimate. We grow together, support each other\'s dreams, and maintain a strong emotional and physical connection. Our love deepens with each passing year.',
    health: 'I am in the best shape of my life. I have abundant energy, sleep deeply, and nourish my body with wholesome foods. My mind is clear, my body is strong, and I feel vibrant and alive every single day.',
    money: 'Money flows to me easily and abundantly. I have more than enough for everything I need and want. I invest wisely, give generously, and experience complete financial freedom and peace of mind.',
    work: 'My work is deeply fulfilling and aligned with my purpose. I make a meaningful impact, am well compensated, and have the flexibility to design my ideal workday. I am respected and valued for my contributions.',
    social: 'I am surrounded by inspiring, supportive friends who lift me higher. We share deep conversations, fun experiences, and genuine connection. My social life is rich and nourishing.',
    stuff: 'I have beautiful, high-quality possessions that bring me joy. My car, clothes, and belongings reflect my values and taste. I own things intentionally and appreciate what I have.',
    giving: 'I give generously of my time, talent, and treasure. I support causes I believe in and make a positive difference in my community. Giving is a natural expression of my abundant life.',
    spirituality: 'I am deeply connected to my spiritual practice. I meditate daily, trust my intuition, and feel guided by a higher power. I live with purpose, gratitude, and inner peace.',
    conclusion: 'This is my ideal life, and I am living it now. Every day I take inspired action toward this vision. I am grateful for all that I have and excited for all that is coming. I am the conscious creator of my reality.',
    created_at: now,
    updated_at: now
  })
}

// Step 6: Refine vision
async function advanceStep6_RefineVision(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  now: string
) {
  // Get the active vision
  const { data: vision } = await supabase
    .from('vision_versions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (!vision) return

  // Update with refined content
  await supabase
    .from('vision_versions')
    .update({
      refined_categories: LIFE_CATEGORIES.map(cat => ({
        category: cat,
        refined_at: now,
        refinement_notes: 'Refined with VIVA for deeper clarity and emotional resonance.'
      })),
      updated_at: now
    })
    .eq('id', vision.id)
}

// Step 7: Generate audio
async function advanceStep7_GenerateAudio(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  now: string
) {
  // Get the active vision
  const { data: vision } = await supabase
    .from('vision_versions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (!vision) return

  // Check if audio set exists
  const { data: existingSet } = await supabase
    .from('audio_sets')
    .select('id')
    .eq('vision_id', vision.id)
    .maybeSingle()

  if (existingSet) return

  // Create audio set
  const { data: audioSet } = await supabase
    .from('audio_sets')
    .insert({
      vision_id: vision.id,
      user_id: userId,
      name: 'My Vision Audio',
      description: 'AI-generated narration of my life vision',
      variant: 'original',
      voice_id: 'rachel',
      is_active: true,
      metadata: { generated_by: 'test_data' },
      created_at: now,
      updated_at: now
    })
    .select()
    .single()

  if (!audioSet) return

  // Create placeholder audio tracks
  const sections = ['forward', ...LIFE_CATEGORIES, 'conclusion']
  const tracks = sections.map((section, index) => ({
    user_id: userId,
    vision_id: vision.id,
    audio_set_id: audioSet.id,
    section_key: section,
    content_hash: `test_hash_${section}_${Date.now()}`,
    text_content: `Sample ${section} content for audio generation.`,
    voice_id: 'rachel',
    s3_bucket: 'vibrationfit-audio',
    s3_key: `test/${userId}/${section}.mp3`,
    audio_url: `https://media.vibrationfit.com/test/${userId}/${section}.mp3`,
    duration_seconds: 30 + index * 5,
    status: 'completed',
    mix_status: 'not_required',
    created_at: now,
    updated_at: now
  }))

  await supabase.from('audio_tracks').insert(tracks)

  // Update vision to have audio
  await supabase
    .from('vision_versions')
    .update({
      has_audio: true,
      last_audio_generated_at: now,
      updated_at: now
    })
    .eq('id', vision.id)
}

// Step 9: Audio mix
async function advanceStep9_AudioMix(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  now: string
) {
  // Update all audio tracks to have mix completed
  await supabase
    .from('audio_tracks')
    .update({
      mix_status: 'completed',
      mixed_audio_url: 'https://media.vibrationfit.com/test/mixed_audio.mp3',
      updated_at: now
    })
    .eq('user_id', userId)
}

// Step 10: Vision board
async function advanceStep10_VisionBoard(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  now: string
) {
  // Check if items exist
  const { data: existing } = await supabase
    .from('vision_board_items')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (existing) return

  // Create 12 vision board items (one per category)
  const items = LIFE_CATEGORIES.map((category, index) => ({
    user_id: userId,
    name: `${category.charAt(0).toUpperCase() + category.slice(1)} Vision`,
    description: `My vision for ${category} - living my ideal life in this area.`,
    image_url: `https://images.unsplash.com/photo-${1500000000000 + index * 1000}?w=800&h=600&fit=crop`,
    status: 'active',
    categories: [category],
    created_at: now,
    updated_at: now
  }))

  await supabase.from('vision_board_items').insert(items)
}

// Step 11: Journal entries (3 entries: written, voice, video)
async function advanceStep11_Journal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  now: string
) {
  // Check if entries exist
  const { data: existing } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (existing) return

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const twoDaysAgo = new Date(today)
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  // Entry 1: Written text only
  await supabase.from('journal_entries').insert({
    user_id: userId,
    date: twoDaysAgo.toISOString().split('T')[0],
    title: 'Day 1 of My Activation',
    content: `Today marks the beginning of my Activation Intensive journey. I'm feeling excited and a little nervous, but mostly grateful for this opportunity to clarify my vision and align with my highest self.

As I worked through the first few steps, I was struck by how much clarity I already have in some areas of my life, and how much work there is to do in others. Money and health are definitely areas where I want to grow.

The profile exercise helped me see where I am right now, and the assessment gave me a clear picture of my starting point. I'm above the green line in most categories, which feels encouraging.

Tomorrow I'll dive into building my actual vision. I can't wait to see what emerges when I give myself permission to dream big.`,
    categories: ['spirituality', 'work'],
    audio_recordings: [],
    created_at: twoDaysAgo.toISOString()
  })

  // Entry 2: Voice recording
  await supabase.from('journal_entries').insert({
    user_id: userId,
    date: yesterday.toISOString().split('T')[0],
    title: 'Voice Reflection on My Vision',
    content: 'Recorded a voice memo reflecting on the vision creation process.',
    categories: ['love', 'family'],
    audio_recordings: JSON.stringify([{
      url: 'https://media.vibrationfit.com/test/voice_journal_entry.mp3',
      transcript: 'Today I recorded my thoughts about creating my life vision. It was such a powerful experience to speak my dreams out loud. When I said the words about my ideal relationship and family life, I could feel the emotion rising. This is what I truly want. I want deep connection, adventure with my partner, and quality time with my kids. Saying it out loud made it more real.',
      type: 'audio',
      category: 'love',
      created_at: yesterday.toISOString()
    }]),
    created_at: yesterday.toISOString()
  })

  // Entry 3: Video recording
  await supabase.from('journal_entries').insert({
    user_id: userId,
    date: today.toISOString().split('T')[0],
    title: 'Video: My My Activation Plan Commitment',
    content: 'Recorded a video committing to my daily activation practice.',
    categories: ['health', 'spirituality'],
    audio_recordings: JSON.stringify([{
      url: 'https://media.vibrationfit.com/test/video_journal_entry.mp4',
      transcript: 'Day three of my intensive and I wanted to capture this moment on video. I just finished my vision audio and listened to it for the first time. Hearing my vision in a beautiful voice with music... it brought tears to my eyes. This is really happening. I am committing right now, on camera, to listen to this audio every morning and evening. I am committing to my activation protocol. I am the conscious creator of my reality.',
      type: 'video',
      category: 'spirituality',
      created_at: today.toISOString()
    }]),
    thumbnail_urls: JSON.stringify(['https://media.vibrationfit.com/test/video_thumb.jpg']),
    created_at: today.toISOString()
  })
}

// Step 12: Book calibration call
async function advanceStep12_BookCall(
  supabase: Awaited<ReturnType<typeof createClient>>,
  checklistId: string,
  now: string
) {
  await supabase
    .from('intensive_checklist')
    .update({
      call_scheduled: true,
      call_scheduled_at: now,
      call_scheduled_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      updated_at: now
    })
    .eq('id', checklistId)
}

// Step 13: Activation protocol
async function advanceStep13_ActivationProtocol(
  supabase: Awaited<ReturnType<typeof createClient>>,
  checklistId: string,
  now: string
) {
  await supabase
    .from('intensive_checklist')
    .update({
      activation_protocol_completed: true,
      activation_protocol_completed_at: now,
      updated_at: now
    })
    .eq('id', checklistId)
}

// Step 14: Unlock platform
async function advanceStep14_Unlock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  checklist: { id: string; intensive_id: string },
  now: string
) {
  // Update checklist
  await supabase
    .from('intensive_checklist')
    .update({
      unlock_completed: true,
      unlock_completed_at: now,
      status: 'completed',
      completed_at: now,
      updated_at: now
    })
    .eq('id', checklist.id)

  // Update purchase
  await supabase
    .from('order_items')
    .update({
      completion_status: 'completed',
      completed_at: now
    })
    .eq('id', checklist.intensive_id)
}

// GET - Fetch user's current progress
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify super_admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminAccount } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminAccount?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Use admin client to bypass RLS
    const adminClient = getAdminClient()

    // Get user's intensive checklist
    const { data: checklist } = await adminClient
      .from('intensive_checklist')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!checklist) {
      return NextResponse.json({ error: 'No intensive found for this user' }, { status: 404 })
    }

    // Get user account for step 1 check
    const { data: userAccount } = await adminClient
      .from('user_accounts')
      .select('first_name, last_name, phone')
      .eq('id', userId)
      .single()

    const settingsComplete = !!(
      userAccount?.first_name?.trim() &&
      userAccount?.last_name?.trim() &&
      userAccount?.phone?.trim()
    )

    // Build progress response
    const progress = {
      step0: !!checklist.started_at,
      step1: settingsComplete,
      step2: !!checklist.intake_completed,
      step3: !!checklist.profile_completed,
      step4: !!checklist.assessment_completed,
      step5: !!checklist.vision_built,
      step6: !!checklist.vision_refined,
      step7: !!checklist.audio_generated,
      step8: !!checklist.audio_generated, // Shares with 7
      step9: !!checklist.audios_generated,
      step10: !!checklist.vision_board_completed,
      step11: !!checklist.first_journal_entry,
      step12: !!checklist.call_scheduled,
      step13: !!checklist.activation_protocol_completed,
      step14: !!checklist.unlock_completed
    }

    const completedCount = Object.values(progress).filter(Boolean).length
    const totalSteps = 15 // 0-14

    return NextResponse.json({
      checklist,
      progress,
      completedCount,
      totalSteps,
      percentage: Math.round((completedCount / totalSteps) * 100),
      stepDefinitions: STEP_DEFINITIONS
    })

  } catch (error) {
    console.error('Error getting progress:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
