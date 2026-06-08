import { readFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

const REFERENCE_CANVAS = 3000
const REFERENCE_WIDTH = 349
const REFERENCE_HEIGHT = 277
const REFERENCE_BOTTOM_MARGIN = 82

const WATERMARK_PATH = path.join(
  process.cwd(),
  'public/site-assets/brand/album-art-watermark.png',
)

let cachedWatermark: Buffer | null = null

function getPlacement(canvasSize: number) {
  const scale = canvasSize / REFERENCE_CANVAS
  const width = Math.round(REFERENCE_WIDTH * scale)
  const height = Math.round(REFERENCE_HEIGHT * scale)
  const left = canvasSize - width
  const top = canvasSize - height - Math.round(REFERENCE_BOTTOM_MARGIN * scale)
  return { left, top, width, height }
}

async function loadScaledWatermark(width: number, height: number): Promise<Buffer> {
  if (!cachedWatermark) {
    cachedWatermark = await readFile(WATERMARK_PATH)
  }
  if (width === REFERENCE_WIDTH && height === REFERENCE_HEIGHT) {
    return cachedWatermark
  }
  return sharp(cachedWatermark).resize(width, height).png().toBuffer()
}

export async function applyAlbumArtWatermark(
  imageBuffer: Buffer,
  canvasSize = REFERENCE_CANVAS,
): Promise<Buffer> {
  const { left, top, width, height } = getPlacement(canvasSize)
  const watermark = await loadScaledWatermark(width, height)

  return sharp(imageBuffer)
    .composite([{ input: watermark, left, top }])
    .toBuffer()
}
