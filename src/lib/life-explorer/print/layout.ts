/**
 * VF print brand — shared shell for every Life Explorer printable.
 *
 * Ink-minimal by design: white paper, near-black text, brand presence
 * through hairline neon-green rules and thin strokes — never fills.
 * Big drawing frames and generous write-on lines (kid pencil space is
 * free; ink is not). The browser's print dialog produces the PDF, so
 * every printable is always current — no static files to regenerate.
 */

export function esc(s: string | null | undefined): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const PRINT_CSS = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  @page { size: letter; margin: 14mm; }
  body {
    font-family: var(--font-poppins, 'Poppins'), -apple-system, 'Segoe UI', Roboto, sans-serif;
    color: #1a1a1a;
    background: #fff;
    margin: 0;
    line-height: 1.5;
    font-size: 12pt;
  }
  .sheet { max-width: 720px; margin: 0 auto; padding: 24px; }
  .page { break-after: page; page-break-after: always; padding-bottom: 18px; }
  .page:last-child { break-after: auto; page-break-after: auto; }

  .brandline {
    display: flex; justify-content: space-between; align-items: baseline;
    border-bottom: 2px solid #39FF14; padding-bottom: 6px; margin-bottom: 18px;
  }
  .wordmark {
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    color: #6b6b6b; font-weight: 600;
  }
  .contextmark { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: #9a9a9a; }

  h1 { font-size: 26pt; line-height: 1.15; margin: 0 0 6px; font-weight: 700; }
  h2 { font-size: 15pt; margin: 22px 0 8px; font-weight: 600; }
  .kicker { font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase; color: #6b6b6b; margin: 0 0 4px; }
  .lede { font-size: 12.5pt; color: #333; margin: 2px 0 0; }
  .hint { font-size: 9.5pt; color: #8a8a8a; }

  .rule { border: 0; border-top: 1px solid #39FF14; margin: 16px 0; }

  /* Write-on lines: generous height for early writers, hairline ink. */
  .lines { margin: 10px 0; }
  .lines .line { height: 34px; border-bottom: 1px solid #c9c9c9; }
  .lines.tight .line { height: 26px; }

  /* Drawing frames: the biggest ink saver — one thin border, lots of space. */
  .frame {
    border: 1px solid #cfcfcf; border-radius: 6px;
    position: relative; margin: 10px 0;
  }
  .frame .frame-label {
    position: absolute; top: -8px; left: 12px; background: #fff; padding: 0 6px;
    font-size: 8.5pt; letter-spacing: 0.12em; text-transform: uppercase; color: #8a8a8a;
  }

  /* Cut-out cards (vocabulary, decodable words): dashed scissor lines. */
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin: 10px 0; }
  .card {
    border: 1px dashed #bbb; padding: 18px 8px; text-align: center;
    font-size: 16pt; font-weight: 600; letter-spacing: 0.02em;
  }
  .card .card-sub { display: block; font-size: 8pt; font-weight: 400; color: #9a9a9a; margin-top: 4px; }

  .checklist { list-style: none; padding: 0; margin: 8px 0; }
  .checklist li { display: flex; gap: 10px; align-items: flex-start; margin: 8px 0; font-size: 11.5pt; }
  .checklist .box {
    flex: none; width: 14px; height: 14px; border: 1.5px solid #1a1a1a;
    border-radius: 3px; margin-top: 4px;
  }

  .steps { padding-left: 20px; margin: 8px 0; }
  .steps li { margin: 6px 0; }

  table.grid { width: 100%; border-collapse: collapse; margin: 10px 0; }
  table.grid th, table.grid td { border: 1px solid #cfcfcf; padding: 10px 8px; text-align: left; }
  table.grid th {
    font-size: 8.5pt; letter-spacing: 0.12em; text-transform: uppercase;
    color: #6b6b6b; font-weight: 600; background: none;
  }
  table.grid td { height: 34px; }

  .footer {
    display: flex; justify-content: space-between; align-items: baseline;
    border-top: 1px solid #e3e3e3; margin-top: 22px; padding-top: 6px;
  }
  .footer .fill { font-size: 9pt; color: #6b6b6b; }
  .footer .fill span { display: inline-block; border-bottom: 1px solid #c9c9c9; min-width: 110px; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }

  .certificate { text-align: center; padding: 28px 20px; border: 2px solid #39FF14; border-radius: 10px; }
  .certificate .big-name { font-size: 24pt; border-bottom: 1px solid #c9c9c9; display: inline-block; min-width: 320px; padding: 8px 16px 2px; }

  /* Screen-only toolbar; disappears on paper. */
  .toolbar {
    position: sticky; top: 0; background: #fff; border-bottom: 1px solid #e3e3e3;
    padding: 10px 24px; display: flex; justify-content: space-between; align-items: center;
  }
  .toolbar button {
    background: #1a1a1a; color: #fff; border: 0; border-radius: 8px;
    padding: 8px 18px; font-size: 10.5pt; font-weight: 600; cursor: pointer;
  }
  @media print { .toolbar { display: none; } .sheet { padding: 0; max-width: none; } }
`

export function brandLine(context: string): string {
  return `<div class="brandline">
    <span class="wordmark">Vibration Fit — Life Explorer</span>
    <span class="contextmark">${esc(context)}</span>
  </div>`
}

export function pageFooter(expeditionTitle: string): string {
  return `<div class="footer">
    <span class="fill">Explorer: <span>&nbsp;</span></span>
    <span class="fill">Date: <span>&nbsp;</span></span>
    <span class="contextmark">${esc(expeditionTitle)}</span>
  </div>`
}

export function writeLines(count: number, tight = false): string {
  return `<div class="lines${tight ? ' tight' : ''}">${'<div class="line"></div>'.repeat(count)}</div>`
}

export function drawFrame(label: string, heightPx: number): string {
  return `<div class="frame" style="height:${heightPx}px"><span class="frame-label">${esc(label)}</span></div>`
}

export function cutCards(words: Array<{ word: string; sub?: string }>): string {
  return `<div class="cards">${words
    .map(
      (w) =>
        `<div class="card">${esc(w.word)}${w.sub ? `<span class="card-sub">${esc(w.sub)}</span>` : ''}</div>`
    )
    .join('')}</div>`
}

export function checklist(items: string[]): string {
  return `<ul class="checklist">${items
    .map((i) => `<li><span class="box"></span><span>${esc(i)}</span></li>`)
    .join('')}</ul>`
}

/** Full HTML document with the shared print shell and a print button. */
export function printShell(input: { title: string; pages: string[] }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(input.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>${PRINT_CSS}</style>
</head>
<body>
<div class="toolbar">
  <span class="wordmark">Vibration Fit — Life Explorer · Printable</span>
  <button onclick="window.print()">Print</button>
</div>
<div class="sheet">
${input.pages.map((p) => `<div class="page">${p}</div>`).join('\n')}
</div>
</body>
</html>`
}
