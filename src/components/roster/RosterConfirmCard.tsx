'use client'

/**
 * "Here's who I'll remember" — the member reviews and corrects the facts VIVA
 * gathered during the Get to Know You conversation. Facts only; the persona
 * (VIVA's living understanding) has no confirmation UI by design.
 *
 * Dates display and edit as MM/DD/YYYY. Full dates are stored as YYYY-MM-DD.
 * Partial dates from the conversation ("1988-04" or "1988") stay as entered.
 * Blanks are valid — the card never presents empty rows to complete.
 */

import { useEffect, useState } from 'react'
import { Heart, Plus, X } from 'lucide-react'
import { Button, Card, Input } from '@/lib/design-system/components'
import { useMemberRoster } from '@/hooks/useMemberRoster'
import type {
  MemberRoster,
  RosterChild,
  RosterPerson,
  RosterPet,
  RosterUpdate,
} from '@/lib/roster/types'

interface EditState {
  partnerName: string
  partnerBirthday: string
  marriedOn: string
  children: RosterChild[]
  pets: RosterPet[]
  people: RosterPerson[]
  city: string
  region: string
  vocation: string
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const US_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

/** Stored roster dates are ISO. The card shows MM/DD/YYYY. */
function toDisplayDate(stored: string): string {
  const match = stored.trim().match(ISO_DATE)
  if (!match) return stored
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!isRealDate(year, month, day)) return stored
  return `${match[2]}/${match[3]}/${match[1]}`
}

