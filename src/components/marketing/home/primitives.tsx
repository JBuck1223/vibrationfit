import { Container } from '@/lib/design-system'

export { Cta, CTA_LABEL } from '@/components/marketing/home/CtaButton'

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
    h1: 'text-center text-[1.65rem] leading-[1.15] md:text-[3.25rem] md:leading-[1.1] lg:text-[3.75rem]',
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
  return <div className="mt-8 space-y-5 text-lg leading-[1.7] text-pretty text-neutral-300">{children}</div>
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
      <Container size="xl" className="px-4 py-12 md:px-10 md:py-20 lg:py-28">
        {children}
      </Container>
    </section>
  )
}
