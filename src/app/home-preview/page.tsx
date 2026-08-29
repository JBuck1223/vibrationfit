import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/lib/design-system'
import { PricingBlock } from './PricingBlock'
import { ReceiptsSection } from './ReceiptsSection'
import { HeroLayout } from './HeroLayout'
import { SectionPhoto } from './SectionPhoto'

const CTA_LABEL = 'Start Your 72-Hour Vision Activation'

// Styled to match the design-system primary/lg Button. Rendered as a plain
// anchor because Button's asChild path hydration-mismatches inside a server
// component, which fires the global error toast on this page.
function Cta({ href = '#pricing', className = '' }: { href?: string; className?: string }) {
  return (
    <div className={`mt-10 flex justify-center ${className}`}>
      <a
        href={href}
        className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full border-2 border-transparent bg-[#39FF14] px-5 py-4 text-sm font-semibold text-black antialiased transition-all duration-300 hover:border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] active:opacity-80 md:px-10 md:text-base"
      >
        {CTA_LABEL}
        <ArrowRight className="h-5 w-5" />
      </a>
    </div>
  )
}

function Eyebrow({
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

function Display({
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

function Script({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`hp-display ${className}`}>{children}</span>
}

function Accent({ children }: { children: React.ReactNode }) {
  return <Script className="text-[#39FF14]">{children}</Script>
}

function Body({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 space-y-5 text-lg leading-[1.7] text-neutral-300">{children}</div>
}

function Hit({ children }: { children: React.ReactNode }) {
  return <p className="text-xl font-semibold leading-snug text-white md:text-2xl">{children}</p>
}

function Punch({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`hp-display mt-10 text-left text-[1.65rem] leading-tight text-[#39FF14] md:text-[2rem] ${className}`}>
      {children}
    </p>
  )
}

function Beats({ items }: { items: React.ReactNode[] }) {
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

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="border-t border-white/10">
      <Container size="xl" className="px-6 py-20 md:px-10 md:py-28">
        {children}
      </Container>
    </section>
  )
}

// Stale HMR safety: an older compiled page still called <Receipt />.
function Receipt() {
  return null
}

function Photo({
  src,
  alt,
  width,
  height,
  className = '',
}: {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 ${className}`}>
      <Image src={src} alt={alt} width={width} height={height} className="h-auto w-full" />
    </div>
  )
}



export default function HomePreviewPage() {
  return (
    <div className="-mt-6 md:-my-12 lg:-mt-8" data-preview="v14">
      {false ? <Receipt /> : null}
      <header className="hp-hero-glow">
        <Container size="xl" className="px-6 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24">
          <HeroLayout
            intro={
              <>
                <Eyebrow>The Life You Choose</Eyebrow>
                <Display as="h1">
                  Stop Chasing Your Dream Life.
                  <br />
                  <Accent>Start Living From It.</Accent>
                </Display>
                <p className="mt-8 text-center text-xl text-neutral-200">You already know the law.</p>
              </>
            }
          >
            <Body>
              <p>
                You have read the books, listened to the podcasts, created the vision boards, and seen enough
                evidence to know this works.
              </p>
              <p>The problem is not belief.</p>
              <Hit>The problem is that the reality in front of you keeps demanding your attention.</Hit>
              <p>
                You want to manifest the relationship, but you&rsquo;re still climbing into bed alone. You
                want to manifest abundance, but your bank account hasn&rsquo;t gotten the memo yet. You want
                to manifest work that lights you up, but you&rsquo;re still dreading the job you have. You
                want to manifest a strong, healthy body, but the mirror isn&rsquo;t reflecting it yet.
              </p>
              <Hit>It&rsquo;s easy to believe in the life you choose when you can see evidence of it.</Hit>
              <p className="hp-display text-[1.45rem] leading-snug text-[#39FF14] md:text-[1.75rem] lg:text-left">
                The practice is staying connected to it when everything in front of you says, &ldquo;Not
                yet.&rdquo;
              </p>
            </Body>
            <Cta className="lg:justify-start" />
          </HeroLayout>
        </Container>
      </header>

      <Section>
        <SectionPhoto
          photos={[
            {
              src: '/home-preview/photos/jump-sunset.jpg',
              alt: 'Jordan and Vanessa leaping together on the beach at sunset',
            },
            {
              src: '/home-preview/photos/maternity-beach-walk.jpg',
              alt: 'Jordan and Vanessa walking the beach while expecting their first child',
            },
          ]}
        >
          <Eyebrow tone="cyan" className="lg:text-left">You Already Know This</Eyebrow>
          <Display className="lg:text-left">
            You Already Know
            <br />
            <Accent>the Law</Accent>
          </Display>
          <Body>
            <p>You do not need Manifestation 101.</p>
            <p>You already understand that your thoughts, words, and actions shape the experience you are creating.</p>
            <p>You have probably experienced moments where it worked:</p>
            <Beats
              items={[
                'The money arrived.',
                'The right person called.',
                'The opportunity appeared.',
                'The answer came through.',
                'Something you had been imagining showed up in reality.',
              ]}
            />
            <p>
              But then the moment passed and your attention returned to what was missing. You began reacting
              to current circumstances instead of creating from the life you choose.
            </p>
            <p>You may recognize yourself here:</p>
            <Beats
              items={[
                <>You want more, but cannot clearly articulate what &ldquo;more&rdquo; actually looks like.</>,
                'You write a vision, then make decisions from your current reality.',
                'You practice in bursts, then lose connection when contrast appears.',
                'You collect another method because the last one never became part of your life.',
                'You wait for proof before allowing yourself to feel good.',
                'You assume feeling off means you have somehow failed.',
              ]}
            />
            <p>You haven&rsquo;t failed.</p>
            <p>Contrast is part of the process.</p>
            <Hit>The question is whether you know what to do with it.</Hit>
          </Body>
        </SectionPhoto>
      </Section>

      <Section>
        <SectionPhoto
          side="left"
          src="/home-preview/photos/family-sunset-rocks.jpg"
          alt="Jordan, Vanessa, and their baby on the rocks at sunset"
        >
          <Eyebrow tone="purple" className="lg:text-left">The Practice</Eyebrow>
          <Display className="lg:text-left">
            You Are Not Missing
            <br />
            <Accent>More Information</Accent>
          </Display>
          <Body>
            <p>You may already know more about manifestation than most people ever will.</p>
            <p>But knowing something intellectually isn&rsquo;t the same as living it.</p>
            <p>
              Someone can know everything about nutrition and still not be physically fit. And you can
              know everything about manifestation without consistently bringing yourself into harmony with
              what you want.
            </p>
            <p>
              That&rsquo;s why our Conscious Creation System is designed to help you become{' '}
              <span className="font-semibold text-white">Vibration Fit.</span>
            </p>
            <p>
              Vibrational Fitness is the practiced ability to intentionally align your thoughts, words, and
              actions with the life you choose.
            </p>
            <p>It doesn&rsquo;t mean feeling amazing every second of every day. We certainly don&rsquo;t.</p>
            <Hit>It means a shitty day doesn&rsquo;t take your vision down with it.</Hit>
          </Body>
          <Cta className="lg:justify-start" />
        </SectionPhoto>
      </Section>

      <Section>
        <SectionPhoto
          photos={[
            {
              src: '/home-preview/photos/italy-sorrento.jpg',
              alt: 'Jordan and Vanessa on a street in Sorrento, Italy',
            },
            {
              src: '/home-preview/photos/cabo-wedding.jpg',
              alt: 'Jordan and Vanessa at their wedding in Cabo',
            },
          ]}
        >
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
            We know how daunting it can feel sitting down with a pen and an empty piece of paper, trying
            to create a comprehensive life vision from scratch.
          </p>
          <div className="hp-display space-y-2 py-2 text-[1.45rem] leading-snug text-neutral-100 md:text-[1.85rem]">
            <p>&ldquo;Where do I start?&rdquo;</p>
            <p>&ldquo;What categories do I write about?&rdquo;</p>
            <p>&ldquo;How long do I make this?&rdquo;</p>
            <p className="text-[#FFFF00]">&hellip;WTF.</p>
            <p>&ldquo;I think I&rsquo;ll take a nap instead.&rdquo;</p>
          </div>
          <Hit>This is why VIVA exists. So you never have to stare at a blank sheet of paper again.</Hit>
          <p>You don&rsquo;t even need to know exactly what you want before you begin.</p>
          <p>
            Tell VIVA what isn&rsquo;t working. Tell her what you&rsquo;re frustrated by, what you wish
            were different, what you&rsquo;re jealous of, what you can&rsquo;t stop thinking about, or
            what you&rsquo;d absolutely love to experience.
          </p>
          <Punch>She knows how to turn contrast into clarity.</Punch>
          <p>Your disappointment contains information about what matters to you.</p>
          <p>Your frustration contains information about what you want to change.</p>
          <p>Your longing contains information about what you&rsquo;re ready to experience.</p>
          <p>
            VIVA takes that information and writes your{' '}
            <span className="font-semibold text-white">Life I Choose</span> vision for you using
            vibrational grammar.
          </p>
          <p>Not a generic affirmation or vague vision statement.</p>
          <Hit>
            A vivid, emotionally charged vision across 12 life categories that gives you a destination you
            can actually align with.
          </Hit>
        </Body>
        </SectionPhoto>
      </Section>

      <Section>
        <SectionPhoto
          side="left"
          src="/home-preview/photos/australia-cliff-kiss.jpg"
          alt="Jordan and Vanessa kissing on a cliff in Australia"
        >
        <Eyebrow tone="cyan" className="lg:text-left">The System</Eyebrow>
        <Display className="lg:text-left">
          Your Conscious
          <br />
          <Accent>Creation System</Accent>
        </Display>
        <Body>
          <p>
            Conscious Creation is choosing what you want to include in your experience, then aligning your
            thoughts, words, and actions with that choice.
          </p>
          <p>The Conscious Creation System makes that way of living repeatable.</p>
          <p>It helps you:</p>
          <Beats
            items={[
              'Choose what you want to include.',
              'Align with it intentionally.',
              'Enjoy your life now.',
              'Experience unresisted desire as you watch your manifestations unfold.',
            ]}
          />
          <Hit>
            VIVA reveals and writes the vision. The 72-Hour Vision Activation installs the system. MAP
            runs it daily. You evolve it as your life expands.
          </Hit>
        </Body>
        </SectionPhoto>
      </Section>

      <Section>
        <SectionPhoto
          photos={[
            {
              src: '/home-preview/photos/skydive-engagement.jpg',
              alt: 'Jordan and Vanessa skydiving together',
            },
            {
              src: '/home-preview/photos/budget-truck.jpg',
              alt: 'Jordan and Vanessa with the moving truck, betting on the life they chose',
            },
          ]}
        >
        <Eyebrow tone="yellow" className="lg:text-left">How It Works</Eyebrow>
        <Display className="lg:text-left">
          Install It Once.
          <br />
          <Script>Run It Daily.</Script>
          <br />
          <Accent>Evolve As Life Changes.</Accent>
        </Display>

        <div className="mt-14 space-y-12">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#39FF14]">
              Phase 1 . Install
            </p>
            <h3 className="text-[1.45rem] font-extrabold text-white md:text-[1.7rem]">The 72-Hour Vision Activation</h3>
            <Body>
              <p>Over 72 hours, you build your Conscious Creation System.</p>
              <p>You leave with:</p>
              <Beats
                items={[
                  'Your Life I Choose vision',
                  'Your Vision Audio',
                  'Your Vision Board',
                  'Your journal',
                  'Your My Alignment Plan (MAP)',
                ]}
              />
              <p>VIVA helps write your Life I Choose using vibrational grammar, even if you start without complete clarity.</p>
              <p>You don&rsquo;t leave with more information.</p>
              <Hit>You leave with your personal system installed.</Hit>
            </Body>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#00FFFF]">
              Phase 2 . Run
            </p>
            <h3 className="text-[1.45rem] font-extrabold text-white md:text-[1.7rem]">My Alignment Plan</h3>
            <Body>
              <p>Your MAP shows you exactly what to do each day through:</p>
              <Beats items={['Creations', 'Activations', 'Connections', 'Sessions']} />
              <p>
                Instead of wondering how to stay connected, you have a structure that guides your
                attention, actions, and vibrational practice.
              </p>
              <Hit>Your MAP helps you put in the reps, collect evidence of actualization, and enjoy the process.</Hit>
            </Body>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#BF00FF]">
              Phase 3 . Evolve
            </p>
            <h3 className="text-[1.45rem] font-extrabold text-white md:text-[1.7rem]">
              Update <Accent>&amp; Look Back</Accent>
            </h3>
            <Body>
              <p>Your desires will change as you grow.</p>
              <p>That&rsquo;s not inconsistency.</p>
              <Punch>That&rsquo;s evolution.</Punch>
              <p>Update your profile, Life I Choose, Vision Audio, Vision Board, and MAP as your life changes.</p>
              <p>
                Every past version is preserved, so you can look back and see how far you&rsquo;ve
                come—and how much of what you once wrote is now your actual life.
              </p>
              <Hit>Install the system once. Run it daily. Evolve it as your life expands.</Hit>
            </Body>
          </div>
        </div>
        <Cta className="lg:justify-start" />
        </SectionPhoto>
      </Section>

      <Section>
        <ReceiptsSection />
        <Cta />
      </Section>

      <Section>
        <SectionPhoto
          photos={[
            {
              src: '/home-preview/photos/founders-couch.png',
              alt: 'Jordan and Vanessa in Vibration Fit shirts, living the life they choose',
            },
            {
              src: 'https://media.vibrationfit.com/site-assets/proof-wall/house-actualized.jpg',
              alt: 'Jordan and Vanessa at their dream home',
            },
          ]}
        >
        <Eyebrow tone="purple" className="lg:text-left">From Us</Eyebrow>
        <Display className="lg:text-left">
          A Note From
          <br />
          <Accent>Jordan &amp; Vanessa</Accent>
        </Display>
        <Body>
          <Hit>You are not years away from the life you choose. You are one vision away.</Hit>
          <p>
            We&rsquo;ve been living this practice for over 15 years, using a consistent conscious
            creation system with our Life I Choose at the center.
          </p>
          <p>And again and again, we&rsquo;ve watched the Universe beautifully unfold into our chosen reality.</p>
          <p>
            We&rsquo;ve gone through several creation cycles now where we&rsquo;ve pulled out an old
            version of our vision, read what we once wrote, looked at each other and realized:
          </p>
          <Punch>Holy shit. We&rsquo;re living it.</Punch>
          <p>That&rsquo;s not to say the road was always smooth and easy.</p>
          <p>
            There has been plenty of contrast along the way. And when we look back at how we arrived at
            some of our most beautiful destinations, the path often looks a lot more like a roller
            coaster than a smooth, low-grade slide.
          </p>
          <p>But that&rsquo;s part of conscious creation too.</p>
          <p>
            When you practice this long enough, you begin to realize that contrast isn&rsquo;t evidence
            that you&rsquo;ve gotten off course.
          </p>
          <Hit>Contrast is the catalyst for clarity.</Hit>
          <p>You experience something you don&rsquo;t want, and suddenly you know more clearly what you do want.</p>
          <p>
            An infinite being, experiencing life through a physical body, with clarity on what they
            choose to experience is{' '}
            <span className="font-semibold text-white">a force to be reckoned with in this physical Universe.</span>
          </p>
          <p>
            This system has been a sacred gift to us. Straight from God, the Cosmos, Infinite
            Intelligence—whatever language feels true to you.
          </p>
          <p>
            It is the system through which we have become <span className="font-semibold text-white">free.</span>
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
            And if you&rsquo;re wondering whether we&rsquo;re one of those couples who made our money
            teaching people this stuff before we&rsquo;d actually lived it ourselves...
          </p>
          <Hit>The answer is no.</Hit>
          <p>
            We accomplished everything we just listed before we ever gave ourselves permission to share
            this system with another human being.
          </p>
          <p>In hindsight, that was probably a little silly.</p>
          <p>But we wanted to know.</p>
          <p>
            We wanted to live it. Test it. Walk our talk. Look back over years of our lives and know that
            what we were experiencing wasn&rsquo;t a lucky break or a one-time manifestation.
          </p>
          <Hit>This was how we lived.</Hit>
          <p>Now we know.</p>
          <p>And that&rsquo;s why we&rsquo;re sharing it with you.</p>
          <p>
            This system changed the way we experience our lives. It has worked for us again and again,
            and{' '}
            <span className="font-semibold text-white">
              we believe this system is designed for anyone who trusts Universal Law and is willing to
              practice it.
            </span>
          </p>
          <p>Your life is yours to choose.</p>
          <p className="text-[1.65rem] font-extrabold leading-tight text-white md:text-[2rem]">
            Rock out, baby,
            <br />
            <Accent>Jordan &amp; Vanessa</Accent>
          </p>
        </Body>
        <Cta className="lg:justify-start" />
        </SectionPhoto>
      </Section>

      <Section>
        <SectionPhoto
          side="left"
          src="/home-preview/photos/japan-torii.jpg"
          alt="Jordan and Vanessa at a torii gate in Japan"
        >
        <Eyebrow tone="yellow" className="lg:text-left">The Feeling</Eyebrow>
        <Display className="lg:text-left">
          Imagine
          <br />
          <Accent>Staying Connected</Accent>
        </Display>
        <Body>
          <p>Imagine waking up knowing what you&rsquo;re creating.</p>
          <p>You&rsquo;re not staring at a blank sheet of paper trying to figure out how to write your vision.</p>
          <p>You&rsquo;re not checking your current circumstances to decide whether you&rsquo;re allowed to feel hopeful.</p>
          <p>
            You&rsquo;re not waiting for the money, relationship, job, body, or opportunity to arrive
            before you let yourself enjoy your life.
          </p>
          <Punch>You know the life you choose.</Punch>
          <p>
            You know what you&rsquo;re creating and how you want it to feel. And when life gets loud and
            your attention gets pulled into the reality in front of you, you know how to reconnect with
            the reality you&rsquo;re creating.
          </p>
          <p>This isn&rsquo;t about ignoring what is.</p>
          <p>It&rsquo;s about not requiring what is to change before you allow yourself to feel good about where you&rsquo;re going.</p>
          <p>You can love what you have AND desire more.</p>
          <p>You can experience unresisted desire.</p>
          <p>You can enjoy the becoming.</p>
          <Hit>The journey gets to be part of the dream.</Hit>
        </Body>
        <Cta className="lg:justify-start" />
        </SectionPhoto>
      </Section>

      <Section>
        <SectionPhoto
          src="/home-preview/photos/koala-australia.jpg"
          alt="Jordan and Vanessa with a koala in Australia"
        >
        <Eyebrow className="lg:text-left">Fit Check</Eyebrow>
        <Display className="lg:text-left">
          Who This
          <br />
          <Accent>Is For</Accent>
        </Display>
        <Body>
          <p>Vibration Fit is for you if:</p>
          <Beats
            items={[
              'You already believe your thoughts, focus, and energy influence what you experience.',
              <>
                You know manifestation works because you&rsquo;ve experienced it&mdash;but you haven&rsquo;t
                learned how to create consistently.
              </>,
              'You know a lot about manifestation, but actually living it is another story.',
              <>
                You&rsquo;re not completely clear on what you want next&mdash;or you know what you want,
                but keep getting pulled back into what is.
              </>,
              'You want a practical way to turn contrast into clarity and intentionally align with the life you choose.',
              'You want to enjoy your life now while creating more of what you want.',
            ]}
          />
          <p>This isn&rsquo;t another pile of manifestation information.</p>
          <Hit>It&rsquo;s for the person who&rsquo;s ready to stop studying manifestation and start living it.</Hit>
        </Body>
        <Cta className="lg:justify-start" />
        </SectionPhoto>
      </Section>

      <Section>
        <h2 className="text-center text-[2.75rem] font-extrabold leading-[1.08] text-[#39FF14] md:text-[3.75rem]">
          Pricing
        </h2>
        <p className="mt-5 text-center text-[1.45rem] font-extrabold leading-tight text-white md:text-[1.85rem]">
          72-Hour Vision Activation + First 28 Days of Vision Pro
        </p>
        <div className="mt-10">
          <PricingBlock>
            <div className="mx-auto mt-12 max-w-3xl">
              <Body>
                <Hit>
                  You&rsquo;re not buying another manifestation course. You&rsquo;re installing your
                  Conscious Creation System.
                </Hit>
                <p>
                  Imagine looking up 90 days from now with a clear vision for your life, a system you
                  actually use, and months of evidence that you know how to return to the life you choose.
                </p>
                <Punch>That&rsquo;s Vibrational Fitness.</Punch>
              </Body>
            </div>
          </PricingBlock>
        </div>
      </Section>

      <Section>
        <SectionPhoto
          side="left"
          src="/home-preview/photos/family-lake-home.jpg"
          alt="Jordan and Vanessa with their first baby at their waterfront home"
        >
          <Eyebrow className="lg:text-left">Now</Eyebrow>
          <Display className="lg:text-left">
            Start Creating
            <br />
            <Accent>Deliberately</Accent>
          </Display>
          <Body>
            <p>You already know the law.</p>
            <Hit>Now it&rsquo;s time to live it.</Hit>
            <p>
              To get clear on the life you choose&mdash;and intentionally bring your thoughts, words, and
              actions into alignment with it.
            </p>
            <p>
              The dream body <span className="font-semibold text-white">AND</span> the dream partner{' '}
              <span className="font-semibold text-white">AND</span> the dream work{' '}
              <span className="font-semibold text-white">AND</span> the dream bank account.
            </p>
            <p>Not someday.</p>
            <p>And not at the expense of enjoying the life you have right now.</p>
            <p>
              You don&rsquo;t need another book, another course, or more information about how
              manifestation works.
            </p>
            <Hit>
              You need a vision. You need a way to align with it. And you need to practice living it.
            </Hit>
            <p>That&rsquo;s what Vibration Fit was built to help you do.</p>
            <p>You are not years away.</p>
          </Body>
          <Punch>You are one vision away.</Punch>
          <Body>
            <p>If you&rsquo;re ready to step into the Life You Choose&trade;, welcome home.</p>
            <p className="hp-display text-left text-[1.65rem] leading-tight text-[#39FF14] md:text-[2rem]">
              We&rsquo;ll see you inside.
            </p>
          </Body>
          <Cta className="lg:justify-start" />
        </SectionPhoto>
      </Section>
    </div>
  )
}
