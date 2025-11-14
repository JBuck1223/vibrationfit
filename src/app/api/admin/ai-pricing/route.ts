import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch all AI model pricing
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: pricing, error } = await supabase
      .from('ai_model_pricing')
      .select('*')
      .eq('is_active', true)
      .order('model_family, model_name')

    if (error) throw error

    return NextResponse.json({ pricing })
  } catch (error: any) {
    console.error('Error fetching AI pricing:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update AI model pricing
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { model_name, input_price_per_1k, output_price_per_1k, price_per_unit, notes } = body

    if (!model_name) {
      return NextResponse.json(
        { error: 'model_name is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ai_model_pricing')
      .update({
        input_price_per_1k,
        output_price_per_1k,
        price_per_unit,
        notes,
        effective_date: new Date().toISOString()
      })
      .eq('model_name', model_name)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating AI pricing:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST - Add new AI model pricing
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { 
      model_name, 
      provider, 
      model_family,
      input_price_per_1k, 
      output_price_per_1k,
      price_per_unit,
      unit_type,
      notes 
    } = body

    if (!model_name || !provider) {
      return NextResponse.json(
        { error: 'model_name and provider are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ai_model_pricing')
      .insert({
        model_name,
        provider,
        model_family,
        input_price_per_1k: input_price_per_1k || 0,
        output_price_per_1k: output_price_per_1k || 0,
        price_per_unit,
        unit_type,
        notes,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating AI pricing:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

