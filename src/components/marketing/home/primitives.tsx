import { ArrowRight } from 'lucide-react'
import { Container } from '@/lib/design-system'

export const CTA_LABEL = 'Start Your 72-Hour Vision Activation'

// Styled to match the design-system primary/lg Button. Rendered as a plain
// anchor because Button's asChild path hydration-mismatches inside a server
// component, which fires the global error toast on marketing pages.
export function Cta({ href = '#offer', className = '' }: { href?: string; className?: string }) {
  return (
    <div className={`mt-10 flex justify-center ${className}`}>
      <a
        href={href}
        className="inline-flex items-center justify-center gap-2.5 whitespace-normal rounded-full border-2 border-transparent bg-[#39FF14] px-5 py-4 text-center text-sm font-semibold text-black antialiased transition-all duration-300 hover:border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] active:opacity-80 md:whitespace-nowrap md:px-10 md:text-base"
      >
        {CTA_LABEL}
        <ArrowRight className="h-5 w-5" />
      </a>
    </div>
  )
}

export function Eyebrow({
  children,
  tone = 'lime',
  className = '',
}: {
  children: React.ReactNode
  tone?: 'lime' | 'cyan' | 'purple' | 'yellow'
  className?: string
}) {
  const tones = {
    lime: 'text-[#39FF14]',
    cyan: 'text-[#00FFFF]',
    purple: 'text-[#BF00FF]',
    yellow: 'text-[#FFFF00]',
  }
  return (
    <p className={`mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.32em] ${tones[tone]} ${className}`}>
      {children}
    </p>
  )
}

export function Display({
  as: Tag = 'h2',
  children,
  className = '',
}: {
  as?: 'h1' | 'h2' | 'h3'
  children: React.ReactNode
  className?: string
}) {
  const sizes = {
    h1: 'text-[2.35rem] leading-[1.08] md:text-[3.25rem] lg:text-[3.75rem]',
    h2: 'text-[2rem] leading-[1.1] md:text-[2.75rem]',
    h3: 'text-[1.65rem] leading-snug md:text-[1.85rem]',
  }
  return (
    <Tag className={`text-center font-extrabold text-white ${sizes[Tag]} ${className}`}>
      {children}
    </Tag>
  )
}

export function Script({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`hp-display ${className}`}>{children}</span>
}

export function Accent({ children }: { children: React.ReactNode }) {
  return <Script className="text-[#39FF14]">{children}</Script>
}

export function Body({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 space-y-5 text-lg leading-[1.7] text-neutral-300">{children}</div>
}

export function Hit({ children }: { children: React.ReactNode }) {
  return <p className="text-xl font-semibold leading-snug text-white md:text-2xl">{children}</p>
}

export function Punch({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`hp-display mt-10 text-left text-[1.65rem] leading-tight text-[#39FF14] md:text-[2rem] ${className}`}>
      {children}
    </p>
  )
}

export function Beats({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="my-7 space-y-3.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3.5 text-lg leading-snug text-neutral-200">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#39FF14] shadow-[0_0_10px_#39FF14]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="border-t border-white/10">
      <Container size="xl" className="px-4 py-20 md:px-10 md:py-28">
        {children}
      </Container>
    </section>
  )
}
