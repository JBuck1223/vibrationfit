import Link from 'next/link'
import { CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react'
import type { Check, PillarReport } from '@/lib/seo/readiness'
import { verdict } from '@/lib/seo/readiness'

const TONES = {
  success: 'border-[#39FF14]/40 bg-[#39FF14]/10 text-[#39FF14]',
  warning: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300',
  danger: 'border-red-500/40 bg-red-500/10 text-red-400',
  neutral: 'border-white/15 bg-white/5 text-neutral-400',
}

export function Panel({ title, action, children, className = '' }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-neutral-950 p-5 md:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-base font-semibold text-white">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950 p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
    </div>
  )
}

export function Pill({ tone = 'neutral', children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>
}

export function ScorePill({ label, score }: { label?: string; score: number | null }) {
  if (score === null) return <Pill>—</Pill>
  const v = verdict(score)
  return <Pill tone={v.tone}>{label ? `${label} ` : ''}{score}%</Pill>
}

export function StatusIcon({ status }: { status: Check['status'] }) {
  if (status === 'pass') return <CheckCircle2 className="h-4 w-4 shrink-0 text-[#39FF14]" aria-label="Pass" />
  if (status === 'warn') return <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-300" aria-label="Needs work" />
  return <XCircle className="h-4 w-4 shrink-0 text-red-400" aria-label="Missing" />
}

export function PillarCard({ report }: { report: PillarReport }) {
  const v = verdict(report.score)
  const open = report.checks.filter(c => c.status !== 'pass').length
  return (
    <Panel
      title={<span className="flex items-center gap-2">{report.label} <Pill tone={v.tone}>{v.label} · {report.score}%</Pill></span>}
      action={<span className="text-xs text-neutral-500">{open === 0 ? 'Nothing to fix' : `${open} to improve`}</span>}
    >
      <ul className="space-y-2.5">
        {report.checks.map(item => (
          <li key={item.label} className="flex gap-2.5 text-sm">
            <StatusIcon status={item.status} />
            <span>
              <span className="text-neutral-100">{item.label}</span>
              <span className="block text-xs leading-relaxed text-neutral-500">{item.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = /^https?:/.test(href)
  const className = 'inline-flex items-center gap-1 text-sm text-[#00FFFF] hover:underline'
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>{children}<ExternalLink className="h-3 w-3" /></a>
  ) : (
    <Link href={href} className={className}>{children}</Link>
  )
}

/** Google-style search ad mock, showing the keyword-inserted headline. */
export function AdPreview({ keyword, headlines, descriptions, displayPath }: { keyword?: string; headlines: string[]; descriptions: string[]; displayPath: string }) {
  const resolve = (text: string) =>
    text.replace(/\{KeyWord:([^}]*)\}/gi, (_, fallback: string) => {
      const inserted = keyword ? keyword.replace(/\b\w/g, c => c.toUpperCase()) : fallback
      return inserted.length <= 30 ? inserted : fallback
    })
  return (
    <div className="rounded-xl border border-white/10 bg-white p-4 text-left font-sans">
      <p className="text-xs text-neutral-700"><span className="font-semibold text-black">Sponsored</span> · vibrationfit.com/{displayPath}</p>
      <p className="mt-1 text-lg leading-snug text-[#1a0dab]">{headlines.slice(0, 3).map(resolve).join(' | ')}</p>
      <p className="mt-1 text-sm leading-snug text-neutral-700">{descriptions.slice(0, 2).join(' ')}</p>
    </div>
  )
}

export const fmt = (n: number) => n.toLocaleString('en-US')
export const money = (n: number) => `$${n.toFixed(2)}`
