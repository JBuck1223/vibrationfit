// Captures raw walkthrough screenshots per area, with step metadata + highlight boxes.
// Usage: node scripts/explainer-guides/capture.js [areaSlug ...]
// NOTE: never submits/saves anything — creation flows are shown filled but unsubmitted.
const path = require('path')
const fs = require('fs')
const { launch, ensureLoggedIn, sleep, cleanPage, BASE_URL } = require('./lib')

// ---------- helpers ----------

async function clickText(page, text, { tag = '*', index = 0, exact = false } = {}) {
  const handle = await page.evaluateHandle(
    (text, tag, index, exact) => {
      const nodes = [...document.querySelectorAll(tag === '*' ? 'button, a, [role=tab], [role=button]' : tag)]
      const matches = nodes.filter((el) => {
        const t = (el.innerText || '').trim().replace(/\s+/g, ' ')
        if (!(exact ? t === text : t.toLowerCase().includes(text.toLowerCase()))) return false
        const r = el.getBoundingClientRect()
        if (r.width < 2 || r.height < 2) return false
        const s = getComputedStyle(el)
        return s.visibility !== 'hidden' && s.display !== 'none'
      })
      return matches[index] || null
    },
    text, tag, index, exact
  )
  const el = handle.asElement()
  if (!el) throw new Error(`clickText: "${text}" not found`)
  await el.evaluate((n) => n.scrollIntoView({ block: 'center' }))
  await sleep(300)
  await el.click()
}

async function boxOfText(page, text, { tag = '*', index = 0, exact = false } = {}) {
  return page.evaluate(
    (text, tag, index, exact) => {
      const nodes = [...document.querySelectorAll(tag === '*' ? 'button, a, [role=tab], [role=button], h1, h2, h3, input, textarea, select' : tag)]
      const matches = nodes.filter((el) => {
        const t = (el.innerText || el.placeholder || '').trim().replace(/\s+/g, ' ')
        return exact ? t === text : t.toLowerCase().includes(text.toLowerCase())
      })
      const el = matches[index]
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height }
    },
    text, tag, index, exact
  )
}

async function boxOfSelector(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  }, selector)
}

async function typeInto(page, selector, text) {
  const el = await page.$(selector)
  if (!el) return false
  await el.click({ clickCount: 1 })
  await page.keyboard.type(text, { delay: 5 })
  return true
}

// ---------- area definitions ----------
// Each step: { slug, title, desc, run(page) -> optional highlight box }

