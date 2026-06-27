'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container, Heading, Text } from '@/lib/design-system'

/**
 * Green Line concept — version index.
 *
 * Each iteration lives at its own route so we can fine-tune and refer back to
 * any version. The "current pick" for the homepage container is the latest.
 */

const VERSIONS = [
  {
    href: '/green-line/v1',
    label: 'Version 1',
    title: 'Original',
    description:
      'First pass — hammock figure (single arm) above, caged + handcuffed figure below, generic supporting copy.',
    status: 'archived' as const,
  },
  {
    href: '/green-line/v2',
    label: 'Version 2',
    title: 'Arms behind head + baked-in principles',
    description:
      'Hammock figure refined (both arms behind head, eyes) and the founding principles baked into each section. Hammock still reads poorly as a human.',
    status: 'archived' as const,
  },
  {
    href: '/green-line/v3',
    label: 'Version 3',
    title: 'Leaping "free & joyful" figure',
    description:
      'New above-the-line concept: a leaping, arms-raised figure that clearly reads as a free, joyful human and mirrors the trapped figure below.',
    status: 'latest' as const,
  },
]

export default function GreenLineIndexPage() {
  return (
    <div className="min-h-screen bg-black py-16 md:py-24">
      <Container size="md">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Heading level={1} className="text-white">
            Green Line Graphic — Versions
          </Heading>
          <Text size="lg" className="text-neutral-300 mt-4">
            Each iteration is preserved at its own route so we can fine-tune and
            compare. Open any version to review it.
          </Text>
        </div>

        <div className="space-y-4">
          {VERSIONS.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              className={`group block rounded-2xl border-2 p-6 transition-all duration-300 hover:-translate-y-1 ${
                v.status === 'latest'
                  ? 'border-[#39FF14]/40 bg-[#39FF14]/5 hover:border-[#39FF14]'
                  : 'border-[#1F1F1F] bg-[#0A0A0A] hover:border-neutral-600'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold uppercase tracking-widest ${
                        v.status === 'latest' ? 'text-[#39FF14]' : 'text-neutral-500'
                      }`}
                    >
                      {v.label}
                    </span>
                    {v.status === 'latest' && (
                      <span className="rounded-full bg-[#39FF14]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#39FF14]">
                        Latest
                      </span>
                    )}
                  </div>
                  <Heading level={4} className="text-white !mb-1">
                    {v.title}
                  </Heading>
                  <Text size="sm" className="text-neutral-400">
                    {v.description}
                  </Text>
                </div>
                <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-neutral-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#39FF14]" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  )
}
