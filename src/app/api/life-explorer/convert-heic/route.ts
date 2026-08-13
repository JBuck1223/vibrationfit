import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import heicConvert from 'heic-convert'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_EDGE = 1600

/**
 * Server-side HEIC → JPEG conversion fallback. Browser-side WASM decode
 * (heic2any) fails on many newer iPhone captures; libheif via heic-convert
 * handles them. Returns a downscaled JPEG ready for upload + vision.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file required' }, { status: 400 })
    }

    const input = Buffer.from(await file.arrayBuffer())

    let jpegBuffer: Buffer
    try {
      // sharp first — fastest when libvips can read it (also handles the
      // case where the "HEIC" is actually a JPEG with the wrong extension).
      jpegBuffer = await sharp(input)
        .rotate() // respect EXIF orientation
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()
    } catch {
      const converted = await heicConvert({ buffer: input, format: 'JPEG', quality: 0.9 })
      jpegBuffer = await sharp(Buffer.from(converted))
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()
    }

    return new NextResponse(new Uint8Array(jpegBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('convert-heic failed', err)
    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : 'Conversion failed'
    return NextResponse.json({ error: `Could not convert photo: ${message}` }, { status: 500 })
  }
}
