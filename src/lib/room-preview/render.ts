import { styles } from './styles'
import { steps, tools } from './content'
const rooms = [
  'home',
  'begin',
  'viva',
  'listen',
  'capture',
  'tribe',
  'tools',
  'account',
] as const
export type PreviewRoom = (typeof rooms)[number]
export const isPreviewRoom = (value: string): value is PreviewRoom =>
  rooms.some((room) => room === value)
const escape = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
const href = (room: string) => `/room/${room === 'home' ? 'dashboard' : room}`
const arrow = '<span aria-hidden="true">↗</span>'
const tabs = [
  ['home', 'Home', '⌂'],
  ['viva', 'VIVA', '✧'],
  ['listen', 'Listen', '♫'],
  ['capture', 'Capture', '✎'],
  ['tribe', 'Tribe', '◎'],
] as const
const card = (name: string, description: string) =>
  `<article class="room-panel room-tool" data-search="${escape(name.toLowerCase() + ' ' + description.toLowerCase())}"><button class="concept-tool" data-demo="${escape(name)}"><span class="concept-symbol">${arrow}</span><h3>${escape(name)}</h3><p>${escape(description)}</p></button></article>`
const toolGrid = (room?: string) =>
  `<div class="room-tool-grid">${tools
    .filter((t) => !room || t[1] === room)
    .map((t) => card(t[0], t[2]))
    .join('')}</div>`
