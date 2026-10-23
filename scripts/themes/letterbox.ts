/**
 * The image model sometimes bakes black letterbox bars into a frame. Those
 * bars show as a black strip at the top of the backdrop. This finds rows that
 * are near-black across the full width at the top and bottom and crops them.
 */

import sharp from 'sharp'

const NEAR_BLACK = 14 // mean luminance (0–255) of a whole row
const MIN_BAR = 8 // rows; anything thinner is just a dark edge

export async function trimLetterbox(input: Buffer): Promise<{ buffer: Buffer; top: number; bottom: number }> {
  const img = sharp(input)
  const { width, height } = await img.metadata()
  if (!width || !height) return { buffer: input, top: 0, bottom: 0 }
  const { data } = await img.clone().greyscale().raw().toBuffer({ resolveWithObject: true })
  const rowMean = (y: number) => {
    let sum = 0
    for (let x = 0; x < width; x++) sum += data[y * width + x]
    return sum / width
  }
  let top = 0
  while (top < height / 3 && rowMean(top) < NEAR_BLACK) top++
  let bottom = 0
  while (bottom < height / 3 && rowMean(height - 1 - bottom) < NEAR_BLACK) bottom++
  if (top < MIN_BAR) top = 0
  if (bottom < MIN_BAR) bottom = 0
  if (top === 0 && bottom === 0) return { buffer: input, top, bottom }
  const buffer = await sharp(input)
    .extract({ left: 0, top, width, height: height - top - bottom })
    .png()
    .toBuffer()
  return { buffer, top, bottom }
}
