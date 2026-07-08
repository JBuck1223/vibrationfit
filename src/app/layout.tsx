import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import '@/styles/brand.css'
import { GlobalLayoutShell } from '@/components/GlobalLayoutShell'
import { AuthProvider } from '@/components/AuthProvider'
import { TrackingProvider } from '@/components/TrackingProvider'
import { AppErrorHandling } from '@/components/AppErrorHandling'
import { PixelScripts } from '@/components/PixelScripts'
import { Toaster } from 'sonner'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import { ReferralBanner } from '@/components/ReferralBanner'
import { GlobalAudioPlayerShell } from '@/lib/design-system/components'

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://vibrationfit.com'),
  title: {
    template: '%s | Vibration Fit',
    default: 'Vibration Fit',
  },
  description: "The SaaS platform for conscious creation. Build your vision, align daily, and actualize your dreams.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: "Vibration Fit - Conscious Creation on Autopilot",
    description: "The SaaS platform for conscious creation. Build your vision, align daily, and actualize your dreams.",
    url: 'https://vibrationfit.com',
    siteName: 'Vibration Fit',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Vibration Fit - Conscious Creation on Autopilot",
    description: "The SaaS platform for conscious creation. Build your vision, align daily, and actualize your dreams.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://media.vibrationfit.com" />
      </head>
      <body
        className="antialiased"
        suppressHydrationWarning={true}
      >
        <PixelScripts />
        <ImpersonationBanner />
        <ReferralBanner />
        <AuthProvider>
          <TrackingProvider>
          <AppErrorHandling>
          <GlobalLayoutShell>
            {children}
          </GlobalLayoutShell>
          <GlobalAudioPlayerShell />
          </AppErrorHandling>
          </TrackingProvider>
          <Toaster 
            theme="dark"
            position="top-right"
            richColors
            expand
            visibleToasts={5}
            gap={8}
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#FFFFFF',
                border: '1px solid #333',
                zIndex: 99999,
                wordBreak: 'break-word',
                fontSize: '14px',
              },
              className: 'toast',
              duration: 5000,
            }}
            offset="16px"
          />
        </AuthProvider>
      </body>
    </html>
  );
}
