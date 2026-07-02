import Image from 'next/image'
import { ButtonLink } from '@/lib/design-system/components'
import { GreenLineSection } from '@/components/GreenLineSection'
import {
  MapPin,
  Factory,
  Cog,
  Fuel,
  Eye,
  Key,
  Users,
  Wrench,
  Gauge,
  Activity,
  BookOpen,
  TrendingUp,
  Compass,
  Sparkles,
  Play,
  Heart,
  Target,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'

export const metadata = {
  title: 'What is a Conscious Creation System? | Vibration Fit',
  description:
    'Your Conscious Creation System is the machine that drives you from the life you have to the life you choose. See how every part fits together.',
}

const machineParts = [
  {
    feature: 'Life Vision',
    home: 'Destination / GPS',
    desc: 'Point B. We help you build and program it during the Intensive, then you refine it over time.',
    icon: MapPin,
  },
  {
    feature: 'Activation Intensive',
    home: 'Assembly Line',
    desc: '72 hours where we program your destination and bolt every part of the machine together.',
    icon: Factory,
  },
  {
    feature: 'My Alignment Plan (MAP)',
    home: 'Engine + Transmission',
    desc: 'Turns daily practice into motion and sets the cadence. The heart of the machine.',
    icon: Cog,
  },
  {
    feature: 'Vision Audio',
    home: 'Fuel / Ignition',
    desc: 'High-octane fuel you burn to run the engine and fire your state into alignment each day.',
    icon: Fuel,
  },
  {
    feature: 'Vision Board',
    home: 'Windshield',
    desc: 'The forward view you keep your eyes on toward the destination.',
    icon: Eye,
  },
  {
    feature: 'Daily Paper',
    home: 'Ignition Key',
    desc: 'Your daily start-up that sets today\u2019s dominant point of attraction before the world floods in.',
    icon: Key,
  },
  {
    feature: 'Vibe Tribe',
    home: 'Convoy',
    desc: 'You travel faster and safer in a group than white-knuckling it alone.',
    icon: Users,
  },
  {
    feature: 'Alignment Gym',
    home: 'Pit Crew',
    desc: 'Scheduled expert maintenance that keeps the machine running clean.',
    icon: Wrench,
  },
  {
    feature: 'Tracking',
    home: 'Dashboard Gauges',
    desc: 'One gauge per wheel: Creations, Activations, Connections, Sessions.',
    icon: Gauge,
  },
  {
    feature: 'Green Line',
    home: 'Alignment Needle',
    desc: 'The needle on the main gauge you keep the machine above.',
    icon: Activity,
  },
  {
    feature: 'Conscious Creation Journal',
    home: 'Trip Log',
    desc: 'The running record of what\u2019s shifting over time.',
    icon: BookOpen,
  },
  {
    feature: 'Abundance Tracker',
    home: 'Odometer',
    desc: 'Tracks the material proof accumulating as you close the distance to Point B.',
    icon: TrendingUp,
  },
  {
    feature: 'VIVA',
    home: 'Co-Pilot',
    desc: 'Explains the system, reads every gauge, and suggests the next best move.',
    icon: Compass,
  },
]

const operations = [
  {
    step: '01',
    title: 'Design',
    icon: Target,
    dot: 'bg-[#39FF14] shadow-[0_0_20px_#39FF14]',
    text: 'text-[#39FF14]',
    desc: 'Choose what you want to include in your experience. The Life I Choose, Vision, audio, and board turn your dream life into something specific.',
  },
  {
    step: '02',
    title: 'Align',
    icon: RefreshCw,
    dot: 'bg-[#00FFFF] shadow-[0_0_20px_#00FFFF]',
    text: 'text-[#00FFFF]',
    desc: 'MAP, Projects, and your four Parts (Creations, Activations, Connections, Sessions) bring your thoughts, feelings, and actions into harmony with that design.',
  },
  {
    step: '03',
    title: 'Enjoy',
    icon: Heart,
    dot: 'bg-[#BF00FF] shadow-[0_0_20px_#BF00FF]',
    text: 'text-[#BF00FF]',
    desc: 'The Green Line, Daily Paper, journal, and Abundance Tracker help you enjoy more freedom and joy now and see expansion as evidence, not a test.',
  },
]

const philosophy = [
  {
    label: 'Foundation',
    title: 'Freedom',
    desc: 'You are free to choose your focus, your meaning, your response, your identity, and the emotional state you cultivate.',
    color: '#39FF14',
  },
  {
    label: 'Purpose',
    title: 'Joy',
    desc: 'Joy is the state from which creativity, love, play, curiosity, gratitude, and expansion naturally emerge.',
    color: '#00FFFF',
  },
  {
    label: 'Mechanism',
    title: 'Emotions as Guidance',
    desc: 'Your emotions are guidance. Emotional states attract the conditions that perpetuate emotional states. In other words, emotions become experiences, and experiences reinforce emotions.',
    color: '#BF00FF',
  },
  {
    label: 'Practice',
    title: 'Design \u2192 Align \u2192 Enjoy',
    desc: 'The Conscious Creation System you run every day.',
    color: '#FFD700',
  },
  {
    label: 'Result',
    title: 'Expansion & meaningful manifestations',
    desc: 'A life that increasingly reflects who you\u2019ve become. The manifestations are feedback, not the finish line.',
    color: '#39FF14',
  },
]

const parts = [
  {
    title: 'Creations',
    bucket: 'Artifacts',
    question: 'What objects exist because of me?',
    desc: 'Visions, audios, boards, journals \u2014 artifacts you build. Proof the inner work is real and accumulating.',
    icon: Sparkles,
    accent: '#FFD700',
  },
  {
    title: 'Activations',
    bucket: 'Practice',
    question: 'How many times did I show up and do the work?',
    desc: 'Daily reps that keep your signal aligned with your vision. The frequency of your practice.',
    icon: Play,
    accent: '#39FF14',
  },
  {
    title: 'Connections',
    bucket: 'Community',
    question: 'How many times did I interact with the community?',
    desc: 'Vibe Tribe posts, comments, and hearts. How you plug your vision into the field of other humans.',
    icon: Heart,
    accent: '#BF00FF',
  },
  {
    title: 'Sessions',
    bucket: 'Coaching',
    question: 'How often am I showing up to live coaching?',
    desc: 'Alignment Gym live coaching and replays. Structured containers where you\u2019re guided back into alignment.',
    icon: Users,
    accent: '#14B8A6',
  },
]

// Callouts overlaid on the side-profile cutaway (desktop only). x/y are
// percentages tuned to the generated diagram; placement controls label side.
const carCallouts = [
  { feature: 'Vision Audio', home: 'Fuel + Ignition', x: 20, y: 46, placement: 'top' as const },
  { feature: 'Vision Board', home: 'Windshield', x: 56, y: 33, placement: 'top' as const },
  { feature: 'My Alignment Plan', home: 'Engine + Transmission', x: 80, y: 47, placement: 'top' as const },
  { feature: 'VIVA', home: 'Co-Pilot', x: 46, y: 49, placement: 'bottom' as const },
  { feature: 'Life Vision', home: 'GPS \u00b7 Destination', x: 64, y: 44, placement: 'bottom' as const },
]


export default function ConsciousCreationSystemPage() {
  return (
    <div className="-mt-6 md:-my-12 lg:-mt-8">
      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden">
        {/* ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#39FF14]/10 blur-[120px]" />
        <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-4 text-center md:pt-28">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#39FF14]/80 md:text-xs">
            How Vibration Fit works
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-7xl">
            The Conscious
            <br />
            Creation System
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-300 md:text-2xl md:leading-relaxed">
            The machine that drives you from the life you have to the life you
            choose.
          </p>
        </div>

        {/* hero machine image — blends into black */}
        <div className="relative mx-auto -mt-4 max-w-4xl px-4 md:-mt-8">
          <div className="relative aspect-[3/2]">
            <Image
              src="/images/system/system-hero-v3.png"
              alt="The Conscious Creation System, visualized as a sleek vehicle"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-contain"
            />
          </div>
        </div>

        <div className="relative mx-auto -mt-6 max-w-2xl px-6 pb-4 text-center md:-mt-12">
          <p className="text-base text-neutral-400 md:text-lg">
            We help you program the destination, build the machine in 72 hours,
            then you drive it every day &mdash; engine running, dashboard lit,
            co-pilot beside you.
          </p>
          <p className="mt-4 text-sm italic text-neutral-500 md:text-base">
            If you&rsquo;ve ever tried to manifest with random journaling and
            inconsistent practice, this is the system that fixes that.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/#pricing" variant="primary" size="lg">
              Start the 72-Hour Activation Intensive
              <ArrowRight className="h-5 w-5" />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ===================== PHILOSOPHY ===================== */}
      <section className="relative mx-auto mt-24 max-w-3xl px-6 md:mt-36">
        <div className="text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-500 md:text-xs">
            The philosophy
          </p>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            We teach joy
            <span className="text-[#39FF14]"> &rarr; </span>
            manifestation.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-neutral-400 md:text-lg">
            Most systems chase the manifestation, then the joy. We start the
            other way around. Freedom makes joy possible. Joy fuels creation.
            The manifestations aren&rsquo;t the goal &mdash; they&rsquo;re feedback.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-2xl">
          {philosophy.map((p, i) => (
            <div key={p.label} className="relative flex gap-5 pb-10 last:pb-0">
              {i < philosophy.length - 1 && (
                <span className="absolute left-[7px] top-6 h-full w-px bg-gradient-to-b from-neutral-700 to-neutral-800/30" />
              )}
              <span
                className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: p.color,
                  boxShadow: `0 0 16px ${p.color}`,
                }}
              />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  {p.label}
                </p>
                <h3 className="mt-1 text-xl font-bold text-white md:text-2xl">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-sm text-neutral-400 md:text-base">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== POINT A -> POINT B ===================== */}
      <section className="relative mt-20 md:mt-32">
        <div className="mx-auto mb-8 max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Point A to Point B.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-neutral-400 md:text-lg">
            Most people manifest from chaos &mdash; random journaling, occasional
            meditations, bursts of action. Inconsistent inputs, inconsistent
            results. A system fixes the inputs.
          </p>
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          {/* Point B label — above image, top right */}
          <div className="mb-2 flex justify-end md:mb-3">
            <div className="flex items-end gap-2 md:gap-3">
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#39FF14] md:text-xs">
                  Point B
                </p>
                <p className="text-sm font-semibold text-white md:text-2xl">
                  Your Life Vision
                </p>
              </div>
              <svg className="h-6 w-6 shrink-0 text-[#39FF14] md:h-8 md:w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 7l10 10" />
                <path d="M17 7v10H7" />
              </svg>
            </div>
          </div>

          <div className="relative aspect-[3/2]">
            <Image
              src="/images/system/system-journey-v4.png"
              alt="A glowing vehicle driving from your current reality toward your Life Vision"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>

          {/* Point A label — below image, bottom left */}
          <div className="mt-2 flex justify-start md:mt-3">
            <div className="flex items-start gap-2 md:gap-3">
              <svg className="h-6 w-6 shrink-0 text-neutral-400 md:h-8 md:w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 17L7 7" />
                <path d="M7 17V7h10" />
              </svg>
              <div className="text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400 md:text-xs">
                  Point A
                </p>
                <p className="text-sm font-semibold text-white md:text-2xl">
                  The life you have today
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== THE CYCLE (3 OPERATIONS) ===================== */}
      <section className="relative mx-auto mt-24 max-w-3xl px-6 md:mt-36">
        <div className="text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-500 md:text-xs">
            The Conscious Creation System
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Design. Align. Enjoy.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-neutral-400 md:text-lg">
            The three steps the system runs, over and over. Run the loop and
            the outer world catches up.
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {operations.map((op) => (
            <div key={op.title} className="flex gap-5">
              <div className="flex flex-col items-center pt-1">
                <span
                  className={`h-3.5 w-3.5 shrink-0 rounded-full ${op.dot}`}
                />
              </div>
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-xs font-mono text-neutral-600">
                    {op.step}
                  </span>
                  <h3 className={`text-xl font-bold ${op.text}`}>
                    {op.title}
                  </h3>
                </div>
                <p className="mt-0.5 text-sm font-medium text-neutral-300">
                  {op.tagline}
                </p>
                <p className="mt-1.5 text-sm text-neutral-400 md:text-base">
                  {op.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== THE 4 PARTS (REPS) ===================== */}
      <section className="relative mx-auto mt-24 max-w-6xl px-6 md:mt-36">
        <div className="mb-12 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-500 md:text-xs">
            The Reps
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            We only track four things.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-neutral-400 md:text-lg">
            If it&rsquo;s not a Creation, Activation, Connection, or Session, we
            don&rsquo;t track it. Your MAP only schedules these four.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-500 md:text-base">
            Each one answers a single, simple question. Together they are every
            rep your MAP schedules and your dashboard measures.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {parts.map((part) => {
            const PartIcon = part.icon
            return (
              <div
                key={part.title}
                className="group relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 p-8 transition-all duration-300 hover:-translate-y-1"
                style={{ boxShadow: `inset 0 0 0 1px transparent` }}
              >
                {/* accent glow */}
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-40"
                  style={{ backgroundColor: part.accent }}
                />
                <div className="relative">
                  <div
                    className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: `${part.accent}1a`,
                      border: `1px solid ${part.accent}40`,
                    }}
                  >
                    <PartIcon
                      className="h-6 w-6"
                      style={{ color: part.accent }}
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-white">
                      {part.title}
                    </h3>
                    <span className="text-sm text-neutral-500">
                      {part.bucket}
                    </span>
                  </div>
                  <p
                    className="mt-1 text-base font-medium"
                    style={{ color: part.accent }}
                  >
                    {part.question}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-neutral-400">
                    {part.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ===================== THE MACHINE (EXPLODED) ===================== */}
      <section className="relative mt-24 md:mt-36">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-500 md:text-xs">
            One machine
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Every feature is a gear.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-neutral-400 md:text-lg">
            Nothing in Vibration Fit is a random tool. Every part has a job in
            the same machine.
          </p>
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="relative aspect-[3/2]">
            <Image
              src="/images/system/system-machine-v3.png"
              alt="Side-profile cutaway of the Conscious Creation System, with each app feature mapped to a part of the vehicle"
              fill
              sizes="100vw"
              className="object-contain"
            />
            {/* Labeled callouts (desktop) */}
            <div className="absolute inset-0 hidden md:block">
              {carCallouts.map((c) => (
                <div
                  key={c.feature}
                  className="absolute"
                  style={{ left: `${c.x}%`, top: `${c.y}%` }}
                >
                  {/* anchor dot, centered on the part */}
                  <span className="absolute -translate-x-1/2 -translate-y-1/2 block h-2.5 w-2.5 rounded-full bg-[#39FF14] shadow-[0_0_12px_#39FF14]" />
                  {c.placement === 'top' ? (
                    <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 flex-col items-center">
                      <div className="whitespace-nowrap rounded-lg bg-black/70 px-2.5 py-1.5 text-center backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                          {c.feature}
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {c.home}
                        </p>
                      </div>
                      <span className="h-7 w-px bg-gradient-to-b from-transparent to-[#39FF14]/70" />
                    </div>
                  ) : (
                    <div className="absolute top-0 left-1/2 flex -translate-x-1/2 flex-col items-center">
                      <span className="h-7 w-px bg-gradient-to-t from-transparent to-[#39FF14]/70" />
                      <div className="whitespace-nowrap rounded-lg bg-black/70 px-2.5 py-1.5 text-center backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                          {c.feature}
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {c.home}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {machineParts.map((part) => {
              const PartIcon = part.icon
              return (
                <div
                  key={part.feature}
                  className="flex gap-4 border-t border-neutral-900 pt-5"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#39FF14]/10">
                    <PartIcon className="h-4.5 w-4.5 text-[#39FF14]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight text-white">
                      {part.feature}
                    </p>
                    <p className="text-xs font-medium text-[#39FF14]">
                      {part.home}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                      {part.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===================== THE ENGINE (4-Layer Architecture) ===================== */}
      <section className="relative mx-auto mt-24 max-w-6xl px-6 md:mt-36">
        <div className="mb-12 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-500 md:text-xs">
            The writing engine
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Meet the Engine Behind VIVA Vision
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-neutral-400 md:text-lg">
            When you do your Creations reps, VIVA uses a 4-Layer Conscious
            Creation Writing Architecture to make your vision feel real and
            stick.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-500">
            In 2011, Jordan wrote his first Life I Choose&trade;&mdash;and the
            same pattern showed up again in 2014. When Vanessa joined, structure
            met soul. We taught VIVA to guide anyone through it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#39FF14]/30 bg-[#39FF14]/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Layer 1
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#39FF14]">
              5-Phase Flow
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              The emotional arc inside VIVA Vision: Gratitude &rarr; Sensory
              &rarr; Embodiment &rarr; Essence &rarr; Surrender. Each vision
              paragraph follows this writing pattern.
            </p>
          </div>
          <div className="rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Layer 2
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#14B8A6]">
              Who / What / Where / Why
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              Turn vague desires into vivid scenes. VIVA prompts for who you are
              being, what you are doing, where you are, and why it matters so
              your vision feels like a real experience.
            </p>
          </div>
          <div className="rounded-2xl border border-[#BF00FF]/30 bg-[#BF00FF]/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Layer 3
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#BF00FF]">
              Being / Doing / Receiving
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              Balance identity, action, and evidence so momentum compounds
              instead of stalling out.
            </p>
          </div>
          <div className="rounded-2xl border border-[#FFB701]/30 bg-[#FFB701]/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Layer 4
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#FFB701]">
              Micro&ndash;Macro Breathing
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              Zoom into sensory detail, zoom out to meaning&mdash;paragraph
              rhythm that feels alive (and sticks).
            </p>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-base text-neutral-300">
          This is why your vision paragraphs feel vivid and emotionally charged
          instead of like vague affirmations.
        </p>
      </section>

      {/* ===================== INSTALL / RUN ===================== */}
      <section className="relative mx-auto mt-24 max-w-6xl px-6 md:mt-36">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Install it once. Run it daily. Update as life evolves.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-3xl border border-[#39FF14]/20 bg-gradient-to-br from-[#39FF14]/10 to-transparent p-8 md:p-10">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#39FF14]/15">
              <Factory className="h-6 w-6 text-[#39FF14]" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#39FF14]/80">
              Phase 1 &middot; Install
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Activation Intensive
            </h3>
            <p className="mt-3 text-base leading-relaxed text-neutral-300">
              Over 72 hours we build your Life Vision, audio, board, journal, and
              My Alignment Plan. You leave with a fully installed Conscious
              Creation System.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-[#00FFFF]/20 bg-gradient-to-br from-[#00FFFF]/10 to-transparent p-8 md:p-10">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00FFFF]/15">
              <Cog className="h-6 w-6 text-[#00FFFF]" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#00FFFF]/80">
              Phase 2 &middot; Run
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              My Alignment Plan
            </h3>
            <p className="mt-3 text-base leading-relaxed text-neutral-300">
              Your MAP schedules Creations, Activations, Connections, and
              Sessions so you stay in alignment and keep collecting evidence of
              actualization.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-[#BF00FF]/20 bg-gradient-to-br from-[#BF00FF]/10 to-transparent p-8 md:p-10">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#BF00FF]/15">
              <RefreshCw className="h-6 w-6 text-[#BF00FF]" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#BF00FF]/80">
              Phase 3 &middot; Evolve
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Update &amp; Look Back
            </h3>
            <p className="mt-3 text-base leading-relaxed text-neutral-300">
              As your desires shift, update your profile, vision, audio, board
              and MAP. Every past version is preserved so you can look back and
              see how far you&rsquo;ve come.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-2xl text-center md:mt-14">
          <p className="text-base text-neutral-300 md:text-lg">
            You install it once during the Intensive. MAP runs it daily. You update it as life evolves.
          </p>
          <div className="mt-6 flex justify-center">
            <ButtonLink href="/#pricing" variant="primary" size="lg">
              Start the 72-Hour Activation Intensive
              <ArrowRight className="h-5 w-5" />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ===================== GREEN LINE ===================== */}
      <section className="relative mx-auto mt-20 max-w-5xl px-6 md:mt-28">
        <GreenLineSection />
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="relative mx-auto mt-24 max-w-4xl px-6 md:mt-36">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            More Questions
          </h2>
        </div>

        <div className="space-y-6">
          <details className="group rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
            <summary className="cursor-pointer text-lg font-bold text-white">
              What is a Conscious Creation System?
            </summary>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-400">
              <p>
                Conscious Creation is choosing what you want to include in your
                experience, then aligning your thoughts, words, and actions with
                that choice.
              </p>
              <p>
                The Conscious Creation System is the structure in Vibration Fit
                that makes that way of living repeatable: it helps you choose
                what to include, align with it, and enjoy your life now, while
                manifestations show up as evidence, not the goal.
              </p>
              <p>
                In Vibration Fit, we install that system in 72 hours during the
                Activation Intensive, then your MAP runs it daily across
                Creations, Activations, Connections, and Sessions.
              </p>
            </div>
          </details>
          <details className="group rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
            <summary className="cursor-pointer text-lg font-bold text-white">
              What is Vibrational Fitness?
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              Vibrational fitness is your system for conscious creation.
              It&rsquo;s the practice of using a repeatable structure of
              Creations, Activations, Connections, and Sessions to stay aligned
              with your Life Vision, with your MAP showing you exactly what to do
              so your outer world naturally starts to reflect it.
            </p>
          </details>
          <details className="group rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
            <summary className="cursor-pointer text-lg font-bold text-white">
              What is the 4-Layer Conscious Creation Writing Architecture?
            </summary>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-400">
              <p>
                The energetic blueprint behind The Life I Choose&trade; vision
                document. Every Life I Choose document follows four interacting
                layers:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong className="text-white">5-Phase Flow:</strong>{' '}
                  Gratitude &rarr; Sensory Detail &rarr; Embodiment &rarr;
                  Essence &rarr; Surrender.
                </li>
                <li>
                  <strong className="text-white">
                    Who / What / Where / Why:
                  </strong>{' '}
                  Narrative orientation that gives your vision shape and clarity.
                </li>
                <li>
                  <strong className="text-white">
                    Being / Doing / Receiving:
                  </strong>{' '}
                  Vibrational cycling that keeps your energy balanced.
                </li>
                <li>
                  <strong className="text-white">
                    Micro&ndash;Macro Breathing:
                  </strong>{' '}
                  Emotional pacing that makes writing feel alive.
                </li>
              </ul>
              <p>
                Together, these four layers turn your writing into a vibrational
                practice&mdash;helping you not just describe your dream life, but
                tune to it until it becomes your reality.
              </p>
            </div>
          </details>
          <details className="group rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
            <summary className="cursor-pointer text-lg font-bold text-white">
              Can I change plans later?
            </summary>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-400">
              <p>
                <strong className="text-white">Short answer:</strong> Yes. You
                can switch plans.
              </p>
              <p>
                <strong className="text-white">Before Day 28:</strong> Switch
                from Annual to Every 28 Days or vice-versa in one click. The
                first charge still occurs on Day 28 at the new plan.
              </p>
              <p>
                <strong className="text-white">After billing starts:</strong>{' '}
                Every 28 Days &rarr; Annual: upgrade immediately with a credit
                for unused time. Annual &rarr; Every 28 Days: switch takes
                effect at renewal.
              </p>
              <p>
                Your Membership Satisfaction Guarantee (16 weeks from checkout)
                stays intact when you switch.
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* ===================== CLOSING CTA ===================== */}
      <section className="relative mt-24 overflow-hidden md:mt-36">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#39FF14]/10 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-6xl">
            Ready to install
            <br />
            your system?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-neutral-300 md:text-lg">
            The Activation Intensive is where we install your Conscious Creation
            System in 72 hours so you can stop manifesting from chaos and start
            running a repeatable machine.
          </p>
          <div className="mt-9 flex justify-center">
            <ButtonLink href="/#pricing" variant="primary" size="lg">
              Start the 72-Hour Activation Intensive
              <ArrowRight className="h-5 w-5" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  )
}
