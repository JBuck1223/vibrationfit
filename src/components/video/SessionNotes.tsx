'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Spinner } from '@/lib/design-system'
import { NotebookPen, Check, Lock } from 'lucide-react'

interface SessionNotesProps {
  sessionId: string
}

export function SessionNotes({ sessionId }: SessionNotesProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef('')

  useEffect(() => {
    async function fetchNote() {
      try {
        const res = await fetch(`/api/video/sessions/${sessionId}/notes`)
        if (res.ok) {
          const data = await res.json()
          const noteContent = data.note?.content || ''
          setContent(noteContent)
          lastSavedRef.current = noteContent
        }
      } catch {
        setError('Could not load your notes')
      } finally {
        setLoading(false)
      }
    }
    fetchNote()
  }, [sessionId])

  const saveNote = useCallback(async (text: string) => {
    if (text === lastSavedRef.current) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch(`/api/video/sessions/${sessionId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (!res.ok) throw new Error('Save failed')
      lastSavedRef.current = text
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Could not save')
    } finally {
      setSaving(false)
    }
  }, [sessionId])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)
    setSaved(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveNote(val), 1200)
  }

  // Save on unmount if pending
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="sm" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-white">My Notes</h3>
          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
            <Lock className="w-3 h-3" />
            Private
          </span>
        </div>
        <div className="text-xs text-neutral-500 h-4">
          {saving && 'Saving...'}
          {saved && (
            <span className="text-primary-500 inline-flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
          {error && <span className="text-red-400">{error}</span>}
        </div>
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Jot down your takeaways, action items, or anything that resonated..."
        className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 resize-none transition-colors min-h-[120px]"
        rows={5}
      />
    </div>
  )
}
