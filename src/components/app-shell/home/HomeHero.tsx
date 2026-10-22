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
      <h1 className="max-w-2xl text-2xl font-semibold leading-snug text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.6)] md:text-[28px]">
        {greeting}
        {firstName ? (
          <>
            , <span className="hp-display text-[1.35em] leading-none text-[#39FF14]">{firstName}</span>.
          </>
        ) : (
          '.'
        )}
      </h1>
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
