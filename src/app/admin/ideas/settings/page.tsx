'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Card, Button, Input, Stack, PageHero, Spinner, Modal } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  ArrowLeft, Plus, Trash2, Edit3, Palette, Tag, LayoutGrid,
  Sliders, X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { IdeaCategory, IdeaTag, IdeaCustomFieldDef, CustomFieldType } from '@/lib/ideas/types'

type SettingsTab = 'categories' | 'fields' | 'tags'

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select (Dropdown)' },
  { value: 'url', label: 'URL' },
  { value: 'boolean', label: 'Yes / No' },
]

const COLOR_PRESETS = [
  '#39FF14', '#00FFFF', '#BF00FF', '#FFFF00', '#FF0040',
  '#FF6B00', '#00FF88', '#6366F1', '#F43F5E', '#14B8A6',
]

function SettingsContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SettingsTab>('categories')
  const [loading, setLoading] = useState(true)

  const [categories, setCategories] = useState<IdeaCategory[]>([])
  const [tags, setTags] = useState<IdeaTag[]>([])
  const [fields, setFields] = useState<IdeaCustomFieldDef[]>([])

  // Category form
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<IdeaCategory | null>(null)
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState('#39FF14')
  const [catIcon, setCatIcon] = useState('Lightbulb')
  const [catSaving, setCatSaving] = useState(false)

  // Tag form
  const [showTagModal, setShowTagModal] = useState(false)
  const [editingTag, setEditingTag] = useState<IdeaTag | null>(null)
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState('#00FFFF')
  const [tagSaving, setTagSaving] = useState(false)

  // Field form
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [editingField, setEditingField] = useState<IdeaCustomFieldDef | null>(null)
  const [fieldName, setFieldName] = useState('')
  const [fieldType, setFieldType] = useState<CustomFieldType>('text')
  const [fieldOptions, setFieldOptions] = useState('')
  const [fieldCategoryId, setFieldCategoryId] = useState('')
  const [fieldSaving, setFieldSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [catRes, tagRes, fieldRes] = await Promise.all([
        fetch('/api/admin/ideas/categories'),
        fetch('/api/admin/ideas/tags'),
        fetch('/api/admin/ideas/custom-fields'),
      ])
      if (catRes.ok) setCategories((await catRes.json()).categories || [])
      if (tagRes.ok) setTags((await tagRes.json()).tags || [])
      if (fieldRes.ok) setFields((await fieldRes.json()).fields || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Category CRUD
  const openCategoryModal = (cat?: IdeaCategory) => {
    if (cat) {
      setEditingCategory(cat)
      setCatName(cat.name)
      setCatColor(cat.color)
      setCatIcon(cat.icon)
    } else {
      setEditingCategory(null)
      setCatName('')
      setCatColor('#39FF14')
      setCatIcon('Lightbulb')
    }
    setShowCategoryModal(true)
  }

  const saveCategory = async () => {
    if (!catName.trim()) return
    setCatSaving(true)
    try {
      const method = editingCategory ? 'PATCH' : 'POST'
      const body = editingCategory
        ? { id: editingCategory.id, name: catName, color: catColor, icon: catIcon }
        : { name: catName, color: catColor, icon: catIcon, sort_order: categories.length }

      const res = await fetch('/api/admin/ideas/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingCategory ? 'Category updated' : 'Category created')
        setShowCategoryModal(false)
        fetchData()
      } else {
        toast.error('Failed to save category')
      }
    } finally {
      setCatSaving(false)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Projects using it will become uncategorized.')) return
    const res = await fetch(`/api/admin/ideas/categories?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Category deleted')
      fetchData()
    } else {
      toast.error('Failed to delete category')
    }
  }

  // Tag CRUD
  const openTagModal = (tag?: IdeaTag) => {
    if (tag) {
      setEditingTag(tag)
      setTagName(tag.name)
      setTagColor(tag.color)
    } else {
      setEditingTag(null)
      setTagName('')
      setTagColor('#00FFFF')
    }
    setShowTagModal(true)
  }

  const saveTag = async () => {
    if (!tagName.trim()) return
    setTagSaving(true)
    try {
      const method = editingTag ? 'PATCH' : 'POST'
      const body = editingTag
        ? { id: editingTag.id, name: tagName, color: tagColor }
        : { name: tagName, color: tagColor }

      const res = await fetch('/api/admin/ideas/tags', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingTag ? 'Tag updated' : 'Tag created')
        setShowTagModal(false)
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save tag')
      }
    } finally {
      setTagSaving(false)
    }
  }

  const deleteTag = async (id: string) => {
    if (!confirm('Delete this tag? It will be removed from all projects.')) return
    const res = await fetch(`/api/admin/ideas/tags?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Tag deleted')
      fetchData()
    } else {
      toast.error('Failed to delete tag')
    }
  }

  // Field CRUD
  const openFieldModal = (field?: IdeaCustomFieldDef) => {
    if (field) {
      setEditingField(field)
      setFieldName(field.name)
      setFieldType(field.field_type)
      setFieldOptions((field.options || []).join(', '))
      setFieldCategoryId(field.category_id || '')
    } else {
      setEditingField(null)
      setFieldName('')
      setFieldType('text')
      setFieldOptions('')
      setFieldCategoryId('')
    }
    setShowFieldModal(true)
  }

  const saveField = async () => {
    if (!fieldName.trim()) return
    setFieldSaving(true)
    try {
      const options = fieldType === 'select'
        ? fieldOptions.split(',').map(o => o.trim()).filter(Boolean)
        : null

      const method = editingField ? 'PATCH' : 'POST'
      const body = editingField
        ? { id: editingField.id, name: fieldName, field_type: fieldType, options, category_id: fieldCategoryId || null }
        : { name: fieldName, field_type: fieldType, options, category_id: fieldCategoryId || null, sort_order: fields.length }

      const res = await fetch('/api/admin/ideas/custom-fields', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingField ? 'Field updated' : 'Field created')
        setShowFieldModal(false)
        fetchData()
      } else {
        toast.error('Failed to save field')
      }
    } finally {
      setFieldSaving(false)
    }
  }

  const deleteField = async (id: string) => {
    if (!confirm('Delete this custom field? All values for this field will be lost.')) return
    const res = await fetch(`/api/admin/ideas/custom-fields?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Field deleted')
      fetchData()
    } else {
      toast.error('Failed to delete field')
    }
  }

  const settingsTabs: { key: SettingsTab; label: string; icon: typeof LayoutGrid }[] = [
    { key: 'categories', label: 'Categories', icon: LayoutGrid },
    { key: 'fields', label: 'Custom Fields', icon: Sliders },
    { key: 'tags', label: 'Tags', icon: Tag },
  ]

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/ideas')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>

        <PageHero
          eyebrow="IDEA HUB"
          title="Settings"
          subtitle="Manage categories, custom fields, and tags"
        />

        {/* Tabs */}
        <div className="flex gap-1 border-b border-neutral-800">
          {settingsTabs.map(tab => {
            const TabIcon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'text-white border-primary-500'
                    : 'text-neutral-400 border-transparent hover:text-neutral-200'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Categories */}
        {activeTab === 'categories' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">Organize ideas into categories</p>
              <Button variant="primary" size="sm" onClick={() => openCategoryModal()}>
                <Plus className="w-4 h-4 mr-1" />
                New Category
              </Button>
            </div>
            {categories.map(cat => (
              <Card key={cat.id} className="p-4 flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cat.color + '20', border: `1px solid ${cat.color}40` }}
                >
                  <Palette className="w-4 h-4" style={{ color: cat.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{cat.name}</p>
                  <p className="text-[10px] text-neutral-500">Icon: {cat.icon}</p>
                </div>
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <Button variant="ghost" size="sm" onClick={() => openCategoryModal(cat)}>
                  <Edit3 className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteCategory(cat.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </Card>
            ))}
            {categories.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-sm text-neutral-500">No categories yet</p>
              </Card>
            )}
          </div>
        )}

        {/* Custom Fields */}
        {activeTab === 'fields' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">Add custom fields to your ideas</p>
              <Button variant="primary" size="sm" onClick={() => openFieldModal()}>
                <Plus className="w-4 h-4 mr-1" />
                New Field
              </Button>
            </div>
            {fields.map(field => {
              const scopeCat = field.category_id ? categories.find(c => c.id === field.category_id) : null
              return (
                <Card key={field.id} className="p-4 flex items-center gap-4">
                  <Sliders className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{field.name}</p>
                    <p className="text-[10px] text-neutral-500">
                      Type: {FIELD_TYPES.find(ft => ft.value === field.field_type)?.label}
                      {scopeCat && ` \u00B7 Scoped to: ${scopeCat.name}`}
                      {!field.category_id && ' \u00B7 Global'}
                      {field.field_type === 'select' && field.options && ` \u00B7 Options: ${(field.options as string[]).join(', ')}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openFieldModal(field)}>
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteField(field.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </Card>
              )
            })}
            {fields.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-sm text-neutral-500">No custom fields yet</p>
              </Card>
            )}
          </div>
        )}

        {/* Tags */}
        {activeTab === 'tags' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">Create reusable tags to label ideas</p>
              <Button variant="primary" size="sm" onClick={() => openTagModal()}>
                <Plus className="w-4 h-4 mr-1" />
                New Tag
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
                  style={{ borderColor: tag.color + '40', backgroundColor: tag.color + '10' }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="text-sm text-white">{tag.name}</span>
                  <button onClick={() => openTagModal(tag)} className="text-neutral-400 hover:text-white">
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button onClick={() => deleteTag(tag.id)} className="text-neutral-400 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            {tags.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-sm text-neutral-500">No tags yet</p>
              </Card>
            )}
          </div>
        )}
      </Stack>

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategory ? 'Edit Category' : 'New Category'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Name *</label>
            <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Category name" autoFocus />
          </div>
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  onClick={() => setCatColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${catColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <Input value={catColor} onChange={(e) => setCatColor(e.target.value)} placeholder="#39FF14" />
          </div>
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Icon (Lucide name)</label>
            <Input value={catIcon} onChange={(e) => setCatIcon(e.target.value)} placeholder="Lightbulb" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowCategoryModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={saveCategory} loading={catSaving} disabled={!catName.trim()} className="flex-1">
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Tag Modal */}
      <Modal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        title={editingTag ? 'Edit Tag' : 'New Tag'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Name *</label>
            <Input value={tagName} onChange={(e) => setTagName(e.target.value)} placeholder="Tag name" autoFocus />
          </div>
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  onClick={() => setTagColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${tagColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <Input value={tagColor} onChange={(e) => setTagColor(e.target.value)} placeholder="#00FFFF" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowTagModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={saveTag} loading={tagSaving} disabled={!tagName.trim()} className="flex-1">
              {editingTag ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Field Modal */}
      <Modal
        isOpen={showFieldModal}
        onClose={() => setShowFieldModal(false)}
        title={editingField ? 'Edit Custom Field' : 'New Custom Field'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Name *</label>
            <Input value={fieldName} onChange={(e) => setFieldName(e.target.value)} placeholder="Field name" autoFocus />
          </div>
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Type</label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white"
            >
              {FIELD_TYPES.map(ft => (
                <option key={ft.value} value={ft.value}>{ft.label}</option>
              ))}
            </select>
          </div>
          {fieldType === 'select' && (
            <div>
              <label className="text-sm text-neutral-300 block mb-1">Options (comma-separated)</label>
              <Input value={fieldOptions} onChange={(e) => setFieldOptions(e.target.value)} placeholder="Option 1, Option 2, Option 3" />
            </div>
          )}
          <div>
            <label className="text-sm text-neutral-300 block mb-1">Scope to Category</label>
            <select
              value={fieldCategoryId}
              onChange={(e) => setFieldCategoryId(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white"
            >
              <option value="">Global (all categories)</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowFieldModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={saveField} loading={fieldSaving} disabled={!fieldName.trim()} className="flex-1">
              {editingField ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}

export default function SettingsPage() {
  return (
    <AdminWrapper>
      <SettingsContent />
    </AdminWrapper>
  )
}
