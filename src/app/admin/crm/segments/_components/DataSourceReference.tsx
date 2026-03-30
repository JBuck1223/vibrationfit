'use client'

import { useState } from 'react'
import { Card } from '@/lib/design-system/components'
import { Database, ChevronDown, ChevronRight } from 'lucide-react'

const mono = 'font-mono text-xs'

interface SourceRow {
  filter: string
  table: string
  columns: string
  notes?: string
}

interface ValueMapping {
  filter: string
  values: { value: string; condition: string }[]
}

const BASE_AUDIENCES: SourceRow[] = [
  {
    filter: 'Members',
    table: 'user_profiles',
    columns: 'user_id, is_active, is_draft',
    notes: 'Only active, non-draft profiles with non-null email',
  },
  {
    filter: 'Members (contact info)',
    table: 'user_accounts',
    columns: 'id, email, phone, sms_opt_in, email_opt_in',
    notes: 'Joined via user_profiles.user_id = user_accounts.id',
  },
  {
    filter: 'Leads',
    table: 'leads',
    columns: 'id, email, first_name, last_name, status, type',
    notes: 'Direct query, filtered by email not null',
  },
]

const MEMBER_SOURCES: SourceRow[] = [
  { filter: 'Intensive Status', table: 'intensive_checklist', columns: 'user_id, status, unlock_completed' },
  { filter: 'Subscription Status', table: 'customer_subscriptions', columns: 'user_id, status' },
  { filter: 'Subscription Tier', table: 'customer_subscriptions + membership_tiers', columns: 'cs.status, mt.name' },
  { filter: 'Engagement Status', table: 'user_activity_metrics', columns: 'engagement_status' },
  { filter: 'Health Status', table: 'user_activity_metrics', columns: 'health_status' },
  { filter: 'Days Since Login', table: 'user_activity_metrics', columns: 'days_since_last_login' },
  { filter: 'Has Phone', table: 'user_accounts', columns: 'phone IS NOT NULL' },
  { filter: 'SMS Opt-in', table: 'user_accounts', columns: 'sms_opt_in' },
  { filter: 'Email Opt-in', table: 'user_accounts', columns: 'email_opt_in' },
  { filter: 'Has Vision', table: 'user_activity_metrics', columns: 'vision_count > 0' },
  { filter: 'Has Journal Entry', table: 'user_activity_metrics', columns: 'journal_entry_count > 0' },
  { filter: 'Profile Completion', table: 'user_activity_metrics', columns: 'profile_completion_percent' },
  { filter: 'Created After/Before', table: 'auth.users', columns: 'created_at', notes: 'Via admin.listUsers, first 1000' },
]

const VALUE_MAPPINGS: ValueMapping[] = [
  {
    filter: 'Intensive Status',
    values: [
      { value: 'no_intensive', condition: 'User has NO row in intensive_checklist' },
      { value: 'pending', condition: 'intensive_checklist.status = \'pending\'' },
      { value: 'in_progress', condition: 'intensive_checklist.status = \'in_progress\'' },
      { value: 'completed', condition: 'intensive_checklist.status = \'completed\' AND unlock_completed = false' },
      { value: 'unlocked', condition: 'intensive_checklist.unlock_completed = true' },
    ],
  },
  {
    filter: 'Subscription Status',
    values: [
      { value: 'free', condition: 'No row in customer_subscriptions, or all rows are canceled/incomplete_expired' },
      { value: 'active', condition: 'customer_subscriptions.status = \'active\'' },
      { value: 'trialing', condition: 'customer_subscriptions.status = \'trialing\'' },
      { value: 'canceled', condition: 'customer_subscriptions.status = \'canceled\'' },
      { value: 'past_due', condition: 'customer_subscriptions.status = \'past_due\'' },
    ],
  },
  {
    filter: 'Subscription Tier',
    values: [
      { value: 'Free', condition: 'No active/trialing row in customer_subscriptions' },
      { value: '(dynamic)', condition: 'membership_tiers.name via customer_subscriptions JOIN (latest active row per user)' },
    ],
  },
  {
    filter: 'Boolean Filters',
    values: [
      { value: 'has_phone = yes', condition: 'user_accounts.phone IS NOT NULL' },
      { value: 'sms_opt_in = yes', condition: 'user_accounts.sms_opt_in = true' },
      { value: 'email_opt_in = yes', condition: 'user_accounts.email_opt_in = true (or not explicitly false)' },
      { value: 'has_vision = yes', condition: 'user_activity_metrics.vision_count > 0' },
      { value: 'has_journal_entry = yes', condition: 'user_activity_metrics.journal_entry_count > 0' },
    ],
  },
]

