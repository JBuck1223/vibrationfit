import { Indie_Flower } from 'next/font/google'
import { Check, X } from 'lucide-react'
import { Container } from '@/lib/design-system'
import {
  Accent,
  Beats,
  Body,
  Display,
  Eyebrow,
  Hit,
  Punch,
  Script,
  Section,
} from '@/components/marketing/home/primitives'
import { SectionMedia } from '@/components/marketing/home/SectionMedia'
import { HeroPreviewVideo } from '@/components/marketing/home/HeroPreviewVideo'
import { ACTIVATION_OFFER_VIDEO } from '@/lib/activation/offer-video'
import { PlatformScreens } from '@/components/marketing/home/PlatformScreens'
import { ChooseActivateAlign, VibrationalFitness } from '@/components/marketing/home/graphics'
import { DualPathCtas } from '@/components/marketing/home/DualPathCtas'
import { MembershipBuyBox } from '@/components/marketing/home/MembershipBuyBox'
import { HOME_PROOF_SCREENSHOTS, HOME_PROOF_VIDEOS } from '@/components/marketing/home/social-proof-data'
import { SocialProofSection } from '@/lib/design-system/components'
import { ReceiptsSection } from '@/components/marketing/home/ReceiptsSection'
import { ActivationHomeFaq } from '@/components/marketing/home/ActivationHomeFaq'
import { FoundersActualizations } from '@/components/marketing/home/FoundersActualizations'
import { LifeCategoryOrbit } from '@/components/marketing/home/LifeCategoryOrbit'
import { NoteCollage } from '@/components/marketing/home/NoteCollage'
import '@/components/marketing/home/marketing.css'

