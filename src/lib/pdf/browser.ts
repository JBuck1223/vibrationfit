import type { Browser } from 'puppeteer-core'

/**
 * Launches a Puppeteer browser appropriate for the current environment.
 * - Local dev: uses full `puppeteer` with its bundled Chromium
 * - Serverless (Vercel): uses `puppeteer-core` + `@sparticuz/chromium`
 */
export async function launchBrowser(): Promise<Browser> {
  const isLocal =
    process.env.NODE_ENV === 'development' ||
    !!process.env.PUPPETEER_EXECUTABLE_PATH

  if (isLocal) {
    const puppeteer = await import('puppeteer')
    return puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    }) as unknown as Browser
  }

  const chromium = (await import('@sparticuz/chromium')).default
  const puppeteerCore = (await import('puppeteer-core')).default

  // chromium.args already includes --no-sandbox, --no-zygote,
  // --use-gl=swiftshader, --in-process-gpu, etc.
  // Do NOT add --disable-gpu: it disables the compositor that printToPDF needs.
  return puppeteerCore.launch({
    args: [...chromium.args, '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 720 },
    executablePath: await chromium.executablePath(),
    headless: 'shell',
  })
}
