import { ACTIVATION_COPY } from '@/lib/activation/copy'

const LOGO_URL = 'https://media.vibrationfit.com/site-assets/brand/logo/black-bar-top-of-vfit.png'

export interface ActivationPackContent {
  title: string
  firstName: string | null
  essence: string | null
  createdDate: string
  visionStatement: string | null
  story: string | null
  incantation: string | null
  sparkQuestions: string[]
  songTitle: string | null
  songLyrics: string | null
  songCoverUrl: string | null
  inspiredStep: string | null
  board: Array<{ name: string; description: string | null; imageUrl: string }>
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function paragraphs(text: string, className = 'body'): string {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p class="${className}">${escapeHtml(p)}</p>`)
    .join('')
}

export function buildActivationPackHtml(content: ActivationPackContent): string {
  const copy = ACTIVATION_COPY.immersion
  const byline = content.firstName
    ? `Created for ${escapeHtml(content.firstName)}`
    : 'Created with VIVA'
  const title = escapeHtml(content.title)

  const stops = copy.mapStops
    .map(
      (stop, i) => `
      <div class="stop">
        <span class="stop-num">${i + 1}</span>
        <div>
          <p class="stop-title">${escapeHtml(stop.title)}</p>
          <p class="stop-use">${escapeHtml(stop.use)}</p>
        </div>
      </div>`,
    )
    .join('')

  const board = content.board.length
    ? `<section>
        <h2>${escapeHtml(copy.images)}</h2>
        <p class="hint">${escapeHtml(copy.imagesHint)}</p>
        <div class="board">
          ${content.board
            .map(
              (item) => `
            <figure class="board-card">
              <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" />
              <figcaption>
                <strong>${escapeHtml(item.name)}</strong>
                ${item.description ? `<span>${escapeHtml(item.description)}</span>` : ''}
              </figcaption>
            </figure>`,
            )
            .join('')}
        </div>
      </section>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
  <style>
    @page { size: Letter; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #1f1f1f;
      font-family: 'Poppins', system-ui, sans-serif;
    }
    body { font-size: 11.5pt; line-height: 1.65; }
    p { margin: 0 0 10pt; orphans: 3; widows: 3; }
    .cover {
      min-height: 9.2in;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      page-break-after: always;
    }
    .eyebrow {
      font-size: 9pt;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
      margin-bottom: 18pt;
    }
    .cover h1 {
      font-size: 34pt;
      line-height: 1.15;
      font-weight: 700;
      margin: 0;
      color: #111;
    }
    .cover-rule {
      width: 72pt;
      height: 3pt;
      background: #39FF14;
      margin: 22pt auto 18pt;
    }
    .essence {
      font-size: 16pt;
      font-style: italic;
      color: #333;
      margin: 0;
      max-width: 28rem;
    }
    .cover-meta {
      margin-top: 28pt;
      font-size: 12pt;
      color: #444;
    }
    .cover-meta strong { color: #111; }
    .cover-logo { margin-top: 48pt; }
    .cover-logo img { max-width: 240px; height: auto; }
    h2 {
      font-size: 16pt;
      font-weight: 700;
      color: #111;
      margin: 0 0 8pt;
      padding-bottom: 6pt;
      border-bottom: 2.5pt solid #39FF14;
      page-break-after: avoid;
    }
    .hint {
      font-size: 9.5pt;
      color: #666;
      margin: 0 0 14pt;
    }
    section {
      margin: 0 0 28pt;
      page-break-inside: auto;
    }
    .body { text-align: justify; }
    .incantation .body {
      font-style: italic;
      font-size: 13pt;
      line-height: 1.7;
      text-align: center;
    }
    .lyrics-body {
      white-space: pre-wrap;
      text-align: center;
      font-size: 12pt;
      line-height: 1.8;
      margin: 0;
    }
    .song-cover {
      width: 180pt;
      height: 180pt;
      object-fit: cover;
      border-radius: 8pt;
      display: block;
      margin: 0 auto 16pt;
    }
    .sparks {
      margin: 0;
      padding-left: 1.2em;
    }
    .sparks li {
      margin: 0 0 10pt;
      padding-left: 4pt;
    }
    .stops {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12pt 16pt;
      margin-top: 6pt;
    }
    .stop {
      display: flex;
      gap: 10pt;
      padding: 10pt 12pt;
      border: 1pt solid #e8e8e8;
      border-radius: 8pt;
      page-break-inside: avoid;
    }
    .stop-num {
      flex-shrink: 0;
      width: 18pt;
      font-weight: 700;
      color: #199D67;
    }
    .stop-title { font-weight: 600; margin: 0 0 2pt; }
    .stop-use { font-size: 9.5pt; color: #555; margin: 0; }
    .board {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12pt;
      margin-top: 8pt;
    }
    .board-card {
      margin: 0;
      page-break-inside: avoid;
    }
    .board-card img {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      border-radius: 6pt;
      display: block;
    }
    .board-card figcaption {
      margin-top: 6pt;
      font-size: 8.5pt;
      color: #333;
    }
    .board-card figcaption strong {
      display: block;
      font-size: 9.5pt;
      margin-bottom: 2pt;
    }
    .board-card figcaption span { color: #666; }
  </style>
</head>
<body>
  <header class="cover">
    <div class="eyebrow">Vibration Fit</div>
    <h1>${title}</h1>
    <div class="cover-rule"></div>
    ${content.essence ? `<p class="essence">${escapeHtml(content.essence)}</p>` : ''}
    <div class="cover-meta">
      <div>${byline}</div>
      <div>${escapeHtml(content.createdDate)}</div>
    </div>
    <div class="cover-logo">
      <img src="${LOGO_URL}" alt="Vibration Fit" />
    </div>
  </header>

  <section>
    <h2>${escapeHtml(copy.mapTitle)}</h2>
    ${copy.mapLead.map((para) => `<p class="hint">${escapeHtml(para)}</p>`).join('')}
    <div class="stops">${stops}</div>
  </section>

  ${
    content.visionStatement
      ? `<section>
    <h2>${escapeHtml(copy.lifeIChoose)}</h2>
    <p class="hint">${escapeHtml(copy.lifeIChooseHint)}</p>
    ${paragraphs(content.visionStatement)}
  </section>`
      : ''
  }

  ${
    content.story
      ? `<section>
    <h2>${escapeHtml(copy.story)}</h2>
    <p class="hint">${escapeHtml(copy.storyHint)}</p>
    ${paragraphs(content.story)}
  </section>`
      : ''
  }

  ${
    content.incantation
      ? `<section class="incantation">
    <h2>${escapeHtml(copy.incantation)}</h2>
    <p class="hint">${escapeHtml(copy.incantationHint)}</p>
    ${paragraphs(content.incantation)}
  </section>`
      : ''
  }

  ${
    content.sparkQuestions.length
      ? `<section>
    <h2>${escapeHtml(copy.sparkQuery)}</h2>
    <p class="hint">${escapeHtml(copy.sparkHint)}</p>
    <ol class="sparks">
      ${content.sparkQuestions.map((q) => `<li>${escapeHtml(q)}</li>`).join('')}
    </ol>
  </section>`
      : ''
  }

  ${
    content.songLyrics
      ? `<section class="lyrics">
    <h2>${escapeHtml(content.songTitle || copy.song)}</h2>
    <p class="hint">${escapeHtml(copy.songHint)}</p>
    ${content.songCoverUrl ? `<img class="song-cover" src="${escapeHtml(content.songCoverUrl)}" alt="${escapeHtml(content.songTitle || copy.song)}" />` : ''}
    <p class="lyrics-body">${escapeHtml(content.songLyrics)}</p>
  </section>`
      : ''
  }

  ${
    content.inspiredStep
      ? `<section>
    <h2>${escapeHtml(copy.inspiredTitle)}</h2>
    ${paragraphs(content.inspiredStep)}
  </section>`
      : ''
  }

  ${board}
</body>
</html>`
}

export const ACTIVATION_PACK_LOGO_URL = LOGO_URL
