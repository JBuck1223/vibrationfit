'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export interface HeroAction {
  label: string
  href: string
}

function greetingFor(date: Date): string {
  const h = date.getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * The Home headline, set straight onto the full-bleed section hero the shell
 * paints behind the page. No box: the photo is the page.
 */
export function HomeHero({ firstName, action }: { firstName: string | null; action: HeroAction | null }) {
  const [greeting, setGreeting] = React.useState('Welcome')
  React.useEffect(() => setGreeting(greetingFor(new Date())), [])

  return (
    <section className="pb-2 pt-3 md:pt-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">
        Your world today
      </p>
      <h1 className="text-[30px] font-extrabold leading-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] md:text-[40px]">
        Choose. Activate. Align.
      </h1>
      <p className="mt-2 max-w-xl text-base text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)] md:text-lg">
        {greeting}
        {firstName ? (
          <>
            , <span className="hp-display text-[1.35em] leading-none text-[#39FF14]">{firstName}</span>.
          </>
        ) : (
          '.'
        )}{' '}
        Consciously create a life you love.
      </p>
      <div className="mt-4 h-12">
        {action && (
          <Link href={action.href} className="btn btn-primary !py-3 !px-6 text-[15px]">
            {action.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  )
}
