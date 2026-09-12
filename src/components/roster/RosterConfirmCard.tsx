'use client'

/**
 * "Here's who I'll remember" — the member reviews and corrects the facts VIVA
 * gathered during the Get to Know You conversation. Facts only; the persona
 * (VIVA's living understanding) has no confirmation UI by design.
 *
 * Partial dates are valid: "1988-04-02", "1988-04", or "1988". Blanks are
 * valid too — the card never presents empty rows to complete.
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

function toEditState(roster: MemberRoster | null): EditState {
  return {
    partnerName: roster?.partner?.name || '',
    partnerBirthday: roster?.partner?.birthday || '',
    marriedOn: roster?.partner?.married_on || '',
    children: roster?.children || [],
    pets: roster?.pets || [],
    people: roster?.people || [],
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
              birthday: state.partnerBirthday.trim() || undefined,
              married_on: state.marriedOn.trim() || undefined,
            }
          : null,
      children: state.children.filter((c) => c.name?.trim()),
      pets: state.pets.filter((p) => p.name?.trim()),
      people: state.people.filter((p) => p.name?.trim()),
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
        From our conversation. Fix anything I got wrong — blanks are fine, and dates can be
        partial (&quot;1988-04&quot; or just &quot;1988&quot;).
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
              <Input
                label="Birthday"
                placeholder="YYYY-MM-DD"
                value={state.partnerBirthday}
                onChange={(e) => set({ partnerBirthday: e.target.value })}
              />
              <Input
                label="Married on"
                placeholder="YYYY-MM-DD"
                value={state.marriedOn}
                onChange={(e) => set({ marriedOn: e.target.value })}
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
                  { key: 'birthday', label: 'Birthday', placeholder: 'YYYY-MM-DD' },
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
                  { key: 'birthday', label: 'Birthday', placeholder: 'YYYY-MM-DD' },
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
            {fields.map((f) => (
              <Input
                key={f.key}
                label={idx === 0 ? f.label : undefined}
                placeholder={f.placeholder}
                value={(row[f.key] as string) || ''}
                onChange={(e) => onChange(idx, { [f.key]: e.target.value } as Partial<T>)}
              />
            ))}
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
