/**
 * Make a phone photo JPEG-safe for upload + vision.
 * Prefer canvas (Safari can often decode HEIC natively); fall back to heic2any.
 * Also downscales large shots so vision payloads stay reasonable.
 */

const MAX_EDGE = 1600
const JPEG_QUALITY = 0.85

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  )
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not decode that photo in the browser'))
    }
    img.src = url
  })
}

function canvasToJpegFile(img: HTMLImageElement, filename: string): Promise<File> {
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas not available'))
  ctx.drawImage(img, 0, 0, w, h)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not encode JPEG'))
          return
        }
        resolve(
          new File([blob], filename.replace(/\.(heic|heif|png|webp|jpe?g)$/i, '.jpg'), {
            type: 'image/jpeg',
          })
        )
      },
      'image/jpeg',
      JPEG_QUALITY
    )
  })
}

// heic2any rejects with plain objects like { code, message }, not Error instances.
function errorDetail(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  try {
    return JSON.stringify(err)
  } catch {
    return 'unknown error'
  }
}

async function viaHeic2any(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: JPEG_QUALITY,
  })
  const blob = (Array.isArray(converted) ? converted[0] : converted) as Blob
  // Re-run through canvas to downscale
  const img = await loadImageFromBlob(blob)
  return canvasToJpegFile(img, file.name)
}

// Last resort: let the server decode it with libheif (handles newer iPhone
// captures that the browser-side WASM decoder chokes on).
async function viaServer(file: File): Promise<File> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/life-explorer/convert-heic', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(json?.error || `Server conversion failed (${res.status})`)
  }
  const blob = await res.blob()
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
}

/** Returns a JPEG File ready for S3 + vision. */
export async function ensureJpegCompatible(file: File): Promise<File> {
  // Fast path: already a browser-friendly raster — still downscale via canvas.
  if (!isHeic(file) && /^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.type || '')) {
    try {
      const img = await loadImageFromBlob(file)
      return canvasToJpegFile(img, file.name)
    } catch {
      return file.type === 'image/jpeg'
        ? file
        : new File([file], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
    }
  }

  // HEIC / unknown: native decode (Safari) → heic2any (WASM) → server (libheif).
  try {
    const img = await loadImageFromBlob(file)
    return canvasToJpegFile(img, file.name)
  } catch (nativeErr) {
    console.warn('native HEIC decode failed:', errorDetail(nativeErr))
    try {
      return await viaHeic2any(file)
    } catch (wasmErr) {
      console.warn('heic2any conversion failed:', errorDetail(wasmErr), wasmErr)
      try {
        return await viaServer(file)
      } catch (serverErr) {
        console.error('server HEIC conversion failed:', serverErr)
        throw new Error(`Could not convert this photo to JPEG (${errorDetail(serverErr)}).`)
      }
    }
  }
}

/** data:image/jpeg;base64,... for vision models that can't fetch private CDNs. */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the photo for AI'))
    reader.readAsDataURL(file)
  })
}
