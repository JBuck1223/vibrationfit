'use client'

import {
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react'
import {
  List,
  Tags,
  Eye,
  EyeOff,
  SeparatorHorizontal,
  CornerDownLeft,
} from 'lucide-react'

interface FormattedTextareaProps {
  value: string
  onChange: (value: string) => void
  variables?: string[]
  placeholder?: string
  rows?: number
  className?: string
}

export function FormattedTextarea({
  value,
  onChange,
  variables = [],
  placeholder,
  rows = 10,
  className,
}: FormattedTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showMergeTags, setShowMergeTags] = useState(false)
  const mergeTagRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        mergeTagRef.current &&
        !mergeTagRef.current.contains(e.target as Node)
      ) {
        setShowMergeTags(false)
      }
    }
    if (showMergeTags) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMergeTags])

  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      const newValue =
        value.substring(0, start) + text + value.substring(end)

      onChange(newValue)

      requestAnimationFrame(() => {
        textarea.focus()
        const pos = start + text.length
        textarea.selectionStart = pos
        textarea.selectionEnd = pos
      })
    },
    [value, onChange],
  )

  const handleBullet = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.substring(start, end)

    if (selected && selected.includes('\n')) {
      const lines = selected.split('\n')
      const bulleted = lines
        .map((line) => {
          if (line.startsWith('- ')) return line.substring(2)
          return line.trim() ? `- ${line}` : line
        })
        .join('\n')
      onChange(value.substring(0, start) + bulleted + value.substring(end))
    } else {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const lineText = value.substring(
        lineStart,
        value.indexOf('\n', start) === -1
          ? value.length
          : value.indexOf('\n', start),
      )
      if (lineText.startsWith('- ')) {
        const newValue =
          value.substring(0, lineStart) +
          lineText.substring(2) +
          value.substring(lineStart + lineText.length)
        onChange(newValue)
        requestAnimationFrame(() => {
          textarea.focus()
          textarea.selectionStart = Math.max(start - 2, lineStart)
          textarea.selectionEnd = Math.max(start - 2, lineStart)
        })
      } else {
        const newValue =
          value.substring(0, lineStart) +
          '- ' +
          value.substring(lineStart)
        onChange(newValue)
        requestAnimationFrame(() => {
          textarea.focus()
          textarea.selectionStart = start + 2
          textarea.selectionEnd = start + 2
        })
      }
    }
  }

  const handleLineBreak = () => insertAtCursor('\n\n')
  const handleDivider = () => insertAtCursor('\n---\n')

  const insertMergeTag = (variable: string) => {
    insertAtCursor(`{{${variable}}}`)
    setShowMergeTags(false)
  }

  const COMMON_TAGS = ['firstName', 'lastName', 'email']

  return (
    <div className="relative">
      <div className="flex items-center gap-0.5 p-1.5 bg-neutral-900 border border-neutral-700 border-b-0 rounded-t-lg">
        <ToolbarButton
          icon={List}
          label="Bullet List"
          onClick={handleBullet}
        />
        <ToolbarButton
          icon={SeparatorHorizontal}
          label="Divider (---)"
          onClick={handleDivider}
        />
        <ToolbarButton
          icon={CornerDownLeft}
          label="Line Break"
          onClick={handleLineBreak}
        />

        <div className="w-px h-5 bg-neutral-700 mx-1" />

        <div className="relative" ref={mergeTagRef}>
          <button
            type="button"
            onClick={() => setShowMergeTags(!showMergeTags)}
            className={`flex items-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors ${
              showMergeTags
                ? 'bg-[#00FFFF]/15 text-[#00FFFF]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            title="Insert merge tag"
          >
            <Tags className="w-3.5 h-3.5" />
            <span>Merge Tags</span>
          </button>

          {showMergeTags && (
            <div className="absolute top-full left-0 mt-1 z-20 min-w-[220px] bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
              {variables.length > 0 && (
                <div className="p-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 px-2.5 py-1">
                    Template Variables
                  </p>
                  {variables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertMergeTag(v)}
                      className="w-full text-left px-2.5 py-1.5 text-sm font-mono text-[#00FFFF] hover:bg-neutral-800 rounded transition-colors"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              )}

              <div
                className={
                  variables.length > 0
                    ? 'border-t border-neutral-700 p-1.5'
                    : 'p-1.5'
                }
              >
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 px-2.5 py-1">
                  Common
                </p>
                {COMMON_TAGS.filter((t) => !variables.includes(t)).map(
                  (tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertMergeTag(tag)}
                      className="w-full text-left px-2.5 py-1.5 text-sm font-mono text-neutral-400 hover:text-[#00FFFF] hover:bg-neutral-800 rounded transition-colors"
                    >
                      {`{{${tag}}}`}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors ${
            showPreview
              ? 'bg-[#39FF14]/15 text-[#39FF14]'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          {showPreview ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
          <span>{showPreview ? 'Edit' : 'Preview'}</span>
        </button>
      </div>

      {showPreview ? (
        <div
          className="bg-neutral-800 border border-neutral-700 rounded-b-lg p-4 overflow-auto"
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          <PlainTextPreview content={value} />
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full bg-neutral-800 border border-neutral-700 rounded-b-lg rounded-t-none px-4 py-3 text-sm text-white font-mono placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/40 focus:border-[#39FF14] resize-y transition-colors ${className || ''}`}
        />
      )}

      <div className="flex items-center gap-4 mt-1.5 text-[10px] text-neutral-600">
        <span>- bullet &nbsp; --- divider &nbsp; {'{{var}}'} merge tag</span>
      </div>
    </div>
  )
}

