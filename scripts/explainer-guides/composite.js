// Renders branded 1920x1080 explainer frames from raw captures + steps.json.
// Usage: node scripts/explainer-guides/composite.js [areaSlug ...]
const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const OUT_ROOT = path.join(__dirname, 'output')

async function main() {
  const areas = process.argv.slice(2)
  const rawRoot = path.join(OUT_ROOT, 'raw')
  const targets = areas.length
    ? areas
    : fs.readdirSync(rawRoot).filter((d) => fs.existsSync(path.join(rawRoot, d, 'steps.json')))

  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
  await page.goto('file://' + path.join(__dirname, 'frame.html'), { waitUntil: 'networkidle0' })
  await page.evaluateHandle('document.fonts.ready')

  for (const area of targets) {
    const areaDir = path.join(rawRoot, area)
    const meta = JSON.parse(fs.readFileSync(path.join(areaDir, 'steps.json'), 'utf8'))
    const frameDir = path.join(OUT_ROOT, 'frames', area)
    fs.mkdirSync(frameDir, { recursive: true })

    let n = 0
    for (const step of meta.steps) {
      n++
      const imgPath = path.join(areaDir, step.slug + '.png')
      if (!fs.existsSync(imgPath)) {
        console.warn(`missing capture ${imgPath}, skipping`)
        continue
      }
      await page.evaluate(
        (d) => window.renderStep(d),
        {
          area: meta.areaLabel,
          accent: meta.accent || '#39FF14',
          step: n,
          title: step.title,
          desc: step.desc,
          image: 'file://' + imgPath,
          box: step.box || null,
        }
      )
      await new Promise((r) => setTimeout(r, 150))
      const frame = await page.$('#frame')
      const out = path.join(frameDir, `${String(n).padStart(2, '0')}-${step.slug}.png`)
      await frame.screenshot({ path: out })
      console.log('framed', path.relative(OUT_ROOT, out))
    }
  }
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
