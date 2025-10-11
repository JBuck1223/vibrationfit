import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@/styles/brand.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VibrationFit - Above the Green Line",
  description: "The SaaS platform for conscious creation. Build your vision, align daily, and actualize your dreams.",
  icons: {
    icon: ASSETS.brand.icon,
    shortcut: ASSETS.brand.icon,
    apple: ASSETS.brand.icon,
  },
  openGraph: {
    title: "VibrationFit - Above the Green Line",
    description: "The SaaS platform for conscious creation. Build your vision, align daily, and actualize your dreams.",
    images: [
      {
        url: ASSETS.brand.logo,
        width: 1200,
        height: 630,
        alt: "VibrationFit Logo",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Header />
        {children}
        <Footer />
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1F1F1F',
              color: '#FFFFFF',
              border: '1px solid #333',
            },
            className: 'toast',
          }}
        />
      </body>
    </html>
  );
}
