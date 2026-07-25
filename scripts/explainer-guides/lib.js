// Shared Puppeteer helpers for the explainer-guide capture pipeline.
const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const BASE_URL = process.env.GUIDE_BASE_URL || 'https://vibrationfit.com'
const LOGIN_EMAIL = process.env.GUIDE_LOGIN_EMAIL || 'jordan@vibrationfit.com'
const PROFILE_DIR = path.join(__dirname, 'chrome-profile')

async function launch() {
  const browser = await puppeteer.launch({
    headless: 'new',
    userDataDir: PROFILE_DIR,
    args: ['--window-size=1920,1200', '--font-render-hinting=none'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 })
  return { browser, page }
}

async function ensureLoggedIn(page) {
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: 60000 })
  if (page.url().includes('/auth/login') || new URL(page.url()).pathname === '/') {
    console.log('Logging in via auto-login...')
    await page.goto(`${BASE_URL}/auth/auto-login?email=${encodeURIComponent(LOGIN_EMAIL)}`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    })
    // /auth/verify redirects client-side; wait until we leave the auth flow
    await page.waitForFunction(() => !location.pathname.startsWith('/auth'), { timeout: 30000 })
    await sleep(2000)
  }
  console.log('Session ready at', page.url())
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// Hide toasts/dev artifacts that would pollute screenshots
async function cleanPage(page) {
  await page
    .addStyleTag({
      content: `
      [data-sonner-toaster], #nextjs-toast, nextjs-portal { display: none !important; }
    `,
    })
    .catch(() => {})
}

async function capture(page, outDir, slug, highlightSelector) {
  fs.mkdirSync(outDir, { recursive: true })
  await cleanPage(page)
  let box = null
  if (highlightSelector) {
    try {
      const el = await page.$(highlightSelector)
      if (el) {
        const b = await el.boundingBox()
        if (b) box = { x: b.x, y: b.y, w: b.width, h: b.height }
      }
    } catch (e) {
      console.warn(`  highlight selector failed for ${slug}: ${e.message}`)
    }
  }
  const file = path.join(outDir, `${slug}.png`)
  await page.screenshot({ path: file })
  console.log(`  captured ${slug}${box ? ' (highlight found)' : ''}`)
  return { file, box }
}

module.exports = { launch, ensureLoggedIn, sleep, capture, cleanPage, BASE_URL }
