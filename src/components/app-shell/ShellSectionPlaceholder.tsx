'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSection, type SectionId } from '@/lib/app-shell/sections'
import { useIsNativeShell } from '@/hooks/useNativeShell'
import { isNativeExternalPath } from '@/lib/mobile/native-shell'

/**
 * Phase 0 stand-in for a section root: the section hero on its theme image
 * plus links to the studios it will hold. Phase 1 replaces each with the real
 * composition. Exists so the pill has somewhere to land and the look can be
 * reviewed on a device today.
 */
export function ShellSectionPlaceholder({ sectionId }: { sectionId: SectionId }) {
  const section = getSection(sectionId)
  const Icon = section.icon
  const isNativeShell = useIsNativeShell()
  const tabs = isNativeShell ? section.tabs.filter((tab) => !isNativeExternalPath(tab.href)) : section.tabs

  return (
    <div className="space-y-6" data-section={section.accent === 'viva' ? 'viva' : undefined}>
      <section className="pb-2 pt-3 md:pt-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">
          {section.label}
        </p>
        <h2 className="text-[30px] font-extrabold leading-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] md:text-[40px]">
          {section.label} is on its way
        </h2>
        <p className="mt-3 max-w-md text-base text-white/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">
          This is the new shell. The {section.label} experience arrives in Phase 1; everything below still works today.
        </p>
      </section>

      {tabs.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tabs.map((tab) => (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className="glass-panel flex items-center justify-between gap-3 px-5 py-4 text-white transition-colors hover:border-[var(--section-accent)]/60"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--section-accent-soft)] text-[var(--section-accent)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{tab.label}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-white/50" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
