'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Briefcase, Heart, Home, Plus, Trash2, Wallet } from 'lucide-react'
import { DatePicker, Input, Select, Textarea } from '@/lib/design-system/components'
import { ShippingStreetField } from '@/components/account/ShippingStreetField'
import type { RosterChild, RosterPet } from '@/lib/roster/types'
import {
  AMOUNT_OPTIONS,
  CURRENCY_OPTIONS,
  DEBT_OPTIONS,
  EDUCATION_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  ETHNICITY_OPTIONS,
  GENDER_OPTIONS,
  LIVING_SITUATION_OPTIONS,
  PET_KIND_SUGGESTIONS,
  RELATIONSHIP_LENGTH_OPTIONS,
  RELATIONSHIP_STATUS_OPTIONS,
  SOCIAL_PREFERENCE_OPTIONS,
  TIME_AT_LOCATION_OPTIONS,
  TIME_IN_ROLE_OPTIONS,
  hasPartner,
  type WorldOption,
} from '@/lib/your-world/options'
import type { YourWorldSnapshot } from '@/lib/your-world/types'
import { cn } from '@/lib/utils'
import { NameWithSayAs } from './NameWithSayAs'

export type WorldScreen = 'people' | 'home' | 'money'

export const WORLD_SCREENS: Array<{ id: WorldScreen; title: string; subtitle: string; icon: typeof Heart }> = [
  { id: 'people', title: 'You and your people', subtitle: 'Who fills your days.', icon: Heart },
  { id: 'home', title: 'Home and work', subtitle: 'Where you live and what you do.', icon: Home },
  { id: 'money', title: 'Money', subtitle: 'Ranges only. Every one has a "prefer not to say".', icon: Wallet },
]

interface EditorProps {
  value: YourWorldSnapshot
  onChange: (next: YourWorldSnapshot) => void
  /** The member's first name from Account, shown read-only. */
  firstName: string
  screens?: WorldScreen[]
  readOnly?: boolean
  /** Paths that differ from the active version (draft highlighting). */
  changed?: Set<string>
}

const HIGHLIGHT = '[&_.vf-field]:border-[#B3B300]'

function Field({ path, changed, children, className }: { path: string; changed?: Set<string>; children: ReactNode; className?: string }) {
  return <div className={cn(changed?.has(path) && HIGHLIGHT, className)}>{children}</div>
}

function Pick({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string
  options: WorldOption[]
  value: string | undefined
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <Select
      label={label}
      options={[{ value: '', label: 'Not set' }, ...options]}
      placeholder="Choose..."
      value={value || ''}
      onChange={(v: string) => onChange(v)}
      disabled={disabled}
    />
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Heart; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 md:p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-white">
        <Icon className="h-4 w-4 text-[#39FF14]" />
        {title}
      </h2>
      {children}
    </section>
  )
}

function HobbiesInput({ value, onChange, disabled }: { value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const [text, setText] = useState(value.join(', '))
  useEffect(() => {
    setText((current) => {
      const parsed = current.split(',').map((s) => s.trim()).filter(Boolean)
      return parsed.join('|') === value.join('|') ? current : value.join(', ')
    })
  }, [value])
  return (
    <Input
      label="Current hobbies"
      value={text}
      disabled={disabled}
      placeholder="Hiking, pottery, pickleball"
      helperText="Separate with commas."
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onChange(text.split(',').map((s) => s.trim()).filter(Boolean))}
    />
  )
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-[#39FF14]/40 hover:text-[#39FF14]"
    >
      <Plus className="h-4 w-4" />
      {children}
    </button>
  )
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center gap-1 text-xs text-neutral-500 transition hover:text-[#FF0040]"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Remove
    </button>
  )
}

