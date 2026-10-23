import { ImageResponse } from 'next/og'
import { SEO_PAGES, getSeoPage } from '@/content/seo/registry'

// Per-page Open Graph image for SEO pages: /og/<page path>
export const dynamicParams = false

export function generateStaticParams() {
  return SEO_PAGES.map(page => ({ slug: page.path.split('/') }))
}

const size = { width: 1200, height: 630 }

const LOGO_URL = 'https://media.vibrationfit.com/site-assets/brand/logo/logo-white.svg'

async function loadPoppins(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Poppins:wght@${weight}&text=${encodeURIComponent(text)}`
    ).then((res) => res.text())
    const fontUrl = css.match(/src: url\((.+?)\) format/)?.[1]
    if (!fontUrl) return null
    return await fetch(fontUrl).then((res) => res.arrayBuffer())
  } catch {
    return null
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const page = getSeoPage((await params).slug.join('/'))
  const headline = page?.h1 ?? 'Conscious Creation on Autopilot'
  const eyebrow = page?.eyebrow ?? 'Vibration Fit'

  const [logoSvg, poppinsBold] = await Promise.all([
    fetch(LOGO_URL).then((res) => res.text()),
    loadPoppins(700, `${headline}${eyebrow}`),
  ])
  const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          backgroundColor: '#0a0a0a',
          backgroundImage:
            'radial-gradient(circle at 90% 120%, rgba(57, 255, 20, 0.22) 0%, rgba(10, 10, 10, 0) 55%), radial-gradient(circle at 0% -20%, rgba(0, 255, 255, 0.12) 0%, rgba(10, 10, 10, 0) 50%)',
        }}
      >
        <div style={{ display: 'flex', color: '#39FF14', fontSize: 26, fontWeight: 700, letterSpacing: 6, textTransform: 'uppercase' }}>
          {eyebrow}
        </div>
        <div style={{ display: 'flex', color: '#FFFFFF', fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-1px' }}>
          {headline}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUri} alt="Vibration Fit" width={405} height={36} />
      </div>
    ),
    {
      ...size,
      fonts: poppinsBold ? [{ name: 'Poppins', data: poppinsBold, weight: 700, style: 'normal' }] : undefined,
    }
  )
}
