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

const PRACTICE_CX = 160
const PRACTICE_CY = 160
const PRACTICE_R = 128
const PRACTICE_INNER_R = 54
const PRACTICE_RING_PATH = `M ${PRACTICE_CX} ${PRACTICE_CY - PRACTICE_R} A ${PRACTICE_R} ${PRACTICE_R} 0 1 1 ${PRACTICE_CX - 0.01} ${PRACTICE_CY - PRACTICE_R}`

function practicePoint(index: number, radius: number) {
  const angle = ((index * 30 - 90) * Math.PI) / 180
  return {
    x: PRACTICE_CX + radius * Math.cos(angle),
    y: PRACTICE_CY + radius * Math.sin(angle),
  }
}

export function VibrationalFitness() {
  const categories = VISION_CATEGORIES.filter(
    (category) => category.key !== 'forward' && category.key !== 'conclusion',
  )

  return (
    <div className="hp-practice-art" aria-label="Vibrational Fitness: the Vibration Fit mark aligned across twelve life categories">
      <div className="hp-practice-ring">
        <svg className="hp-practice-links" viewBox="0 0 320 320" aria-hidden="true">
          <defs>
            <filter id="vf-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={PRACTICE_CX} cy={PRACTICE_CY} r="46" className="hp-practice-ripple" />
          <circle cx={PRACTICE_CX} cy={PRACTICE_CY} r="68" className="hp-practice-ripple hp-practice-ripple-2" />
          <circle cx={PRACTICE_CX} cy={PRACTICE_CY} r="90" className="hp-practice-ripple hp-practice-ripple-3" />

          <circle
            cx={PRACTICE_CX}
            cy={PRACTICE_CY}
            r={PRACTICE_R}
            fill="none"
            stroke={TONE.cyan}
            strokeWidth="10"
            opacity="0.05"
          />
          <path
            d={PRACTICE_RING_PATH}
            fill="none"
            stroke={TONE.cyan}
            strokeWidth="1.15"
            opacity="0.28"
            className="hp-flow-path hp-flow-path-draw"
          />

          {categories.map((category, index) => {
            const outer = practicePoint(index, PRACTICE_R)
            const inner = practicePoint(index, PRACTICE_INNER_R)
            return (
              <line
                key={category.key}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={TONE.cyan}
                strokeWidth="1"
                opacity="0.16"
              />
            )
          })}

          <g
            fill={TONE.lime}
            filter="url(#vf-glow)"
            transform="translate(160 160) scale(0.078) translate(-512 -512)"
          >
            <path d="M991.02,639.67c-56.5,211.45-249.93,367.64-479.22,367.64-265.29,0-482.58-209.09-495.33-470.94v-46.94c0-8.62,7.02-15.63,15.57-15.63,2.62.05,15.75,1.06,15.75,15.63v70c0,16.62,13.53,30.15,30.19,30.15s30.18-13.53,30.18-30.15v-132.04c0-.31,0-.62.03-.92.48-8.48,7.55-15.23,16.15-15.23s16.18,7.24,16.18,16.15v188.52c0,16.98,13.83,30.79,30.82,30.79s29.73-13.52,29.73-30.79v-234.61c0-8,7.54-15.02,16.15-15.02s15.05,6.75,15.05,15.02v113.3h559.55v-14.45H246.71v-98.85c0-16.25-13.23-29.47-29.5-29.47s-30.61,13.49-30.61,29.47v234.61c0,9.31-6.57,16.34-15.27,16.34s-16.35-7.33-16.35-16.34v-188.52c0-16.87-13.75-30.6-30.66-30.6-15.6,0-28.51,11.7-30.4,26.79-.16,1.25-.24,2.53-.24,3.82v132.04c0,8.66-7.05,15.7-15.72,15.7s-15.72-7.04-15.72-15.7l-.02-70c0-21.93-17.97-30.01-30.1-30.08-4.97,0-9.68,1.21-13.82,3.36-9.69,5.01-16.31,15.1-16.31,26.72v51.95c.12,2.33.27,4.64.44,6.95,3.91,56.03,16.94,110.44,38.86,162.19,25.72,60.73,62.53,115.27,109.43,162.1,46.9,46.84,101.51,83.59,162.31,109.29,62.96,26.61,129.84,40.08,198.77,40.08s135.81-13.47,198.77-40.08c60.8-25.69,115.42-62.45,162.31-109.29,46.89-46.84,83.7-101.38,109.42-162.1,9.8-23.12,17.78-46.77,24-70.86h-15.28Z" />
            <path d="M1021.56,475.66c-3.91-56.03-16.94-110.44-38.86-162.19-25.72-60.73-62.53-115.27-109.43-162.1-46.9-46.84-101.51-83.59-162.31-109.29C648.01,15.47,581.13,2,512.2,2s-135.81,13.47-198.77,40.08c-60.8,25.69-115.42,62.45-162.31,109.29-46.89,46.84-83.7,101.38-109.42,162.1-10.02,23.66-18.18,47.87-24.46,72.54h15.28C88.45,173.71,282.31,16.69,512.2,16.69c265.29,0,482.58,209.09,495.33,470.94v46.94c0,8.62-7.02,15.63-15.57,15.63-2.62-.05-15.75-1.06-15.75-15.63v-70c0-16.62-13.53-30.15-30.19-30.15s-30.18,13.53-30.18,30.15v132.04c0,8.91-7.27,16.15-16.17,16.15s-16.18-7.24-16.18-16.15v-188.52c0-16.98-13.83-30.79-30.82-30.79s-29.73,13.52-29.73,30.79v234.61c0,8-7.54,15.02-16.15,15.02s-15.05-6.75-15.05-15.02v-113.3H232.19v14.45h545.1v98.85c0,16.25,13.23,29.47,29.5,29.47s30.61-13.49,30.61-29.47v-234.61c0-9.31,6.57-16.34,15.27-16.34s16.35,7.33,16.35,16.34v188.52c0,16.87,13.75,30.6,30.66,30.6s30.64-13.73,30.64-30.6v-132.04c0-8.66,7.05-15.7,15.72-15.7s15.72,7.04,15.72,15.7l.02,70c0,21.93,17.97,30.01,30.1,30.08,4.97,0,9.68-1.21,13.82-3.36,9.69-5.01,16.31-15.1,16.31-26.72v-51.95c-.12-2.33-.27-4.64-.44-6.95Z" />
          </g>

          <circle r="2.5" fill={TONE.lime} className="hp-flow-dot">
            <animateMotion dur="18s" repeatCount="indefinite" path={PRACTICE_RING_PATH} />
          </circle>
        </svg>
        {categories.map((category, index) => {
          const Icon = category.icon

          return (
            <span
              key={category.key}
              className="hp-practice-cat"
              style={{ '--cat-angle': `${index * 30 - 90}deg` } as React.CSSProperties}
            >
              <span className="hp-practice-cat-badge">
                <Icon className="hp-practice-cat-icon" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="hp-practice-cat-label">{category.label}</span>
            </span>
          )
        })}
      </div>
    </div>
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

const SYSTEM_REPS = [
  { icon: Brain, label: 'Creations' },
  { icon: RadioTower, label: 'Activations' },
  { icon: Heart, label: 'Connections' },
  { icon: CalendarDays, label: 'Sessions' },
] as const

export function InstallRunEvolve() {
  return (
    <div className="hp-system" aria-label="Install once, run daily, evolve as life changes">
      <div className="hp-system-phase" style={{ color: TONE.lime }}>
        <span className="hp-system-node">
          <Rocket strokeWidth={1.6} aria-hidden="true" />
        </span>
        <p className="hp-system-kicker">Phase 1</p>
        <p className="hp-system-title">Install</p>
        <p className="hp-system-hint">Once</p>
      </div>

      <span className="hp-system-spine" aria-hidden="true" />

      <div className="hp-system-phase" style={{ color: TONE.cyan }}>
        <span className="hp-system-node">
          <Map strokeWidth={1.6} aria-hidden="true" />
        </span>
        <p className="hp-system-kicker">Phase 2</p>
        <p className="hp-system-title">Run</p>
        <p className="hp-system-hint">Daily</p>
        <ul className="hp-system-reps">
          {SYSTEM_REPS.map((rep) => (
            <li key={rep.label} className="hp-system-rep">
              <rep.icon strokeWidth={1.75} aria-hidden="true" />
              <span>{rep.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <span className="hp-system-spine hp-system-spine-evolve" aria-hidden="true" />

      <div className="hp-system-phase" style={{ color: TONE.purple }}>
        <span className="hp-system-node">
          <RefreshCw strokeWidth={1.6} aria-hidden="true" />
        </span>
        <p className="hp-system-kicker">Phase 3</p>
        <p className="hp-system-title">Evolve</p>
        <p className="hp-system-hint">As life changes</p>
      </div>
    </div>
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