/** Complete MM/DD/YYYY values go back to YYYY-MM-DD. Anything else is kept. */
function toStoredDate(display: string): string {
  const trimmed = display.trim()
  if (!trimmed || ISO_DATE.test(trimmed)) return trimmed
  const match = trimmed.match(US_DATE)
  if (!match) return trimmed
  const month = Number(match[1])
  const day = Number(match[2])
  const year = Number(match[3])
  if (!isRealDate(year, month, day)) return trimmed
  return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`
}

function maskDateInput(raw: string): string {
  const trimmed = raw.trim()
  if (ISO_DATE.test(trimmed)) return toDisplayDate(trimmed)

  let display = raw
  if (raw.includes('/')) {
    const parts = raw.split('/')
    const month = (parts[0] || '').replace(/\D/g, '').slice(0, 2)
    const day = (parts[1] || '').replace(/\D/g, '').slice(0, 2)
    const year = (parts[2] || '').replace(/\D/g, '').slice(0, 4)
    if (parts.length < 2) display = month
    else if (parts.length === 2) display = `${month}/${day}`
    else display = `${month}/${day}/${year}`
  } else if (!raw.includes('-')) {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 2) display = digits
    else if (digits.length <= 4) display = `${digits.slice(0, 2)}/${digits.slice(2)}`
    else display = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  }

  const stored = toStoredDate(display)
  return ISO_DATE.test(stored) ? toDisplayDate(stored) : display
}

function toEditState(roster: MemberRoster | null): EditState {
  return {
    partnerName: roster?.partner?.name || '',
    partnerBirthday: toDisplayDate(roster?.partner?.birthday || ''),
    marriedOn: toDisplayDate(roster?.partner?.married_on || ''),
    children: (roster?.children || []).map((child) => ({
      ...child,
      birthday: toDisplayDate(child.birthday || ''),
    })),
    pets: roster?.pets || [],
    people: (roster?.people || []).map((person) => ({
      ...person,
      birthday: toDisplayDate(person.birthday || ''),
    })),
    city: roster?.place?.city || '',
    region: roster?.place?.region || '',
    vocation: roster?.vocation || '',
  }
}

export function RosterConfirmCard({ onConfirmed }: { onConfirmed?: () => void }) {
  const { roster, isLoading, saveRoster, isSaving } = useMemberRoster()
  const [state, setState] = useState<EditState | null>(null)

  useEffect(() => {
    if (roster && !state) setState(toEditState(roster))
  }, [roster, state])

  if (isLoading || !roster || roster.confirmed_at || !state) return null

  const set = (patch: Partial<EditState>) => setState((s) => (s ? { ...s, ...patch } : s))
  const setRow = <K extends 'children' | 'pets' | 'people'>(
    key: K,
    idx: number,
    patch: Partial<EditState[K][number]>,
  ) =>
    set({
      [key]: state[key].map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    } as Partial<EditState>)
  const removeRow = (key: 'children' | 'pets' | 'people', idx: number) =>
    set({ [key]: state[key].filter((_, i) => i !== idx) } as Partial<EditState>)
  const addRow = (key: 'children' | 'pets' | 'people') =>
    set({ [key]: [...state[key], {}] } as Partial<EditState>)

  const handleConfirm = async () => {
    const update: RosterUpdate = {
      partner:
        state.partnerName.trim() || state.partnerBirthday.trim() || state.marriedOn.trim()
          ? {
              name: state.partnerName.trim() || undefined,
              birthday: toStoredDate(state.partnerBirthday) || undefined,
              married_on: toStoredDate(state.marriedOn) || undefined,
            }
          : null,
      children: state.children
        .filter((c) => c.name?.trim())
        .map((c) => ({ ...c, birthday: toStoredDate(c.birthday || '') || undefined })),
      pets: state.pets.filter((p) => p.name?.trim()),
      people: state.people
        .filter((p) => p.name?.trim())
        .map((p) => ({ ...p, birthday: toStoredDate(p.birthday || '') || undefined })),
      place:
        state.city.trim() || state.region.trim()
          ? { city: state.city.trim() || undefined, region: state.region.trim() || undefined }
          : null,
      vocation: state.vocation.trim() || null,
    }
    await saveRoster(update, true)
    onConfirmed?.()
  }

  const tender = (roster.tender_ground || []).filter((t) => t.who || t.note)

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-white">Here&apos;s who I&apos;ll remember</h2>
      <p className="mt-2 text-sm text-neutral-300">
        From our conversation. Fix anything I got wrong — blanks are fine. Dates are MM/DD/YYYY.
      </p>

      <div className="mt-5 space-y-6">
        {(state.partnerName || state.partnerBirthday || state.marriedOn) && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-200">Partner</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="Name"
                value={state.partnerName}
                onChange={(e) => set({ partnerName: e.target.value })}
              />
              <DateField
                label="Birthday"
                value={state.partnerBirthday}
                onChange={(partnerBirthday) => set({ partnerBirthday })}
              />
              <DateField
                label="Married on"
                value={state.marriedOn}
                onChange={(marriedOn) => set({ marriedOn })}
              />
            </div>
          </div>
        )}

        {(state.children.length > 0 || state.pets.length > 0 || state.people.length > 0) && (
          <>
            {state.children.length > 0 && (
              <RowSection
                title="Children"
                rows={state.children}
                fields={[
                  { key: 'name', label: 'Name' },
                  { key: 'birthday', label: 'Birthday', date: true },
                ]}
                onChange={(idx, patch) => setRow('children', idx, patch)}
                onRemove={(idx) => removeRow('children', idx)}
                onAdd={() => addRow('children')}
              />
            )}
            {state.pets.length > 0 && (
              <RowSection
                title="Pets"
                rows={state.pets}
                fields={[
                  { key: 'name', label: 'Name' },
                  { key: 'kind', label: 'Kind' },
                  { key: 'age', label: 'Age' },
                ]}
                onChange={(idx, patch) => setRow('pets', idx, patch)}
                onRemove={(idx) => removeRow('pets', idx)}
                onAdd={() => addRow('pets')}
              />
            )}
            {state.people.length > 0 && (
              <RowSection
                title="Important people"
                rows={state.people}
                fields={[
                  { key: 'name', label: 'Name' },
                  { key: 'role', label: 'Who they are' },
                  { key: 'birthday', label: 'Birthday', date: true },
                ]}
                onChange={(idx, patch) => setRow('people', idx, patch)}
                onRemove={(idx) => removeRow('people', idx)}
                onAdd={() => addRow('people')}
              />
            )}
          </>
        )}

        {(state.city || state.region || state.vocation) && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="City" value={state.city} onChange={(e) => set({ city: e.target.value })} />
            <Input
              label="State / region"
              value={state.region}
              onChange={(e) => set({ region: e.target.value })}
            />
            <Input
              label="What you do"
              value={state.vocation}
              onChange={(e) => set({ vocation: e.target.value })}
            />
          </div>
        )}

        {tender.length > 0 && (
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
              <Heart className="h-4 w-4 text-neutral-400" />
              Held with care
            </h3>
            {tender.map((t, i) => (
              <p key={i} className="text-sm text-neutral-400">
                {[t.who, t.note, t.date].filter(Boolean).join(' — ')}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button variant="primary" onClick={handleConfirm} disabled={isSaving}>
          {isSaving ? 'Saving...' : "That's my world"}
        </Button>
      </div>
    </Card>
  )
}

interface RowField<T> {
  key: keyof T & string
  label: string
  placeholder?: string
  date?: boolean
}

function DateField({
  label,
  value,
  onChange,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Input
      label={label}
      placeholder="MM/DD/YYYY"
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={(e) => onChange(maskDateInput(e.target.value))}
    />
  )
}

function RowSection<T extends object>({
  title,
  rows,
  fields,
  onChange,
  onRemove,
  onAdd,
}: {
  title: string
  rows: T[]
  fields: RowField<T>[]
  onChange: (idx: number, patch: Partial<T>) => void
  onRemove: (idx: number) => void
  onAdd: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-200">{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      {rows.map((row, idx) => (
        <div key={idx} className="flex items-end gap-2">
          <div className="grid flex-1 gap-2 sm:grid-cols-3">
            {fields.map((f) =>
              f.date ? (
                <DateField
                  key={f.key}
                  label={idx === 0 ? f.label : undefined}
                  value={(row[f.key] as string) || ''}
                  onChange={(value) => onChange(idx, { [f.key]: value } as Partial<T>)}
                />
              ) : (
                <Input
                  key={f.key}
                  label={idx === 0 ? f.label : undefined}
                  placeholder={f.placeholder}
                  value={(row[f.key] as string) || ''}
                  onChange={(e) => onChange(idx, { [f.key]: e.target.value } as Partial<T>)}
                />
              ),
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="mb-3 text-neutral-500 transition-colors hover:text-white"
            aria-label={`Remove ${title.toLowerCase()} row`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
