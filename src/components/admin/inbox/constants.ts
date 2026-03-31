import {
  Mail,
  MessageSquare,
  Inbox,
  Send,
  Layers,
} from 'lucide-react'

export interface SidebarFilterItem {
  value: string
  label: string
  icon: typeof Mail
}

export interface SidebarSection {
  key: string
  label: string
  path: string
  icon: typeof Mail
  iconColor: string
  activeColor: string
  filters: SidebarFilterItem[]
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    key: 'all',
    label: 'All Messages',
    path: '/admin/inbox/all',
    icon: Layers,
    iconColor: 'text-[#39FF14]',
    activeColor: 'bg-[#39FF14]/10 text-[#39FF14]',
    filters: [
      { value: 'inbox', label: 'Inbox', icon: Inbox },
      { value: 'sent', label: 'Sent', icon: Send },
    ],
  },
  {
    key: 'email',
    label: 'Email',
    path: '/admin/inbox/email',
    icon: Mail,
    iconColor: 'text-[#00FFFF]',
    activeColor: 'bg-[#00FFFF]/10 text-[#00FFFF]',
    filters: [
      { value: 'inbox', label: 'Inbox', icon: Inbox },
      { value: 'sent', label: 'Sent', icon: Send },
    ],
  },
  {
    key: 'sms',
    label: 'SMS',
    path: '/admin/inbox/sms',
    icon: MessageSquare,
    iconColor: 'text-[#BF00FF]',
    activeColor: 'bg-[#BF00FF]/10 text-[#BF00FF]',
    filters: [
      { value: 'inbox', label: 'Inbox', icon: Inbox },
      { value: 'sent', label: 'Sent', icon: Send },
    ],
  },
]

export const CHANNEL_ICON: Record<string, { icon: typeof Mail; color: string }> = {
  email: { icon: Mail, color: 'text-[#00FFFF]' },
  sms: { icon: MessageSquare, color: 'text-[#BF00FF]' },
}

export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
