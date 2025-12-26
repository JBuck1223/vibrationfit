'use client'

import React, { useState } from 'react'
import {
  Container,
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Stack,
  DatePicker,
  PageHero,
} from '@/lib/design-system/components'

const VALUE_TYPES = [
  { value: 'money', label: 'Money' },
  { value: 'value', label: 'Value (intangible)' },
]

const VISION_CATEGORY_OPTIONS = [
  { value: 'money', label: 'Money & Wealth' },
  { value: 'work', label: 'Business & Work' },
  { value: 'social', label: 'Social & Friendship' },
  { value: 'family', label: 'Family & Parenting' },
  { value: 'love', label: 'Love & Partnership' },
  { value: 'fun', label: 'Fun & Recreation' },
  { value: 'health', label: 'Health & Vitality' },
  { value: 'spirituality', label: 'Expansion & Spirituality' },
]

const ENTRY_CATEGORY_OPTIONS = [
  { value: 'gift', label: 'Gift' },
  { value: 'discount', label: 'Discount' },
  { value: 'income', label: 'Income' },
  { value: 'found_money', label: 'Found Money' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'support', label: 'Support / Kindness' },
  { value: 'synchronicity', label: 'Synchronicity' },
]

export default function AbundanceLogPage() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [valueType, setValueType] = useState<'money' | 'value'>('money')
  const [amount, setAmount] = useState('')
  const [visionCategory, setVisionCategory] = useState('')
  const [entryCategory, setEntryCategory] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/vibration/abundance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          valueType,
          amount: amount ? Number(amount) : undefined,
          visionCategory: visionCategory || undefined,
          entryCategory: entryCategory || undefined,
          note,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to log abundance moment.')
      }

      setSuccessMessage('Abundance moment logged. VIVA captured the appreciation vibe.')
      setNote('')
      setAmount('')
      setValueType('money')
      setVisionCategory('')
      setEntryCategory('')
      setDate(today)
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Abundance Tracker"
          subtitle="Log daily gifts, synchronicities, and abundance moments. Train your mind to notice what's flowing to you."
        />
        <Card className="p-4 md:p-6">
          <p className="text-neutral-400 text-sm md:text-base">
            Celebrate every moment of receiving. Each entry updates your vibrational log with an Above the Green Line pulse.
          </p>
        </Card>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <DatePicker
                label="Date"
                value={date}
                maxDate={today}
                onChange={(dateString: string) => setDate(dateString)}
                required
              />

              <Select
                label="Type"
                value={valueType}
                onChange={(value) => setValueType(value as 'money' | 'value')}
                options={VALUE_TYPES}
              />

              <Input
                type="number"
                step="0.01"
                min="0"
                label="Amount"
                placeholder={valueType === 'money' ? '0.00' : 'Optional amount'}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required={valueType === 'money'}
              />
            </div>

            <Textarea
              label="Note"
              placeholder="Describe this abundance moment in present-tense appreciation."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              required
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Vision Category"
                value={visionCategory}
                onChange={(value) => setVisionCategory(value)}
                options={VISION_CATEGORY_OPTIONS}
                placeholder="No specific vision category"
              />

              <Select
                label="Entry Category"
                value={entryCategory}
                onChange={(value) => setEntryCategory(value)}
                options={ENTRY_CATEGORY_OPTIONS}
                placeholder="Select entry category (optional)"
              />
            </div>

            <div className="text-xs text-neutral-500">
              {valueType === 'money'
                ? 'Money entries require an amount. Value entries can capture intangible appreciation without a dollar value.'
                : 'Value entries celebrate intangible abundance—share the story in the note and add an amount if you want to track it numerically.'}
            </div>

            {successMessage && (
              <div className="bg-primary-500/10 border border-primary-500/40 rounded-xl p-4 text-sm text-primary-200">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            <Button type="submit" variant="primary" loading={isSubmitting}>
              {isSubmitting ? 'Logging...' : 'Log Abundance Moment'}
            </Button>
          </form>
        </Card>
      </Stack>
    </Container>
  )
}

