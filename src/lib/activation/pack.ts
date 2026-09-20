import JSZip from 'jszip'
import { launchBrowser } from '@/lib/pdf/browser'
import { getVisionCategoryLabel, type VisionCategoryKey } from '@/lib/design-system/vision-categories'
import type { ActivationRow } from '@/lib/activation/orchestrator'
import {
  ACTIVATION_PACK_LOGO_URL,
  buildActivationPackHtml,
} from '@/lib/activation/pack-html'

export interface PackSongTrack {
  audio_url: string
  cover_url: string | null
  title: string | null
}

export interface PackAssets {
  story: { content: string } | null
  incantation: { content: string } | null
  sparkQuery: { content: string; metadata?: { questions?: string[] } | null } | null
  song: {
    title: string
    lyrics: string | null
    tracks: PackSongTrack[]
  } | null
  audioTracks: Array<{ audio_url: string; section_key: string }>
  manifestations: Array<{ name: string; description: string | null; image_url: string | null }>
}

type CachedFile = { buffer: Buffer; contentType: string }

function safeFilePart(value: string, fallback = 'file'): string {
  const cleaned = value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return cleaned || fallback
}

function extFrom(url: string, contentType: string, fallback: string): string {
  const fromUrl = url.split('?')[0].split('.').pop()?.toLowerCase() || ''
  if (fromUrl && /^[a-z0-9]{2,5}$/.test(fromUrl) && fromUrl !== 'com') return fromUrl
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'
  if (contentType.includes('mpeg') || contentType.includes('mp3') || contentType.includes('mpeg3')) {
    return 'mp3'
  }
  return fallback
}

async function fetchBuffer(url: string): Promise<CachedFile | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) })
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    if (!buffer.length) return null
    return {
      buffer,
      contentType: res.headers.get('content-type') || 'application/octet-stream',
    }
  } catch {
    return null
  }
}

function sparkQuestionsFrom(assets: PackAssets): string[] {
  return (
    assets.sparkQuery?.metadata?.questions ||
    (assets.sparkQuery?.content ? assets.sparkQuery.content.split('\n').filter(Boolean) : [])
  )
}

function packBaseName(firstName: string | null, categoryLabel: string | null): string {
  const parts = [firstName, categoryLabel, 'Activation']
    .filter((part): part is string => !!part?.trim())
    .map((part) => safeFilePart(part))
  return parts.join('-') || 'Activation'
}

