import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// Create admin client that bypasses RLS
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseAdmin(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

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

    const { email, firstName, lastName } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_accounts')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists',
        userId: existingUser.id
      }, { status: 409 })
    }

    // Create admin client for user creation
    const adminClient = getAdminClient()

    // Create auth user with a default test password
    const testPassword = 'TestUser123!'
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || 'Test',
        last_name: lastName || 'User'
      }
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json({ 
        error: authError?.message || 'Failed to create auth user' 
      }, { status: 500 })
    }

    const newUserId = authData.user.id
    const now = new Date().toISOString()

    // Note: user_accounts row is automatically created by the handle_new_user trigger
    // Update the user_accounts row with first_name and last_name if provided
    if (firstName || lastName) {
      const { error: accountError } = await adminClient
        .from('user_accounts')
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
          updated_at: now
        })
        .eq('id', newUserId)

      if (accountError) {
        console.error('Error updating user account:', accountError)
        // Non-fatal - continue with the rest
      }
    }

    const { data: intensiveProduct, error: productError } = await adminClient
      .from('products')
      .select('id')
      .eq('key', 'intensive')
      .maybeSingle()

    if (productError || !intensiveProduct) {
      return NextResponse.json({
        error: 'Intensive product not found'
      }, { status: 500 })
    }

    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        user_id: newUserId,
        total_amount: 49900,
        currency: 'usd',
        status: 'paid',
        paid_at: now,
        metadata: { source: 'admin_test_user' },
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json({
        error: 'Failed to create order for test intensive'
      }, { status: 500 })
    }

    const { data: intensivePurchase, error: purchaseError } = await adminClient
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: intensiveProduct.id,
        price_id: null,
        quantity: 1,
        amount: 49900,
        currency: 'usd',
        is_subscription: false,
        stripe_payment_intent_id: `test_user_${Date.now()}`,
        payment_plan: 'full',
        installments_total: 1,
        installments_paid: 1,
        completion_status: 'pending',
        created_at: now
      })
      .select()
      .single()

    if (purchaseError || !intensivePurchase) {
      console.error('Error creating intensive order item:', purchaseError)
      return NextResponse.json({
        error: 'Failed to create intensive order item'
      }, { status: 500 })
    }

    // Create intensive_checklist row
    const { error: checklistError } = await adminClient
      .from('intensive_checklist')
      .insert({
        intensive_id: intensivePurchase.id,
        user_id: newUserId,
        status: 'pending',
        created_at: now,
        updated_at: now
      })

    if (checklistError) {
      console.error('Error creating intensive checklist:', checklistError)
      return NextResponse.json({ 
        error: 'Failed to create intensive checklist' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test user created: ${email}`,
      userId: newUserId,
      intensiveId: intensivePurchase.id,
      email: email,
      password: testPassword,
      loginInstructions: `Login with email: ${email} and password: ${testPassword}`
    })

  } catch (error) {
    console.error('Error creating test user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - List all users with intensives (for dropdown)
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

    // Use admin client to bypass RLS
    const adminClient = getAdminClient()

    // Get all intensive checklists
    const { data: checklists, error: checklistError } = await adminClient
      .from('intensive_checklist')
      .select('user_id, status, started_at, created_at')
      .order('created_at', { ascending: false })

    if (checklistError) {
      console.error('Error fetching checklists:', checklistError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get unique user IDs
    const userIds = [...new Set((checklists || []).map(c => c.user_id))]
    
    if (userIds.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Fetch user accounts for these users
    const { data: accounts, error: accountsError } = await adminClient
      .from('user_accounts')
      .select('id, email, first_name, last_name')
      .in('id', userIds)

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Create a map of user accounts by ID
    const accountMap = new Map((accounts || []).map(a => [a.id, a]))

    // Build the response, deduplicating by user_id (keep most recent checklist)
    const userMap = new Map()
    for (const checklist of checklists || []) {
      if (!userMap.has(checklist.user_id)) {
        const account = accountMap.get(checklist.user_id)
        if (account) {
          userMap.set(checklist.user_id, {
            userId: checklist.user_id,
            email: account.email,
            firstName: account.first_name,
            lastName: account.last_name,
            displayName: account.first_name && account.last_name 
              ? `${account.first_name} ${account.last_name}` 
              : account.email,
            status: checklist.status,
            startedAt: checklist.started_at,
            createdAt: checklist.created_at
          })
        }
      }
    }

    return NextResponse.json({ 
      users: Array.from(userMap.values()) 
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
