'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { diffWords } from 'diff'
import { FileText, Plus, Sparkles, Upload, Lock, Unlock, Trash2, Scissors, ArrowUp, ArrowDown, ChevronDown, ChevronUp, FolderOpen, MessageCircle, Copy, Eye } from 'lucide-react'
import { Button, Card, Input, Textarea } from '@/lib/design-system/components'
import { useAdminStudioChrome } from '@/components/admin-studio/AdminStudioContext'
import type { AreaBarVersionSelector } from '@/lib/design-system/components'
import { VivaChatInput } from '@/components/viva/VivaChatInput'
import { VivaAssistantMessage, VivaUserMessage, VivaThinkingIndicator } from '@/components/viva/VivaChatMessage'
import type { Script, ScriptVersion, ScriptSection, ScriptGroup } from '@/lib/script-studio/schema'
import { scriptSections, sectionText, restoreSections } from '@/lib/script-studio/sections'

async function api(path: string, body?: unknown, method = 'POST') {
  const response = await fetch(path, body ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}

function Changes({ before, after }: { before: string; after: string }) {
  const parts = useMemo(() => diffWords(before, after), [before, after])
  return <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{parts.map((part, i) =>
    part.added ? <ins key={i} className="bg-[#39FF14]/20 text-[#a4ff8a] no-underline">{part.value}</ins>
      : part.removed ? <del key={i} className="bg-[#FF0040]/20 text-[#ff8ba7]">{part.value}</del>
        : <span key={i}>{part.value}</span>
  )}</div>
}
const optionClass = 'w-full rounded-xl border border-neutral-700 bg-neutral-900 p-3 text-sm text-white'
const versionName = (version: ScriptVersion) => `V${version.version_number}${version.label ? ` · ${version.label}` : ''}`
const previewFieldClass = 'w-full resize-none overflow-hidden bg-transparent p-0 text-lg leading-loose text-neutral-100 outline-none placeholder:text-neutral-600 disabled:opacity-50'

function PreviewField({ label, value, locked, disabled, onChange, onFocus }: {
  label: string
  value: string
  locked: boolean
  disabled: boolean
  onChange: (value: string) => void
  onFocus: () => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.max(el.scrollHeight, 44)}px`
  }, [value])
  if (locked) {
    return <div className="space-y-1">
      <p className="flex items-center gap-1 text-[11px] text-neutral-500"><Lock className="h-3 w-3" />{label} · locked</p>
      <p className="whitespace-pre-wrap break-words text-lg leading-loose text-neutral-400">{value || 'Locked and empty.'}</p>
    </div>
  }
  return <label className="block space-y-1">
    <span className="text-[11px] text-neutral-500">{label}</span>
    <textarea ref={ref} aria-label={`Draft: ${label}`} value={value} maxLength={100000} disabled={disabled} rows={1} placeholder="Write this section…" className={previewFieldClass} onChange={event => onChange(event.target.value)} onFocus={onFocus} />
  </label>
}

export default function ScriptStudioPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ main: true })
  const [sectionViews, setSectionViews] = useState<Record<string, 'draft' | 'edits' | 'saved'>>({})
  const [draftView, setDraftView] = useState<'sections' | 'full'>('sections')
  const [mobilePane, setMobilePane] = useState<'chat' | 'draft'>('draft')
  const [manageOpen, setManageOpen] = useState(false)
  const [refining, setRefining] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [scripts, setScripts] = useState<Script[]>([])
  const [scriptId, setScriptId] = useState('')
  const [versions, setVersions] = useState<ScriptVersion[]>([])
  const [title, setTitle] = useState('')
  const [sections, setSections] = useState<ScriptSection[]>(scriptSections())
  const [selectedSection, setSelectedSection] = useState('main')
  const [unlockedIds, setUnlockedIds] = useState<string[]>([])
  const [groups, setGroups] = useState<ScriptGroup[]>([])
  const [groupId, setGroupId] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [groupName, setGroupName] = useState('')
  const draft = sectionText(sections)
  const wordCount = draft.split(/\s+/).filter(Boolean).length
  const selected = sections.find(section => section.id === selectedSection)
  const updateSelected = (updates: Partial<ScriptSection>) => setSections(items => items.map(item => item.id === selectedSection ? { ...item, ...updates } : item))
  const [label, setLabel] = useState('')
  const [baseline, setBaseline] = useState('')
  const [compare, setCompare] = useState('draft')
  const [source, setSource] = useState<ScriptVersion['source']>('admin')
  const [instruction, setInstruction] = useState('')
  const [proposal, setProposal] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const pendingSave = useRef<{ signature: string; id: string } | null>(null)
  const lastSaved = useRef(JSON.stringify(scriptSections()))
  const dirty = JSON.stringify(sections) !== lastSaved.current

  const loadScripts = useCallback(async () => {
    const [data, groupData] = await Promise.all([api('/api/admin/scripts'), api('/api/admin/scripts/groups')])
    setScripts(data.scripts); setGroups(groupData.groups)
    return data.scripts as Script[]
  }, [])

  const openScript = useCallback(async (script: Script) => {
    setLoading(true)
    try {
      const data = await api(`/api/admin/scripts?script=${script.id}`)
      const items: ScriptVersion[] = data.versions
      const latest = items.at(-1)
      setScriptId(script.id); setTitle(script.title); setVersions(items)
      const loaded = scriptSections(latest)
      setSections(loaded); lastSaved.current = JSON.stringify(loaded)
      setSelectedSection(loaded[0].id); setExpanded({ [loaded[0].id]: true }); setSectionViews({}); setMessages([]); setGroupFilter(script.group_id || 'ungrouped'); setUnlockedIds([]); setGroupId(script.group_id || '')
      setBaseline(items.length > 1 ? items[items.length - 2].id : latest?.id || '')
      setCompare('draft'); setLabel(''); setProposal(null); setInstruction(''); setSource('admin')
      window.history.replaceState(null, '', `/admin/scripts?script=${script.id}`)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const items = await loadScripts()
        const requested = new URLSearchParams(window.location.search).get('script')
        const selected = items.find(item => item.id === requested) || items[0]
        if (selected) await openScript(selected)
      } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load scripts') }
      finally { setLoading(false) }
    })()
  }, [loadScripts, openScript])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('')
    try { await action() } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong') }
    finally { setBusy(false) }
  }
  function canReplace() { return !dirty || window.confirm('Discard the unsaved working draft?') }
  function newScript(nextGroup = groupFilter, discardConfirmed = false) {
    if (!discardConfirmed && !canReplace()) return
    setScriptId(''); setTitle(''); setVersions([]); setSections(scriptSections()); lastSaved.current = JSON.stringify(scriptSections())
    setSelectedSection('main'); setExpanded({ main: true }); setSectionViews({}); setMessages([]); setUnlockedIds([]); setGroupId(nextGroup === 'all' || nextGroup === 'ungrouped' ? '' : nextGroup)
    setBaseline(''); setCompare('draft'); setLabel(''); setProposal(null); setInstruction(''); setSource('admin')
    window.history.replaceState(null, '', '/admin/scripts')
  }
  async function save() {
    const payload = { ...(scriptId ? { script_id: scriptId, base_version_id: versions.at(-1)?.id } : {}), group_id: groupId || null, unlock_section_ids: unlockedIds, title, versions: [{ sections, label, source }] }
    const signature = JSON.stringify(payload)
    if (pendingSave.current?.signature !== signature) pendingSave.current = { signature, id: crypto.randomUUID() }
    const result = await api('/api/admin/scripts', { ...payload, request_id: pendingSave.current.id })
    const items = await loadScripts()
    await openScript(items.find(item => item.id === result.script_id)!)
    pendingSave.current = null
    setNotice('Version saved.')
  }
  async function importVersions() {
    if (!canReplace()) return
    const input = JSON.parse(importText)
    // Keep the generated ID in the textarea so a retry uses the same batch ID.
    const payload = { ...input, request_id: input.request_id || crypto.randomUUID() }
    setImportText(JSON.stringify(payload, null, 2))
    const result = await api('/api/admin/scripts', payload)
    const items = await loadScripts()
    await openScript(items.find(item => item.id === result.script_id)!)
    setImportOpen(false); setImportText(''); setNotice('Script versions imported.')
  }
  const oldSections = scriptSections(versions.find(version => version.id === baseline))
  const newSections = compare === 'draft' ? sections : scriptSections(versions.find(version => version.id === compare))
  const comparisonIds = Array.from(new Set([...oldSections, ...newSections].map(section => section.id)))
  function restoreVersion() {
    if (!canReplace()) return
    const restored = restoreSections(sections, newSections)
    setSections(restored); setSelectedSection(restored[0].id); setExpanded({ [restored[0].id]: true }); setCompare('draft'); setSource('admin'); setProposal(null)
  }
  function splitSection() {
    if (!selected || selected.locked) return
    const pieces = selected.content.split(/\n\s*\n/).filter(piece => piece.trim())
    if (pieces.length < 2) { setNotice('Separate the parts with blank lines, then split.'); return }
    if (sections.length + pieces.length - 1 > 100) { setError('A script can have up to 100 sections.'); return }
    setSections(items => items.flatMap(item => item.id !== selected.id ? [item] : pieces.map((content, index) => ({ ...item, id: index === 0 ? item.id : crypto.randomUUID(), title: index === 0 ? item.title : `${item.title.slice(0, 180)} · ${index + 1}`, content }))))
    setProposal(null)
  }
  async function moveScript(script: Script, destination: string | null, direction?: 'up' | 'down') {
    await api('/api/admin/scripts', { script_id: script.id, group_id: destination, direction }, 'PATCH')
    if (script.id === scriptId) { setGroupId(destination || ''); if (groupFilter !== 'all') setGroupFilter(destination || 'ungrouped') }
    await loadScripts()
    setNotice(direction ? 'Script order updated.' : 'Script moved to the end of its group.')
  }
  const visibleGroups = [
    ...groups.map(group => ({ id: group.id, name: group.name })),
    { id: '', name: 'Ungrouped' },
  ].filter(group => groupFilter === 'all' || (groupFilter === 'ungrouped' ? !group.id : group.id === groupFilter))
  const disabled = busy || loading

  const versionSelectors = useMemo<AreaBarVersionSelector[]>(() => [
    {
      id: 'script-group', label: 'Group', icon: FolderOpen, position: 'contextRow', searchable: true,
      options: [{ id: 'all', label: 'All groups' }, ...groups.map(group => ({ id: group.id, label: group.name, count: scripts.filter(script => script.group_id === group.id).length })), { id: 'ungrouped', label: 'Ungrouped' }],
      selectedId: groupFilter,
      onSelect: id => {
        if (disabled || id === groupFilter || !canReplace()) return
        setGroupFilter(id)
        if (id === 'all') return
        const first = scripts.find(script => id === 'ungrouped' ? !script.group_id : script.group_id === id)
        if (first) void run(() => openScript(first))
        else newScript(id, true)
      },
    },
    {
      id: 'script-document', label: 'Script', icon: FileText, position: 'contextRow', searchable: true,
      options: [
        ...scripts.filter(script => groupFilter === 'all' || (groupFilter === 'ungrouped' ? !script.group_id : script.group_id === groupFilter)).map(script => ({ id: script.id, label: script.title, group: groupFilter === 'all' ? groups.find(group => group.id === script.group_id)?.name || 'Ungrouped' : undefined })),
        { id: 'new', label: 'New script', icon: Plus },
      ],
      selectedId: scriptId || 'new',
      onSelect: id => {
        if (disabled || id === scriptId) return
        if (id === 'new') { newScript(); return }
        const script = scripts.find(item => item.id === id)
        if (script && canReplace()) void run(() => openScript(script))
      },
    },
  ], [groups, scripts, groupFilter, scriptId, disabled, dirty, openScript])
  useAdminStudioChrome({ title: 'Script Studio', icon: FileText, versionSelectors, contextText: 'Refine one section at a time. Keep the rest exactly as you choose.' })

  function moveSection(id: string, direction: -1 | 1) {
    if (disabled) return
    setSections(items => {
      const from = items.findIndex(item => item.id === id)
      const to = from + direction
      if (from < 0 || to < 0 || to >= items.length) return items
      const reordered = [...items]
      ;[reordered[from], reordered[to]] = [reordered[to], reordered[from]]
      return reordered
    })
    setNotice('Section order updated in the draft. Save a version to keep it.')
  }

  function selectSection(id: string) {
    if (id !== selectedSection) { setSelectedSection(id); setProposal(null) }
  }
  function focusSection(id: string) {
    selectSection(id)
    setDraftView('sections')
    setExpanded(items => ({ ...items, [id]: true }))
  }
  async function copyScript() {
    if (!draft.trim()) return
    try {
      await navigator.clipboard.writeText(draft)
      setNotice('Full script copied.')
    } catch {
      setError('Unable to copy. Select the preview text and copy it manually.')
    }
  }
  async function propose(text = instruction) {
    if (!selected || selected.locked || !text.trim()) return
    setRefining(true)
    setMessages(items => [...items, { role: 'user', content: text }])
    try {
      const result = await api('/api/admin/scripts/refine', { sections, section_id: selected.id, instruction: text })
      setProposal(result.content); setDraftView('sections'); setExpanded(items => ({ ...items, [selected.id]: true }))
      setMessages(items => [...items, { role: 'assistant', content: `I’ve proposed a revision for “${selected.title}.” Review it in the draft pane, then accept, edit, or discard it.` }])
      setInstruction(''); setMobilePane('draft')
    } finally { setRefining(false) }
  }
  const paneClass = 'flex flex-col overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#111] lg:h-[calc(100dvh-15rem)] lg:min-h-[480px]'
  const scrollClass = 'min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#2c2c2c_transparent]'

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-neutral-400">{loading ? 'Loading scripts…' : `${versions.length} saved versions · ${dirty ? 'Unsaved draft' : 'Working draft'}`}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={() => setManageOpen(!manageOpen)} aria-expanded={manageOpen}><FolderOpen className="mr-1 h-4 w-4" />Manage library</Button>
        <Button size="sm" variant="outline" onClick={() => setImportOpen(!importOpen)} disabled={disabled}><Upload className="mr-1 h-4 w-4" />Import</Button>
        <Button size="sm" variant="outline" onClick={() => newScript()} disabled={disabled}><Plus className="mr-1 h-4 w-4" />New script</Button>
      </div>
    </div>
    {error && <p role="alert" className="text-red-400">{error}</p>}
    {notice && <p role="status" className="text-[#39FF14]">{notice}</p>}
    {manageOpen && <div>      <Card className="space-y-3 !p-4 self-start">
        <p className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4" />Script library</p>
        {loading && <p role="status" className="text-sm text-neutral-400">Loading…</p>}
        {!loading && scripts.length === 0 && <p className="text-sm text-neutral-400">Create a script or import variations to start.</p>}
        <Input aria-label="New group name" placeholder="Activation, Onboarding, Course…" value={groupName} maxLength={200} disabled={disabled} onChange={event => setGroupName(event.target.value)} />
        <Button size="sm" variant="outline" disabled={disabled || !groupName.trim()} onClick={() => void run(async () => { const result = await api('/api/admin/scripts/groups', { name: groupName }); await loadScripts(); if (!scriptId) { setGroupFilter(result.group.id); setGroupId(result.group.id) } setGroupName(''); setNotice('Group created. Select it in the studio bar or move a script into it.') })}>Create group</Button>
        {groupFilter !== 'all' && groupFilter !== 'ungrouped' && <p className="text-xs text-neutral-500 break-all">Group ID: {groupFilter}</p>}
        {visibleGroups.map(group => {
          const members = scripts.filter(script => (script.group_id || '') === group.id)
          if (!members.length && groupFilter === 'all') return null
          return <section key={group.id || 'ungrouped'} className="space-y-2 border-t border-neutral-800 pt-3">
            <h3 className="text-sm font-semibold text-neutral-300">{group.name} <span className="text-neutral-500">({members.length})</span></h3>
            {!members.length && <p className="text-xs text-neutral-500">No scripts in this group yet.</p>}
            {members.map((script, index) => <div key={script.id} className={`rounded-xl border p-2 ${script.id === scriptId ? 'border-[#39FF14]/40 bg-[#39FF14]/10' : 'border-neutral-800'}`}>
              <button disabled={disabled} onClick={() => { if (script.id !== scriptId && canReplace()) void run(() => openScript(script)) }} className="block w-full p-1 text-left text-sm break-words">{index + 1}. {script.title}</button>
              <div className="flex items-center gap-1 pt-2">
                <button aria-label={`Move ${script.title} up`} title="Move up" className="rounded p-1 hover:bg-neutral-700 disabled:opacity-30" disabled={disabled || index === 0} onClick={() => void run(() => moveScript(script, script.group_id, 'up'))}><ArrowUp className="h-4 w-4" /></button>
                <button aria-label={`Move ${script.title} down`} title="Move down" className="rounded p-1 hover:bg-neutral-700 disabled:opacity-30" disabled={disabled || index === members.length - 1} onClick={() => void run(() => moveScript(script, script.group_id, 'down'))}><ArrowDown className="h-4 w-4" /></button>
                <select aria-label={`Move ${script.title} to group`} className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-900 p-1 text-xs" value={script.group_id || ''} disabled={disabled} onChange={event => void run(() => moveScript(script, event.target.value || null))}><option value="">Ungrouped</option>{groups.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
              </div>
            </div>)}
          </section>
        })}
      </Card></div>}
    {importOpen && <Card className="space-y-3">
      <p className="text-sm text-neutral-400">Paste a script package. Include script_id to append versions, or group_id to create a script in a group.</p>
      <Textarea aria-label="Script import JSON" rows={6} value={importText} onChange={event => setImportText(event.target.value)} disabled={disabled} />
      <Button disabled={disabled || !importText.trim()} onClick={() => void run(importVersions)}>Import versions</Button>
    </Card>}
    <div className="flex gap-2 lg:hidden">
      <Button size="sm" variant={mobilePane === 'chat' ? 'accent' : 'outline'} onClick={() => setMobilePane('chat')}><MessageCircle className="mr-1 h-4 w-4" />VIVA</Button>
      <Button size="sm" variant={mobilePane === 'draft' ? 'secondary' : 'outline'} onClick={() => setMobilePane('draft')}><FileText className="mr-1 h-4 w-4" />Draft {proposal !== null && '· Proposal'}</Button>
    </div>
    <div className="grid grid-cols-1 gap-6 pb-8 lg:grid-cols-[minmax(360px,2fr)_3fr]">
      <div className={`${mobilePane === 'chat' ? '' : 'hidden lg:block'}`}>
        <div className={paneClass}>
          <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3"><Sparkles className="h-4 w-4 text-[#BF00FF]" /><h2 className="text-sm font-semibold">Edit with VIVA</h2></div>
          <div className={`${scrollClass} space-y-5 p-4 min-h-[200px]`}>
            <VivaAssistantMessage>I have your script beside us. Select a section and tell me what you’d like to change. I’ll use the whole script for context and leave the other sections untouched.</VivaAssistantMessage>
            {messages.map((message, index) => message.role === 'user' ? <VivaUserMessage key={index} copyText={message.content}>{message.content}</VivaUserMessage> : <VivaAssistantMessage key={index}>{message.content}</VivaAssistantMessage>)}
            {refining && <VivaThinkingIndicator label="Revising your section…" />}
          </div>
          <div className="space-y-3 border-t border-neutral-800 p-4">
            <label className="block space-y-2 text-xs text-neutral-400"><span>{selected?.locked ? 'Selected section · Locked' : 'Working on'}</span><select className={optionClass} aria-label="Section for VIVA" value={selectedSection} disabled={disabled || proposal !== null} onChange={event => focusSection(event.target.value)}>{sections.map(section => <option key={section.id} value={section.id}>{section.title}{section.locked ? ' · Locked' : ''}</option>)}</select></label>
            {selected?.locked && <p className="text-xs text-neutral-500">This section is locked. Unlock it in the draft or select an unlocked section to work with VIVA.</p>}
            <VivaChatInput value={instruction} onChange={setInstruction} disabled={disabled || !!selected?.locked || proposal !== null} canSend={!!draft.trim() && !!instruction.trim()} placeholder="How would you like to refine this section?" onSend={(attachments, text) => {
              if (attachments?.length) { setError('Use text or voice for script edits; attachments are not supported here.'); return }
              void run(() => propose(text || instruction))
            }} />
          </div>
        </div>
      </div>
      <div className={mobilePane === 'draft' ? '' : 'hidden lg:block'}>
        <div className={paneClass}>
          <div className="space-y-3 border-b border-neutral-800 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-neutral-400" />{title || 'New script'}</h2><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={disabled || !draft.trim()} onClick={() => void copyScript()}><Copy className="mr-1 h-4 w-4" />Copy script</Button><Button size="sm" disabled={disabled || !draft.trim() || !title.trim() || sections.some(section => !section.title.trim())} onClick={() => void run(save)}>Save V{(versions.at(-1)?.version_number || 0) + 1}</Button></div></div>
            {!scriptId && <Input aria-label="Script title" value={title} maxLength={200} disabled={disabled} onChange={event => setTitle(event.target.value)} placeholder="Name this video script" />}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><Input aria-label="Version note" value={label} maxLength={200} disabled={disabled} onChange={event => setLabel(event.target.value)} placeholder="Version note (optional)" />{versions.length > 0 && <select className={optionClass} aria-label="Compare draft against version" value={baseline} disabled={disabled} onChange={event => setBaseline(event.target.value)}>{versions.map(version => <option key={version.id} value={version.id}>Compare with {versionName(version)}</option>)}</select>}</div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
              <div className="flex gap-1">{(['sections', 'full'] as const).map(mode => <button key={mode} onClick={() => setDraftView(mode)} className={`rounded-full px-3 py-1 ${draftView === mode ? 'bg-neutral-700 text-white' : 'hover:text-white'}`}>{mode === 'sections' ? 'Sections' : 'Full preview'}</button>)}</div>
              {draftView === 'sections' ? <><button onClick={() => setExpanded(Object.fromEntries(sections.map(section => [section.id, true])))}>Expand all</button><button onClick={() => setExpanded({})}>Collapse all</button></> : <span>{wordCount} words · titles omitted from copy</span>}
            </div>
          </div>
          <div className={`${scrollClass} space-y-3 p-4`}>
            {draftView === 'full' ? <div className="space-y-6">
              <p className="flex items-center gap-2 text-xs text-neutral-500"><Eye className="h-3.5 w-3.5" />Edit the spoken script in section order. Locked sections stay read-only. Copy omits titles.</p>
              {sections.map(section => <PreviewField key={section.id} label={section.title} value={section.content} locked={section.locked} disabled={disabled || proposal !== null} onFocus={() => selectSection(section.id)} onChange={content => setSections(items => items.map(item => item.id === section.id ? { ...item, content } : item))} />)}
            </div> : <>
            {sections.map((section, index) => {
              const isOpen = !!expanded[section.id]
              const isSelected = selectedSection === section.id
              const sectionProposal = isSelected ? proposal : null
              const saved = oldSections.find(item => item.id === section.id)?.content || ''
              const changed = saved !== section.content
              const view = sectionViews[section.id] || 'draft'
              return <section key={section.id} className={`rounded-2xl border bg-[#161616] ${sectionProposal !== null ? 'border-[#BF00FF]/60' : changed && versions.length ? 'border-[#FFFF00]/30' : 'border-[#2a2a2a]'}`}>
                <div className="flex items-center gap-2 px-4 py-3">
                  <button className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={isOpen} aria-controls={`script-section-${section.id}`} onClick={() => setExpanded(items => ({ ...items, [section.id]: !isOpen }))}>{section.locked ? <Lock className="h-4 w-4 shrink-0 text-neutral-500" /> : <FileText className="h-4 w-4 shrink-0 text-neutral-500" />}<span className="truncate text-sm font-medium">{index + 1}. {section.title}</span>{isOpen ? <ChevronUp className="ml-auto h-4 w-4 shrink-0" /> : <ChevronDown className="ml-auto h-4 w-4 shrink-0" />}</button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" className="rounded-full p-1.5 text-neutral-400 hover:text-white disabled:opacity-30" aria-label={`Move ${section.title} up`} title="Move section up" disabled={disabled || index === 0} onClick={() => moveSection(section.id, -1)}><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" className="rounded-full p-1.5 text-neutral-400 hover:text-white disabled:opacity-30" aria-label={`Move ${section.title} down`} title="Move section down" disabled={disabled || index === sections.length - 1} onClick={() => moveSection(section.id, 1)}><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" className={`flex items-center gap-1 rounded-full px-2 py-1.5 text-xs disabled:opacity-40 ${section.locked ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`} aria-label={`Lock ${section.title}`} aria-pressed={section.locked} title={section.locked ? 'Locked — click to unlock editing' : 'Unlocked — click to lock editing'} disabled={disabled || sectionProposal !== null} onClick={() => { if (section.locked) setUnlockedIds(ids => [...new Set([...ids, section.id])]); setSections(items => items.map(item => item.id === section.id ? { ...item, locked: !item.locked } : item)) }}>{section.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}<span className="hidden sm:inline">{section.locked ? 'Locked' : 'Unlocked'}</span></button>
                  </div>
                </div>
                {isOpen && <div id={`script-section-${section.id}`} className="space-y-3 border-t border-neutral-800 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex gap-1">{(['draft', 'edits', 'saved'] as const).map(mode => <button key={mode} disabled={mode !== 'draft' && !versions.length} onClick={() => setSectionViews(items => ({ ...items, [section.id]: mode }))} className={`rounded-full px-3 py-1 text-xs capitalize disabled:opacity-30 ${view === mode ? 'bg-neutral-700 text-white' : 'text-neutral-500'}`}>{mode}</button>)}</div><button className="text-xs text-[#BF00FF] disabled:opacity-40" disabled={disabled || section.locked || proposal !== null} onClick={() => { focusSection(section.id); setMobilePane('chat') }}>{section.locked ? 'Locked · unlock to edit' : isSelected ? 'Selected for VIVA' : 'Edit with VIVA'}</button></div>
                  {sectionProposal !== null ? <div className="space-y-3"><p className="text-xs text-[#BF00FF]">VIVA’s proposal · review before accepting</p><Changes before={section.content} after={sectionProposal} /><Textarea aria-label={`VIVA proposal for ${section.title}`} rows={8} value={sectionProposal} onChange={event => setProposal(event.target.value)} disabled={disabled} /><div className="flex gap-2"><Button size="sm" disabled={disabled || section.locked || !sectionProposal.trim()} onClick={() => { updateSelected({ content: sectionProposal }); setProposal(null); setSource('viva'); setNotice('Accepted into draft. Save a version to keep it.') }}>Accept into draft</Button><Button size="sm" variant="ghost" disabled={disabled} onClick={() => setProposal(null)}>Discard</Button></div></div>
                    : view === 'edits' ? (changed ? <Changes before={saved} after={section.content} /> : <p className="text-xs text-neutral-500">No text changes.</p>)
                    : view === 'saved' ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">{saved || 'This section did not exist in this version.'}</p>
                    : <><Input aria-label={`Section title: ${section.title}`} value={section.title} maxLength={200} disabled={disabled || section.locked} onChange={event => setSections(items => items.map(item => item.id === section.id ? { ...item, title: event.target.value } : item))} /><Textarea aria-label={`Draft: ${section.title}`} rows={8} value={section.content} maxLength={100000} disabled={disabled || section.locked} onChange={event => setSections(items => items.map(item => item.id === section.id ? { ...item, content: event.target.value } : item))} /></>}
                  <div className="flex flex-wrap gap-3 text-xs text-neutral-500"><span>{section.locked ? 'Text locked · section can still be reordered' : `${section.content.split(/\s+/).filter(Boolean).length} words`}</span>{isSelected && !section.locked && <button disabled={disabled || proposal !== null} onClick={splitSection}><Scissors className="mr-1 inline h-3 w-3" />Split at blank lines</button>}<button disabled={disabled || section.locked || proposal !== null || sections.length === 1} onClick={() => { if (section.content.trim() && !window.confirm('Remove this section from the draft? Saved versions remain available.')) return; const remaining = sections.filter(item => item.id !== section.id); setSections(remaining); if (isSelected) setSelectedSection(remaining[0].id) }}><Trash2 className="mr-1 inline h-3 w-3" />Remove</button></div>
                </div>}
              </section>
            })}
            <Button variant="outline" size="sm" disabled={disabled || sections.length >= 100 || proposal !== null} onClick={() => { const id = crypto.randomUUID(); setSections(items => [...items, { id, title: `Section ${items.length + 1}`, content: '', locked: false }]); focusSection(id) }}><Plus className="mr-1 h-4 w-4" />Add section</Button>
            {versions.length > 0 && <details className="rounded-xl border border-neutral-800 p-3"><summary className="cursor-pointer text-sm text-neutral-400">Compare saved versions</summary><div className="mt-3 space-y-3"><select className={optionClass} aria-label="Comparison target" value={compare} onChange={event => setCompare(event.target.value)}><option value="draft">Working draft</option>{versions.map(version => <option key={version.id} value={version.id}>{versionName(version)}</option>)}</select>{comparisonIds.map(id => { const before = oldSections.find(item => item.id === id); const after = newSections.find(item => item.id === id); return <div key={id}><h3 className="mb-2 text-xs font-semibold">{after?.title || before?.title}</h3><Changes before={before?.content || ''} after={after?.content || ''} /></div> })}{compare !== 'draft' && <Button size="sm" variant="outline" disabled={disabled} onClick={restoreVersion}>Restore unlocked sections</Button>}</div></details>}
            </>}
          </div>
        </div>
      </div>
    </div>
  </div>
}
