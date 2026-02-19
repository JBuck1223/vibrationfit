import type { Metadata } from "next";
import "./globals.css";
import '@/styles/brand.css'
import { GlobalLayout } from '@/components/GlobalLayout'
import { AuthProvider } from '@/components/AuthProvider'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: {
    template: '%s | VibrationFit',
    default: 'Vibration Fit',
  },
  description: "The SaaS platform for conscious creation. Build your vision, align daily, and actualize your dreams.",
  // Let Next.js automatically use the favicon.ico from the app directory
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
        <AuthProvider>
          <GlobalLayout>
            {/* <IntensiveBar /> */}
            {children}
          </GlobalLayout>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#1F1F1F',
                color: '#FFFFFF',
                border: '1px solid #333',
                zIndex: 99999,
              },
              className: 'toast',
            }}
            offset="16px"
          />
        </AuthProvider>
      </body>
    </html>
  );
}
