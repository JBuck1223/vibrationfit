import {
  ArrowRight,
  BookOpen,
  Download,
  Headphones,
  LayoutGrid,
  Music,
  Quote,
  ScrollText,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

const ASSET_GROUPS: Array<{
  heading: string
  color: string
  items: Array<{ icon: LucideIcon; title: string; detail: string }>
}> = [
  {
    heading: 'Ready in minutes',
    color: '#39FF14',
    items: [
      {
        icon: ScrollText,
        title: 'Life I Choose\u2122 vision',
        detail: 'your desired reality, in your language',
      },
      {
        icon: BookOpen,
        title: 'Future-Self Story',
        detail: 'a narrative written from inside that reality',
      },
      {
        icon: Quote,
        title: 'Incantation',
        detail: 'words to reinforce the identity you\u2019re practicing',
      },
      {
        icon: Sparkles,
        title: 'SparkQuery\u2122',
        detail: 'a question for the universe that opens new possibilities',
      },
    ],
  },
  {
    heading: 'Created in the background',
    color: '#BF00FF',
    items: [
      {
        icon: Headphones,
        title: 'Vision Audio',
        detail: 'your vision brought to life through sound',
      },
      {
        icon: Music,
        title: 'Personalized Song',
        detail: 'an original song created from your vision',
      },
      {
        icon: LayoutGrid,
        title: 'Vision Board',
        detail: 'visual anchors for the reality you\u2019re choosing',
      },
    ],
  },
]

/** Free-activation counterpart to the homepage OfferBuyBox — same card chrome, no purchase. */
export function ActivationOfferCard() {
  return (
    <div className="hp-offer-card flex flex-col items-center rounded-2xl px-5 py-6 text-center lg:px-6 lg:py-7">
      <p className="text-xl font-extrabold leading-tight text-[#39FF14] md:text-[1.65rem]">
        Your Personalized Activation
      </p>
      <p className="mt-1 text-xs text-neutral-400">
        one area of your life, built entirely around you
      </p>

      <div className="mt-5">
        <p className="text-6xl font-extrabold leading-none text-[#39FF14]">Free</p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
          no credit card required
        </p>
      </div>

      <p className="mt-3 text-sm leading-snug text-neutral-300 md:text-base">
        Takes <span className="font-semibold text-white">10&ndash;15 minutes</span>. Your
        written assets appear right away &mdash; the rest is forged while you take it in.
      </p>

      <div className="mt-5 w-full border-t border-white/10 pt-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
          What&rsquo;s Inside
        </p>
        <div className="grid grid-cols-1 gap-2.5">
          {ASSET_GROUPS.map((group) => (
            <div
              key={group.heading}
              className="rounded-xl border border-white/10 bg-black/40 p-3 text-left"
            >
              <p
                className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: group.color }}
              >
                {group.heading}
              </p>
              <div className="space-y-2">
                {group.items.map(({ icon: Icon, title, detail }) => (
                  <div key={title} className="flex items-start gap-2">
                    <span
                      className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${group.color}1A`, color: group.color }}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold leading-tight text-white">
                        {title}
                      </span>
                      <span className="block text-[11px] leading-tight text-neutral-400">
                        {detail}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <a
        href="#start"
        className="mt-5 inline-flex items-center justify-center gap-2 whitespace-normal rounded-full border-2 border-transparent bg-[#39FF14] px-6 py-3 text-center text-sm font-semibold text-black antialiased transition-all duration-300 hover:border-[rgba(57,255,20,0.2)] hover:bg-[rgba(57,255,20,0.1)] hover:text-[#39FF14] active:opacity-80 md:whitespace-nowrap md:px-7"
      >
        Create My Free Activation
        <ArrowRight className="h-4 w-4 shrink-0" />
      </a>

      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-neutral-500">
        <Download className="h-3.5 w-3.5 text-[#39FF14]" />
        Everything is yours to download and keep
      </p>
    </div>
  )
}
