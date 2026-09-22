'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Input } from '@/lib/design-system/components'
import type { AddressSuggestion } from '@/lib/address/suggest'

export function ShippingStreetField({
  value,
  onChange,
  onSelect,
}: {
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: AddressSuggestion) => void
}) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [active, setActive] = useState(0)
  const [query, setQuery] = useState<string | null>(null)

  useEffect(() => {
    const lookup = query?.trim() || ''
    if (lookup.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/address/suggest?q=${encodeURIComponent(lookup)}`, {
          signal: controller.signal,
        })
        if (!response.ok) return
        const body = (await response.json()) as { suggestions?: AddressSuggestion[] }
        const next = body.suggestions || []
        setSuggestions(next)
        setActive(0)
        setOpen(next.length > 0)
      } catch {
        // Ignore aborted lookups.
      }
    }, 400)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const choose = (suggestion: AddressSuggestion) => {
    setQuery(null)
    onSelect(suggestion)
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={rootRef} className="relative">
      <Input
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setQuery(event.target.value)
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={(event) => {
          if (!open || suggestions.length === 0) return
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActive((index) => (index + 1) % suggestions.length)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActive((index) => (index - 1 + suggestions.length) % suggestions.length)
          } else if (event.key === 'Enter') {
            event.preventDefault()
            choose(suggestions[active])
          } else if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
        placeholder="Street, city, and state"
        className="w-full"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-white/10 bg-[#161616] py-1 shadow-xl"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.label} role="option" aria-selected={index === active}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(suggestion)}
                onMouseEnter={() => setActive(index)}
                className={`w-full px-3.5 py-2 text-left text-sm ${
                  index === active ? 'bg-white/[0.06] text-white' : 'text-neutral-300'
                }`}
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
