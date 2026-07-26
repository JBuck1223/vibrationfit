#!/usr/bin/env node
/**
 * Export Instagram carousel HTML slides to exact 1080x1350 PNGs.
 *
 * Usage:
 *   node scripts/social/instagram-carousel/export.mjs
 *   node scripts/social/instagram-carousel/export.mjs slides/v3-slide2-figures.html
 */

import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer'

const WIDTH = 1080
const HEIGHT = 1350

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SLIDES_DIR = path.join(__dirname, 'slides')
const OUT_DIR = path.join(__dirname, 'out')

async function resolveSlideFiles(args) {
  if (args.length > 0) {
    return args.map((arg) =>
      path.isAbsolute(arg) ? arg : path.join(__dirname, arg),
    )
  }

  // Default: export the final V3 set in order
  const v3Order = [
    'v3-slide1-hook.html',
    'v3-slide2-figures.html',
    'v3-slide3-cta.html',
  ]

  const existing = await readdir(SLIDES_DIR)
  const ordered = v3Order.filter((f) => existing.includes(f))
  if (ordered.length > 0) {
    return ordered.map((f) => path.join(SLIDES_DIR, f))
  }

  return existing
    .filter((f) => f.endsWith('.html'))
    .sort()
    .map((f) => path.join(SLIDES_DIR, f))
}

async function exportSlide(browser, htmlPath) {
  const page = await browser.newPage()
  await page.setViewport({
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
  })

  const fileUrl = pathToFileURL(htmlPath).href
  await page.goto(fileUrl, { waitUntil: 'networkidle0' })

  await page.evaluate(() => document.fonts.ready)
  await new Promise((r) => setTimeout(r, 200))

  const base = path.basename(htmlPath, '.html')
  const outPath = path.join(OUT_DIR, `${base}.png`)

  await page.screenshot({
    path: outPath,
    type: 'png',
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    omitBackground: false,
  })

  await page.close()
  return outPath
}

async function main() {
  const args = process.argv.slice(2)
  const slides = await resolveSlideFiles(args)

  if (slides.length === 0) {
    console.error('No HTML slides found.')
    process.exit(1)
  }

  await mkdir(OUT_DIR, { recursive: true })

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    for (const slide of slides) {
      const out = await exportSlide(browser, slide)
      console.log(`Exported ${WIDTH}x${HEIGHT}: ${out}`)
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
