import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { Container } from '@/lib/design-system'
import { Body, Display, Eyebrow, Section } from '@/components/marketing/home/primitives'
import { MarketingImage } from '@/components/marketing/home/MarketingImage'
import { PlatformScreens } from '@/components/marketing/home/PlatformScreens'
import { ReceiptsSection } from '@/components/marketing/home/ReceiptsSection'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import type { SeoPage } from '@/content/seo/types'
import { getRelatedPages, type SeoVariant } from '@/content/seo/registry'
import { SeoJsonLd, getBreadcrumbs } from './JsonLd'
import { SeoTool } from './tools/SeoTool'
import '@/components/marketing/home/marketing.css'

const START_HREF = '/free-activation/start'

function StartCta({ label, className = '' }: { label: string; className?: string }) {
  return (
    <a
      href={START_HREF}
      className={`inline-flex items-center justify-center gap-2 rounded-full border-2 border-transparent bg-[#39FF14] px-6 py-3 text-center text-sm font-semibold text-black transition-all duration-300 hover:border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] md:px-7 ${className}`}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </a>
  )
}

function slugId(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function SeoLandingPage({ page, variant }: { page: SeoPage; variant?: SeoVariant }) {
  const h1 = variant?.h1 ?? page.h1
  const sub = variant?.sub ?? page.heroSub
  const cta = variant?.cta ?? page.ctaLabel
  const crumbs = getBreadcrumbs(page)
  const related = getRelatedPages(page)

  const toc = [
    page.tool && { id: 'try-it', label: page.tool.title },
    { id: slugId(page.steps.heading), label: page.steps.heading },
    page.examples && { id: slugId(page.examples.heading), label: page.examples.heading },
    { id: 'faq', label: 'Frequently asked questions' },
  ].filter((item): item is { id: string; label: string } => Boolean(item))

  return (
    <article className="bg-black text-white">
      <SeoJsonLd page={page} />

      {/* Hero */}
      <Container size="xl" className="px-4 pb-12 pt-6 md:px-10 md:pb-20 md:pt-10">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            {crumbs.map((crumb, index) => (
              <li key={crumb.name} className="flex items-center gap-1.5">
                {index > 0 && <span aria-hidden="true">›</span>}
                {crumb.path && index < crumbs.length - 1 ? (
                  <Link href={crumb.path} className="hover:text-neutral-300">{crumb.name}</Link>
                ) : (
                  <span className={index === crumbs.length - 1 ? 'text-neutral-300' : ''}>{crumb.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <Eyebrow className="!text-left">{page.eyebrow}</Eyebrow>
            <h1 className="text-[2.1rem] font-extrabold leading-[1.1] text-white md:text-[3.25rem]">{h1}</h1>
            <p className="mt-6 text-lg leading-[1.7] text-neutral-300">{sub}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <StartCta label={cta} />
              {page.tool && (
                <a href="#try-it" className="text-center text-sm font-semibold text-[#00FFFF] hover:underline sm:text-left">
                  Try the free tool ↓
                </a>
              )}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_60px_rgba(57,255,20,0.08)]">
            {page.video ? (
              <OptimizedVideo
                url={page.video.url}
                thumbnailUrl={page.video.thumbnailUrl}
                context="single"
                trackingId={`seo-${slugId(page.path)}-hero`}
                className="h-auto w-full"
              />
            ) : (
              <MarketingImage
                src={page.heroImage.src}
                alt={page.heroImage.alt}
                width={page.heroImage.width}
                height={page.heroImage.height}
                sizes="(min-width: 1024px) 45vw, 100vw"
                priority
                className="h-auto w-full"
              />
            )}
          </div>
        </div>

        {/* Answer-first block: the featured snippet / AI answer target */}
        <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-[#39FF14]/25 bg-[#39FF14]/[0.04] p-6 md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#39FF14]">The short answer</p>
          <p className="mt-3 text-lg leading-[1.7] text-neutral-100">{page.answer}</p>
        </div>

        <nav aria-label="On this page" className="mx-auto mt-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">On this page</p>
          <ul className="mt-3 space-y-2">
            {toc.map(item => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-neutral-300 hover:text-[#39FF14]">{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      {/* Free tool */}
      {page.tool && (
        <section id="try-it" className="scroll-mt-24 border-t border-white/10">
          <Container size="lg" className="px-4 py-12 md:px-10 md:py-20">
            <Display>{page.tool.title}</Display>
            <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-[1.7] text-neutral-300">{page.tool.intro}</p>
            <div className="mt-10">
              <SeoTool id={page.tool.id} startHref={START_HREF} />
            </div>
          </Container>
        </section>
      )}

      {/* Steps */}
      <Section>
        <div id={slugId(page.steps.heading)} className="mx-auto max-w-4xl scroll-mt-24">
          <Display>{page.steps.heading}</Display>
          {page.steps.intro && <p className="mt-5 text-center text-lg text-neutral-300">{page.steps.intro}</p>}
          <ol className="mt-12 space-y-14">
            {page.steps.items.map((step, index) => (
              <li key={step.title} className="grid gap-6 md:grid-cols-[auto_1fr] md:gap-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#39FF14]/40 text-lg font-bold text-[#39FF14]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-white md:text-2xl">{step.title}</h3>
                  <p className="mt-3 text-lg leading-[1.7] text-neutral-300">{step.body}</p>
                  {step.screenshot && (
                    <MarketingImage
                      src={step.screenshot.src}
                      alt={step.screenshot.alt}
                      width={step.screenshot.width}
                      height={step.screenshot.height}
                      sizes="(min-width: 768px) 640px, 100vw"
                      loading="lazy"
                      className="mt-6 h-auto w-full rounded-xl border border-white/10"
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Examples */}
      {page.examples && (
        <Section>
          <div id={slugId(page.examples.heading)} className="scroll-mt-24">
            <Display>{page.examples.heading}</Display>
            {page.examples.intro && <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-neutral-300">{page.examples.intro}</p>}
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {page.examples.groups.map(group => (
                <div key={group.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#39FF14]">{group.title}</h3>
                  <ul className="mt-4 space-y-3">
                    {group.items.map(item => (
                      <li key={item} className="leading-snug text-neutral-200">{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Founder note: first-hand experience */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <Eyebrow tone="purple">From Jordan &amp; Vanessa</Eyebrow>
          <Display>{page.founderNote.heading}</Display>
          <Body>
            {page.founderNote.paragraphs.map(paragraph => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </Body>
          <p className="mt-8 text-sm text-neutral-500">
            <strong className="text-neutral-300">{page.definition.term}:</strong> {page.definition.text}
          </p>
        </div>
      </Section>

      {/* Platform */}
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Eyebrow className="!text-left">Do it on autopilot</Eyebrow>
            <h2 className="text-[2rem] font-extrabold leading-[1.1] md:text-[2.75rem]">Choose. Activate. Align.</h2>
            <p className="mt-6 text-lg leading-[1.7] text-neutral-300">
              Vibration Fit keeps your Life Vision, vision board, journal, affirmations and audios in one place, with
              VIVA guiding you through it every day.
            </p>
            <div className="mt-8"><StartCta label={cta} /></div>
          </div>
          <PlatformScreens />
        </div>
      </Section>

      {/* Proof */}
      <Section>
        <Display>Real members. Real results.</Display>
        <ReceiptsSection showHeader={false} showMoreMisty={false} columns={3} />
      </Section>

      {/* FAQ */}
      <Section>
        <div id="faq" className="mx-auto max-w-3xl scroll-mt-24">
          <Display>Frequently asked questions</Display>
          <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {page.faqs.map(faq => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-white">
                  <h3>{faq.question}</h3>
                  <ChevronDown className="h-5 w-5 shrink-0 text-[#39FF14] transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 leading-[1.7] text-neutral-300">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* Related + final CTA */}
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          {related.length > 0 && (
            <div className="mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Keep exploring</p>
              <ul className="mt-4 flex flex-wrap justify-center gap-3">
                {related.map(item => (
                  <li key={item.path}>
                    <Link href={`/${item.path}`} className="inline-block rounded-full border border-white/15 px-4 py-2 text-sm text-neutral-200 hover:border-[#39FF14]/50 hover:text-[#39FF14]">
                      {item.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Display>Start creating on purpose today</Display>
          <p className="mt-5 text-lg text-neutral-300">Free to start. Your Life Vision, vision board and daily practice in one place.</p>
          <div className="mt-8"><StartCta label={cta} /></div>
          <p className="mt-6 text-xs text-neutral-500">Updated {new Date(page.dateModified).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</p>
        </div>
      </Section>
    </article>
  )
}
