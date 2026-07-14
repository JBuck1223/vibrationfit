import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Container, Heading, Text, ButtonLink } from '@/lib/design-system'
import { GreenLineSection } from '@/components/GreenLineSection'
import { DownloadButton } from './DownloadButton'

export const metadata: Metadata = {
  title: 'From $100K in Debt to $100K in the Bank | Vibration Fit',
  description:
    'The A.U.R.A. Process, the daily incantation, and the exact money playbook that carried us out of six figures of debt and into freedom. Free guide with worksheets.',
}

const CONTENT_CARDS = [
  {
    num: '01',
    name: 'The Green Line',
    desc: 'The two concepts everything else is built on.',
  },
  {
    num: '02',
    name: 'A.U.R.A. Process',
    desc: 'Four steps to replace any vibration that isn\u2019t serving you.',
  },
  {
    num: '03',
    name: 'The Incantation',
    desc: 'The words we said out loud every single day.',
  },
  {
    num: '04',
    name: 'Money Playbook',
    desc: 'The exact money flow that set us free.',
  },
]

const AURA_CARDS = [
  {
    letter: 'A',
    name: 'Awareness',
    desc: 'Recognize the vibration you\u2019re currently carrying.',
    color: '#FFFF00',
  },
  {
    letter: 'U',
    name: 'Unplug',
    desc: 'Step back. You are the observer, not the thought.',
    color: '#00FFFF',
  },
  {
    letter: 'R',
    name: 'Replace',
    desc: 'Choose a new, better-feeling direction.',
    color: '#BF00FF',
  },
  {
    letter: 'A',
    name: 'Activate',
    desc: 'Reinforce the new vibration until it\u2019s your default.',
    color: '#39FF14',
  },
]

const AURA_STEPS = [
  {
    num: 1,
    color: '#FFFF00',
    title: 'Awareness \u2014 Recognizing the Vibration',
    intro:
      'Awareness is the first step to shifting your vibration. In this step, we bring conscious attention to your current vibration and the way that it feels.',
    label: 'Questions to ask yourself:',
    questions: [
      'What emotions am I currently experiencing? (Refer to the Emotional Guidance Scale)',
      'Do I feel above or below the Green Line?',
      'Do I have clarity on what situation, thought, or belief is contributing to this feeling?',
      'Would I like to continue carrying this vibration forward?',
    ],
    example:
      '\u201CI feel anxious about money. Every time I look at my credit card balance, my stomach drops. This feels below the Green Line. If I continue holding onto this, I will keep feeling stressed and stuck. I don\u2019t want to stay in this vibration.\u201D',
  },
  {
    num: 2,
    color: '#00FFFF',
    title: 'Unplug \u2014 Disengaging the Old Vibration',
    intro:
      'Now that you are aware, it\u2019s time to step back from identifying with the emotion. You are not your thoughts. You are not your emotions. You are the observer.',
    label: 'Questions to ask yourself:',
    questions: [
      'Can I imagine myself as an observer, simply watching this thought without engaging with it?',
      'What would happen if I decided to let go of the story that\u2019s perpetuating this vibration?',
      'How does it feel to take a step back and recognize that I am not my thoughts?',
    ],
    example:
      '\u201CI am aware that I feel anxious because of the way I am focused on my debt. The balance is just a number \u2014 it is not who I am. I choose to consciously unplug from this energy by shifting my focus elsewhere whenever the money stress comes up.\u201D',
  },
  {
    num: 3,
    color: '#BF00FF',
    title: 'Replace \u2014 Choosing a New Direction',
    intro:
      'Now that you have unplugged from the old vibration, it\u2019s time to introduce a new one.',
    label: 'Questions to ask yourself:',
    questions: [
      'What is a better-feeling thought I can choose instead?',
      'What is the best-case scenario in this situation?',
      'What emotion would I like to feel instead?',
      'Can I think of a time when I felt this way before? What did that feel like?',
      'How can I shift my focus toward a more empowering perspective?',
    ],
    example:
      '\u201CInstead of focusing on what I owe, I can choose to focus on the money that is already flowing to me. The best-case scenario is that surplus keeps showing up and my Safe Number grows month after month. I want to feel abundant and at ease. I remember a time when money felt easy \u2014 and it felt amazing.\u201D',
  },
  {
    num: 4,
    color: '#39FF14',
    title: 'Activate \u2014 Reinforcing the New Vibration',
    intro:
      'Now that you have chosen a new perspective, you must activate it through repetition and focus.',
    label: 'How to activate:',
    questions: [
      'Use activation cycles \u2014 holding the new thought for at least 68 seconds at a time \u2014 to solidify the new vibrational signature.',
      'Intentionally activate the new thought pattern anytime you become aware that the old default pattern is engaged. Repeat this until your chosen thought pattern is your new default.',
    ],
    example:
      '\u201CI will take three deep breaths and remind myself that I am in control of my energy. I will repeat: \u2018God\u2019s wealth is circulating in my life! His wealth cascades to me in avalanches of abundance.\u2019 I will visualize (for at least 68 seconds at a time) my Safe Number sitting in my account and my balances shrinking. I will check in with myself throughout the day \u2014 especially when I pay bills \u2014 to keep activating my chosen vibration.\u201D',
  },
]

