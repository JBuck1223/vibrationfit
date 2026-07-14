'use client'

import { Download } from 'lucide-react'
import { Button } from '@/lib/design-system'

const PDF_URL = '/downloads/from-100k-in-debt-to-100k-in-the-bank.pdf'

// Client component so the <a> element is created on both server and client
// renders identically. Passing an <a> into `Button asChild` from a Server
// Component causes a hydration mismatch (RSC children can arrive as lazy
// references, failing Button's isValidElement check on one side only).
export function DownloadButton({ label = 'Download the Free PDF' }: { label?: string }) {
  return (
    <Button asChild variant="primary" size="lg">
      <a href={PDF_URL} download>
        <Download className="mr-2 h-5 w-5" />
        {label}
      </a>
    </Button>
  )
}