const AREAS = {
  dashboard: {
    areaLabel: 'Dashboard',
    accent: '#39FF14',
    steps: [
      {
        slug: 'overview',
        title: 'Your Dashboard is home base',
        desc: 'Everything starts here: your daily rhythm, upcoming calls, and quick links to every tool in the platform.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' })
          await sleep(2500)
        },
      },
      {
        slug: 'sidebar',
        title: 'Navigate with the sidebar',
        desc: 'Every major area — Life Vision, Vision Board, Journal, Audio, Daily Paper, and more — is one click away on the left.',
        run: async (page) =>
          page.evaluate(() => {
            const el = [...document.querySelectorAll('aside, nav, div')].find((n) => {
              const r = n.getBoundingClientRect()
              return r.width > 100 && r.width < 400 && r.height > 400 && r.x < 300 && n.innerText.includes('Vision Board')
            })
            if (!el) return null
            const r = el.getBoundingClientRect()
            return { x: r.x, y: r.y, w: r.width, h: r.height }
          }),
      },
      {
        slug: 'checklist',
        title: 'Follow your Getting Started checklist',
        desc: 'Work through these steps in your first 7 days to lock in your new rhythm.',
        run: async (page) => {
          await page.evaluate(() => {
            const h = [...document.querySelectorAll('h2')].find((x) => x.innerText.includes('Getting Started'))
            if (h) h.scrollIntoView({ block: 'center' })
          })
          await sleep(800)
          return boxOfText(page, 'Getting Started', { tag: 'h2' })
        },
      },
      {
        slug: 'map-section',
        title: 'Run your MAP every day',
        desc: 'Your MAP — My Alignment Plan — is your daily conscious creation rhythm. Jump in right from the Dashboard.',
        run: async (page) => {
          await clickText(page, 'View MAP')
          await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
          await sleep(2000)
        },
      },
    ],
  },

  profile: {
    areaLabel: 'Profile',
    accent: '#39FF14',
    steps: [
      {
        slug: 'overview',
        title: 'Your Profile tells your story',
        desc: 'View your personal information, media, and everything that makes your journey uniquely yours.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' })
          await sleep(2500)
        },
      },
      {
        slug: 'versions',
        title: 'Switch between profile versions',
        desc: 'Your profile evolves as you do. Use the version selector to view any snapshot of who you are becoming.',
        run: async (page) => boxOfText(page, 'Version', { tag: 'button' }),
      },
      {
        slug: 'update',
        title: 'Update your profile any time',
        desc: 'Click Update to open the profile editor and refresh your info, photos, and story.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/profile/create`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
      {
        slug: 'editor',
        title: 'Fill in each section at your pace',
        desc: 'Personal info, media, and more — every section you complete gives VIVA more to personalize your experience with.',
        run: async (page) => {
          await page.evaluate(() => window.scrollTo({ top: 400 }))
          await sleep(800)
        },
      },
    ],
  },

  'life-vision': {
    areaLabel: 'Life Vision',
    accent: '#39FF14',
    steps: [
      {
        slug: 'overview',
        title: 'Read or listen to your Life Vision',
        desc: 'Your active Life Vision lives here — the full picture of The Life You Choose, across all 12 categories.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/life-vision`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
      {
        slug: 'versions',
        title: 'Choose a version and audio style',
        desc: 'Your vision is versioned as it evolves. Pick any version, and choose which audio voice to listen with.',
        run: async (page) => boxOfText(page, 'Version', { tag: 'button' }),
      },
      {
        slug: 'categories',
        title: 'Jump to any life category',
        desc: 'Use the category pills — Fun, Health, Travel, Love, Money, and more — to focus on one area at a time.',
        run: async (page) => boxOfText(page, 'Health', { tag: 'button', exact: true }),
      },
      {
        slug: 'listen',
        title: 'Press play on any section',
        desc: 'Every section has audio. Listen to your vision in your own cloned voice to activate it daily.',
        run: async (page) => {
          const box = await page.evaluate(() => {
            const btns = [...document.querySelectorAll('button')]
            const b = btns.find((x) => x.querySelector('svg.lucide-play, svg[class*=play]'))
            if (!b) return null
            const r = b.getBoundingClientRect()
            return { x: r.x, y: r.y, w: r.width, h: r.height }
          })
          return box
        },
      },
      {
        slug: 'household',
        title: 'See your Household visions',
        desc: 'The Household tab brings your visions together with your partner\u2019s, so you can create in alignment as a family.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/life-vision/household`, { waitUntil: 'networkidle2' })
          await sleep(2500)
        },
      },
      {
        slug: 'pdf',
        title: 'Download your vision as a PDF',
        desc: 'Take your Life Vision offline any time with a beautifully formatted PDF download.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/life-vision`, { waitUntil: 'networkidle2' })
          await sleep(2500)
          return boxOfText(page, 'Download PDF')
        },
      },
      {
        slug: 'update',
        title: 'Refine your vision with VIVA',
        desc: 'Click Update to open the Life Vision studio and evolve any category with VIVA guiding you.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/life-vision/new/fun`, { waitUntil: 'networkidle2' })
          await sleep(3500)
        },
      },
    ],
  },

  'vision-board': {
    areaLabel: 'Vision Board',
    accent: '#BF00FF',
    steps: [
      {
        slug: 'overview',
        title: 'Your Vision Board makes it visual',
        desc: 'Every desire gets an image. Watch your board fill up with Actualized wins over time.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/vision-board`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
      {
        slug: 'household-toggle',
        title: 'View yours, your partner\u2019s, or both',
        desc: 'Flip between Me, your partner, or Both to see the whole household\u2019s vision at once.',
        run: async (page) => boxOfText(page, 'Both', { tag: 'button', exact: true }),
      },
      {
        slug: 'create',
        title: 'Add a new vision item',
        desc: 'Click the plus button or the Create tab to add a new desire to your board.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/vision-board/create`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
      {
        slug: 'filter',
        title: 'Filter and organize your board',
        desc: 'Use Filter to slice your board by category or status, and Select to work with multiple items at once.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/vision-board`, { waitUntil: 'networkidle2' })
          await sleep(2500)
          await clickText(page, 'Filter', { tag: 'button' })
          await sleep(1200)
        },
      },
      {
        slug: 'play',
        title: 'Play your board like a slideshow',
        desc: 'Hit Play for an immersive full-screen run-through of everything you\u2019re calling in — or export it all as a PDF.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/vision-board`, { waitUntil: 'networkidle2' })
          await sleep(2500)
          return boxOfText(page, 'Play', { tag: 'button', exact: true })
        },
      },
    ],
  },

  journal: {
    areaLabel: 'Journal',
    accent: '#00FFFF',
    steps: [
      {
        slug: 'overview',
        title: 'Your Journal captures the journey',
        desc: 'Every entry is a timestamped snapshot of your vibration — wins, wobbles, and everything in between.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/journal`, { waitUntil: 'networkidle2' })
          await sleep(2500)
        },
      },
      {
        slug: 'entry',
        title: 'Tap any entry to expand it',
        desc: 'Open an entry to read the full text, see attached photos, and listen to any audio you recorded.',
        run: async (page) => {
          const rows = await page.$$('main [class*=cursor-pointer], main li, main [role=button]')
          await clickText(page, 'Problems and Solutions').catch(() => {})
          await sleep(1500)
        },
      },
      {
        slug: 'create',
        title: 'Create a new entry',
        desc: 'Click the plus button to start a new entry. Type it, or just talk — your voice gets transcribed automatically.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/journal/new`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
      {
        slug: 'filled',
        title: 'Write it, tag it, save it',
        desc: 'Add a title, your thoughts, photos, and tags — then save. Your entry joins your timeline instantly.',
        run: async (page) => {
          const titleSel = await page.evaluate(() => {
            const input = [...document.querySelectorAll('input')].find(
              (i) => (i.placeholder || '').toLowerCase().includes('title')
            )
            if (input) input.setAttribute('data-guide-title', '1')
            return input ? 'input[data-guide-title]' : null
          })
          if (titleSel) await typeInto(page, titleSel, 'A magical morning')
          await typeInto(page, 'textarea', 'Woke up feeling above the Green Line today. The vision is getting clearer every single day, and the fun part is watching it all unfold...')
          await page.evaluate(() => window.scrollTo({ top: 0 }))
          await sleep(500)
        },
      },
    ],
  },

  audio: {
    areaLabel: 'Audio Studio',
    accent: '#00FFFF',
    steps: [
      {
        slug: 'overview',
        title: 'Play your vision in the Audio Studio',
        desc: 'Your entire Life Vision, as audio. Play it daily to keep your vibration pointed at what you\u2019re creating.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/audio`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
      {
        slug: 'mix',
        title: 'Choose your voice and mix',
        desc: 'Switch between voices and mixes — including your own cloned voice with frequency-enhanced backing tracks.',
        run: async (page) => boxOfText(page, 'Voice Only', { tag: 'button' }),
      },
      {
        slug: 'offline',
        title: 'Take your audio anywhere',
        desc: 'Play Offline or download the MP3s so your vision travels with you — car, gym, or airplane mode.',
        run: async (page) => boxOfText(page, 'Download MP3s'),
      },
      {
        slug: 'stories',
        title: 'Listen to your Stories',
        desc: 'Stories are immersive day-in-the-life narrations of your vision, generated with VIVA and ready to play.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/audio/stories`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
      {
        slug: 'music',
        title: 'Explore vibration-raising Music',
        desc: 'A catalog of tracks tuned for alignment — play them standalone or under your vision audio.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/audio/music`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
      {
        slug: 'playlists',
        title: 'Build your own Playlists',
        desc: 'Combine vision sections, stories, and music into playlists for any moment of your day.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/audio/playlists`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
      {
        slug: 'songs',
        title: 'Your personal Songs',
        desc: 'My Songs holds custom songs created from your vision — anthems for the life you\u2019re actualizing.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/audio/songs`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
      {
        slug: 'create',
        title: 'Create new audio any time',
        desc: 'The Create tab is your studio: generate fresh vision audio, new mixes, stories, and more.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/audio/create`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
    ],
  },

  'abundance-tracker': {
    areaLabel: 'Abundance Tracker',
    accent: '#FFFF00',
    steps: [
      {
        slug: 'overview',
        title: 'Track the abundance flowing in',
        desc: 'Money, gifts, synchronicities, unexpected wins — logging them builds your appreciation muscle.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/abundance-tracker`, { waitUntil: 'networkidle2' })
          await sleep(2500)
        },
      },
      {
        slug: 'new-entry',
        title: 'Log a new abundance moment',
        desc: 'Click New Entry and capture the moment while the feeling is fresh.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/abundance-tracker/new`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
      {
        slug: 'insights',
        title: 'Watch your abundance Insights grow',
        desc: 'The Insights tab charts your abundance over time — proof that what you appreciate, appreciates.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/abundance-tracker/reports`, { waitUntil: 'networkidle2' })
          await sleep(3000)
          // Show household data across the year so the charts have content
          await clickText(page, 'Both', { exact: true }).catch(() => {})
          await sleep(1500)
          await clickText(page, 'Year', { exact: true }).catch(() => {})
          await sleep(2500)
        },
      },
      {
        slug: 'goals',
        title: 'Set abundance Goals',
        desc: 'Give your abundance a target and watch the tracker close the gap.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/abundance-tracker/goals`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
    ],
  },

  'daily-paper': {
    areaLabel: 'Daily Paper',
    accent: '#39FF14',
    steps: [
      {
        slug: 'overview',
        title: 'Your Daily Paper practice',
        desc: 'A magical daily process for establishing a positive vibe while intentionally moving toward your desires.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/daily-paper`, { waitUntil: 'networkidle2' })
          await sleep(2500)
        },
      },
      {
        slug: 'create',
        title: 'Start today\u2019s paper',
        desc: 'Click Create and follow the guided flow — appreciation, intention, and vision, all in one sitting.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/daily-paper/new`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
      {
        slug: 'resources',
        title: 'Learn the method in Resources',
        desc: 'The Resources tab walks you through exactly how and why the Daily Paper works.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/daily-paper/resources`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
      {
        slug: 'history',
        title: 'Revisit past papers any time',
        desc: 'Your papers stack into a history of your alignment practice — scroll back and watch your growth.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/daily-paper`, { waitUntil: 'networkidle2' })
          await sleep(2500)
          return boxOfText(page, 'Filter', { tag: 'button' })
        },
      },
    ],
  },

  map: {
    areaLabel: 'MAP · My Alignment Plan',
    accent: '#39FF14',
    steps: [
      {
        slug: 'overview',
        title: 'Your MAP is your daily system',
        desc: 'Activate, Create, Connect, Attend — your conscious creation reps, organized into one daily rhythm.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle2' })
          await sleep(2500)
        },
      },
      {
        slug: 'log',
        title: 'Log your reps as you go',
        desc: 'Rituals auto-track when you use the platform, or tap Manual log to record them yourself.',
        run: async (page) => boxOfText(page, 'Manual log', { tag: 'button' }),
      },
      {
        slug: 'week',
        title: 'Zoom out to Week and Month views',
        desc: 'See your consistency at a glance and keep your streaks alive.',
        run: async (page) => {
          await clickText(page, 'Week', { exact: true })
          await sleep(2000)
        },
      },
      {
        slug: 'update',
        title: 'Customize your commitments',
        desc: 'Click Update to tune your rituals and custom commitments to match your season of life.',
        run: async (page) => {
          await page.goto(`${BASE_URL}/map/update`, { waitUntil: 'networkidle2' })
          await sleep(3000)
        },
      },
    ],
  },
}

// ---------- runner ----------

async function main() {
  const targets = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(AREAS)
  const { browser, page } = await launch()
  await ensureLoggedIn(page)

  for (const slug of targets) {
    const area = AREAS[slug]
    if (!area) {
      console.warn('unknown area', slug)
      continue
    }
    console.log(`\n=== ${area.areaLabel} ===`)
    const outDir = path.join(__dirname, 'output', 'raw', slug)
    fs.mkdirSync(outDir, { recursive: true })
    const meta = { areaLabel: area.areaLabel, accent: area.accent, steps: [] }

    for (const step of area.steps) {
      try {
        const box = await step.run(page)
        await cleanPage(page)
        await sleep(400)
        await page.screenshot({ path: path.join(outDir, step.slug + '.png') })
        meta.steps.push({ slug: step.slug, title: step.title, desc: step.desc, box: box || null })
        console.log('  ok:', step.slug, box ? '(highlighted)' : '')
      } catch (e) {
        console.warn('  FAIL:', step.slug, e.message)
        meta.steps.push({ slug: step.slug, title: step.title, desc: step.desc, box: null, error: e.message })
      }
    }
    fs.writeFileSync(path.join(outDir, 'steps.json'), JSON.stringify(meta, null, 2))
  }

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
