'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface MentionMember {
  id: string
  full_name: string | null
  profile_picture_url: string | null
  role: string | null
}

interface UseMentionAutocompleteOptions {
  value: string
  onChange: (value: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

export function useMentionAutocomplete({ value, onChange, textareaRef }: UseMentionAutocompleteOptions) {
  const [results, setResults] = useState<MentionMember[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [mentionStart, setMentionStart] = useState<number | null>(null)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortController = useRef<AbortController | null>(null)

  const getMentionQuery = useCallback((text: string, cursorPos: number): string | null => {
    const before = text.slice(0, cursorPos)
    const match = before.match(/@([\w\s]*)$/)
    if (!match) return null
    const atIndex = before.lastIndexOf('@')
    if (atIndex > 0 && /\w/.test(before[atIndex - 1])) return null
    return match[1]
  }, [])

  const fetchMembers = useCallback(async (query: string) => {
    abortController.current?.abort()
    const controller = new AbortController()
    abortController.current = controller

    try {
      const res = await fetch(`/api/vibe-tribe/members/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
      if (!res.ok) return
      const data = await res.json()
      if (!controller.signal.aborted) {
        setResults(data.members || [])
        setActiveIndex(0)
      }
    } catch {
      // Aborted or network error
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    const cursorPos = e.target.selectionStart
    const query = getMentionQuery(newValue, cursorPos)

    if (query !== null && query.length >= 1) {
      const atIndex = newValue.slice(0, cursorPos).lastIndexOf('@')
      setMentionStart(atIndex)
      setIsOpen(true)

      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => fetchMembers(query), 300)
    } else {
      setIsOpen(false)
      setResults([])
      setMentionStart(null)
    }
  }, [onChange, getMentionQuery, fetchMembers])

  const selectMember = useCallback((member: MentionMember) => {
    if (mentionStart === null || !textareaRef.current) return
    const name = member.full_name || 'Unknown'
    const cursorPos = textareaRef.current.selectionStart
    const before = value.slice(0, mentionStart)
    const after = value.slice(cursorPos)
    const newValue = `${before}@${name} ${after}`
    onChange(newValue)

    setIsOpen(false)
    setResults([])
    setMentionStart(null)

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const newCursor = mentionStart + name.length + 2 // @ + name + space
        textareaRef.current.selectionStart = newCursor
        textareaRef.current.selectionEnd = newCursor
        textareaRef.current.focus()
      }
    })
  }, [mentionStart, value, onChange, textareaRef])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      selectMember(results[activeIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      setResults([])
    }
  }, [isOpen, results, activeIndex, selectMember])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      abortController.current?.abort()
    }
  }, [])

  return {
    mentionResults: results,
    mentionActiveIndex: activeIndex,
    isMentionOpen: isOpen,
    mentionHandleChange: handleChange,
    mentionHandleKeyDown: handleKeyDown,
    mentionSelectMember: selectMember,
    closeMentions: () => { setIsOpen(false); setResults([]) },
  }
}
