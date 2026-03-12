'use client'

import { useState } from 'react'
import { Container, Stack, PageHero, Card, Badge, Button } from '@/lib/design-system/components'
import {
  GraduationCap,
  BookOpen,
  Heart,
  Home,
  Activity,
  PartyPopper,
  Users,
  DollarSign,
  Briefcase,
  Plane,
  Gift,
  Star,
  Package,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sun,
  Eye,
  Hand,
  Zap,
  Feather,
  Clock,
  CheckCircle,
  FileText,
  Palette,
  Music,
  TreePine,
  Brain,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const LIFE_CATEGORY_CURRICULUM = [
  {
    key: 'family',
    label: 'Family',
    theme: 'My Family Story',
    icon: Users,
    color: 'text-[#FF6B9D]',
    bgColor: 'bg-[#FF6B9D]/10',
    borderColor: 'border-[#FF6B9D]/30',
    weeks: '1-3',
    essence: 'Belonging & Joy',
    academics: 'Narrative writing, counting family members, family history, heredity (SC.1.L)',
    preschoolFocus: 'Family photo books, "In our family, we..." traditions, cooperative play',
    sampleActivity: 'Build a family timeline. Interview grandparents. Write "My family is..." in present tense.',
  },
  {
    key: 'home',
    label: 'Home',
    theme: 'Where I Live',
    icon: Home,
    color: 'text-[#14B8A6]',
    bgColor: 'bg-[#14B8A6]/10',
    borderColor: 'border-[#14B8A6]/30',
    weeks: '4-6',
    essence: 'Comfort & Peace',
    academics: 'Informational writing, measurement, Earth\'s surface & materials (SC.1.E), map skills',
    preschoolFocus: 'Neighborhood walks, sensory bins with soil/rocks/water, building with blocks',
    sampleActivity: 'Measure every room in the house. Draw a floor plan. Write "My home is..." with sensory details.',
  },
  {
    key: 'health',
    label: 'Health',
    theme: 'My Amazing Body',
    icon: Activity,
    color: 'text-[#39FF14]',
    bgColor: 'bg-[#39FF14]/10',
    borderColor: 'border-[#39FF14]/30',
    weeks: '7-9',
    essence: 'Energy & Freedom',
    academics: 'Life science — senses, plant/animal needs (SC.1.L), nutrition, addition/subtraction with food',
    preschoolFocus: 'Cooking together, yoga with animal names, five senses exploration stations',
    sampleActivity: 'Count heartbeats before and after jumping jacks. Grow a family garden. Taste test with blindfolds.',
  },
  {
    key: 'fun',
    label: 'Fun',
    theme: 'Things I Love to Do',
    icon: PartyPopper,
    color: 'text-[#FFFF00]',
    bgColor: 'bg-[#FFFF00]/10',
    borderColor: 'border-[#FFFF00]/30',
    weeks: '10-12',
    essence: 'Permission & Lightness',
    academics: 'Opinion writing ("I love ___ because"), physical science — motion & force (SC.1.P), PE focus',
    preschoolFocus: 'Choice-based play stations, outdoor obstacle courses, musical instruments',
    sampleActivity: 'Build ramps and race cars (physics). Write opinion pieces about favorite activities. Playground pendulum experiments.',
  },
  {
    key: 'social',
    label: 'Social',
    theme: 'My Friends & Community',
    icon: Users,
    color: 'text-[#00FFFF]',
    bgColor: 'bg-[#00FFFF]/10',
    borderColor: 'border-[#00FFFF]/30',
    weeks: '13-15',
    essence: 'Authenticity & Play',
    academics: 'Civics, community helpers, collaborative writing, graphing class/family data',
    preschoolFocus: 'Community helper pretend play, turn-taking games, cooperative art projects',
    sampleActivity: 'Visit a fire station. Create family agreements together ("We choose to..." not "Don\'t..."). Survey and graph favorites.',
  },
  {
    key: 'money',
    label: 'Money',
    theme: 'Counting & Sharing',
    icon: DollarSign,
    color: 'text-[#FFB701]',
    bgColor: 'bg-[#FFB701]/10',
    borderColor: 'border-[#FFB701]/30',
    weeks: '16-18',
    essence: 'Ease & Generosity',
    academics: 'Coins, addition/subtraction, place value deep dive, economics (wants vs. needs)',
    preschoolFocus: 'Counting real coins, "more/less/same" at snack time, pretend store play',
    sampleActivity: 'Run a lemonade stand (real economics). Sort and count coins. Farmer\'s market field trip with budgeting.',
  },
  {
    key: 'work',
    label: 'Work',
    theme: 'What I Create',
    icon: Briefcase,
    color: 'text-[#A855F7]',
    bgColor: 'bg-[#A855F7]/10',
    borderColor: 'border-[#A855F7]/30',
    weeks: '19-21',
    essence: 'Confidence & Pride',
    academics: 'How-to/procedural writing, STEM building projects, problem-solving math',
    preschoolFocus: 'Building and constructing, dramatic play (pretend jobs), process art',
    sampleActivity: 'Design and build a bridge from craft sticks (engineering). Write how-to instructions. Create something to sell or give.',
  },
  {
    key: 'travel',
    label: 'Travel',
    theme: 'Places Near & Far',
    icon: Plane,
    color: 'text-[#06B6D4]',
    bgColor: 'bg-[#06B6D4]/10',
    borderColor: 'border-[#06B6D4]/30',
    weeks: '22-24',
    essence: 'Wonder & Expansion',
    academics: 'Geography, maps & globes, cultural studies, comparing texts on same topic, Earth & space (SC.1.E)',
    preschoolFocus: 'Globe games, cultural food tastings, "Where in the world" explorations',
    sampleActivity: 'Map the neighborhood with cardinal directions. Night sky observation journal. Cook a dish from another culture.',
  },
  {
    key: 'love',
    label: 'Love',
    theme: 'People Who Love Me',
    icon: Heart,
    color: 'text-[#FF0080]',
    bgColor: 'bg-[#FF0080]/10',
    borderColor: 'border-[#FF0080]/30',
    weeks: '25-27',
    essence: 'Connection & Safety',
    academics: 'Poetry & letter writing, kindness focus, social-emotional deep dive',
    preschoolFocus: 'Naming emotions in self and others, empathy activities, love letter art',
    sampleActivity: 'Write letters to loved ones. Create a "People Who Love Me" book. Poetry about feelings using sensory language.',
  },
  {
    key: 'stuff',
    label: 'Stuff',
    theme: 'Things I Use & Make',
    icon: Package,
    color: 'text-[#FF6600]',
    bgColor: 'bg-[#FF6600]/10',
    borderColor: 'border-[#FF6600]/30',
    weeks: '28-30',
    essence: 'Appreciation & Care',
    academics: 'Properties of materials (science), sorting & classifying (math), recycling & care',
    preschoolFocus: 'Sorting by color/shape/size, sensory exploration of textures, building with recyclables',
    sampleActivity: 'Material science experiments (sink/float, magnetic/not). Sort and classify household objects. Build art from recycled materials.',
  },
  {
    key: 'giving',
    label: 'Giving',
    theme: 'How I Help',
    icon: Gift,
    color: 'text-[#BF00FF]',
    bgColor: 'bg-[#BF00FF]/10',
    borderColor: 'border-[#BF00FF]/30',
    weeks: '31-33',
    essence: 'Overflow & Kindness',
    academics: 'Service learning project, persuasive/opinion writing, historical figures of character (SS.1)',
    preschoolFocus: 'Helping activities, sharing games, making gifts for others',
    sampleActivity: 'Plan and execute a family service project. Study historical figures who gave (MLK, etc.). Write persuasive letter about a cause.',
  },
  {
    key: 'spirituality',
    label: 'Spirituality',
    theme: 'My Quiet Inside',
    icon: Star,
    color: 'text-[#E0E0FF]',
    bgColor: 'bg-[#E0E0FF]/10',
    borderColor: 'border-[#E0E0FF]/30',
    weeks: '34-36',
    essence: 'Trust & Presence',
    academics: 'Nature study capstone, reflection & journaling, year-in-review portfolio celebration',
    preschoolFocus: 'Mindfulness activities, nature walks with magnifying glasses, weather observation',
    sampleActivity: 'Nature journal capstone. Year-in-review portfolio celebration. Create final pages of "Life I Love" book.',
  },
]

const FIVE_PHASES = [
  {
    phase: 1,
    name: 'Gratitude Opens',
    icon: Sun,
    color: 'text-[#FFFF00]',
    bgGlow: 'shadow-[0_0_15px_rgba(255,255,0,0.15)]',
    childVersion: '"What do I already love about this?"',
    timeBlock: 'Morning Circle',
    time: '20-30 min',
    description: 'Green Line check-in, Vision Declaration, gratitude moment, preview the day',
  },
  {
    phase: 2,
    name: 'Sensory Detail Amplifies',
    icon: Eye,
    color: 'text-[#00FFFF]',
    bgGlow: 'shadow-[0_0_15px_rgba(0,255,255,0.15)]',
    childVersion: '"Let me touch it, see it, hear it"',
    timeBlock: 'Core Learning Block',
    time: '60-90 min',
    description: 'Hands-on phonics, Vision Journaling, manipulatives-based math',
  },
  {
    phase: 3,
    name: 'Embodiment Stabilizes',
    icon: Hand,
    color: 'text-[#39FF14]',
    bgGlow: 'shadow-[0_0_15px_rgba(57,255,20,0.15)]',
    childVersion: '"My body knows this"',
    timeBlock: 'Experiential Learning',
    time: '45-60 min',
    description: 'Science experiments, field trips, cooking, building, exploring',
  },
  {
    phase: 4,
    name: 'Essence Locks In',
    icon: Zap,
    color: 'text-[#BF00FF]',
    bgGlow: 'shadow-[0_0_15px_rgba(191,0,255,0.15)]',
    childVersion: '"This makes me feel ___"',
    timeBlock: 'Reflection',
    time: '10-15 min',
    description: 'Share one thing learned, name the Essence word, add to portfolio',
  },
  {
    phase: 5,
    name: 'Surrender Releases',
    icon: Feather,
    color: 'text-[#FF6B9D]',
    bgGlow: 'shadow-[0_0_15px_rgba(255,107,157,0.15)]',
    childVersion: '"I did my part, now I let it grow"',
    timeBlock: 'Afternoon Freedom',
    time: 'Open',
    description: 'Free play, independent reading, nature time — let the learning integrate',
  },
]

const GREEN_LINE_ZONES = [
  {
    zone: 'Above the Green Line',
    color: 'bg-[#39FF14]',
    textColor: 'text-[#39FF14]',
    borderColor: 'border-[#39FF14]/40',
    feelings: ['Happy', 'Excited', 'Curious', 'Calm', 'Proud', 'Playful', 'Loving'],
    response: '"I notice I feel good. I\'m ready to learn, play, and create."',
  },
  {
    zone: 'On the Green Line',
    color: 'bg-[#FFFF00]',
    textColor: 'text-[#FFFF00]',
    borderColor: 'border-[#FFFF00]/40',
    feelings: ['Okay', 'A little tired', 'Not sure', 'Thinking'],
    response: '"I notice I\'m in the middle. What would feel a little better right now?"',
  },
  {
    zone: 'Below the Green Line',
    color: 'bg-[#FF0040]',
    textColor: 'text-[#FF0040]',
    borderColor: 'border-[#FF0040]/40',
    feelings: ['Frustrated', 'Sad', 'Angry', 'Scared', 'Overwhelmed'],
    response: '"I notice I feel ___ and that\'s okay. My feelings are giving me information."',
  },
]

const FLORIDA_REQUIREMENTS = [
  { step: 'File Notice of Intent', description: 'Letter to county superintendent with child\'s name, DOB, address. File once within 30 days of starting.', icon: FileText },
  { step: 'Maintain Portfolio', description: 'Daily activity log, work samples, reading list. Preserve for 2 years.', icon: BookOpen },
  { step: 'Annual Evaluation', description: 'Portfolio review by FL-certified teacher (recommended), standardized test, or other approved method.', icon: CheckCircle },
  { step: 'Sequential Progress', description: 'Each year must build on the previous year in complexity. No specific subjects mandated.', icon: ArrowRight },
]

function ExpandableCard({ title, icon: Icon, iconColor, children, defaultOpen = false }: {
  title: string
  icon: LucideIcon
  iconColor: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className="p-0 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={iconColor}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-left">{title}</h3>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-neutral-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 md:px-6 md:pb-6 border-t border-[#333]">
          {children}
        </div>
      )}
    </Card>
  )
}

