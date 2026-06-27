import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#39FF14]/10">
        <Compass className="h-8 w-8 text-[#39FF14]" aria-hidden />
      </div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-[#39FF14]">404</p>
      <h1 className="mt-2 text-2xl font-bold text-white">This page wandered off</h1>
      <p className="mt-3 max-w-md text-sm text-neutral-400">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back
        on track.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-full bg-[#39FF14] px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/support"
          className="inline-flex items-center justify-center rounded-full border border-[#333] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Get Help
        </Link>
      </div>
    </div>
  )
}