const HOW_CARDS = [
  {
    title: 'Say it out loud',
    desc: 'Whispering doesn\u2019t cut it. Speak it with your whole body \u2014 rhythm, breath, and certainty \u2014 until you feel the words, not just hear them.',
  },
  {
    title: 'Repeat it daily',
    desc: 'In the car, in the shower, on a walk. Repetition is the point: you\u2019re training a new default vibration, one activation cycle at a time.',
  },
  {
    title: 'Hold it 68 seconds',
    desc: 'Hold the feeling of the words for at least 68 seconds without contradicting them. That\u2019s one clean activation \u2014 stack them until abundance is your baseline.',
  },
]

const MONEY_STEPS: { title: React.ReactNode; body: React.ReactNode }[] = [
  {
    title: (
      <>
        Determine your <span className="text-[#39FF14]">Safe Number</span>
      </>
    ),
    body: (
      <>
        This is the number that, if it were sitting in the bank, would make you actually{' '}
        <strong className="text-white">feel safe for a minimum of 90 days</strong> &mdash; even if
        no new money came in.
      </>
    ),
  },
  {
    title: 'Go to minimums on all debt',
    body: 'Instead of trying to allocate more money to debt, begin by making the absolute minimum payment on everything \u2014 just enough to keep it from getting larger. This is especially true for high-interest credit cards.',
  },
  {
    title: (
      <>
        Tune to the vibration of <span className="text-[#39FF14]">more than enough</span>
      </>
    ),
    body: (
      <>
        The universe is infinitely abundant &mdash; there is always more available to you than you
        are currently letting in, because there is just always more available! Get into vibrational
        harmony with additional abundance &mdash; whether it&rsquo;s{' '}
        <strong className="text-white">$1, $100, $1,000, or $10,000</strong> &mdash; and look for
        any way to create a surplus beyond what you normally bring in.
      </>
    ),
  },
  {
    title: 'Build to your Safe Number',
    body: 'Allocate all additional money \u2014 everything beyond your absolute spending and your minimums \u2014 to your Safe Number until you reach it.',
  },
  {
    title: 'Sweep the high-interest debt \u2014 monthly',
    body: (
      <>
        Once your Safe Number is in place, stay above that line. Then,{' '}
        <strong className="text-white">
          at the end of each month, once all your payments are satisfied
        </strong>
        , sweep everything above your Safe Number to debt.{' '}
        <strong className="text-white">Above 5% is high interest; below 5% is low interest</strong>{' '}
        (we&rsquo;ll deal with that later). Sweep to the smallest balance first, killing cards and
        obligations one at a time, until all high-interest debt is gone!
      </>
    ),
  },
  {
    title: (
      <>
        Escalate to your <span className="text-[#39FF14]">Super Safe Number</span>
      </>
    ),
    body: (
      <>
        You&rsquo;ll be tempted to start paying down the low-interest debt for that amazing feeling
        of being completely debt-free &mdash; but not yet. First, escalate your Safe Number to a
        minimum of <strong className="text-white">6 months of feeling safe, up to 12 months</strong>{' '}
        depending on your family situation. For many people this lands somewhere around
        $30,000&ndash;$50,000. Keep making normal payments on all low-interest debt until you reach
        it.
      </>
    ),
  },
  {
    title: 'Sweep again \u2014 and go completely debt-free',
    body: (
      <>
        With your Super Safe Number in place, perform the same sweeping process to eliminate all
        low-interest debt &mdash; student loans, car payments, all of it. When you owe no one in the
        world anything and you are completely liquid, you hit a{' '}
        <strong className="text-white">magical pivot point</strong>.
      </>
    ),
  },
]

