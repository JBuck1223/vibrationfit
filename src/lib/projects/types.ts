// ============================================================================
// Project Hub - Type Definitions
// ============================================================================
// Backed by the project_* tables (projects, project_tasks, project_categories,
// project_tags, project_tag_links, project_comments, project_attachments,
// project_custom_field_defs, project_custom_field_values, project_links).
// Used by both the admin project management UI and member-facing /projects.

export type IdeaStatus = 'active' | 'done' | 'archived'
export type VisualColumn = 'not_started' | 'in_motion' | 'actualized' | 'archived'
export type CommentType = 'comment' | 'status_change' | 'system'
export type LinkType = 'related' | 'blocks' | 'blocked_by' | 'parent' | 'child'
export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'url' | 'boolean'

// Item type kept for backwards compat; all items are now 'project'
export type IdeaItemType = 'project' | 'list'

export const IDEA_STATUSES: { value: IdeaStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: '#39FF14' },
  { value: 'done', label: 'Complete', color: '#00FF88' },
  { value: 'archived', label: 'Archived', color: '#666666' },
]

export const VISUAL_COLUMNS: { value: VisualColumn; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not Started', color: '#BF00FF' },
  { value: 'in_motion', label: 'In Motion', color: '#39FF14' },
  { value: 'actualized', label: 'Complete', color: '#00FF88' },
  { value: 'archived', label: 'Archived', color: '#666666' },
]

export function getVisualColumn(status: IdeaStatus, taskDoneCount: number): VisualColumn {
  if (status === 'done') return 'actualized'
  if (status === 'archived') return 'archived'
  return taskDoneCount > 0 ? 'in_motion' : 'not_started'
}

export function getVisualColumnInfo(column: VisualColumn) {
  return VISUAL_COLUMNS.find(c => c.value === column) ?? VISUAL_COLUMNS[0]
}

export const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: 'related', label: 'Related to' },
  { value: 'blocks', label: 'Blocks' },
  { value: 'blocked_by', label: 'Blocked by' },
  { value: 'parent', label: 'Parent of' },
  { value: 'child', label: 'Child of' },
]

// ============================================================================
// Life Categories (the 12 canonical VibrationFit vision categories)
// Single source of truth: src/lib/design-system/vision-categories.ts
// Items can be tagged with multiple life categories.
// ============================================================================

import { LIFE_CATEGORY_KEYS, getVisionCategoryLabel } from '@/lib/design-system/vision-categories'

// Stable color palette assigned to life categories for chips/badges
const LIFE_CATEGORY_PALETTE = [
  '#39FF14', '#00FFFF', '#BF00FF', '#FFFF00', '#FF6B00', '#00FF88',
  '#FF0080', '#00B3FF', '#FFAA00', '#A020F0', '#14F0C8', '#FF4D4D',
]

export interface LifeCategoryOption {
  key: string
  label: string
  color: string
}

export const LIFE_CATEGORY_OPTIONS: LifeCategoryOption[] = LIFE_CATEGORY_KEYS.map((key, i) => ({
  key,
  label: getVisionCategoryLabel(key),
  color: LIFE_CATEGORY_PALETTE[i % LIFE_CATEGORY_PALETTE.length],
}))

export function getLifeCategoryInfo(key: string): LifeCategoryOption {
  return (
    LIFE_CATEGORY_OPTIONS.find(c => c.key === key) ?? {
      key,
      label: key,
      color: '#888888',
    }
  )
}

export interface IdeaCategory {
  id: string
  name: string
  color: string
  icon: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface IdeaProject {
  id: string
  title: string
  description: string | null
  type: IdeaItemType
  category_id: string | null
  life_categories: string[]
  status: IdeaStatus
  priority: string | null
  sort_order: number
  due_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface IdeaProjectWithRelations extends IdeaProject {
  category: IdeaCategory | null
  tags: IdeaTag[]
  task_count: number
  task_done_count: number
}

export interface IdeaTag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface IdeaProjectTag {
  project_id: string
  tag_id: string
}

export interface IdeaTask {
  id: string
  project_id: string
  parent_task_id: string | null
  title: string
  description: string | null
  is_complete: boolean
  sort_order: number
  created_at: string
  updated_at: string
  subtasks?: IdeaTask[]
}

export interface IdeaComment {
  id: string
  project_id: string
  user_id: string | null
  body: string | null
  type: CommentType
  metadata: Record<string, unknown> | null
  created_at: string
  user_name?: string
  user_email?: string
}

export interface IdeaAttachment {
  id: string
  project_id: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  uploaded_by: string | null
  created_at: string
}

export interface IdeaCustomFieldDef {
  id: string
  name: string
  field_type: CustomFieldType
  options: string[] | null
  category_id: string | null
  sort_order: number
  created_at: string
}

export interface IdeaCustomFieldValue {
  id: string
  project_id: string
  field_id: string
  value: string | null
}

export interface IdeaProjectLink {
  id: string
  source_project_id: string
  target_project_id: string
  link_type: LinkType
  created_at: string
  linked_project?: IdeaProject
}

export function getStatusInfo(status: IdeaStatus) {
  return IDEA_STATUSES.find(s => s.value === status) ?? IDEA_STATUSES[0]
}

// Legacy exports kept for admin pages during transition
export type IdeaPriority = 'low' | 'medium' | 'high' | 'urgent'

export const IDEA_PRIORITIES: { value: IdeaPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: '#FF0040' },
  { value: 'high', label: 'High', color: '#FF6B00' },
  { value: 'medium', label: 'Medium', color: '#FFFF00' },
  { value: 'low', label: 'Low', color: '#666666' },
]

export function getPriorityInfo(priority: IdeaPriority) {
  return IDEA_PRIORITIES.find(p => p.value === priority) ?? IDEA_PRIORITIES[2]
}

export const ITEM_TYPES: { value: IdeaItemType; label: string; plural: string; color: string }[] = [
  { value: 'project', label: 'Project', plural: 'Projects', color: '#39FF14' },
]

export function getItemTypeInfo(type: IdeaItemType) {
  return ITEM_TYPES.find(t => t.value === type) ?? ITEM_TYPES[0]
}