const display = Indie_Flower({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

const SYSTEM_STEPS = [
  {
    name: 'Choose',
    color: '#39FF14',
    title: 'Get clear on the Life You Choose.',
    paragraphs: [
      'Talk with VIVA about what\u2019s true now, what you want, what you don\u2019t want, and what you would love instead.',
      'She helps you turn all of that into one comprehensive, congruent Life Vision across all 12 areas of your life\u2014so your choices work together in harmony instead of competing with each other.',
    ],
    close: 'Because you really can have it all.',
  },
  {
    name: 'Activate',
    color: '#00FFFF',
    title: 'Experience your chosen reality now.',
    paragraphs: [
      'Turn your Life Vision into personalized audio, visual experiences, Manifestations, Stories, Incantations, SparkQueries, and other vibrational tools designed to help your chosen reality become increasingly familiar.',
    ],
    close: 'Hear it. See it. Speak it. Feel it.',
  },
  {
    name: 'Align',
    color: '#BF00FF',
    title: 'Bring your thoughts, words, and actions into alignment with what you\u2019ve chosen.',
    paragraphs: [
      'Because while you\u2019re activating your vision, life is still happening.',
      'Wins happen. Wobbles surface. Contrast gives you clarity.',
      'Bring all of it to VIVA. She helps you uncover the Vibrational Constraints competing with your chosen reality and return to thoughts, beliefs, and actions that support the Life You Choose.',
    ],
    close: null,
  },
] as const

const FOR_YOU = [
  'You already believe your thoughts, focus, and energy influence what you experience.',
  'You know manifestation works because you’ve experienced it—but you want to create more consistently.',
  "You don't know what you want.",
  'You know what you want, but keep getting pulled back into what is.',
  'You want a practical way to intentionally align with the life you choose.',
  'You want to enjoy your life now while creating more of what you want.',
]

const NOT_YET = [
  'You’re still deciding whether your thoughts, focus, and energy influence what you experience.',
  'You’re looking to be convinced that manifestation works rather than learning how to practice it consistently.',
  'The idea that you have a role in creating your experience feels impossible for you to entertain.',
  'You prefer to argue for your limitations rather than intentionally stepping into the version of you who can truly have it all.',
  'You’re already convinced this won’t work for you.',
]

export function HomeFrontDoor({ paidOnly = false }: { paidOnly?: boolean } = {}) {
  const Ctas = (props: { className?: string; align?: 'center' | 'start' }) => (
    <DualPathCtas {...props} paidOnly={paidOnly} />
  )

  return (
    <div className={`${display.variable} -mx-4 -mt-6 overflow-x-clip sm:-mx-6 md:-mx-6 md:-my-12 md:overflow-x-visible lg:-mx-8 lg:-mt-8`} data-home={paidOnly ? 'join' : 'front-door'}>
      <header className="hp-hero-glow" data-hero={paidOnly ? 'vision-pro' : 'activation-offer'}>
        <Container size="xl" className="px-4 py-12 md:px-10 md:pb-20 md:pt-14">
          <Display as="h1" className="hp-hero-headline">
            <span className="hp-hero-headline-line">Thoughts Become Things.</span>
            <br />
            <Accent>So Why Isn&rsquo;t It Working?</Accent>
          </Display>
          <div className="mx-auto mt-10 max-w-3xl">
            <HeroPreviewVideo
              src={ACTIVATION_OFFER_VIDEO.src}
              poster={ACTIVATION_OFFER_VIDEO.poster}
              trackingId={paidOnly ? 'join-hero-video' : 'home-hero-video'}
            />
          </div>
          <Ctas className="mt-10" />
          <p className="mt-4 text-center text-sm text-neutral-500">
            {paidOnly
              ? 'Vision Pro is $99 every 28 days. Charged today. Cancel anytime.'
              : 'Membership is $99 every 28 days. The Free Activation never asks for a card.'}
          </p>
        </Container>
      </header>

      <Section>
        <SectionMedia graphic={<MembershipBuyBox id="pricing" />}>
          <Eyebrow className="lg:text-left">The Short Version</Eyebrow>
          <Display className="lg:text-left">How Vibration Fit Works</Display>
          <Body>
            <p>
              Vibration Fit is a self-guided software system that installs a
              custom-built <span className="font-semibold text-white">Conscious Creation System</span>{' '}
              in your reality.
            </p>
            <p>
              Infused with VIVA — your Vibrationally Intelligent Virtual Assistant —
              it walks you step by step through clearly defining the life you choose,
              then hands you the tools to consistently activate that version of you in
              your vibrational point of attraction.
            </p>
            <p>
              The result: unresisted alignment with your deepest desires, and real
              vibrational leverage in a vibrationally based universe.
            </p>
          </Body>
          {paidOnly ? (
            <>
              <Punch>This is the whole system. Not a sample.</Punch>
              <Body>
                <p>
                  Vision Pro is $99 every 28 days. VIVA writes your Life Vision across
                  every area of your life, records it in your voice, and gives you the
                  daily tools that keep that life in front of you.
                </p>
              </Body>
            </>
          ) : (
            <>
              <Punch>But rather than tell you, we want to show you.</Punch>
              <Body>
                <p>
                  Your free Activation is a working sample of the whole system — built
                  around you, in one area of your life, in the next 10 to 15 minutes.
                </p>
              </Body>
            </>
          )}
        </SectionMedia>
      </Section>

      <Section>
        <div className="hp-proof-card min-w-0 max-w-full overflow-x-clip rounded-2xl bg-black/40 p-4 md:p-6 lg:p-8">
          <SocialProofSection
            eyebrow="Vibration Fit Member Results"
            title="Real People. Real Results."
            subtitle="This is what happens when the system is built around you."
            microcopy="All videos and messages are from real Vibration Fit members, shared with permission. Screenshots are unedited."
            videos={HOME_PROOF_VIDEOS}
            screenshots={HOME_PROOF_SCREENSHOTS}
          />
          <ReceiptsSection showHeader={false} showMoreMisty={false} columns={3} />
        </div>
        <Ctas className="mt-10" />
      </Section>

      <Section>
        <SectionMedia side="left" graphic={<LifeCategoryOrbit />} cta={<Ctas className="mt-8 lg:mt-10" align="start" />}>
          <Eyebrow tone="cyan" className="lg:text-left">The Life You Choose</Eyebrow>
          <Display className="lg:text-left">
            Start Creating
            <br />
            <Accent>Deliberately</Accent>
          </Display>
          <Body>
            <Hit>Imagine waking up knowing exactly what you&rsquo;re creating.</Hit>
            <p>
              You&rsquo;re crystal clear on{' '}
              <span className="font-semibold text-white">The Life You Choose.</span>
            </p>
            <p>
              You deeply appreciate where you are right now&mdash;and give yourself permission to
              unapologetically desire more. The journey gets to be part of the dream, and you get to
              enjoy every step along the way.
            </p>
            <p>
              The dream body and the dream partner and the dream work and the dream bank account.
            </p>
            <p>
              Not someday. And not at the expense of enjoying the life you have right now.
            </p>
            <p>
              If you already understand the law of attraction, you don&rsquo;t need another manifestation
              course to help you align with what you want.
            </p>
            <p className="font-semibold text-white">
              You need a vision. You need a way to align with it. And you need to practice living it.
            </p>
            <p>That&rsquo;s what Vibration Fit was built to help you do.</p>
            <p>You are not years away from the life of your dreams.</p>
            <p className="hp-display text-left text-[1.65rem] leading-tight text-[#39FF14] md:text-[2rem]">
              You are one vision away.
            </p>
          </Body>
        </SectionMedia>
      </Section>

      <Section>
        <SectionMedia graphic={<PlatformScreens />} cta={<Ctas className="mt-8 lg:mt-10" align="start" />}>
          <Eyebrow className="lg:text-left">Meet VIVA</Eyebrow>
          <Display className="lg:text-left">
            What VIVA
            <br />
            <Accent>Does</Accent>
          </Display>
          <Body>
            <p>
              VIVA is your <span className="font-semibold text-white">Vibrationally Intelligent Virtual Assistant.</span>
            </p>
            <p>
              We know how daunting it feels sitting down with a blank page, trying to
              describe the life you want from scratch.
            </p>
            <Hit>With VIVA, you never stare at a blank page.</Hit>
            <p>
              You don&rsquo;t even need to know what you want before you begin. Tell
              VIVA what isn&rsquo;t working&mdash;what feels frustrating, what feels
              stuck, what you&rsquo;re longing for, what you&rsquo;d absolutely love
              to experience instead.
            </p>
            <Punch>She knows how to turn contrast into clarity.</Punch>
            <p>
              Your disappointment, frustration, and longing all contain information
              about what you&rsquo;re ready to experience. VIVA takes that information
              and writes your <span className="font-semibold text-white">Life I Choose</span>{' '}
              vision using vibrational grammar &mdash; in your language, from your words.
            </p>
            <p>
              And then VIVA becomes your <span className="font-semibold text-white">blacksmith.</span>
            </p>
            <p>
              Once your vision exists, she forges the tools you need to align with
              it: your Future-Self Story, your Incantation, your SparkQuery, your
              Vision Audio, your own original song, and the images for your vision
              board. Every tool hammered out of your own words.
            </p>
          </Body>
        </SectionMedia>
      </Section>

      <Section>
        <SectionMedia side="left" graphic={<ChooseActivateAlign />} cta={<Ctas className="mt-8 lg:mt-10" align="start" />}>
          <Eyebrow className="lg:text-left">Your Conscious Creation System</Eyebrow>
          <Display className="hp-system-headline lg:text-left">
            Choose It.{' '}
            <br />
            Activate It.{' '}
            <br />
            <Script>align with it.</Script>
          </Display>
          <Body>
            <p>
              Conscious creation isn&rsquo;t something you do once. It&rsquo;s an ongoing
              practice for consciously choosing your life as you live it.
            </p>
          </Body>

          <ol className="mt-8 space-y-8">
            {SYSTEM_STEPS.map((step, index) => (
              <li key={step.name} className="flex gap-5">
                <span
                  className={`hp-step-num ${step.color === '#BF00FF' ? 'is-light' : ''}`}
                  style={{ '--step': step.color } as React.CSSProperties}
                >
                  {index + 1}
                </span>
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                    style={{ color: step.color }}
                  >
                    {step.name}
                  </p>
                  <p className="mt-1 text-xl font-semibold leading-snug text-white">{step.title}</p>
                  <div className="mt-3 space-y-3 text-lg leading-[1.65] text-neutral-400">
                    {step.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {step.close ? (
                    <div className="mt-3">
                      <Hit>{step.close}</Hit>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>

          <Body>
            <Punch className="!mt-2">And all the while&hellip; you live.</Punch>
            <Beats
              items={[
                'Life gives you new experiences.',
                'New desires.',
                'New contrast.',
                'New clarity.',
              ]}
            />
            <p>
              And that clarity comes right back into{' '}
              <span className="font-semibold text-white">Choose</span>.
            </p>
            <p>
              Your Life Vision evolves as you do, with every version preserved so you can
              look back and see how much of what you once chose is now simply&hellip;
            </p>
            <Punch className="!mt-2">your life.</Punch>
            <p className="pt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#39FF14]">
              Choose &rarr; Activate &rarr; Align
            </p>
            <Hit>Again and again, while you live.</Hit>
            <p>
              Vibration Fit gives you the complete system&mdash;with VIVA by your side,
              personalized vibrational tools, the Vibe Tribe community, and weekly live
              coaching inside the Alignment Gym.
            </p>
          </Body>
        </SectionMedia>
      </Section>

      <Section>
        <SectionMedia align="center" graphic={<VibrationalFitness />} cta={<Ctas className="mt-8 lg:mt-10" align="start" />}>
          <Eyebrow className="lg:text-left">The Practice</Eyebrow>
          <Display className="lg:text-left">
            You Know the Law.
            <br />
            <Accent>Now Live It.</Accent>
          </Display>
          <Body>
            <p>
              Someone can know everything about nutrition and strength training and still not be
              physically fit. You can know everything about manifestation and still not be{' '}
              <span className="font-semibold text-white">Vibration Fit.</span>
            </p>
            <p>
              Vibrational Fitness is the practiced ability to intentionally align your thoughts, words,
              and actions with the life you choose.
            </p>
            <Hit>
              It doesn&rsquo;t mean feeling amazing every second. It means a shitty day doesn&rsquo;t take
              your vision down with it.
            </Hit>
          </Body>
        </SectionMedia>
      </Section>

      <Section>
        <SectionMedia graphic={<NoteCollage />} cta={<Ctas className="mt-8 lg:mt-10" align="start" />}>
          <Eyebrow tone="purple" className="lg:text-left">From Us</Eyebrow>
          <Display className="lg:text-left">
            A Note From
            <br />
            <Accent>Jordan &amp; Vanessa</Accent>
          </Display>
          <Body>
            <p>
              We&rsquo;ve been living this practice for over 15 years, with our Life I Choose at the
              center. Again and again, we&rsquo;ve pulled out an old version of our vision, read what we
              once wrote, looked at each other and realized:
            </p>
            <Punch>Holy shit. We&rsquo;re living it.</Punch>
            <p>
              The road wasn&rsquo;t always smooth. The path to our most beautiful destinations often
              looked more like a roller coaster than a slide. That&rsquo;s part of conscious creation too.
            </p>
            <p>
              This system has been a sacred gift to us. Straight from God, the Cosmos, Infinite
              Intelligence&mdash;whatever language feels true to you. It is the system through which we
              have become <span className="font-semibold text-white">free.</span>
            </p>
            <Beats
              items={[
                'Free to choose our soul mate.',
                'Free to choose abundance over bankruptcy.',
                'Free to live in the destinations of our dreams.',
                'Free to buy our dream home.',
                'Free to homeschool our kids as a team.',
                'Free to travel the world.',
                <>
                  Free to do what we love <span className="font-semibold text-white">AND get paid (a lot) to do it.</span>
                </>,
              ]}
            />
            <p>
              And if you&rsquo;re wondering whether we made our money teaching this stuff before we&rsquo;d
              actually lived it ourselves&hellip;
            </p>
            <Hit>The answer is no.</Hit>
            <p>
              We accomplished everything on that list before we ever gave ourselves permission to share
              this system with another human being. We wanted to walk our talk and know it wasn&rsquo;t a
              lucky break.
            </p>
            <Hit>This was how we lived. Now we know.</Hit>
            <p>
              We believe this system is for anyone who trusts Universal Law and is willing to
              practice it. Your life is yours to choose.
            </p>
            <p className="text-[1.65rem] font-extrabold leading-tight text-white md:text-[2rem]">
              Rock out, baby,
              <br />
              <Accent>Jordan &amp; Vanessa</Accent>
            </p>
          </Body>
        </SectionMedia>
        <div className="mt-16 border-t border-white/10 pt-16 md:mt-20 md:pt-20">
          <Display>
            We Used This Process
            <br />
            <Accent>On Ourselves First</Accent>
          </Display>
          <p className="mx-auto mt-5 max-w-3xl text-center text-lg leading-[1.6] text-neutral-300">
            Before we ever invited members in, we used this exact system on ourselves. Here are some of
            our meaningful manifestations and their actualization stories.
          </p>
          <div className="hp-actualizations mt-10 min-w-0 max-w-full overflow-x-clip">
            <FoundersActualizations />
          </div>
        </div>
        <Ctas className="mt-10" />
      </Section>

      <Section>
        <div className="mx-auto max-w-5xl">
          <Eyebrow>Fit Check</Eyebrow>
          <Display>
            Who This
            <br />
            <Accent>Is For</Accent>
          </Display>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border-2 border-[#39FF14]/30 bg-[#39FF14]/[0.04] p-6 md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#39FF14]">
                This is for you if
              </p>
              <ul className="mt-6 space-y-4">
                {FOR_YOU.map((item) => (
                  <li key={item} className="flex gap-3 text-lg leading-snug text-neutral-200">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#39FF14]" strokeWidth={2.5} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border-2 border-[#FF0040]/30 bg-[#FF0040]/[0.04] p-6 md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#FF0040]">
                This probably isn&rsquo;t for you yet if
              </p>
              <ul className="mt-6 space-y-4">
                {NOT_YET.map((item) => (
                  <li key={item} className="flex gap-3 text-lg leading-snug text-neutral-200">
                    <X className="mt-0.5 h-5 w-5 shrink-0 text-[#FF0040]" strokeWidth={2.5} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mx-auto mt-10 max-w-3xl text-center">
            <Hit>
              It&rsquo;s for the person who&rsquo;s ready to stop studying manifestation and start living it.
            </Hit>
          </div>
          <Ctas className="mt-10" />
        </div>
      </Section>

      <Section>
        <ActivationHomeFaq paidOnly={paidOnly} />
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <Display as="h2">
            Ready when <Accent>you are.</Accent>
          </Display>
          <p className="mx-auto mt-6 max-w-xl text-center text-lg leading-[1.7] text-neutral-300">
            {paidOnly
              ? 'Start Vision Pro today. $99 every 28 days.'
              : 'Start membership now, or try a Free Activation first.'}
          </p>
          <Ctas className="mt-10" />
        </div>
      </Section>
    </div>
  )
}