function beginJourney(full: boolean) {
  const journey = `<div class="begin-full-journey"><div class="room-section-heading"><h2>Your full Begin journey</h2><span>0/11 complete · sample</span></div>${['Start', 'Vision', 'Community', 'Plan', 'Completion'].map((phase) => `<section class="begin-phase"><h3 class="room-eyebrow">${phase}</h3><ol class="begin-step-grid">${steps.map((step, i) => (step[2] !== phase ? '' : `<li class="begin-step-card" data-status="${i === 0 ? 'current' : 'locked'}"><div class="begin-step-heading"><span class="room-step">${i + 1}</span><span class="begin-step-status">${i === 0 ? 'Your next step' : 'Up next'}</span></div><h4>${step[0]}</h4><p>${step[1]}</p><button class="begin-step-action" data-demo="${step[0]}">Preview step ${i + 1} ${arrow}</button></li>`)).join('')}</ol></section>`).join('')}</div>`
  return `<section class="room-panel room-begin"><div class="room-feature"><p class="room-eyebrow">BEGIN · YOUR LIFE ACTIVATION</p><h2>Your next chapter<br>starts here.</h2><p class="room-subtitle">Eleven steps. Your own pace. A life that feels more like you.</p><a class="room-primary" href="${href('begin')}">Explore your Begin journey ${arrow}</a><progress class="room-progress" aria-label="Sample Begin progress" value="0" max="11"></progress></div>${full ? journey : ''}</section>`
}
export function renderRoomPreview(room: PreviewRoom) {
  const titles: Record<PreviewRoom, [string, string]> = {
    home: ['Welcome home.', 'A little space for the life you’re creating.'],
    begin: [
      'Begin your Life Activation.',
      'Your full journey, one step at a time.',
    ],
    viva: [
      'A little clarity. A little possibility.',
      'A place to think, reflect and move forward.',
    ],
    listen: [
      'Find your frequency.',
      'Your vision, your voice, your soundtrack.',
    ],
    capture: [
      'Make room for the moment.',
      'Thoughts, gratitude and the life unfolding around you.',
    ],
    tribe: [
      'Better, together.',
      'Share your wins. Find your people. Keep growing.',
    ],
    tools: [
      'Your space. Your tools.',
      'Everything you need, right where you need it.',
    ],
    account: [
      'Make yourself at home.',
      'Your preferences, your membership, your space.',
    ],
  }
  let content = ''
  if (room === 'home')
    content = `${beginJourney(false)}<div class="room-section-heading"><h2>Your quick actions</h2><a href="${href('tools')}">Explore tools ${arrow}</a></div><div class="room-tool-grid">${[
      ['Daily Paper', 'Set the tone for today'],
      ['Life Vision Audio', 'Return to your vision'],
      ['Journal', 'Capture what’s on your mind'],
      ['MAP', 'Your next small step'],
      ['VIVA', 'Find a little clarity'],
      ['Vibe Tribe', 'Connect with your people'],
    ]
      .map((t) => card(t[0], t[1]))
      .join(
        '',
      )}</div><div class="room-section-heading"><h2>Pick up where you left off</h2><span>Sample activity</span></div><div class="room-panel room-listening"><div><p class="room-eyebrow">CONTINUE LISTENING</p><h3>My Life Vision</h3><p>Sample listening position · 04:32</p></div><button class="room-play" data-demo="Listening resume" aria-label="Preview listening resume">▶</button></div><div class="room-return-grid">${card('Your last journal entry', 'A moment worth remembering')}${card('Your latest creation', 'The life I’m creating')}</div>`
  else if (room === 'begin') content = beginJourney(true)
  else if (room === 'viva')
    content = `<section class="room-panel room-feature"><p class="room-eyebrow">YOUR VIVA ROOM</p><h2>What’s on your mind?</h2><p class="room-subtitle">Start with a thought. We’ll find the next step together.</p><div class="concept-prompts">${['Help me find clarity', 'Explore my vision', 'Reflect on today'].map((t) => `<button class="room-pin" data-demo="${t}">${t}</button>`).join('')}</div><form id="concept-chat" class="room-search"><input aria-label="Sample VIVA message" placeholder="Ask VIVA…"><button type="submit" aria-label="Preview send">${arrow}</button></form><p class="room-pin-hint">Concept only. Messages are not sent or saved.</p></section>`
  else {
    content =
      room === 'tools'
        ? '<label class="room-search"><span aria-hidden="true">⌕</span><input id="tool-search" type="search" placeholder="Find a tool, practice or place…" aria-label="Search concept tools"></label><p class="room-pin-hint">All tools, together in one place.</p>'
        : ''
    content += toolGrid(room === 'tools' ? undefined : room)
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${room === 'begin' ? 'Begin' : titles[room][0]} · Isolated room concept</title><style>${styles}
*{box-sizing:border-box}body{margin:0;background:#0a151b;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}h1,h2,h3,h4,p,ol{margin:0}ol{padding:0}a{color:inherit;text-decoration:none}button,input{font:inherit;color:inherit}button{cursor:pointer;background:none;border:0}input{border:0}button:focus-visible,a:focus-visible,input:focus-visible{outline:2px solid #39ff14;outline-offset:4px}.concept-tool{width:100%;height:100%;display:block;padding:24px;text-align:left}.concept-symbol{font-size:24px;color:#b8e7ae}.concept-prompts{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}.concept-prompts .room-pin{margin:0}.concept-notice{margin:20px 0 0;font-size:12px;color:#dde8e4}.room-nav .nav-icon{font-size:24px;line-height:1}.room-section-heading>span{font-size:11px;color:#c3d0ce}.room-header>div{display:flex;gap:10px}.room-feature h2{margin-top:14px}.room-eyebrow{margin-bottom:14px!important}.begin-step-heading+.begin-step-card h4{margin-top:18px}.room-feature>progress{margin-top:28px}.room-search input{min-width:0}.concept-dialog{color:white;background:#13252e;border:1px solid #ffffff40;border-radius:24px;padding:28px;max-width:min(90vw,500px)}.concept-dialog::backdrop{background:#0009;backdrop-filter:blur(8px)}.concept-dialog p{line-height:1.7;margin-top:16px}.concept-dialog .room-primary{margin-top:24px}.begin-step-card h4{margin:18px 0 10px}.begin-phase h3{margin-bottom:14px!important}[hidden]{display:none!important}
</style></head><body><main class="member-room" style="--room-image:url('https://media.vibrationfit.com/site-assets/mobile/rooms/coastal-home-20261021.webp')"><div class="room-content"><header class="room-header"><a href="${href('home')}" aria-label="Concept Home"><img src="https://media.vibrationfit.com/site-assets/brand/logo/logo-white.svg" alt="Vibration Fit" width="210" height="40"></a><div><a class="room-icon-button" href="${href('tools')}" aria-label="Concept tools">⌕</a><a class="room-icon-button" href="${href('account')}" aria-label="Concept account">◎</a></div></header><p class="concept-notice">Isolated design concept · Sample content · No changes to your account</p><div class="room-heading"><p class="room-eyebrow">${room === 'begin' ? 'YOUR BEGIN JOURNEY' : 'YOUR SPACE TO BECOME'}</p><h1>${titles[room][0]}</h1><p class="room-subtitle">${titles[room][1]}</p></div>${content}</div></main><nav class="room-nav" aria-label="Concept rooms">${tabs.map((t) => `<a href="${href(t[0])}"${(room === 'begin' ? 'home' : room) === t[0] ? ' aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${t[2]}</span><span>${t[1]}</span></a>`).join('')}</nav><dialog class="concept-dialog" id="concept-dialog"><h2 id="concept-title">Concept preview</h2><p>This is an isolated visual concept. The existing feature and its saved progress are unchanged. This button does not open or modify the live flow.</p><button class="room-primary" id="close-dialog">Back to concept</button></dialog><script>
const dialog=document.getElementById('concept-dialog');document.querySelectorAll('[data-demo]').forEach(button=>button.addEventListener('click',()=>{document.getElementById('concept-title').textContent=button.dataset.demo;dialog.showModal()}));document.getElementById('close-dialog').addEventListener('click',()=>dialog.close());document.getElementById('tool-search')?.addEventListener('input',event=>{const value=event.target.value.toLowerCase();document.querySelectorAll('[data-search]').forEach(card=>card.hidden=!card.dataset.search.includes(value))});document.getElementById('concept-chat')?.addEventListener('submit',event=>{event.preventDefault();document.getElementById('concept-title').textContent='VIVA conversation preview';dialog.showModal()});
</script></body></html>`
}