function CategoryUnitCard({ unit, index }: { unit: typeof LIFE_CATEGORY_CURRICULUM[0]; index: number }) {
  const Icon = unit.icon

  return (
    <div className={`relative rounded-xl border ${unit.borderColor} ${unit.bgColor} p-4 md:p-5`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`${unit.color} flex-shrink-0 mt-0.5`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`font-bold text-sm md:text-base ${unit.color}`}>{unit.label}</h4>
            <Badge variant="neutral" className="text-[10px] px-2 py-0.5">{unit.theme}</Badge>
          </div>
          <p className="text-[11px] md:text-xs text-neutral-400 mt-0.5">
            Weeks {unit.weeks} &middot; Essence: <span className="italic text-neutral-300">{unit.essence}</span>
          </p>
        </div>
      </div>

      <div className="space-y-2 text-xs md:text-sm">
        <div>
          <span className="text-neutral-400 font-medium">1st Grade: </span>
          <span className="text-neutral-300">{unit.academics}</span>
        </div>
        <div>
          <span className="text-neutral-400 font-medium">Preschool: </span>
          <span className="text-neutral-300">{unit.preschoolFocus}</span>
        </div>
        <div className="pt-1 border-t border-white/5">
          <span className="text-neutral-500 font-medium">Sample: </span>
          <span className="text-neutral-400 italic">{unit.sampleActivity}</span>
        </div>
      </div>
    </div>
  )
}

