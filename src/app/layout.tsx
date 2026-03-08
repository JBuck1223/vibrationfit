import type { Metadata, Viewport } from "next";
import "./globals.css";
import '@/styles/brand.css'
import { GlobalLayout } from '@/components/GlobalLayout'
import { AuthProvider } from '@/components/AuthProvider'
import { TrackingProvider } from '@/components/TrackingProvider'
import { AppErrorHandling } from '@/components/AppErrorHandling'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'
import { PixelScripts } from '@/components/PixelScripts'
import { Toaster } from 'sonner'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    template: '%s | VibrationFit',
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
    title: "Vibration Fit - Above the Green Line",
    description: "The SaaS platform for conscious creation. Build your vision, align daily, and actualize your dreams.",
    images: [
      {
        url: ASSETS.brand.logo,
        width: 1200,
        height: 630,
        alt: "Vibration Fit Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body
        className="antialiased"
        style={{ fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}
        suppressHydrationWarning={true}
      >
        <PixelScripts />
        <AuthProvider>
          <TrackingProvider>
          <AppErrorHandling>
          <GlobalLayout>
            {children}
          </GlobalLayout>
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
