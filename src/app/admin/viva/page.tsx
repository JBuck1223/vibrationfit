'use client'

/**
 * Admin guide for the VIVA Conversational Coach.
 *
 * Explains how the system works end-to-end (layers, data sources, memory,
 * tools), how to control which model powers it, and how billing is routed.
 */

import Link from 'next/link'
import {
  Container,
  Card,
  Stack,
  PageHero,
  Button,
} from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  MessageCircle,
  Layers,
  Database,
  Brain,
  Sparkles,
  Wrench,
  Users,
  Cpu,
  CreditCard,
  ExternalLink,
} from 'lucide-react'

const TEST_MODELS = [
  { id: 'openai/gpt-4o', note: 'Current default' },
  { id: 'openai/gpt-5', note: 'Deeper reasoning, slower' },
  { id: 'openai/gpt-5-mini', note: 'Fast + cheap' },
  { id: 'anthropic/claude-sonnet-4-5', note: 'Warm conversational tone' },
  { id: 'google/gemini-2.5-pro', note: 'Long context' },
]

const DATA_SOURCES = [
  ['Life Vision', 'Active vision version — all 12 categories, quoted back in their own words'],
  ['Alignment Assessment', 'Green Line status and per-category scores'],
  ['Journal', 'Recent entries, filtered by category when one is in focus'],
  ['Daily Papers', 'Gratitude pulse and practice rhythm'],
  ['Songs', 'Emotional arcs the member set to music, including lyrics themes'],
  ['Vision Board', 'Active items and what they are actualizing'],
  ['Abundance Tracker', 'Recent abundance events and flow'],
  ['MAP Items', 'Actualization plan progress'],
  ['Activation Stories', 'Completed stories and their themes'],
  ['Past Coaching', 'Recent thread titles and previews'],
]

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-8">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-5 h-5 text-primary-500" />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="text-sm text-neutral-300 leading-relaxed space-y-3">
        {children}
      </div>
    </Card>
  )
}

