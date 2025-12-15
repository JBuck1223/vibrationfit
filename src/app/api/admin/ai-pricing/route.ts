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
    
    const { 
      model_name, 
      input_price_per_1k, 
      output_price_per_1k, 
      price_per_unit, 
      notes,
      // New capability fields
      supports_temperature,
      supports_json_mode,
      supports_streaming,
      is_reasoning_model,
      max_tokens_param,
      token_multiplier,
      context_window,
      capabilities_notes
    } = body

    if (!model_name) {
      return NextResponse.json(
        { error: 'model_name is required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      effective_date: new Date().toISOString()
    }

    // Only update fields that are provided
    if (input_price_per_1k !== undefined) updateData.input_price_per_1k = input_price_per_1k
    if (output_price_per_1k !== undefined) updateData.output_price_per_1k = output_price_per_1k
    if (price_per_unit !== undefined) updateData.price_per_unit = price_per_unit
    if (notes !== undefined) updateData.notes = notes
    
    // Capability fields
    if (supports_temperature !== undefined) updateData.supports_temperature = supports_temperature
    if (supports_json_mode !== undefined) updateData.supports_json_mode = supports_json_mode
    if (supports_streaming !== undefined) updateData.supports_streaming = supports_streaming
    if (is_reasoning_model !== undefined) updateData.is_reasoning_model = is_reasoning_model
    if (max_tokens_param !== undefined) updateData.max_tokens_param = max_tokens_param
    if (token_multiplier !== undefined) updateData.token_multiplier = token_multiplier
    if (context_window !== undefined) updateData.context_window = context_window
    if (capabilities_notes !== undefined) updateData.capabilities_notes = capabilities_notes

    const { data, error } = await supabase
      .from('ai_model_pricing')
      .update(updateData)
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

