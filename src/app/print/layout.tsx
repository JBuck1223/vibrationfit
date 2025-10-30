// Print Layout - No app chrome, just pure HTML for PDF rendering
// This ensures print pages don't inherit headers, footers, or sidebars
// Path: /src/app/print/layout.tsx

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Print View - VibrationFit",
  description: "Printable vision document",
  robots: 'noindex, nofollow', // Don't index print pages
}

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Return clean HTML with no app chrome - just the content
  // The print page itself renders the full HTML structure
  return <>{children}</>
}