async function renderPackPdf(
  html: string,
  imageCache: Map<string, CachedFile>,
  browser: Awaited<ReturnType<typeof launchBrowser>>,
): Promise<Buffer> {
  const page = await browser.newPage()
  await page.setViewport({ width: 816, height: 1056 })

  if (imageCache.size > 0) {
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      const cached = imageCache.get(req.url())
      if (cached) {
        void req.respond({
          status: 200,
          contentType: cached.contentType,
          body: cached.buffer,
        })
      } else {
        void req.continue()
      }
    })
  }

  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 45000 })

  const pdfBuffer = await page.pdf({
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
        <div style="width:100%;text-align:center;font-size:9pt;color:#666;font-family:Poppins,system-ui,sans-serif;">
          <span class="pageNumber"></span>
        </div>
      `,
    margin: {
      top: '0.55in',
      right: '0.7in',
      bottom: '0.75in',
      left: '0.7in',
    },
  })

  return Buffer.from(pdfBuffer)
}

export async function buildActivationPack(params: {
  activation: ActivationRow & { created_at?: string; inspired_next_step?: string | null }
  assets: PackAssets
  firstName: string | null
}): Promise<{ zip: Buffer; filename: string }> {
  const { activation, assets, firstName } = params
  const categoryLabel = activation.category
    ? getVisionCategoryLabel(activation.category as VisionCategoryKey)
    : null
  const title = categoryLabel ? `${categoryLabel} Activation` : 'Your Activation'
  const createdDate = new Date(
    activation.created_at || activation.ready_at || Date.now(),
  ).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const sparkQuestions = sparkQuestionsFrom(assets)
  const boardCandidates = assets.manifestations.filter((item) => item.image_url)
  const songTracks = (assets.song?.tracks || []).filter((track) => track.audio_url)
  const songCoverUrl = songTracks.find((track) => track.cover_url)?.cover_url || null

  const urls = new Set<string>([ACTIVATION_PACK_LOGO_URL])
  for (const item of boardCandidates) {
    if (item.image_url) urls.add(item.image_url)
  }
  if (songCoverUrl) urls.add(songCoverUrl)
  for (const track of assets.audioTracks) {
    if (track.audio_url) urls.add(track.audio_url)
  }
  for (const track of songTracks) {
    urls.add(track.audio_url)
    if (track.cover_url) urls.add(track.cover_url)
  }

  const imageCache = new Map<string, CachedFile>()
  const fileCache = new Map<string, CachedFile>()
  const browserPromise = launchBrowser()
  browserPromise.catch(() => {})

  await Promise.all(
    Array.from(urls).map(async (url) => {
      const fetched = await fetchBuffer(url)
      if (!fetched) return
      fileCache.set(url, fetched)
      if (fetched.contentType.startsWith('image/') || url === ACTIVATION_PACK_LOGO_URL) {
        imageCache.set(url, fetched)
      }
    }),
  )

  const board = boardCandidates
    .filter((item) => item.image_url && imageCache.has(item.image_url))
    .map((item) => ({
      name: item.name,
      description: item.description,
      imageUrl: item.image_url as string,
    }))

  const html = buildActivationPackHtml({
    title,
    firstName,
    essence: activation.essence,
    createdDate,
    visionStatement: activation.vision_statement,
    story: assets.story?.content || null,
    incantation: assets.incantation?.content || null,
    sparkQuestions,
    songTitle: assets.song?.title || null,
    songLyrics: assets.song?.lyrics || null,
    songCoverUrl: songCoverUrl && imageCache.has(songCoverUrl) ? songCoverUrl : null,
    inspiredStep: activation.inspired_next_step || null,
    board,
  })

  const browser = await browserPromise
  let pdf: Buffer
  try {
    pdf = await renderPackPdf(html, imageCache, browser)
  } finally {
    await browser.close()
  }
  const base = packBaseName(firstName, categoryLabel)
  const zip = new JSZip()
  zip.file(`${base}.pdf`, pdf, { compression: 'DEFLATE', compressionOptions: { level: 6 } })

  const audioName = (sectionKey: string) => {
    if (sectionKey === 'life_i_choose') return 'Life-I-Choose'
    if (sectionKey === 'future_self_story') return 'Future-Self-Story'
    return safeFilePart(sectionKey, 'Audio')
  }

  for (const track of assets.audioTracks) {
    const file = fileCache.get(track.audio_url)
    if (!file) continue
    const ext = extFrom(track.audio_url, file.contentType, 'mp3')
    zip.file(`Audio/${audioName(track.section_key)}.${ext}`, file.buffer, { compression: 'STORE' })
  }

  const songFolderName = safeFilePart(assets.song?.title || 'Your-Song', 'Your-Song')
  songTracks.forEach((track, index) => {
    const audio = fileCache.get(track.audio_url)
    if (audio) {
      const ext = extFrom(track.audio_url, audio.contentType, 'mp3')
      const suffix = songTracks.length > 1 ? `-${index + 1}` : ''
      zip.file(`Audio/${songFolderName}${suffix}.${ext}`, audio.buffer, { compression: 'STORE' })
    }
    if (track.cover_url) {
      const cover = fileCache.get(track.cover_url)
      if (cover) {
        const ext = extFrom(track.cover_url, cover.contentType, 'jpg')
        const suffix = songTracks.length > 1 ? `-${index + 1}` : ''
        zip.file(`Audio/${songFolderName}-Cover${suffix}.${ext}`, cover.buffer, { compression: 'STORE' })
      }
    }
  })

  board.forEach((item, index) => {
    const file = fileCache.get(item.imageUrl)
    if (!file) return
    const ext = extFrom(item.imageUrl, file.contentType, 'jpg')
    const n = String(index + 1).padStart(2, '0')
    zip.file(
      `Vision-Board/${n}-${safeFilePart(item.name, 'Image')}.${ext}`,
      file.buffer,
      { compression: 'STORE' },
    )
  })

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  return { zip: zipBuffer, filename: `${base}.zip` }
}
