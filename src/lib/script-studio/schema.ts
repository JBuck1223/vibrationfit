import { z } from 'zod'

export const sectionSchema = z.object({
  id: z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  title: z.string().trim().min(1).max(200),
  content: z.string().max(100000),
  locked: z.boolean().default(false),
})
export const sectionsSchema = z.array(sectionSchema).min(1).max(100)
  .refine(items => new Set(items.map(item => item.id)).size === items.length, 'Section IDs must be unique')
  .refine(items => items.some(item => item.content.trim()), 'Script cannot be empty')
  .refine(items => items.map(item => item.content).join('\n\n').length <= 100000, 'Script exceeds 100,000 characters')
export const versionSchema = z.object({
  label: z.string().trim().max(200).default(''),
  content: z.string().max(100000).optional(),
  sections: sectionsSchema.optional(),
  source: z.enum(['admin', 'personal', 'viva']).default('admin'),
}).refine(value => value.sections || value.content?.trim(), 'Provide script content or sections')
export const importSchema = z.object({
  request_id: z.uuid(),
  script_id: z.uuid().optional(),
  group_id: z.uuid().nullable().optional(),
  base_version_id: z.uuid().optional(),
  unlock_section_ids: z.array(z.string().min(1).max(80)).max(100).default([]),
  title: z.string().trim().min(1).max(200),
  versions: z.array(versionSchema).min(1).max(50),
})
export type ScriptSection = z.infer<typeof sectionSchema>
export interface ScriptVersion {
  id: string
  script_id: string
  version_number: number
  label: string
  content: string
  sections: ScriptSection[]
  source: 'admin' | 'personal' | 'viva'
  created_at: string
}
export interface Script {
  id: string
  title: string
  group_id: string | null
  sort_order: number
  created_at: string
}
export interface ScriptGroup { id: string; name: string }
