import { Container, Stack, PageHero, Card, Button, Video } from '@/lib/design-system/components'
import {
  Sparkles,
  Play,
  Heart,
  Users,
  CheckCircle,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import {
  BADGE_CATEGORY_COLORS,
  BADGE_CATEGORY_INFO,
  getBadgesByCategory,
  type BadgeCategory,
} from '@/lib/badges/types'

export default function HowItWorksPage() {
  const metrics = [
    {
      title: 'Creations',
      question: 'What objects exist because of me?',
      icon: Sparkles,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      timeframe: 'Last 30 days + all-time total',
      items: [
        'Life Visions',
        'Audio Sets',
        'Vision Board items',
        'Journal entries',
        'Daily Paper entries',
        'Abundance Tracker events',
      ],
    },
    {
      title: 'Activations',
      question: 'How many times did I show up and do the work?',
      icon: Play,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      timeframe: 'Last 30 days + all-time total',
      items: [
        'Playing a Vision Audio',
        'Creating a Journal entry',
        'Creating a Daily Paper entry',
        'Creating an Abundance Tracker entry',
        'Creating or actualizing a Vision Board item',
        'Attending an Alignment Gym session',
        'Posting in Vibe Tribe',
      ],
    },
    {
      title: 'Connections',
      question: 'How many times did I interact with the community?',
      icon: Heart,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      timeframe: 'This week + all-time total',
      items: [
        'Vibe Tribe posts',
        'Comments on posts',
        'Hearts given',
      ],
    },
    {
      title: 'Sessions',
      question: 'How often am I showing up to live coaching?',
      icon: Users,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/30',
      timeframe: 'Last 4 weeks (goal: 1 per week) + all-time total',
      items: [
        'Live Alignment Gym sessions attended',
        'Replays watched',
      ],
    },
  ]

  const categories: BadgeCategory[] = ['activations', 'creations', 'connections', 'sessions']

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="How Vibration Fit Tracks Your Practice"
          subtitle="Everything you need to know about Creations, Activations, Connections, Sessions, and Badges."
        >
          <div className="mx-auto w-full max-w-3xl">
            <Video
              src="https://media.vibrationfit.com/site-assets/video/membership/tracking-1080p.mp4"
              poster="https://media.vibrationfit.com/site-assets/video/membership/tracking-thumb.0000000.jpg"
              variant="default"
              caption="Five minute overview video"
            />
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tracking">
              <ArrowLeft className="w-5 h-5" />
              Tracking Dashboard
            </Link>
          </Button>
        </PageHero>

        {/* How Your Four Core Metrics Work */}
        <Card className="p-0 overflow-hidden border-[#333]">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer list-none py-3 px-4 md:px-6 hover:bg-white/[0.02] transition-colors rounded-2xl">
              <ChevronDown className="w-4 h-4 shrink-0 text-neutral-500 transition-transform duration-200 group-open:rotate-180" />
              <div className="min-w-0">
                <span className="text-base font-semibold text-white block">How Your Four Core Metrics Work</span>
                <span className="text-sm text-neutral-400">VibrationFit tracks four kinds of engagement. Each answers a different question:</span>
              </div>
            </summary>
            <div className="px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 pt-1">
          <p className="text-neutral-400 text-sm mb-6">
            VibrationFit tracks four kinds of engagement. Each answers a different question:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="p-5 md:p-6 border-[#333] h-full flex flex-col">
              <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#39FF14] flex-shrink-0" />
                Creations – &quot;What have I built?&quot;
              </h3>
              <p className="text-sm text-neutral-300 mb-3 flex-1">
                Counts assets you&apos;ve created: Life Visions, Audio Sets, Vision Board items, Journal entries, Daily Papers, and Abundance Tracker entries.
              </p>
              <p className="text-xs text-neutral-500">
                <span className="text-neutral-400">Recent:</span> last 30 days · <span className="text-neutral-400">Lifetime:</span> all-time creations
              </p>
            </Card>
            <Card className="p-5 md:p-6 border-[#333] h-full flex flex-col">
              <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                <Play className="w-5 h-5 text-[#39FF14] flex-shrink-0" />
                Activations – &quot;How many times did I run my practice?&quot;
              </h3>
              <p className="text-sm text-neutral-300 mb-2">
                Counts meaningful practice reps, such as:
              </p>
              <ul className="text-sm text-neutral-300 list-disc list-outside pl-5 space-y-1 mb-3 flex-1">
                <li>Playing a Vision Audio (most of the track)</li>
                <li>Creating a Journal or Daily Paper entry</li>
                <li>Logging an Abundance event</li>
                <li>Creating or actualizing a Vision Board item</li>
                <li>Attending an Alignment Gym session</li>
                <li>Posting in Vibe Tribe</li>
              </ul>
              <p className="text-xs text-neutral-500">
                <span className="text-neutral-400">Recent:</span> last 30 days · <span className="text-neutral-400">Lifetime:</span> all-time activations
              </p>
            </Card>
            <Card className="p-5 md:p-6 border-[#333] h-full flex flex-col">
              <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#39FF14] flex-shrink-0" />
                Connections – &quot;How much am I engaging with the community?&quot;
              </h3>
              <p className="text-sm text-neutral-300 mb-3 flex-1">
                Counts your interactions in Vibe Tribe: posts, comments, and hearts.
              </p>
              <p className="text-xs text-neutral-500">
                <span className="text-neutral-400">Recent:</span> this week (last 7 days) · <span className="text-neutral-400">Lifetime:</span> all-time interactions
              </p>
            </Card>
            <Card className="p-5 md:p-6 border-[#333] h-full flex flex-col">
              <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#39FF14] flex-shrink-0" />
                Sessions – &quot;How often am I showing up to live coaching?&quot;
              </h3>
              <p className="text-sm text-neutral-300 mb-3 flex-1">
                Counts Alignment Gym sessions you attend live or via replay.
              </p>
              <p className="text-xs text-neutral-500">
                <span className="text-neutral-400">Recent:</span> last 4 weeks (goal: 1 per week) · <span className="text-neutral-400">Lifetime:</span> all-time sessions attended
              </p>
            </Card>
          </div>
          <Card className="p-5 md:p-6 border-[#333] mt-6">
            <p className="text-sm text-neutral-400 mb-4">
              Some actions move more than one metric on purpose. For example:
            </p>
            <ul className="text-sm text-neutral-300 space-y-1 mb-4">
              <li>One Alignment Gym session = +1 Activation and +1 Session</li>
              <li>One Daily Paper entry = +1 Creation and +1 Activation</li>
              <li>One Vibe Tribe post = +1 Activation and +1 Connection</li>
            </ul>
            <p className="text-sm text-neutral-300">
              Together, these four numbers give you a clear picture of how consistently you&apos;re creating, activating, connecting, and showing up – not just thinking about your practice.
            </p>
          </Card>
            </div>
          </details>
        </Card>

        {/* About overlaps */}
        <Card className="p-0 overflow-hidden border-[#333] bg-gradient-to-r from-[#39FF14]/5 to-[#00FFFF]/5 border-[#39FF14]/20">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer list-none py-3 px-4 md:px-6 hover:bg-white/[0.02] transition-colors rounded-2xl">
              <ChevronDown className="w-4 h-4 shrink-0 text-neutral-500 transition-transform duration-200 group-open:rotate-180" />
              <span className="text-base font-semibold text-white">
                Why do some activities show up in multiple metrics?
              </span>
            </summary>
            <div className="px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 pt-1">
          <p className="text-sm text-neutral-300 leading-relaxed">
            That is by design. Each metric answers a different question about your practice.
            For example, attending an Alignment Gym session adds +1 Session <strong>and</strong> +1 Activation.
            Creating a journal entry adds +1 Creation <strong>and</strong> +1 Activation.
            The overlap means every angle of your practice gets credit.
          </p>
            </div>
          </details>
        </Card>

        {/* The 4 Metrics */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">The 4 Metrics</h2>
          <div className="space-y-4">
            {metrics.map((metric) => {
              const MetricIcon = metric.icon
              return (
                <Card
                  key={metric.title}
                  className={`p-5 md:p-6 ${metric.bgColor} border ${metric.borderColor}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                      <MetricIcon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{metric.title}</h3>
                      <p className={`text-sm ${metric.color}`}>{metric.question}</p>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 mb-3">
                    Measured: {metric.timeframe}
                  </p>

                  <div className="space-y-1.5">
                    {metric.items.map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-neutral-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Example day */}
        <Card className="p-5 md:p-6">
          <h2 className="text-lg font-bold text-white mb-3">Example: A Big Practice Day</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Say you play 3 vision audios, create a journal entry, and attend Alignment Gym.
            Here is how it breaks down:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-yellow-400 font-medium mb-1">Creations</p>
              <p className="text-xl font-bold text-white">+1</p>
              <p className="text-xs text-neutral-500">journal entry</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-green-400 font-medium mb-1">Activations</p>
              <p className="text-xl font-bold text-white">+5</p>
              <p className="text-xs text-neutral-500">3 audios + journal + gym</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-xs text-purple-400 font-medium mb-1">Connections</p>
              <p className="text-xl font-bold text-white">+0</p>
              <p className="text-xs text-neutral-500">no Vibe Tribe activity</p>
            </div>
            <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <p className="text-xs text-teal-400 font-medium mb-1">Sessions</p>
              <p className="text-xl font-bold text-white">+1</p>
              <p className="text-xs text-neutral-500">gym attended</p>
            </div>
          </div>
        </Card>

        {/* Badges Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Badges</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Badges are milestones that recognize your practice. Tap any badge on the Tracking page or your Snapshot to see exactly how you earned it.
          </p>

          <div className="space-y-4">
            {categories.map((category) => {
              const badges = getBadgesByCategory(category)
              const info = BADGE_CATEGORY_INFO[category]
              const colors = BADGE_CATEGORY_COLORS[category]

              return (
                <Card
                  key={category}
                  className={`p-4 md:p-5 ${colors.bg} border ${colors.border}`}
                >
                  <h3 className="text-sm font-semibold text-white mb-3 capitalize">
                    {info.label}
                    <span className="text-xs text-neutral-500 font-normal ml-2">
                      {info.description}
                    </span>
                  </h3>

                  <div className="space-y-3">
                    {badges.map((badge) => {
                      const BadgeIcon = badge.icon
                      return (
                        <div key={badge.type} className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: `${colors.primary}20`,
                            }}
                          >
                            <BadgeIcon className="w-4 h-4" style={{ color: colors.primary }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{badge.label}</p>
                            <p className="text-xs text-neutral-400">{badge.description}</p>
                            {badge.meaning && (
                              <p className="text-xs text-neutral-500 mt-1 italic">{badge.meaning}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Back button at bottom */}
        <div className="text-center pb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tracking">
              <ArrowLeft className="w-5 h-5" />
              Tracking Dashboard
            </Link>
          </Button>
        </div>
      </Stack>
    </Container>
  )
}
