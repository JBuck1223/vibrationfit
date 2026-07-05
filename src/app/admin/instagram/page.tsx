'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Input,
  Textarea,
  Select,
  Container,
  Stack,
  Badge,
  Spinner,
  PageHero,
} from '@/lib/design-system/components'
import {
  Instagram,
  Facebook,
  MessageCircle,
  Zap,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  UserPlus,
  KeyRound,
} from 'lucide-react'
import { toast } from 'sonner'

interface MetaAccount {
  id: string
  platform: 'instagram' | 'facebook'
  ig_user_id: string
  username: string | null
  token_expires_at: string | null
  is_active: boolean
  created_at: string
}

interface AutomationRule {
  id: string
  account_id: string | null
  platform: 'instagram' | 'facebook' | 'both'
  trigger_type: 'dm_keyword' | 'comment_keyword'
  keyword: string
  match_type: 'exact' | 'contains'
  reply_text: string
  reply_link: string | null
  media_id: string | null
  is_active: boolean
  hit_count: number
  last_hit_at: string | null
  created_at: string
}

interface MetaMessage {
  id: string
  account_id: string | null
  platform: 'instagram' | 'facebook'
  sender_id: string
  sender_username: string | null
  direction: 'inbound' | 'outbound'
  message_type: 'dm' | 'comment'
  body: string | null
  rule_id: string | null
  rule: { keyword: string } | null
  account: { username: string | null } | null
  created_at: string
}

const EMPTY_FORM = {
  account_id: '',
  platform: 'instagram',
  trigger_type: 'dm_keyword',
  keyword: '',
  match_type: 'contains',
  reply_text: '',
  reply_link: '',
  media_id: '',
}

function PlatformBadge({ platform }: { platform: string }) {
  if (platform === 'instagram') {
    return (
      <Badge className="bg-[#BF00FF]/20 text-[#BF00FF] px-2 py-1 text-xs inline-flex items-center gap-1">
        <Instagram className="w-3 h-3" /> Instagram
      </Badge>
    )
  }
  if (platform === 'facebook') {
    return (
      <Badge className="bg-[#00FFFF]/20 text-[#00FFFF] px-2 py-1 text-xs inline-flex items-center gap-1">
        <Facebook className="w-3 h-3" /> Facebook
      </Badge>
    )
  }
  return (
    <Badge className="bg-[#333] text-white px-2 py-1 text-xs">Both</Badge>
  )
}

