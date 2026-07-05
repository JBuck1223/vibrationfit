import { ImageResponse } from 'next/og'

export const alt = 'Vibration Fit - Conscious Creation on Autopilot'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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

export default async function Image() {
  const tagline = 'Conscious Creation on Autopilot'

  const [logoSvg, poppinsSemiBold] = await Promise.all([
    fetch(LOGO_URL).then((res) => res.text()),
    loadPoppins(600, tagline),
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
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage:
            'radial-gradient(circle at 50% 120%, rgba(57, 255, 20, 0.18) 0%, rgba(10, 10, 10, 0) 55%), radial-gradient(circle at 50% -20%, rgba(0, 255, 255, 0.10) 0%, rgba(10, 10, 10, 0) 50%)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUri} alt="Vibration Fit" width={720} height={64} />
        <div
          style={{
            width: 720,
            height: 4,
            borderRadius: 2,
            marginTop: 56,
            marginBottom: 48,
            backgroundImage: 'linear-gradient(90deg, #39FF14 0%, #00FFFF 100%)',
          }}
        />
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 54,
            fontWeight: 600,
            letterSpacing: '-0.5px',
            textAlign: 'center',
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: poppinsSemiBold
        ? [
            {
              name: 'Poppins',
              data: poppinsSemiBold,
              weight: 600,
              style: 'normal',
            },
          ]
        : undefined,
    }
  )
}
