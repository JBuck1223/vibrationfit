import { Container, Stack, PageHero, Card, Button } from '@/lib/design-system/components'
import {
  Sparkles,
  Play,
  Heart,
  Users,
  CheckCircle,
  ArrowLeft,
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
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tracking">
              <ArrowLeft className="w-4 h-4" />
              Back to Tracking
            </Link>
          </Button>
        </PageHero>

        {/* About overlaps */}
        <Card className="p-5 md:p-6 bg-gradient-to-r from-[#39FF14]/5 to-[#00FFFF]/5 border-[#39FF14]/20">
          <h2 className="text-base font-bold text-white mb-2">
            Why do some activities show up in multiple metrics?
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            That is by design. Each metric answers a different question about your practice.
            For example, attending an Alignment Gym session adds +1 Session <strong>and</strong> +1 Activation.
            Creating a journal entry adds +1 Creation <strong>and</strong> +1 Activation.
            The overlap means every angle of your practice gets credit.
          </p>
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
              <ArrowLeft className="w-4 h-4" />
              Back to Tracking
            </Link>
          </Button>
        </div>
      </Stack>
    </Container>
  )
}