const CATEGORIES = [
  'Fun',
  'Health',
  'Travel',
  'Love',
  'Family',
  'Social',
  'Home',
  'Work',
  'Money',
  'Stuff',
  'Giving',
  'Spirituality',
]

function Eyebrow({ children, color = '#00FFFF' }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-block rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-widest"
      style={{
        color,
        borderColor: `${color}66`,
        backgroundColor: `${color}14`,
      }}
    >
      {children}
    </span>
  )
}

export default function HundredKPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(80% 60% at 50% 0%, rgba(57,255,20,0.10), rgba(0,255,255,0.04) 50%, transparent 75%)',
          }}
        />
        <Container size="md" className="relative">
          <div className="text-center">
            <Eyebrow color="#39FF14">As promised &mdash; everything that worked for us</Eyebrow>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white md:text-6xl">
              From <span className="text-[#FF0040]">$100K in Debt</span>
              <br />
              to <span className="text-[#39FF14]">$100K in the Bank</span>
            </h1>
            <Text size="lg" className="mx-auto mt-6 max-w-2xl text-neutral-300">
              This is exactly what we used: the A.U.R.A. Process, the daily incantation, and the
              money playbook that carried us out of the hole and into freedom. Use them to replace
              any vibration that isn&rsquo;t serving you with one that does.
            </Text>
            <div className="mt-8 flex justify-center">
              <DownloadButton />
            </div>
            <Text size="sm" className="mt-3 text-neutral-500">
              Free guide &mdash; includes printable worksheets
            </Text>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CONTENT_CARDS.map((card) => (
              <div
                key={card.num}
                className="rounded-2xl border-2 border-[#1F1F1F] bg-[#0A0A0A] p-5 text-center"
              >
                <div className="text-xs font-bold tracking-widest text-neutral-500">
                  {card.num}
                </div>
                <div className="mt-1 font-semibold text-white">{card.name}</div>
                <Text size="sm" className="mt-1 text-neutral-400">
                  {card.desc}
                </Text>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center text-neutral-400">
            <p>Love,</p>
            <p className="mt-1 text-lg font-semibold text-white">
              Vanessa &amp; Jordan Buckingham
            </p>
            <p className="text-sm">Founders of Vibration Fit</p>
          </div>
        </Container>
      </section>

      {/* ============ GREEN LINE ============ */}
      <section className="py-16 md:py-24">
        <Container size="lg">
          <div className="mb-8 text-center">
            <Eyebrow>Before the four steps &mdash; two concepts you&rsquo;ll need</Eyebrow>
          </div>
          <GreenLineSection />
        </Container>
      </section>

      {/* ============ EMOTIONAL GUIDANCE SCALE ============ */}
      <section className="py-16 md:py-24">
        <Container size="md">
          <div className="text-center">
            <Eyebrow>Your built-in GPS</Eyebrow>
            <Heading level={2} className="mt-4 text-white">
              The{' '}
              <span className="bg-gradient-to-r from-[#00FFFF] to-[#39FF14] bg-clip-text text-transparent">
                Emotional Guidance Scale
              </span>
            </Heading>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border-2 border-[#1F1F1F] bg-[#0A0A0A] p-4 md:p-8">
            <div className="relative mx-auto w-full max-w-2xl">
              <Image
                src="/images/emotional-guidance-scale.png"
                alt="Emotional Guidance Scale and the Green Line"
                width={1200}
                height={1200}
                className="h-auto w-full rounded-xl"
              />
            </div>
          </div>

          <Text className="mx-auto mt-6 max-w-2xl text-center text-neutral-400">
            The Emotional Guidance Scale, as described by{' '}
            <strong className="text-white">Abraham Hicks</strong>. Every emotion is information
            &mdash; a reading on how close your current vibration is to the life you&rsquo;re
            choosing. The Green Line sits between contentment and boredom: above it, momentum lifts
            you higher; below it, momentum pulls you further down. In the Awareness step, use this
            scale to locate exactly where you are &mdash; then use the rest of A.U.R.A. to climb.
          </Text>
        </Container>
      </section>

      {/* ============ A.U.R.A. PROCESS ============ */}
      <section className="py-16 md:py-24">
        <Container size="lg">
          <div className="text-center">
            <Heading level={2} className="text-white">
              The <span className="text-[#FFFF00]">A</span>.
              <span className="text-[#00FFFF]">U</span>.<span className="text-[#BF00FF]">R</span>.
              <span className="text-[#39FF14]">A</span>. Process
            </Heading>
            <Text size="lg" className="mx-auto mt-4 max-w-2xl text-neutral-300">
              Four steps to replace any vibration that isn&rsquo;t serving you with one that does.
            </Text>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AURA_CARDS.map((card, i) => (
              <div
                key={i}
                className="rounded-2xl border-2 p-5 text-center"
                style={{
                  borderColor: `${card.color}55`,
                  backgroundColor: `${card.color}0D`,
                }}
              >
                <div className="text-3xl font-extrabold" style={{ color: card.color }}>
                  {card.letter}
                </div>
                <div className="mt-1 font-semibold text-white">{card.name}</div>
                <Text size="sm" className="mt-1 text-neutral-400">
                  {card.desc}
                </Text>
              </div>
            ))}
          </div>

          <div className="mt-12 space-y-8">
            {AURA_STEPS.map((step) => (
              <div
                key={step.num}
                className="rounded-3xl border-2 border-[#1F1F1F] bg-[#0A0A0A] p-6 md:p-8"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-extrabold text-black"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.num}
                  </div>
                  <Heading level={3} className="!mb-0 text-white">
                    {step.title}
                  </Heading>
                </div>
                <Text className="mt-4 text-neutral-300">{step.intro}</Text>
                <div
                  className="mt-5 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: step.color }}
                >
                  {step.label}
                </div>
                <ul className="mt-3 space-y-2">
                  {step.questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-300">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: step.color }}
                      />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
                <div
                  className="mt-6 rounded-2xl border-l-4 bg-white/[0.03] p-5"
                  style={{ borderColor: step.color }}
                >
                  <div
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: step.color }}
                  >
                    Example
                  </div>
                  <Text className="mt-2 italic text-neutral-300">{step.example}</Text>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-[#39FF14]/30 bg-[#39FF14]/5 p-6 text-center">
            <Text className="text-neutral-300">
              You can&rsquo;t U-turn at 70 mph. If you&rsquo;re heading the wrong direction at full
              speed, you can&rsquo;t safely flip it instantly &mdash; and vibration works exactly
              the same way. A.U.R.A. is how you slow down, turn around, and build speed in the
              direction you actually want to go.
            </Text>
          </div>
        </Container>
      </section>

      {/* ============ THE INCANTATION ============ */}
      <section className="py-16 md:py-24">
        <Container size="md">
          <div className="text-center">
            <Eyebrow color="#BF00FF">The words we said out loud &mdash; every single day</Eyebrow>
            <Heading level={2} className="mt-4 text-white">
              The{' '}
              <span className="bg-gradient-to-r from-[#BF00FF] to-[#00FFFF] bg-clip-text text-transparent">
                Incantation
              </span>{' '}
              That Carried Us From Debt to Abundance
            </Heading>
            <Text size="lg" className="mx-auto mt-4 max-w-2xl text-neutral-300">
              When we were six figures in debt &mdash; literally moving 43 cents between bank
              accounts to dodge an overdraft fee &mdash; this was the incantation we repeated daily
              to activate a vibration of abundance. It became the soundtrack of our turnaround.
            </Text>
          </div>

          <div className="mt-10 rounded-3xl border-2 border-[#BF00FF]/50 bg-gradient-to-br from-[#BF00FF]/10 to-[#00FFFF]/5 p-8 md:p-12">
            <p className="text-center text-xl font-semibold leading-relaxed text-white md:text-2xl">
              God&rsquo;s wealth is circulating in our lives!
              <br />
              His wealth cascades to us in <em className="text-[#00FFFF]">avalanches of abundance</em>.
              <br />
              All of our needs, desires and goals are met instantaneously by infinite intelligence
              &mdash; for we are one with God and God is everything.
            </p>
          </div>
          <Text size="sm" className="mt-4 text-center text-neutral-500">
            Adapted from an incantation shared by Tony Robbins and Louise Hay &mdash; we exchanged a
            few words to make it land even more for us. Make it yours, too.
          </Text>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {HOW_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border-2 border-[#1F1F1F] bg-[#0A0A0A] p-6"
              >
                <div className="font-semibold text-[#00FFFF]">{card.title}</div>
                <Text size="sm" className="mt-2 text-neutral-400">
                  {card.desc}
                </Text>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ============ MONEY FRAMEWORK ============ */}
      <section className="py-16 md:py-24">
        <Container size="md">
          <div className="text-center">
            <Eyebrow color="#39FF14">The exact playbook we followed</Eyebrow>
            <Heading level={2} className="mt-4 text-white">
              The Money Framework: From{' '}
              <span className="text-[#FF0040]">$100K in the Hole</span> to{' '}
              <span className="text-[#39FF14]">$100K in the Bank</span>
            </Heading>
            <Text size="lg" className="mx-auto mt-4 max-w-2xl text-neutral-300">
              This is the flow that carried us out of six figures of debt &mdash; very simple, but
              very powerful. The target at every step: vibrational harmony with the infinite
              abundance already available to you.
            </Text>
          </div>

          <div className="mt-10 space-y-4">
            {MONEY_STEPS.map((step, i) => (
              <div
                key={i}
                className="flex gap-5 rounded-2xl border-2 border-[#1F1F1F] bg-[#0A0A0A] p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#39FF14] text-lg font-extrabold text-black">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  <Text className="mt-2 text-neutral-300">{step.body}</Text>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border-2 border-[#00FFFF]/40 bg-[#00FFFF]/5 p-6 md:p-8">
            <h3 className="text-xl font-bold text-[#00FFFF]">Our numbers</h3>
            <Text className="mt-3 text-neutral-300">
              Our first Safe Number &mdash; back when it was just the two of us, no children &mdash;
              was <strong className="text-white">$10,000</strong>. We held that number solid and
              swept everything left at the end of each month exactly as described above. Our Super
              Safe Number was <strong className="text-white">$50,000</strong>; once we reached it,
              we swept away the remaining student debt, car payments, and every last low-interest
              balance. Then the pivot: completely liquid and debt-free, cash began popping like
              crazy &mdash; the first <strong className="text-white">$100,000</strong> was quickly
              in hand, and it grew to <strong className="text-white">$250,000 and beyond</strong>.
              That base cash put 20% down on our dream home, paid cash for a brand-new Honda
              Odyssey Elite, and set us and our kids up for a life of freedom and fun.
            </Text>
          </div>

          <Text className="mx-auto mt-8 max-w-2xl text-center text-neutral-400">
            No matter where you are, we truly believe a vibrational shift can be made in your life.
            Reality is subjective, so your experience will be your own &mdash; but the target is
            always vibrational harmony with infinite abundance. As our incantation says: all of our
            needs, desires and goals are met instantaneously by infinite intelligence, for we are
            one with God and God is everything.{' '}
            <strong className="text-white">Love and light to you, from us!</strong> We look forward
            to hearing about your transformation as you step into the life you choose.
          </Text>
        </Container>
      </section>

      {/* ============ WORKSHEETS + DOWNLOAD ============ */}
      <section className="py-16 md:py-24">
        <Container size="md">
          <div className="rounded-3xl border-2 border-[#39FF14]/40 bg-gradient-to-br from-[#39FF14]/10 to-[#00FFFF]/5 p-8 text-center md:p-12">
            <Heading level={2} className="text-white">
              Do the work &mdash; grab the guide with printable worksheets
            </Heading>
            <Text size="lg" className="mx-auto mt-4 max-w-2xl text-neutral-300">
              The free PDF includes everything on this page plus printer-friendly worksheets: find
              your Safe Number, list every debt, track the abundance you notice coming in, build to
              your Safe Number month by month, and run your monthly sweep.
            </Text>
            <div className="mt-8 flex justify-center">
              <DownloadButton />
            </div>
          </div>
        </Container>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="pb-20 md:pb-28">
        <Container size="md">
          <div className="text-center">
            <Heading level={2} className="text-white">
              Consciously create your reality around{' '}
              <span className="text-[#39FF14]">12 life categories</span>
            </Heading>
            <Text size="lg" className="mx-auto mt-4 max-w-2xl text-neutral-300">
              A.U.R.A. is one tool inside a complete conscious creation system &mdash; your written
              life vision, personalized vision audios, vision board, and daily activation
              practices.
            </Text>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-[#00FFFF]/50 px-4 py-1.5 text-sm font-medium text-[#00FFFF]"
                >
                  {cat}
                </span>
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <ButtonLink href="/" variant="primary" size="lg">
                Learn More at VibrationFit.com
                <ArrowRight className="ml-2 h-5 w-5" />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}