export default function MetaAutomationPage() {
  const [accounts, setAccounts] = useState<MetaAccount[]>([])
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [messages, setMessages] = useState<MetaMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [refreshingFeed, setRefreshingFeed] = useState(false)

  const [newToken, setNewToken] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/instagram/accounts')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch {
      toast.error('Failed to load accounts')
    }
  }, [])

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/instagram/rules')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setRules(data.rules || [])
    } catch {
      toast.error('Failed to load automation rules')
    }
  }, [])

  const fetchMessages = useCallback(async () => {
    setRefreshingFeed(true)
    try {
      const res = await fetch('/api/admin/instagram/messages?limit=50')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {
      toast.error('Failed to load activity')
    } finally {
      setRefreshingFeed(false)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchAccounts(), fetchRules(), fetchMessages()]).finally(() =>
      setLoading(false)
    )
  }, [fetchAccounts, fetchRules, fetchMessages])

  function accountLabel(accountId: string | null): string {
    if (!accountId) return 'All accounts'
    const account = accounts.find((a) => a.id === accountId)
    return account?.username ? `@${account.username}` : 'Unknown account'
  }

  async function handleConnect() {
    if (!newToken.trim()) return toast.error('Paste an Instagram access token')
    setConnecting(true)
    try {
      const res = await fetch('/api/admin/instagram/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: newToken.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to connect')
      toast.success(
        data.account?.username
          ? `Connected @${data.account.username}`
          : 'Account connected'
      )
      setNewToken('')
      fetchAccounts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect account')
    } finally {
      setConnecting(false)
    }
  }

  async function toggleAccountActive(account: MetaAccount) {
    try {
      const res = await fetch(`/api/admin/instagram/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !account.is_active }),
      })
      if (!res.ok) throw new Error()
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, is_active: !a.is_active } : a))
      )
    } catch {
      toast.error('Failed to update account')
    }
  }

  async function handleDeleteAccount(account: MetaAccount) {
    const name = account.username ? `@${account.username}` : account.ig_user_id
    if (!confirm(`Disconnect ${name}? Rules scoped to it will be deleted.`)) return
    try {
      const res = await fetch(`/api/admin/instagram/accounts/${account.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success('Account disconnected')
      setAccounts((prev) => prev.filter((a) => a.id !== account.id))
      fetchRules()
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
  }

  async function handleSubmit() {
    if (!form.keyword.trim()) return toast.error('Enter a keyword')
    if (!form.reply_text.trim()) return toast.error('Enter the reply text')

    setSaving(true)
    try {
      const isEdit = !!editingId
      const res = await fetch(
        isEdit ? `/api/admin/instagram/rules/${editingId}` : '/api/admin/instagram/rules',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, account_id: form.account_id || null }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success(isEdit ? 'Rule updated' : 'Rule created')
      resetForm()
      fetchRules()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(rule: AutomationRule) {
    setEditingId(rule.id)
    setForm({
      account_id: rule.account_id || '',
      platform: rule.platform,
      trigger_type: rule.trigger_type,
      keyword: rule.keyword,
      match_type: rule.match_type,
      reply_text: rule.reply_text,
      reply_link: rule.reply_link || '',
      media_id: rule.media_id || '',
    })
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function toggleActive(rule: AutomationRule) {
    try {
      const res = await fetch(`/api/admin/instagram/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !rule.is_active }),
      })
      if (!res.ok) throw new Error()
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
      )
    } catch {
      toast.error('Failed to update')
    }
  }

  async function handleDelete(rule: AutomationRule) {
    if (!confirm(`Delete the "${rule.keyword}" rule? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/instagram/rules/${rule.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Rule deleted')
      setRules((prev) => prev.filter((r) => r.id !== rule.id))
      if (editingId === rule.id) resetForm()
    } catch {
      toast.error('Failed to delete')
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="Meta DM Automation"
          subtitle="Keyword-triggered auto-replies for connected Instagram accounts. DM keywords reply in the conversation; comment keywords send a private reply DM to the commenter."
        />

        {/* Connected accounts */}
        <Card className="p-4 md:p-6">
          <Stack gap="md">
            <h3 className="text-white font-semibold">Connected accounts</h3>

            {accounts.length === 0 ? (
              <p className="text-sm text-neutral-400">
                No accounts connected yet. Generate a token for each Instagram
                account from the Meta app dashboard (Instagram use case → API
                setup with Instagram login) and paste it below.
              </p>
            ) : (
              <div className="divide-y divide-[#333]">
                {accounts.map((account) => (
                  <div key={account.id} className="py-3 flex items-center gap-3 flex-wrap">
                    <Instagram className="w-4 h-4 text-[#BF00FF]" />
                    <span className="text-sm text-white font-medium">
                      {account.username ? `@${account.username}` : account.ig_user_id}
                    </span>
                    {account.token_expires_at && (
                      <span className="text-xs text-neutral-500">
                        token renews by {new Date(account.token_expires_at).toLocaleDateString()}
                      </span>
                    )}
                    <div className="flex items-center gap-1 ml-auto">
                      <button onClick={() => toggleAccountActive(account)} title="Toggle active">
                        {account.is_active ? (
                          <Badge className="bg-primary-500 text-black px-2 py-1 text-xs">Active</Badge>
                        ) : (
                          <Badge className="bg-[#555] text-white px-2 py-1 text-xs">Paused</Badge>
                        )}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAccount(account)}
                        title="Disconnect"
                      >
                        <Trash2 className="w-4 h-4 text-[#FF0040]" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-200 mb-2">
                  <KeyRound className="w-3.5 h-3.5 inline mr-1" />
                  Instagram access token
                </label>
                <Input
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  placeholder="Paste the token generated for the account"
                />
              </div>
              <Button variant="secondary" onClick={handleConnect} disabled={connecting}>
                <UserPlus className="w-4 h-4 mr-1" />
                {connecting ? 'Connecting…' : 'Connect account'}
              </Button>
            </div>
          </Stack>
        </Card>

        {/* Create / Edit rule form */}
        <Card className="p-4 md:p-6">
          <Stack gap="md">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">
                {editingId ? 'Edit rule' : 'New rule'}
              </h3>
              {editingId && (
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Account"
                value={form.account_id}
                onChange={(v) => setForm({ ...form, account_id: v })}
                options={[
                  { value: '', label: 'All accounts' },
                  ...accounts.map((a) => ({
                    value: a.id,
                    label: a.username ? `@${a.username}` : a.ig_user_id,
                  })),
                ]}
              />
              <Select
                label="Trigger"
                value={form.trigger_type}
                onChange={(v) => setForm({ ...form, trigger_type: v })}
                options={[
                  { value: 'dm_keyword', label: 'DM keyword' },
                  { value: 'comment_keyword', label: 'Comment keyword' },
                ]}
              />
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-2">Keyword</label>
                <Input
                  value={form.keyword}
                  onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                  placeholder="VISION"
                />
              </div>
              <Select
                label="Match"
                value={form.match_type}
                onChange={(v) => setForm({ ...form, match_type: v })}
                options={[
                  { value: 'contains', label: 'Message contains keyword' },
                  { value: 'exact', label: 'Exact match only' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-2">Reply text</label>
              <Textarea
                value={form.reply_text}
                onChange={(e) => setForm({ ...form, reply_text: e.target.value })}
                placeholder="Here it is! Tap the link below to start your Life Vision."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-2">
                  Reply link <span className="text-neutral-500">(optional, appended to reply)</span>
                </label>
                <Input
                  value={form.reply_link}
                  onChange={(e) => setForm({ ...form, reply_link: e.target.value })}
                  placeholder="https://vibrationfit.com/go/vision"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-2">
                  Post ID <span className="text-neutral-500">(optional, scope comment rules to one post)</span>
                </label>
                <Input
                  value={form.media_id}
                  onChange={(e) => setForm({ ...form, media_id: e.target.value })}
                  placeholder="Leave blank for all posts"
                />
              </div>
            </div>

            <div>
              <Button variant="primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create rule'}
              </Button>
            </div>
          </Stack>
        </Card>

        {/* Rules table */}
        {rules.length === 0 ? (
          <Card className="text-center p-8 md:p-12">
            <p className="text-sm md:text-base text-neutral-400">
              No automation rules yet. Create your first one above.
            </p>
          </Card>
        ) : (
          <Card className="p-0 overflow-x-auto">
            <div className="min-w-[880px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#333]">
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Keyword</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Account</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Trigger</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Reply</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Hits</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Status</th>
                    <th className="text-right py-3 md:py-4 px-3 md:px-4 text-neutral-400 font-medium text-xs md:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="border-b border-[#333] hover:bg-[#1F1F1F] transition-colors">
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <span className="text-sm text-white font-medium">{rule.keyword}</span>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          {rule.match_type === 'exact' ? 'Exact match' : 'Contains'}
                          {rule.media_id ? ' · single post' : ''}
                        </div>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <span className="text-xs text-neutral-300">{accountLabel(rule.account_id)}</span>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <span className="flex items-center gap-1.5 text-xs text-neutral-300">
                          <MessageCircle className="w-3.5 h-3.5 text-neutral-500" />
                          {rule.trigger_type === 'dm_keyword' ? 'DM' : 'Comment'}
                        </span>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <div className="text-xs text-neutral-400 truncate max-w-[260px]" title={rule.reply_text}>
                          {rule.reply_text}
                        </div>
                        {rule.reply_link && (
                          <div className="text-xs text-neutral-600 truncate max-w-[260px]">{rule.reply_link}</div>
                        )}
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <span className="flex items-center gap-1 text-sm text-white font-medium">
                          <Zap className="w-3.5 h-3.5 text-neutral-500" />
                          {rule.hit_count}
                        </span>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <button onClick={() => toggleActive(rule)} title="Toggle active">
                          {rule.is_active ? (
                            <Badge className="bg-primary-500 text-black px-2 py-1 text-xs">Active</Badge>
                          ) : (
                            <Badge className="bg-[#555] text-white px-2 py-1 text-xs">Paused</Badge>
                          )}
                        </button>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(rule)} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(rule)} title="Delete">
                            <Trash2 className="w-4 h-4 text-[#FF0040]" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Activity feed */}
        <Card className="p-4 md:p-6">
          <Stack gap="md">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Recent activity</h3>
              <Button variant="ghost" size="sm" onClick={fetchMessages} disabled={refreshingFeed}>
                <RefreshCw className={`w-4 h-4 mr-1 ${refreshingFeed ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {messages.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4 text-center">
                No activity yet. Once the webhook is live, inbound DMs and comments will show up here.
              </p>
            ) : (
              <div className="divide-y divide-[#333]">
                {messages.map((msg) => (
                  <div key={msg.id} className="py-3 flex items-start gap-3">
                    <div className="mt-0.5">
                      {msg.direction === 'inbound' ? (
                        <ArrowDownLeft className="w-4 h-4 text-[#00FFFF]" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-primary-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-white font-medium">
                          {msg.sender_username || msg.sender_id}
                        </span>
                        {msg.account?.username && (
                          <span className="text-xs text-neutral-500">
                            {msg.direction === 'inbound' ? 'to' : 'from'} @{msg.account.username}
                          </span>
                        )}
                        <PlatformBadge platform={msg.platform} />
                        <Badge className="bg-[#333] text-neutral-300 px-2 py-0.5 text-xs">
                          {msg.message_type === 'comment' ? 'Comment' : 'DM'}
                        </Badge>
                        {msg.rule?.keyword && (
                          <Badge className="bg-primary-500/20 text-primary-500 px-2 py-0.5 text-xs">
                            {msg.rule.keyword}
                          </Badge>
                        )}
                      </div>
                      {msg.body && (
                        <p className="text-xs text-neutral-400 mt-1 break-words">{msg.body}</p>
                      )}
                    </div>
                    <span className="text-xs text-neutral-600 whitespace-nowrap">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
