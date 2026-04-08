'use client'

import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'
import dynamic from 'next/dynamic'

const Picker = dynamic(() => import('@emoji-mart/react').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="w-[352px] h-[435px] bg-neutral-800 rounded-xl animate-pulse" />,
})

interface EmojiPickerButtonProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onInsert: (emoji: string) => void
  className?: string
  iconSize?: string
}

export function EmojiPickerButton({ textareaRef, onInsert, className = '', iconSize = 'w-5 h-5' }: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pickerData, setPickerData] = useState<any>(null)

  useEffect(() => {
    if (open && !pickerData) {
      import('@emoji-mart/data').then(mod => {
        const raw = mod.default ?? mod
        setPickerData(JSON.parse(JSON.stringify(raw)))
      })
    }
  }, [open, pickerData])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const handleSelect = (emoji: any) => {
    const native = emoji.native
    if (!native) return

    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const before = textarea.value.slice(0, start)
      const after = textarea.value.slice(end)
      const newValue = before + native + after
      onInsert(newValue)

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const newCursor = start + native.length
          textareaRef.current.selectionStart = newCursor
          textareaRef.current.selectionEnd = newCursor
          textareaRef.current.focus()
        }
      })
    } else {
      onInsert(native)
    }
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-9 w-9 flex items-center justify-center text-neutral-400 hover:text-[#39FF14] transition-colors flex-shrink-0"
        aria-label="Emoji picker"
      >
        <Smile className={iconSize} />
      </button>

      {open && pickerData && (
        <div className="absolute bottom-full mb-2 right-0 z-50">
          <Picker
            data={pickerData}
            onEmojiSelect={handleSelect}
            theme="dark"
            previewPosition="none"
            skinTonePosition="search"
            set="native"
          />
        </div>
      )}
    </div>
  )
}
