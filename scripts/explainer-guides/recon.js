// Visits each major area and dumps a screenshot + visible interactive elements.
const path = require('path')
const fs = require('fs')
const { launch, ensureLoggedIn, sleep, cleanPage, BASE_URL } = require('./lib')

const ROUTES = [
  'dashboard',
  'profile',
  'life-vision',
  'vision-board',
  'journal',
  'audio',
  'abundance-tracker',
  'daily-paper',
  'map',
  'alignment-gym',
  'vibe-tribe',
  'stories',
]

async function main() {
  const outDir = path.join(__dirname, 'output', 'recon')
  fs.mkdirSync(outDir, { recursive: true })
  const { browser, page } = await launch()
  await ensureLoggedIn(page)

  const report = {}
  for (const route of ROUTES) {
    const url = `${BASE_URL}/${route}`
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
      await sleep(2500)
      await cleanPage(page)
      await page.screenshot({ path: path.join(outDir, route.replace(/\//g, '_') + '.png') })
      const els = await page.evaluate(() => {
        const out = []
        document.querySelectorAll('button, a[href], [role=tab]').forEach((el) => {
          const r = el.getBoundingClientRect()
          if (r.width < 5 || r.height < 5) return
          const text = (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60)
          if (!text) return
          out.push({ tag: el.tagName.toLowerCase(), text, href: el.getAttribute('href') || undefined })
        })
        return out.slice(0, 120)
      })
      report[route] = { finalUrl: page.url(), elements: els }
      console.log('recon ok:', route)
    } catch (e) {
      report[route] = { error: e.message }
      console.warn('recon FAIL:', route, e.message)
    }
  }
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2))
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
