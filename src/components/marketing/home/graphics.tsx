import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  AlertTriangle,
  Brain,
  CalendarDays,
  CheckCircle,
  Compass,
  Eye,
  EyeOff,
  Heart,
  Map,
  RadioTower,
  RefreshCw,
  Rocket,
  Sparkles,
  Target,
  Volume2,
} from 'lucide-react'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

const TONE = {
  lime: '#39FF14',
  cyan: '#00FFFF',
  purple: '#BF00FF',
  yellow: '#FFFF00',
  red: '#FF0040',
  teal: '#14B8A6',
} as const

type Tone = keyof typeof TONE

function FlowCanvas({
  viewBox,
  paths,
  children,
}: {
  viewBox: string
  paths: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="hp-flow">
      <svg className="hp-flow-svg" viewBox={viewBox} aria-hidden="true">
        {paths}
      </svg>
      {children}
    </div>
  )
}

function Mark({
  icon: Icon,
  label,
  tone,
  x,
  y,
  size = 'lg',
}: {
  icon: LucideIcon
  label: string
  tone: Tone
  x: number
  y: number
  size?: 'lg' | 'md' | 'sm'
}) {
  return (
    <div className={`hp-mark hp-mark-${size}`} style={{ left: `${x}%`, top: `${y}%`, color: TONE[tone] }}>
      <Icon strokeWidth={1.5} />
      <span>{label}</span>
    </div>
  )
}

function GlowPath({
  d,
  tone,
}: {
  d: string
  tone: Tone
}) {
  const color = TONE[tone]
  return (
    <g>
      <path d={d} stroke={color} strokeWidth="10" opacity="0.12" className="hp-flow-path" />
      <path d={d} stroke={color} strokeWidth="2.25" className="hp-flow-path hp-flow-path-draw" />
      <circle r="3" fill={color} className="hp-flow-dot">
        <animateMotion dur="6s" repeatCount="indefinite" path={d} />
      </circle>
    </g>
  )
}

export function AttentionSplit() {
  return (
    <FlowCanvas
      viewBox="0 0 320 340"
      paths={
        <>
          <path
            d="M160 78 C160 130 160 150 160 170"
            stroke={TONE.lime}
            strokeWidth="2"
            className="hp-flow-path"
            opacity="0.7"
          />
          <path
            d="M160 188 C160 220 160 248 160 268"
            stroke={TONE.cyan}
            strokeWidth="2"
            strokeDasharray="3 8"
            className="hp-flow-path"
            opacity="0.55"
          />
        </>
      }
    >
      <Mark icon={CheckCircle} label="It worked" tone="lime" x={50} y={18} />
      <Mark icon={EyeOff} label="Attention slipped" tone="cyan" x={50} y={82} />
    </FlowCanvas>
  )
}

export function GreenLineMini() {
  return (
    <div className="hp-line-art" aria-hidden="true">
      <svg viewBox="0 0 320 360" className="hp-flow-svg">
        <circle cx="160" cy="70" r="70" fill="rgba(57,255,20,0.08)" />
        <g fill="none" stroke={TONE.lime} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="160" cy="52" r="11" />
          <line x1="160" y1="64" x2="160" y2="102" />
          <path d="M160 74 L132 48" />
          <path d="M160 74 L188 48" />
          <path d="M160 102 L142 132" />
          <path d="M160 102 L178 132" />
        </g>
        <text x="160" y="168" textAnchor="middle" fill={TONE.lime} fontSize="11" fontWeight="700" letterSpacing="3">
          ABOVE
        </text>

        <line x1="36" y1="196" x2="284" y2="196" stroke={TONE.lime} strokeWidth="3" />
        <line x1="36" y1="196" x2="284" y2="196" stroke={TONE.lime} strokeWidth="10" opacity="0.22" />

        <circle cx="160" cy="286" r="70" fill="rgba(255,0,64,0.07)" />
        <g fill="none" stroke={TONE.red} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="112" y="248" width="96" height="86" rx="4" />
          <circle cx="154" cy="276" r="9" />
          <path d="M154 286 Q148 304 158 320" />
          <path d="M158 320 L146 332" />
          <path d="M158 320 L174 330" />
        </g>
        <text x="160" y="352" textAnchor="middle" fill={TONE.red} fontSize="11" fontWeight="700" letterSpacing="3">
          BELOW
        </text>
      </svg>
    </div>
  )
}