export default function AdminHomeschoolPage() {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="VIBRATIONFIT EDUCATION"
          title="Homeschool Curriculum"
          subtitle="A full-year, Florida-compliant homeschool program built on VibrationFit's conscious creation framework — for Preschool and First Grade"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge variant="premium" className="text-xs">Florida Home Education Compliant</Badge>
            <Badge variant="neutral" className="text-xs">Preschool (3-5) & 1st Grade (6-7)</Badge>
            <Badge variant="neutral" className="text-xs">36-Week Program</Badge>
          </div>
        </PageHero>

        {/* Philosophy Overview */}
        <Card className="p-4 md:p-6 lg:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-2">The Vision</h2>
          <p className="text-sm md:text-base text-neutral-300 mb-6 max-w-3xl">
            What if school felt like the life you choose? This curriculum applies VibrationFit&apos;s
            core methodology — present-tense vision, sensory embodiment, and vibrational alignment —
            to every subject a young learner needs. Children don&apos;t just learn reading, math, and science.
            They build their first Life Vision, one category at a time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              {
                principle: 'The basis of life is freedom',
                childLang: '"I get to choose"',
                detail: 'Children choose projects, pace, and expression within structured learning',
                color: 'text-[#39FF14]',
                borderColor: 'border-[#39FF14]/30',
              },
              {
                principle: 'The purpose of life is joy',
                childLang: '"Learning feels good"',
                detail: 'Every subject connects to wonder, play, and delight',
                color: 'text-[#00FFFF]',
                borderColor: 'border-[#00FFFF]/30',
              },
              {
                principle: 'The result of life is expansion',
                childLang: '"I notice I can do more"',
                detail: 'Portfolio tracks growth without judgment; celebrates new capacities',
                color: 'text-[#BF00FF]',
                borderColor: 'border-[#BF00FF]/30',
              },
              {
                principle: 'Activation through immersion',
                childLang: '"When I say it, I feel it"',
                detail: 'Daily vision readings, storytelling, and verbal declarations',
                color: 'text-[#FFFF00]',
                borderColor: 'border-[#FFFF00]/30',
              },
            ].map((p) => (
              <div key={p.principle} className={`rounded-xl border ${p.borderColor} bg-black/30 p-4`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${p.color}`}>{p.principle}</p>
                <p className="text-sm md:text-base font-semibold text-white mb-1">{p.childLang}</p>
                <p className="text-xs text-neutral-400">{p.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 5-Phase Daily Rhythm */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 md:w-6 md:h-6 text-[#00FFFF]" />
            <h2 className="text-xl md:text-2xl font-bold">Daily Rhythm: 5-Phase Conscious Creation Flow</h2>
          </div>
          <p className="text-sm text-neutral-400 mb-6 max-w-2xl">
            Every school day follows the same rhythm adults use in VibrationFit — adapted for young learners.
            First graders spend approximately 3-4 hours in focused morning learning.
          </p>

          <div className="space-y-3">
            {FIVE_PHASES.map((phase) => {
              const Icon = phase.icon
              return (
                <div
                  key={phase.phase}
                  className={`rounded-xl border border-[#333] bg-[#1a1a1a] p-4 md:p-5 ${phase.bgGlow}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-5">
                    <div className="flex items-center gap-3 md:min-w-[200px]">
                      <div className={`w-8 h-8 rounded-full bg-[#252525] flex items-center justify-center flex-shrink-0 ${phase.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`font-bold text-sm md:text-base ${phase.color}`}>
                          Phase {phase.phase}: {phase.name}
                        </p>
                        <p className="text-[11px] text-neutral-500">{phase.timeBlock} &middot; {phase.time}</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-neutral-300 italic mb-1">{phase.childVersion}</p>
                      <p className="text-xs md:text-sm text-neutral-400">{phase.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Green Line System */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 md:w-6 md:h-6 text-[#39FF14]" />
            <h2 className="text-xl md:text-2xl font-bold">Green Line Emotional Check-In System</h2>
          </div>
          <p className="text-sm text-neutral-400 mb-6 max-w-2xl">
            Children check in each morning with simple color cards. No zone is &quot;bad&quot; — all feelings
            are information. Below the Green Line tells us what we want instead (Contrast to Clarity).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GREEN_LINE_ZONES.map((zone) => (
              <div key={zone.zone} className={`rounded-xl border ${zone.borderColor} bg-black/30 p-4 md:p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${zone.color}`} />
                  <h3 className={`font-bold text-sm md:text-base ${zone.textColor}`}>{zone.zone}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {zone.feelings.map((f) => (
                    <span key={f} className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-white/5 text-neutral-300">
                      {f}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-neutral-400 italic">{zone.response}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-[#1a1a1a] border border-[#333] p-4">
            <p className="text-xs md:text-sm text-neutral-400">
              <span className="text-[#39FF14] font-semibold">Key principle:</span> When below the Green Line,
              we don&apos;t jump to joy. We reach for the next slightly better feeling: angry &rarr; frustrated &rarr;
              bored &rarr; okay &rarr; curious &rarr; interested &rarr; happy. This is the same emotional
              guidance scale VibrationFit teaches adults.
            </p>
          </div>
        </Card>

        {/* 12 Life Category Units */}
        <ExpandableCard
          title="36-Week Pacing: 12 Life Category Units"
          icon={Calendar}
          iconColor="text-[#BF00FF]"
          defaultOpen
        >
          <p className="text-sm text-neutral-400 mt-4 mb-5 max-w-2xl">
            The year is organized into 12 thematic units of 3 weeks each — one per VibrationFit Life Category.
            Every subject weaves through each theme. Week 1 = Explore, Week 2 = Create, Week 3 = Celebrate.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {LIFE_CATEGORY_CURRICULUM.map((unit, i) => (
              <CategoryUnitCard key={unit.key} unit={unit} index={i} />
            ))}
          </div>
        </ExpandableCard>

        {/* The "Life I Love" Book */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-[#FFB701]" />
            <h2 className="text-xl md:text-2xl font-bold">The &quot;Life I Love&quot; Book</h2>
          </div>
          <p className="text-sm text-neutral-400 mb-6 max-w-2xl">
            The year-long portfolio centerpiece. Over 36 weeks, the child builds a 12-page illustrated book
            of their life, written in present tense, first person — their first Life Vision document.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#FFB701]/30 bg-[#FFB701]/5 p-4 md:p-5">
              <h3 className="font-bold text-sm md:text-base text-[#FFB701] mb-3">How It Builds</h3>
              <div className="space-y-2">
                {[
                  { unit: 'Family', entry: '"My family is..." with drawing and sentences' },
                  { unit: 'Home', entry: '"My home is..." with floor plan drawing' },
                  { unit: 'Health', entry: '"My body can..." with body tracing and labels' },
                  { unit: 'Fun', entry: '"I love to..." with activity collage' },
                  { unit: '...8 more', entry: 'One page per Life Category through the year' },
                ].map((item) => (
                  <div key={item.unit} className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-[#FFB701]/60 mt-1 flex-shrink-0" />
                    <p className="text-xs md:text-sm text-neutral-300">
                      <span className="text-white font-medium">{item.unit}:</span> {item.entry}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#BF00FF]/30 bg-[#BF00FF]/5 p-4 md:p-5">
              <h3 className="font-bold text-sm md:text-base text-[#BF00FF] mb-3">Why It Matters</h3>
              <div className="space-y-3 text-xs md:text-sm text-neutral-300">
                <p>
                  By year&apos;s end, a 6-year-old has created their own Life Vision — exactly like
                  the adult VibrationFit experience, but built through a full year of learning.
                </p>
                <p>
                  It serves triple duty: <span className="text-white font-medium">writing practice</span> (present-tense,
                  first-person sentences), <span className="text-white font-medium">portfolio evidence</span> (shows
                  progression across 36 weeks), and a <span className="text-white font-medium">deeply personal artifact</span> the
                  child treasures.
                </p>
                <p className="text-neutral-400 italic">
                  This is the foundation of a lifelong VibrationFit practice — planted at age 6.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* FL Standards Alignment */}
        <ExpandableCard
          title="Florida B.E.S.T. Standards Alignment (1st Grade)"
          icon={GraduationCap}
          iconColor="text-[#14B8A6]"
        >
          <div className="mt-4 space-y-4">
            {[
              {
                subject: 'English Language Arts',
                icon: BookOpen,
                color: 'text-[#39FF14]',
                standards: [
                  { area: 'Print Concepts', coverage: 'Daily reading with "Who made this book?" framing' },
                  { area: 'Phonological Awareness', coverage: 'Singing, clapping syllables, rhyming games, sound hunts' },
                  { area: 'Phonics & Word Analysis', coverage: 'Life Category word walls — digraphs, r-controlled vowels, long vowels' },
                  { area: 'Fluency', coverage: 'Daily "Vision Reading" — child reads their personal vision aloud' },
                  { area: 'Writing (Narrative, Informational, Opinion)', coverage: 'Vision Journaling 3x/week, "My Best Day" stories, "I love ___ because" pieces' },
                ],
              },
              {
                subject: 'Mathematics',
                icon: Brain,
                color: 'text-[#00FFFF]',
                standards: [
                  { area: 'Number Sense (to 120)', coverage: 'Counting real things — coins, heartbeats, steps, seashells' },
                  { area: 'Place Value', coverage: 'Bundling real objects: "10 crayons = 1 bundle"' },
                  { area: 'Addition & Subtraction', coverage: '"Abundance Math" — problems framed as having and sharing, not scarcity' },
                  { area: 'Measurement', coverage: 'Measuring rooms, gardens, how tall the sunflower grew' },
                  { area: 'Geometry', coverage: 'Shape hunts around the house; building with blocks' },
                  { area: 'Data & Probability', coverage: 'Family favorite surveys, simple bar graphs' },
                ],
              },
              {
                subject: 'Science (SC.1)',
                icon: TreePine,
                color: 'text-[#FFFF00]',
                standards: [
                  { area: 'Earth & Space (SC.1.E)', coverage: 'Night sky journal, sunrise gratitude, rock collection, water cycle' },
                  { area: 'Life Science (SC.1.L)', coverage: 'Family garden, "My Amazing Body" unit, animal observation, heredity' },
                  { area: 'Physical Science (SC.1.P)', coverage: 'Playground physics — swings, slides, ramps. Push/pull experiments.' },
                  { area: 'Science Practices (SC.1.N)', coverage: '"I wonder..." board, nature journal, observation logs, five senses exploration' },
                ],
              },
              {
                subject: 'Social Studies (SS.1)',
                icon: Users,
                color: 'text-[#FF6B9D]',
                standards: [
                  { area: 'American History', coverage: 'Family timeline, holiday celebrations, historical figures of character' },
                  { area: 'Geography', coverage: 'Neighborhood maps, globe games, cardinal directions, cultural studies' },
                  { area: 'Civics', coverage: '"I Choose" agreements — intrinsic motivation, not compliance through fear' },
                  { area: 'Economics', coverage: 'Lemonade stand, wants vs. needs, farmer\'s market budgeting' },
                ],
              },
              {
                subject: 'Specials',
                icon: Palette,
                color: 'text-[#BF00FF]',
                standards: [
                  { area: 'Visual Art', coverage: '"Draw the life you love" — category illustrations, vision board collages, nature art' },
                  { area: 'Music', coverage: 'Songs for each Life Category, rhythm and movement, instrument exploration' },
                  { area: 'Drama', coverage: '"Day in My Life" role play (mirrors VibrationFit Focus Story)' },
                  { area: 'Physical Education', coverage: 'Outdoor play, yoga, dance, swimming, obstacle courses' },
                ],
              },
            ].map((subject) => {
              const Icon = subject.icon
              return (
                <div key={subject.subject} className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${subject.color}`} />
                    <h3 className={`font-bold text-sm md:text-base ${subject.color}`}>{subject.subject}</h3>
                  </div>
                  <div className="space-y-2">
                    {subject.standards.map((s) => (
                      <div key={s.area} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                        <span className="text-xs font-medium text-neutral-500 sm:min-w-[180px] flex-shrink-0">{s.area}</span>
                        <span className="text-xs md:text-sm text-neutral-300">{s.coverage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </ExpandableCard>

        {/* Preschool Track */}
        <ExpandableCard
          title="Preschool Track (Ages 3-5)"
          icon={Sparkles}
          iconColor="text-[#FF6B9D]"
        >
          <div className="mt-4">
            <p className="text-sm text-neutral-400 mb-5 max-w-2xl">
              Aligned with Florida VPK (Voluntary Prekindergarten) developmental benchmarks.
              Everything is play-based. No worksheets — intentional play across 8 developmental domains.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { domain: 'Physical Development', vfCategory: 'Health', activity: 'Outdoor play 1+ hr/day, yoga, cooking, obstacle courses, fine motor play', color: 'text-[#39FF14]' },
                { domain: 'Approaches to Learning', vfCategory: 'Fun', activity: 'Choice-based play stations, project work child selects, wonder questions', color: 'text-[#FFFF00]' },
                { domain: 'Social-Emotional', vfCategory: 'Love/Family', activity: 'Green Line check-in with color cards, naming emotions, cooperative play', color: 'text-[#FF0080]' },
                { domain: 'Language & Literacy', vfCategory: 'All Categories', activity: '3+ books/day, storytelling, rhyming songs, letter recognition, name writing', color: 'text-[#00FFFF]' },
                { domain: 'Mathematical Thinking', vfCategory: 'Money/Home', activity: 'Count everything, sorting, pattern making, "more/less/same" at snack time', color: 'text-[#FFB701]' },
                { domain: 'Scientific Inquiry', vfCategory: 'Health/Home', activity: 'Nature walks with magnifying glasses, water play, planting seeds, weather', color: 'text-[#14B8A6]' },
                { domain: 'Social Studies', vfCategory: 'Family/Social', activity: 'Neighborhood walks, community helper pretend play, family traditions', color: 'text-[#A855F7]' },
                { domain: 'Creative Expression', vfCategory: 'Fun/Giving', activity: 'Daily open-ended art, singing and dancing, dramatic play, building', color: 'text-[#BF00FF]' },
              ].map((d) => (
                <div key={d.domain} className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3 md:p-4">
                  <p className={`font-bold text-xs md:text-sm ${d.color} mb-1`}>{d.domain}</p>
                  <p className="text-[10px] text-neutral-500 mb-2">VF: {d.vfCategory}</p>
                  <p className="text-xs text-neutral-400">{d.activity}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-[#333] bg-[#1a1a1a] p-4">
              <h4 className="text-sm font-bold text-white mb-3">Preschool Vision Declarations</h4>
              <p className="text-xs text-neutral-400 mb-3">
                3 simple sentences. Parent prompts, child repeats or creates their own. Read each morning.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#252525] p-3 font-mono text-xs text-[#39FF14]/80 space-y-0.5">
                  <p>I am {'{name}'}.</p>
                  <p>I love my family.</p>
                  <p>Today is a good day.</p>
                </div>
                <div className="rounded-lg bg-[#252525] p-3 font-mono text-xs text-[#00FFFF]/80 space-y-0.5">
                  <p>I am strong.</p>
                  <p>I like to play outside.</p>
                  <p>I have a dog named {'{name}'}.</p>
                </div>
              </div>
            </div>
          </div>
        </ExpandableCard>

        {/* Florida Compliance */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-[#14B8A6]" />
            <h2 className="text-xl md:text-2xl font-bold">Florida Compliance (F.S. 1002.41)</h2>
          </div>
          <p className="text-sm text-neutral-400 mb-5 max-w-2xl">
            Florida is one of the most homeschool-friendly states. No state-approved curriculum required —
            just &quot;sequentially progressive instruction&quot; and a maintained portfolio.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
            {FLORIDA_REQUIREMENTS.map((req, i) => {
              const Icon = req.icon
              return (
                <div key={req.step} className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] text-xs font-bold">
                      {i + 1}
                    </div>
                    <Icon className="w-4 h-4 text-[#14B8A6]" />
                  </div>
                  <h4 className="font-bold text-xs md:text-sm text-white mb-1">{req.step}</h4>
                  <p className="text-[11px] md:text-xs text-neutral-400">{req.description}</p>
                </div>
              )
            })}
          </div>

          <div className="rounded-lg border border-[#14B8A6]/30 bg-[#14B8A6]/5 p-4">
            <h4 className="text-sm font-bold text-[#14B8A6] mb-2">Portfolio Review (Recommended Evaluation)</h4>
            <p className="text-xs md:text-sm text-neutral-300">
              This curriculum generates abundant portfolio material naturally — writing samples, math journals,
              science observation logs, art projects, the &quot;Life I Love&quot; book, and a daily activity log.
              A certified teacher portfolio review is the lowest-stress option and the best fit for this approach.
            </p>
          </div>
        </Card>

        {/* Vibrational Language */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-2">
            <Music className="w-5 h-5 md:w-6 md:h-6 text-[#A855F7]" />
            <h2 className="text-xl md:text-2xl font-bold">Vibrational Grammar for Children</h2>
          </div>
          <p className="text-sm text-neutral-400 mb-5 max-w-2xl">
            The same present-tense, positive-framing language VibrationFit teaches adults —
            adapted as a natural way children learn to speak and write.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-[#39FF14]/30 bg-[#39FF14]/5 p-4">
              <h4 className="text-sm font-bold text-[#39FF14] mb-3">Cultivate</h4>
              <div className="space-y-1.5">
                {[
                  '"I am..." / "I can..." / "I notice..."',
                  '"I choose..." / "I love when..."',
                  'Describing what IS, not what isn\'t',
                  '"It feels warm" instead of "It\'s nice"',
                  'Sensory-specific language',
                ].map((phrase) => (
                  <div key={phrase} className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-[#39FF14]/60 mt-0.5 flex-shrink-0" />
                    <p className="text-xs md:text-sm text-neutral-300">{phrase}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[#FF0040]/30 bg-[#FF0040]/5 p-4">
              <h4 className="text-sm font-bold text-[#FF0040] mb-3">Gently Redirect</h4>
              <div className="space-y-1.5">
                {[
                  { from: '"I can\'t"', to: '"I\'m still learning how" \u2192 "I\'m figuring this out"' },
                  { from: '"I hate this"', to: '"This isn\'t my favorite" \u2192 "I know what I\'d like instead"' },
                  { from: '"I\'m bored"', to: '"I\'m ready for something new" \u2192 "I wonder what would feel fun"' },
                ].map((r) => (
                  <div key={r.from} className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-[#FF0040]/60 mt-0.5 flex-shrink-0" />
                    <p className="text-xs md:text-sm text-neutral-300">
                      <span className="text-[#FF0040]/80">{r.from}</span> &rarr; <span className="text-[#39FF14]/80">{r.to}</span>
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-neutral-500 mt-3 italic">
                Not about suppressing emotion. Below the Green Line feelings are valid.
                The practice is noticing, then reaching for a slightly better-feeling thought.
              </p>
            </div>
          </div>
        </Card>

        {/* 1st Grade Vision Declarations */}
        <Card className="p-4 md:p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 via-transparent to-[#BF00FF]/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-[#39FF14]" />
              <h2 className="text-xl md:text-2xl font-bold">First Grade Vision Declaration</h2>
            </div>
            <p className="text-sm text-neutral-400 mb-5 max-w-2xl">
              5-7 sentences written by the child and read aloud each morning. Evolves throughout the year as
              the child grows. By year&apos;s end, they&apos;ve created their own Life Vision document.
            </p>

            <div className="max-w-lg mx-auto rounded-xl border border-[#39FF14]/20 bg-[#0a0a0a] p-5 md:p-6">
              <div className="space-y-1 font-mono text-sm md:text-base text-[#39FF14]/90 leading-relaxed">
                <p>I am a reader. Books take me to amazing places.</p>
                <p>My body is strong and healthy.</p>
                <p>I love my family and they love me.</p>
                <p>I am a good friend.</p>
                <p>I notice cool things in nature.</p>
                <p>Learning feels like an adventure.</p>
                <p>I am exactly who I choose to be.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-500 text-center mt-4 italic">
              Present tense. First person. Sensory. Specific. The beginning of a lifelong VibrationFit practice.
            </p>
          </div>
        </Card>

        {/* Weekly Structure */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 md:w-6 md:h-6 text-[#FFB701]" />
            <h2 className="text-xl md:text-2xl font-bold">Weekly Structure</h2>
          </div>
          <p className="text-sm text-neutral-400 mb-5">
            Each week within a 3-week unit follows a rhythm: Explore, Create, Celebrate.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="text-left py-2 pr-4 text-neutral-400 font-medium">Day</th>
                  <th className="text-left py-2 pr-4 text-neutral-400 font-medium">Focus</th>
                  <th className="text-left py-2 text-neutral-400 font-medium">Special Activity</th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                {[
                  { day: 'Monday', focus: 'New theme introduction', activity: 'Library visit or new book selection' },
                  { day: 'Tuesday', focus: 'Deep dive — Science/Social Studies', activity: 'Hands-on experiment or project' },
                  { day: 'Wednesday', focus: 'Creative expression day', activity: 'Art, music, drama, or building' },
                  { day: 'Thursday', focus: 'Real-world application', activity: 'Field trip, cooking, community outing' },
                  { day: 'Friday', focus: 'Celebration & portfolio', activity: '"Week in Review" — child shares favorites; portfolio day' },
                ].map((row) => (
                  <tr key={row.day} className="border-b border-[#333]/50">
                    <td className="py-2.5 pr-4 font-medium text-white whitespace-nowrap">{row.day}</td>
                    <td className="py-2.5 pr-4">{row.focus}</td>
                    <td className="py-2.5">{row.activity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Closing CTA */}
        <Card className="p-4 md:p-6 lg:p-8 text-center border-[#39FF14]/20">
          <p className="text-sm md:text-base text-neutral-300 max-w-2xl mx-auto mb-2">
            The most aligned curriculum is one where your child is Above the Green Line more
            often than not. Trust the process. Trust them.
          </p>
          <p className="text-xs text-neutral-500 italic">
            Full curriculum document: <span className="text-neutral-400">docs/jordan/VibrationFit_Homeschool_Curriculum.md</span>
          </p>
        </Card>
      </Stack>
    </Container>
  )
}