export function YourWorldEditor({ value, onChange, firstName, screens, readOnly = false, changed }: EditorProps) {
  const shown = new Set<WorldScreen>(screens ?? ['people', 'home', 'money'])
  const set = (patch: Partial<YourWorldSnapshot>) => onChange({ ...value, ...patch })
  const setPartner = (patch: Partial<YourWorldSnapshot['partner']>) => set({ partner: { ...value.partner, ...patch } })
  const setAddress = (patch: Partial<YourWorldSnapshot['address']>) => set({ address: { ...value.address, ...patch } })
  const setWork = (patch: Partial<YourWorldSnapshot['work']>) => set({ work: { ...value.work, ...patch } })
  const setMoney = (patch: Partial<YourWorldSnapshot['money']>) => set({ money: { ...value.money, ...patch } })
  const setChild = (i: number, patch: Partial<RosterChild>) =>
    set({ children: value.children.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) })
  const setPet = (i: number, patch: Partial<RosterPet>) =>
    set({ pets: value.pets.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) })

  const partnered = hasPartner(value.partner.status)
  const showChildren = Boolean(value.partner.status) || value.children.length > 0

  return (
    <div className="space-y-6">
      {shown.has('people') && (
        <>
          <Section title="You" icon={Heart}>
            <NameWithSayAs
              nameLabel="Your first name"
              name={firstName}
              nameReadOnly
              sayAs={value.say_as || ''}
              onSayAsChange={(say_as) => set({ say_as })}
              readOnly={readOnly}
              highlightSayAs={changed?.has('say_as')}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field path="gender" changed={changed}>
                <Pick label="Gender" options={GENDER_OPTIONS} value={value.gender} onChange={(gender) => set({ gender })} disabled={readOnly} />
              </Field>
              <Field path="ethnicity" changed={changed}>
                <Pick label="Ethnicity" options={ETHNICITY_OPTIONS} value={value.ethnicity} onChange={(ethnicity) => set({ ethnicity })} disabled={readOnly} />
              </Field>
              <Field path="social_preference" changed={changed}>
                <Pick
                  label="Social preference"
                  options={SOCIAL_PREFERENCE_OPTIONS}
                  value={value.social_preference}
                  onChange={(social_preference) => set({ social_preference })}
                  disabled={readOnly}
                />
              </Field>
              <Field path="hobbies" changed={changed}>
                <HobbiesInput value={value.hobbies} onChange={(hobbies) => set({ hobbies })} disabled={readOnly} />
              </Field>
            </div>
          </Section>

          <Section title="Your people" icon={Heart}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field path="partner.status" changed={changed}>
                <Pick
                  label="Relationship status"
                  options={RELATIONSHIP_STATUS_OPTIONS}
                  value={value.partner.status}
                  onChange={(status) => setPartner({ status })}
                  disabled={readOnly}
                />
              </Field>
              {partnered && (
                <Field path="partner.length" changed={changed}>
                  <Pick
                    label="How long together"
                    options={RELATIONSHIP_LENGTH_OPTIONS}
                    value={value.partner.length}
                    onChange={(length) => setPartner({ length })}
                    disabled={readOnly}
                  />
                </Field>
              )}
            </div>
            {partnered && (
              <NameWithSayAs
                nameLabel="Partner's name"
                name={value.partner.name || ''}
                sayAs={value.partner.say_as || ''}
                onNameChange={(name) => setPartner({ name })}
                onSayAsChange={(say_as) => setPartner({ say_as })}
                readOnly={readOnly}
                highlightName={changed?.has('partner.name')}
                highlightSayAs={changed?.has('partner.say_as')}
              />
            )}

            {showChildren && (
              <div className="space-y-4 border-t border-white/[0.06] pt-4">
                <p className="text-sm font-medium text-white">Children</p>
                {value.children.map((child, i) => (
                  <div key={i} className="space-y-3 rounded-xl border border-white/[0.06] p-3">
                    <NameWithSayAs
                      nameLabel="Name"
                      name={child.name || ''}
                      sayAs={child.say_as || ''}
                      onNameChange={(name) => setChild(i, { name })}
                      onSayAsChange={(say_as) => setChild(i, { say_as })}
                      readOnly={readOnly}
                      highlightName={changed?.has(`children.${i}.name`)}
                      highlightSayAs={changed?.has(`children.${i}.say_as`)}
                    />
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <Field path={`children.${i}.birthday`} changed={changed} className="w-full md:w-1/2">
                        <DatePicker
                          label="Birthday"
                          value={child.birthday || ''}
                          onChange={(birthday: string) => setChild(i, { birthday })}
                          disabled={readOnly}
                        />
                      </Field>
                      {!readOnly && (
                        <RemoveButton
                          label={`Remove ${child.name || 'child'}`}
                          onClick={() => set({ children: value.children.filter((_, idx) => idx !== i) })}
                        />
                      )}
                    </div>
                  </div>
                ))}
                {!readOnly && <AddButton onClick={() => set({ children: [...value.children, {}] })}>Add a child</AddButton>}
              </div>
            )}

            <div className="space-y-4 border-t border-white/[0.06] pt-4">
              <p className="text-sm font-medium text-white">Pets</p>
              {value.pets.map((pet, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-white/[0.06] p-3">
                  <NameWithSayAs
                    nameLabel="Name"
                    name={pet.name || ''}
                    sayAs={pet.say_as || ''}
                    onNameChange={(name) => setPet(i, { name })}
                    onSayAsChange={(say_as) => setPet(i, { say_as })}
                    readOnly={readOnly}
                    highlightName={changed?.has(`pets.${i}.name`)}
                    highlightSayAs={changed?.has(`pets.${i}.say_as`)}
                  />
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <Field path={`pets.${i}.kind`} changed={changed} className="w-full md:w-1/2">
                      <Input
                        label="Kind"
                        list="your-world-pet-kinds"
                        value={pet.kind || ''}
                        placeholder="Dog"
                        disabled={readOnly}
                        onChange={(e) => setPet(i, { kind: e.target.value })}
                      />
                    </Field>
                    {!readOnly && (
                      <RemoveButton
                        label={`Remove ${pet.name || 'pet'}`}
                        onClick={() => set({ pets: value.pets.filter((_, idx) => idx !== i) })}
                      />
                    )}
                  </div>
                </div>
              ))}
              <datalist id="your-world-pet-kinds">
                {PET_KIND_SUGGESTIONS.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
              {!readOnly && <AddButton onClick={() => set({ pets: [...value.pets, {}] })}>Add a pet</AddButton>}
            </div>
          </Section>
        </>
      )}

      {shown.has('home') && (
        <>
          <Section title="Home" icon={Home}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field path="address.line1" changed={changed} className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#E5E7EB]">Address</label>
                {readOnly ? (
                  <Input value={value.address.line1 || ''} disabled />
                ) : (
                  <ShippingStreetField
                    value={value.address.line1 || ''}
                    onChange={(line1) => setAddress({ line1 })}
                    onSelect={(s) =>
                      setAddress({
                        line1: s.line1,
                        city: s.city || value.address.city,
                        region: s.state || value.address.region,
                        postal_code: s.postalCode || value.address.postal_code,
                        country: s.country || value.address.country,
                      })
                    }
                  />
                )}
              </Field>
              <Field path="address.line2" changed={changed} className="md:col-span-2">
                <Input
                  label="Apartment, suite, or unit"
                  value={value.address.line2 || ''}
                  disabled={readOnly}
                  autoComplete="address-line2"
                  onChange={(e) => setAddress({ line2: e.target.value })}
                />
              </Field>
              <Field path="address.city" changed={changed}>
                <Input label="City" value={value.address.city || ''} disabled={readOnly} autoComplete="address-level2" onChange={(e) => setAddress({ city: e.target.value })} />
              </Field>
              <Field path="address.region" changed={changed}>
                <Input label="State or region" value={value.address.region || ''} disabled={readOnly} autoComplete="address-level1" onChange={(e) => setAddress({ region: e.target.value })} />
              </Field>
              <Field path="address.postal_code" changed={changed}>
                <Input label="Postal code" value={value.address.postal_code || ''} disabled={readOnly} autoComplete="postal-code" onChange={(e) => setAddress({ postal_code: e.target.value })} />
              </Field>
              <Field path="address.country" changed={changed}>
                <Input label="Country" value={value.address.country || ''} disabled={readOnly} autoComplete="country-name" placeholder="United States" onChange={(e) => setAddress({ country: e.target.value })} />
              </Field>
              <Field path="living_situation" changed={changed}>
                <Pick label="Own or rent" options={LIVING_SITUATION_OPTIONS} value={value.living_situation} onChange={(living_situation) => set({ living_situation })} disabled={readOnly} />
              </Field>
              <Field path="time_at_location" changed={changed}>
                <Pick label="Time there" options={TIME_AT_LOCATION_OPTIONS} value={value.time_at_location} onChange={(time_at_location) => set({ time_at_location })} disabled={readOnly} />
              </Field>
            </div>
          </Section>

          <Section title="Work" icon={Briefcase}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field path="work.employment_type" changed={changed}>
                <Pick label="Employment type" options={EMPLOYMENT_TYPE_OPTIONS} value={value.work.employment_type} onChange={(employment_type) => setWork({ employment_type })} disabled={readOnly} />
              </Field>
              <Field path="work.time_in_role" changed={changed}>
                <Pick label="Time in role" options={TIME_IN_ROLE_OPTIONS} value={value.work.time_in_role} onChange={(time_in_role) => setWork({ time_in_role })} disabled={readOnly} />
              </Field>
              <Field path="work.occupation" changed={changed}>
                <Input label="Occupation" value={value.work.occupation || ''} disabled={readOnly} onChange={(e) => setWork({ occupation: e.target.value })} />
              </Field>
              <Field path="work.company" changed={changed}>
                <Input label="Company" value={value.work.company || ''} disabled={readOnly} onChange={(e) => setWork({ company: e.target.value })} />
              </Field>
              <Field path="work.education" changed={changed}>
                <Pick label="Education" options={EDUCATION_OPTIONS} value={value.work.education} onChange={(education) => setWork({ education })} disabled={readOnly} />
              </Field>
              <Field path="work.education_description" changed={changed} className="md:col-span-2">
                <Textarea
                  label="Education details"
                  value={value.work.education_description || ''}
                  disabled={readOnly}
                  placeholder="What you studied, certifications, or training"
                  onChange={(e) => setWork({ education_description: e.target.value })}
                />
              </Field>
            </div>
          </Section>
        </>
      )}

      {shown.has('money') && (
        <Section title="Money" icon={Wallet}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field path="money.currency" changed={changed}>
              <Pick label="Currency" options={CURRENCY_OPTIONS} value={value.money.currency} onChange={(currency) => setMoney({ currency })} disabled={readOnly} />
            </Field>
            <Field path="money.household_income" changed={changed}>
              <Pick label="Household income (yearly)" options={AMOUNT_OPTIONS} value={value.money.household_income} onChange={(household_income) => setMoney({ household_income })} disabled={readOnly} />
            </Field>
            <Field path="money.savings_retirement" changed={changed}>
              <Pick label="Savings and retirement" options={AMOUNT_OPTIONS} value={value.money.savings_retirement} onChange={(savings_retirement) => setMoney({ savings_retirement })} disabled={readOnly} />
            </Field>
            <Field path="money.assets_equity" changed={changed}>
              <Pick label="Assets and equity" options={AMOUNT_OPTIONS} value={value.money.assets_equity} onChange={(assets_equity) => setMoney({ assets_equity })} disabled={readOnly} />
            </Field>
            <Field path="money.consumer_debt" changed={changed}>
              <Pick label="Consumer debt" options={DEBT_OPTIONS} value={value.money.consumer_debt} onChange={(consumer_debt) => setMoney({ consumer_debt })} disabled={readOnly} />
            </Field>
          </div>
        </Section>
      )}
    </div>
  )
}
