'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'
import type { ResolvedTheme } from '@/lib/app-shell/theme-types'

/**
 * The frame every auth page shares: the default theme's picture, blurred and
 * washed like the app shell's backdrop, with one violet glass card in the
 * middle. Signed-out visitors get the default theme from the theme API, so
 * the sign-in screen already looks like the app they are about to enter.
 */
export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  const [backdrop, setBackdrop] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/app-shell/theme', { credentials: 'include', cache: 'no-store' })
      .then((res) => (res.ok ? (res.json() as Promise<ResolvedTheme | { theme: null; images: Record<string, string> }>) : null))
      .then((data) => {
        if (cancelled || !data) return
        const images = data.images as Partial<Record<string, string>>
        setBackdrop(images['area.backdrop'] ?? images['home.hero'] ?? null)
      })
      .catch(() => {
        // No picture: the violet gradient underneath is the screen.
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="relative isolate flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-8">
      {/* Backdrop: the picture blurred into soft bokeh, then a wash so the card and text read. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[linear-gradient(180deg,#2a2238_0%,#1a1426_100%)]">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{
            backgroundImage: backdrop ? `url("${backdrop}")` : undefined,
            opacity: backdrop ? 1 : 0,
            filter: 'blur(10px) saturate(125%) brightness(0.8)',
            transform: 'scale(1.06)',
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0.35)_50%,rgba(0,0,0,0.55)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(191,0,255,0.18),transparent_55%),radial-gradient(ellipse_at_85%_90%,rgba(57,255,20,0.10),transparent_50%)]" />
      </div>

      <div
        className={cn(
          'vf-glass w-full max-w-md rounded-[28px] border border-white/[0.14] p-6 text-white sm:p-8',
          'bg-[linear-gradient(180deg,rgba(44,36,60,0.62)_0%,rgba(22,18,32,0.74)_100%)]',
          'shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150',
          className,
        )}
      >
        <div className="mb-7 text-center">
          <Image src={ASSETS.brand.logoWhite} alt="Vibration Fit" width={453} height={40} className="mx-auto h-8 w-auto" priority />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-white/65">{subtitle}</p> : null}
        </div>
        {children}
        {footer ? <div className="mt-6 text-center text-sm text-white/65">{footer}</div> : null}
      </div>
    </div>
  )
}

/** A glass text field for auth forms: round, translucent, white type. */
export function AuthField({
  label,
  trailing,
  className,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; trailing?: React.ReactNode }) {
  const fieldId = id ?? `auth-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <label htmlFor={fieldId} className="block">
      <span className="mb-1.5 block px-1 text-xs font-medium text-white/65">{label}</span>
      <span className="relative block">
        <input
          id={fieldId}
          className={cn(
            'h-12 w-full rounded-full border border-white/15 bg-white/[0.08] px-5 text-[15px] text-white outline-none',
            'placeholder:text-white/40 transition-colors focus:border-[#39FF14]/60 focus:bg-white/[0.12]',
            trailing && 'pr-12',
            className,
          )}
          {...props}
        />
        {trailing ? <span className="absolute inset-y-0 right-2 flex items-center">{trailing}</span> : null}
      </span>
    </label>
  )
}

/** Inline status under a form: an error (red) or a note (green). */
export function AuthNotice({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-2xl border px-4 py-3 text-sm',
        tone === 'error' ? 'border-[#FF0040]/40 bg-[rgba(255,0,64,0.12)] text-[#FF8FA8]' : 'border-[#39FF14]/40 bg-[rgba(57,255,20,0.12)] text-[#8DFF77]',
      )}
    >
      {children}
    </div>
  )
}

export const AUTH_PRIMARY_BUTTON =
  'flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#39FF14] text-[15px] font-semibold text-black shadow-[0_0_24px_rgba(57,255,20,0.35)] transition-all hover:shadow-[0_0_36px_rgba(57,255,20,0.45)] active:scale-[0.98] disabled:opacity-60 disabled:shadow-none'
export const AUTH_SECONDARY_BUTTON =
  'flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.06] text-[15px] font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white active:scale-[0.98] disabled:opacity-60'
export const AUTH_LINK = 'text-[#39FF14] transition-colors hover:text-[#8DFF77]'