export function VivaPipeline() {
  const categories = VISION_CATEGORIES.filter((category) => category.key !== 'forward' && category.key !== 'conclusion')

  return (
    <FlowCanvas
      viewBox="0 0 320 520"
      paths={
        <>
          <GlowPath tone="purple" d="M160 72 C160 120 160 150 160 188" />
          <GlowPath tone="lime" d="M160 236 C160 280 160 300 160 318" />
          {categories.map((_, index) => {
            const angle = (index / categories.length) * Math.PI * 2 - Math.PI / 2
            const x = 160 + Math.cos(angle) * 92
            const y = 412 + Math.sin(angle) * 68
            return (
              <line
                key={index}
                x1="160"
                y1="412"
                x2={x}
                y2={y}
                stroke={TONE.lime}
                strokeWidth="1"
                opacity="0.22"
              />
            )
          })}
        </>
      }
    >
      <Mark icon={AlertTriangle} label="Contrast" tone="red" x={50} y={12} />
      <Mark icon={Sparkles} label="VIVA" tone="purple" x={50} y={40} />
      <Mark icon={Compass} label="Life I Choose" tone="lime" x={50} y={64} />
      {categories.map((category, index) => {
        const angle = (index / categories.length) * Math.PI * 2 - Math.PI / 2
        const x = 50 + Math.cos(angle) * 29
        const y = 82 + Math.sin(angle) * 13.5
        return (
          <Mark
            key={category.key}
            icon={category.icon}
            label={category.label}
            tone="lime"
            x={x}
            y={y}
            size="sm"
          />
        )
      })}
    </FlowCanvas>
  )
}

export function CreationLoop() {
  return (
    <FlowCanvas
      viewBox="0 0 320 320"
      paths={<GlowPath tone="lime" d="M160 58 C230 58 262 98 262 160 C262 230 214 262 160 262 C98 262 58 214 58 160 C58 98 98 58 160 58" />}
    >
      <Mark icon={Target} label="Choose" tone="lime" x={50} y={12} size="md" />
      <Mark icon={Activity} label="Align" tone="cyan" x={88} y={50} size="md" />
      <Mark icon={Heart} label="Enjoy" tone="purple" x={50} y={88} size="md" />
      <Mark icon={Sparkles} label="Unfold" tone="yellow" x={12} y={50} size="md" />
    </FlowCanvas>
  )
}

export function InstallRunEvolve() {
  return (
    <FlowCanvas
      viewBox="0 0 320 460"
      paths={
        <>
          <GlowPath tone="cyan" d="M160 70 C160 130 160 180 160 230" />
          <GlowPath tone="purple" d="M160 270 C160 320 160 350 160 390" />
          <line x1="160" y1="230" x2="58" y2="230" stroke={TONE.lime} strokeWidth="1.25" opacity="0.35" />
          <line x1="160" y1="230" x2="262" y2="230" stroke={TONE.teal} strokeWidth="1.25" opacity="0.35" />
          <line x1="160" y1="230" x2="58" y2="292" stroke={TONE.purple} strokeWidth="1.25" opacity="0.35" />
          <line x1="160" y1="230" x2="262" y2="292" stroke={TONE.yellow} strokeWidth="1.25" opacity="0.35" />
        </>
      }
    >
      <Mark icon={Rocket} label="Install" tone="lime" x={50} y={12} />
      <Mark icon={Map} label="Run" tone="cyan" x={50} y={46} />
      <Mark icon={Brain} label="Creations" tone="lime" x={16} y={50} size="sm" />
      <Mark icon={RadioTower} label="Activations" tone="teal" x={84} y={50} size="sm" />
      <Mark icon={Heart} label="Connections" tone="purple" x={16} y={64} size="sm" />
      <Mark icon={CalendarDays} label="Sessions" tone="yellow" x={84} y={64} size="sm" />
      <Mark icon={RefreshCw} label="Evolve" tone="purple" x={50} y={88} />
    </FlowCanvas>
  )
}

export function ReconnectLoop() {
  return (
    <FlowCanvas
      viewBox="0 0 320 340"
      paths={
        <GlowPath
          tone="lime"
          d="M86 90 C86 48 140 36 176 62 C220 92 244 150 210 196 C176 242 110 236 92 188 C76 148 118 126 168 148 C210 168 228 210 196 250"
        />
      }
    >
      <Mark icon={Volume2} label="Life gets loud" tone="yellow" x={24} y={24} size="md" />
      <Mark icon={Eye} label="Attention pulled" tone="cyan" x={76} y={58} size="md" />
      <Mark icon={Compass} label="Return" tone="lime" x={56} y={82} />
    </FlowCanvas>
  )
}