const LEAD_SOURCES: SourceRow[] = [
  { filter: 'Lead Status', table: 'leads', columns: 'status' },
  { filter: 'Lead Type', table: 'leads', columns: 'type' },
  { filter: 'UTM Source/Medium/Campaign', table: 'leads', columns: 'utm_source, utm_medium, utm_campaign', notes: 'ILIKE match' },
  { filter: 'Created After/Before', table: 'leads', columns: 'created_at' },
]

const EXCLUSION_SOURCES: { exclusion: string; behavior: string }[] = [
  { exclusion: 'Exclude Leads overlap', behavior: 'Loads all leads.email, removes member emails found in leads' },
  { exclusion: 'Exclude Segment', behavior: 'Loads blast_segments row, runs queryRecipients, removes matching emails' },
  { exclusion: 'Email Suppressions', behavior: 'email_suppressions table \u2014 bounced/complained addresses removed at preview + send' },
]

function SourceTable({ rows }: { rows: SourceRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#333]">
            <th className="text-left py-2 pr-4 text-neutral-500 font-medium">Filter</th>
            <th className="text-left py-2 pr-4 text-neutral-500 font-medium">Source Table</th>
            <th className="text-left py-2 pr-4 text-neutral-500 font-medium">Column(s)</th>
            <th className="text-left py-2 text-neutral-500 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.filter} className="border-b border-[#222]">
              <td className="py-2 pr-4 text-neutral-300">{row.filter}</td>
              <td className={`py-2 pr-4 text-[#00FFFF] ${mono}`}>{row.table}</td>
              <td className={`py-2 pr-4 text-neutral-400 ${mono}`}>{row.columns}</td>
              <td className="py-2 text-neutral-600 text-xs">{row.notes || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ValueMappingTable({ mappings }: { mappings: ValueMapping[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#333]">
            <th className="text-left py-2 pr-4 text-neutral-500 font-medium">Filter</th>
            <th className="text-left py-2 pr-4 text-neutral-500 font-medium">Value</th>
            <th className="text-left py-2 text-neutral-500 font-medium">DB Condition</th>
          </tr>
        </thead>
        <tbody>
          {mappings.flatMap((m) =>
            m.values.map((v, i) => (
              <tr key={`${m.filter}-${v.value}`} className="border-b border-[#222]">
                {i === 0 ? (
                  <td
                    className="py-2 pr-4 text-neutral-300 align-top"
                    rowSpan={m.values.length}
                  >
                    {m.filter}
                  </td>
                ) : null}
                <td className={`py-2 pr-4 text-[#39FF14] ${mono}`}>{v.value}</td>
                <td className={`py-2 text-neutral-400 ${mono}`}>{v.condition}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function DataSourceReference() {
  const [open, setOpen] = useState(false)

  return (
    <Card className="p-6 md:p-8">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <Database className="w-5 h-5 text-[#BF00FF]" />
        <h2 className="text-lg font-semibold text-white flex-1">Data Sources</h2>
        {open ? (
          <ChevronDown className="w-5 h-5 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
        ) : (
          <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
        )}
      </button>
      <p className="text-sm text-neutral-600 mt-1 mb-0">
        Exact database tables, columns, and value mappings behind each filter
      </p>

      {open && (
        <div className="mt-6 space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-3">Base Audiences</h3>
            <SourceTable rows={BASE_AUDIENCES} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-3">Member Filters</h3>
            <SourceTable rows={MEMBER_SOURCES} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-3">
              Filter Value Mappings
            </h3>
            <p className="text-xs text-neutral-600 mb-3">
              What each filter value actually queries in the database
            </p>
            <ValueMappingTable mappings={VALUE_MAPPINGS} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-3">Lead Filters</h3>
            <SourceTable rows={LEAD_SOURCES} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-3">Exclusions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#333]">
                    <th className="text-left py-2 pr-4 text-neutral-500 font-medium">Exclusion</th>
                    <th className="text-left py-2 text-neutral-500 font-medium">Behavior</th>
                  </tr>
                </thead>
                <tbody>
                  {EXCLUSION_SOURCES.map((row) => (
                    <tr key={row.exclusion} className="border-b border-[#222]">
                      <td className="py-2 pr-4 text-neutral-300">{row.exclusion}</td>
                      <td className="py-2 text-neutral-400 text-xs">{row.behavior}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
