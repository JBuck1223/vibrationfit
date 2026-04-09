// ============================================================================
// Idea Hub - Type Definitions
// ============================================================================

export type IdeaStatus = 'idea' | 'planned' | 'in_progress' | 'review' | 'done' | 'archived'
export type IdeaPriority = 'low' | 'medium' | 'high' | 'urgent'
export type CommentType = 'comment' | 'status_change' | 'system'
export type LinkType = 'related' | 'blocks' | 'blocked_by' | 'parent' | 'child'
export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'url' | 'boolean'

export const IDEA_STATUSES: { value: IdeaStatus; label: string; color: string }[] = [
  { value: 'idea', label: 'Idea', color: '#BF00FF' },
  { value: 'planned', label: 'Planned', color: '#00FFFF' },
  { value: 'in_progress', label: 'In Progress', color: '#39FF14' },
  { value: 'review', label: 'Review', color: '#FFFF00' },
  { value: 'done', label: 'Done', color: '#00FF88' },
  { value: 'archived', label: 'Archived', color: '#666666' },
]

export const IDEA_PRIORITIES: { value: IdeaPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: '#FF0040' },
  { value: 'high', label: 'High', color: '#FF6B00' },
  { value: 'medium', label: 'Medium', color: '#FFFF00' },
  { value: 'low', label: 'Low', color: '#666666' },
]

export const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: 'related', label: 'Related to' },
  { value: 'blocks', label: 'Blocks' },
  { value: 'blocked_by', label: 'Blocked by' },
  { value: 'parent', label: 'Parent of' },
  { value: 'child', label: 'Child of' },
]

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
  category_id: string | null
  status: IdeaStatus
  priority: IdeaPriority
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
  title: string
  is_complete: boolean
  sort_order: number
  created_at: string
  updated_at: string
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

export function getPriorityInfo(priority: IdeaPriority) {
  return IDEA_PRIORITIES.find(p => p.value === priority) ?? IDEA_PRIORITIES[2]
}