function VivaAdminGuideContent() {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="VIVA Conversational Coach"
          subtitle="How the coaching system works, what it knows, and how to control it"
        />

        <div className="flex flex-wrap gap-3">
          <Link href="/viva">
            <Button variant="primary" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              Open VIVA
            </Button>
          </Link>
          <Link href="/admin/ai-models">
            <Button variant="outline" size="sm">
              <Cpu className="w-4 h-4 mr-2" />
              Model Settings
            </Button>
          </Link>
        </div>

        <SectionCard icon={Layers} title="How a coaching turn works">
          <p>
            Every message a member sends to VIVA at <code className="text-neutral-100">/viva</code> flows
            through four layers:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <span className="text-white font-medium">Classify</span> — a fast model detects the
              conversational mode (connection, coaching, momentum, guide, or crisis) and emotional state.
            </li>
            <li>
              <span className="text-white font-medium">Retrieve</span> — in parallel, VIVA loads the
              member&apos;s adaptive lens (see below), durable memories, the constraint ledger, and runs
              semantic recall over everything they have ever written.
            </li>
            <li>
              <span className="text-white font-medium">Respond</span> — the main model streams a reply,
              with in-app tools available (queue a song, save a journal entry, create a story, and more).
            </li>
            <li>
              <span className="text-white font-medium">Extract</span> — after the response is sent, a
              background pass extracts new memories and constraints, embeds fresh content for recall, and
              titles new threads.
            </li>
          </ol>
          <p className="text-neutral-500">
            Small muted indicators above each response show members which sources VIVA drew from.
          </p>
        </SectionCard>

        <SectionCard icon={Database} title="What VIVA knows (the adaptive lens)">
          <p>
            Every source is queried cheaply on each turn. Sources a member does not use simply produce no
            prompt section, so each member&apos;s lens reflects how they actually use the platform.
            <span className="text-white font-medium"> Life Vision is the anchor</span> — VIVA quotes the
            member&apos;s vision back in their own words and coaches toward it.
          </p>
          <div className="grid md:grid-cols-2 gap-2 mt-2">
            {DATA_SOURCES.map(([name, detail]) => (
              <div key={name} className="flex gap-2 rounded-lg border border-neutral-800 p-3">
                <div>
                  <p className="text-white text-sm font-medium">{name}</p>
                  <p className="text-neutral-500 text-xs mt-0.5">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={Brain} title="Memory and the constraint ledger">
          <p>
            After each conversation, VIVA extracts durable facts, preferences, breakthroughs, and patterns
            into a persistent memory store, deduplicated against what it already knows. These load into
            every future conversation — this is what makes VIVA feel like it remembers the member.
          </p>
          <p>
            Limiting beliefs are tracked separately in the <span className="text-white font-medium">vibrational
            constraint ledger</span> with a status arc: uncovered, then named, working, releasing, and
            integrated. Members can view and manage their own ledger from the panel inside VIVA
            (the waypoints icon in the header).
          </p>
        </SectionCard>

        <SectionCard icon={Sparkles} title="Semantic recall">
          <p>
            Everything a member writes — journal entries, coaching messages, stories, song concepts, and
            all Life Vision sections — is embedded into a vector index. On each turn, VIVA retrieves the
            passages most relevant to what the member just said, regardless of when they wrote them. This
            powers moments like &quot;this connects to what you told me in March.&quot;
          </p>
        </SectionCard>

        <SectionCard icon={Wrench} title="In-app actions">
          <p>VIVA can act inside the platform mid-conversation. Current tools:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Queue one of the member&apos;s songs to play</li>
            <li>Save a journal entry captured from the conversation</li>
            <li>Add a vision board item</li>
            <li>Log an abundance event</li>
            <li>Add a task to today&apos;s Daily Paper</li>
            <li>Create an activation story draft</li>
          </ul>
          <p className="text-neutral-500">
            Each action confirms in the chat with a link to the created item.
          </p>
        </SectionCard>

        <SectionCard icon={Users} title="Household lens (opt-in)">
          <p>
            When two household members both enable VIVA sharing in Account Studio, VIVA can draw on the
            other member&apos;s memories, constraints, and embedded content — always attributed by name in
            the prompt. Sharing is mutual opt-in; either member turning it off closes the lens both ways.
          </p>
        </SectionCard>

        <SectionCard icon={Cpu} title="Controlling the model">
          <p>
            The coach model resolves in this order on every turn — no deploy needed to change it:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <span className="text-white font-medium">Admin override for testing</span> — open VIVA with a
              <code className="text-neutral-100"> ?model=</code> parameter. Only admin accounts are honored;
              members sending an override are silently ignored. A badge in the VIVA header shows the active
              override.
            </li>
            <li>
              <span className="text-white font-medium">The viva_coach tool</span> in{' '}
              <Link href="/admin/ai-models" className="text-primary-500 hover:underline">
                Model Settings
              </Link>{' '}
              (AI Tools tab) — changing its model changes the default for all members instantly.
            </li>
            <li>
              Environment fallback (<code className="text-neutral-100">VIVA_COACH_MODEL</code>), currently
              gpt-4o.
            </li>
          </ol>
          <p className="mt-2 text-white font-medium">Quick test links</p>
          <div className="flex flex-col gap-2">
            {TEST_MODELS.map(m => (
              <Link
                key={m.id}
                href={`/viva?model=${encodeURIComponent(m.id)}`}
                className="flex items-center justify-between rounded-lg border border-neutral-800 px-4 py-2.5 hover:border-neutral-600 transition-colors"
              >
                <span className="text-sm text-neutral-100 font-mono">{m.id}</span>
                <span className="flex items-center gap-2 text-xs text-neutral-500">
                  {m.note}
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
          <p className="text-neutral-500">
            Model ids use gateway format (provider/model). Plain OpenAI names like gpt-4o also work and are
            treated as openai/gpt-4o. Any provider available on the Vercel AI Gateway can be tested.
          </p>
        </SectionCard>

        <SectionCard icon={CreditCard} title="Billing and routing">
          <p>
            All VIVA coach traffic runs through the <span className="text-white font-medium">Vercel AI
            Gateway</span>: the streamed coaching response, mode classification, background memory
            extraction, thread auto-titling, story generation, and semantic embeddings. Gateway generation
            ids are stored with each request in the token usage ledger, so the reconciliation cron can pull
            exact billed costs per request.
          </p>
          <p className="text-neutral-500">
            Member-facing token deductions apply to conversation turns only; background processing
            (extraction, embeddings, titling) is cost-tracked but never billed to members.
          </p>
        </SectionCard>
      </Stack>
    </Container>
  )
}

export default function VivaAdminGuidePage() {
  return (
    <AdminWrapper>
      <VivaAdminGuideContent />
    </AdminWrapper>
  )
}