/** Converts plain text body to email-safe HTML (bullets, dividers, merge tags) */
export function plainTextToEmailHtml(text: string): string {
  if (!text.trim()) return ''

  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  escaped = escaped.replace(
    /\{\{(\w+)\}\}/g,
    '{{$1}}',
  )

  const lines = escaped.split('\n')
  const result: string[] = []
  let inList = false

  for (const line of lines) {
    const isBullet = line.startsWith('- ')
    const isDivider = line.trim() === '---'

    if (isBullet && !inList) {
      inList = true
      result.push('<ul style="margin:8px 0;padding-left:24px;">')
    }

    if (!isBullet && inList) {
      inList = false
      result.push('</ul>')
    }

    if (isBullet) {
      result.push(
        `  <li style="margin:4px 0;">${line.substring(2)}</li>`,
      )
    } else if (isDivider) {
      result.push(
        '<hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0;">',
      )
    } else if (line.trim() === '') {
      result.push('<br>')
    } else {
      result.push(`<p style="margin:0 0 8px;">${line}</p>`)
    }
  }

  if (inList) result.push('</ul>')

  return result.join('\n')
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

function PlainTextPreview({ content }: { content: string }) {
  if (!content)
    return <p className="text-neutral-500 italic text-sm">Nothing to preview</p>

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let key = 0

  const renderInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    const regex = /\{\{(\w+)\}\}/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      parts.push(
        <code
          key={`t-${match.index}`}
          className="bg-[#00FFFF]/15 text-[#00FFFF] px-1.5 py-0.5 rounded text-xs font-mono"
        >
          {`{{${match[1]}}}`}
        </code>,
      )
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts
  }

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul
          key={`ul-${key++}`}
          className="list-disc pl-5 my-2 space-y-1 text-sm text-neutral-300"
        >
          {listItems}
        </ul>,
      )
      listItems = []
    }
  }

  for (const line of lines) {
    if (line.startsWith('- ')) {
      listItems.push(
        <li key={`li-${key++}`}>{renderInline(line.substring(2))}</li>,
      )
    } else {
      flushList()

      if (line.trim() === '---') {
        elements.push(
          <hr key={`hr-${key++}`} className="border-neutral-700 my-3" />,
        )
      } else if (line.trim() === '') {
        elements.push(<div key={`br-${key++}`} className="h-2" />)
      } else {
        elements.push(
          <p key={`p-${key++}`} className="text-sm text-neutral-300 mb-1">
            {renderInline(line)}
          </p>,
        )
      }
    }
  }

  flushList()

  return <div>{elements}</div>
}
