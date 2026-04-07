'use client'

import { MentionMember } from '@/hooks/useMentionAutocomplete'

interface MentionDropdownProps {
  results: MentionMember[]
  activeIndex: number
  onSelect: (member: MentionMember) => void
  isOpen: boolean
}

export function MentionDropdown({ results, activeIndex, onSelect, isOpen }: MentionDropdownProps) {
  if (!isOpen || results.length === 0) return null

  return (
    <div className="absolute left-0 right-0 bottom-full mb-1 z-50 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden max-h-[240px] overflow-y-auto">
      {results.map((member, index) => (
        <button
          key={member.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(member)
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
            index === activeIndex
              ? 'bg-[#39FF14]/10'
              : 'hover:bg-neutral-700/50'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0">
            {member.profile_picture_url ? (
              <img
                src={member.profile_picture_url}
                alt={member.full_name || 'Member'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs font-medium">
                {member.full_name?.[0] || '?'}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-sm font-medium truncate ${
              index === activeIndex ? 'text-[#39FF14]' : 'text-white'
            }`}>
              {member.full_name || 'Unknown'}
            </span>
            {(member.role === 'admin' || member.role === 'super_admin') && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#BF00FF]/15 text-[10px] font-bold text-[#BF00FF] tracking-wide uppercase flex-shrink-0">
                Guide
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
