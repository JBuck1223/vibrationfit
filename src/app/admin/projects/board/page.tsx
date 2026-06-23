'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Stack, Spinner } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { ProjectsAreaBar } from '@/components/projects-studio'
import {
  Calendar, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { IdeaProjectWithRelations, IdeaStatus, VisualColumn } from '@/lib/projects/types'
import { VISUAL_COLUMNS, getVisualColumn, getVisualColumnInfo, getLifeCategoryInfo } from '@/lib/projects/types'

function KanbanBoard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<IdeaProjectWithRelations[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<VisualColumn | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/projects?status=all')
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const updateStatus = async (projectId: string, newStatus: IdeaStatus) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p))

    const res = await fetch(`/api/admin/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!res.ok) {
      toast.error('Failed to update status')
      fetchProjects()
    }
  }

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedId(projectId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', projectId)
  }

  const handleDragOver = (e: React.DragEvent, column: VisualColumn) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(column)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, column: VisualColumn) => {
    e.preventDefault()
    const projectId = e.dataTransfer.getData('text/plain')
    if (projectId) {
      const project = projects.find(p => p.id === projectId)
      if (!project) return

      // Map visual column to DB status
      const statusMap: Record<VisualColumn, IdeaStatus> = {
        not_started: 'active',
        in_motion: 'active',
        actualized: 'done',
        archived: 'archived',
      }
      const targetStatus = statusMap[column]
      if (project.status !== targetStatus) {
        updateStatus(projectId, targetStatus)
      }
    }
    setDraggedId(null)
    setDragOverColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverColumn(null)
  }

  if (loading) {
    return (
      <Container size="full">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <div className="px-4 md:px-6 pb-8">
      <Stack gap="lg">
        <ProjectsAreaBar contextText="Drag items between columns to update their status" />

        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
          {VISUAL_COLUMNS.map(col => {
            const columnProjects = projects.filter(p => {
              const visual = getVisualColumn(p.status, p.task_done_count)
              return visual === col.value
            })
            const isDragOver = dragOverColumn === col.value

            return (
              <div
                key={col.value}
                className={`flex-shrink-0 w-72 rounded-2xl border transition-colors ${
                  isDragOver
                    ? 'border-primary-500/50 bg-primary-500/5'
                    : 'border-neutral-800 bg-neutral-900/50'
                }`}
                onDragOver={(e) => handleDragOver(e, col.value)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.value)}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="text-sm font-semibold text-white">{col.label}</span>
                  </div>
                  <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                    {columnProjects.length}
                  </span>
                </div>

                <div className="p-2 space-y-2 min-h-[200px]">
                  {columnProjects.map(project => {
                    const isDragging = draggedId === project.id
                    const taskPercent = project.task_count > 0
                      ? Math.round((project.task_done_count / project.task_count) * 100)
                      : 0

                    return (
                      <div
                        key={project.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, project.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => router.push(`/admin/projects/${project.id}`)}
                        className={`bg-neutral-800 rounded-xl p-3 cursor-grab active:cursor-grabbing border border-neutral-700 hover:border-neutral-600 transition-all ${
                          isDragging ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        {project.category && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: project.category.color }}
                            />
                            <span className="text-[10px] font-medium" style={{ color: project.category.color }}>
                              {project.category.name}
                            </span>
                          </div>
                        )}

                        <p className="text-sm font-medium text-white mb-2 line-clamp-2">{project.title}</p>

                        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                          {project.task_count > 0 && (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{project.task_done_count}/{project.task_count}</span>
                            </>
                          )}
                          {project.due_date && (
                            <>
                              {project.task_count > 0 && <span className="text-neutral-700">|</span>}
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </>
                          )}
                        </div>

                        {project.task_count > 0 && (
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-700">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#39FF14] to-[#00FFFF] transition-all"
                              style={{ width: `${taskPercent}%` }}
                            />
                          </div>
                        )}

                        {project.life_categories && project.life_categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.life_categories.slice(0, 3).map(key => {
                              const lc = getLifeCategoryInfo(key)
                              return (
                                <span
                                  key={key}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                                  style={{ backgroundColor: lc.color + '20', color: lc.color }}
                                >
                                  {lc.label}
                                </span>
                              )
                            })}
                            {project.life_categories.length > 3 && (
                              <span className="text-[9px] text-neutral-500">+{project.life_categories.length - 3}</span>
                            )}
                          </div>
                        )}

                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag.id}
                                className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                                style={{ backgroundColor: tag.color + '20', color: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                            {project.tags.length > 3 && (
                              <span className="text-[9px] text-neutral-500">+{project.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {columnProjects.length === 0 && (
                    <div className="text-center py-8 text-xs text-neutral-600">
                      Nothing here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Stack>
    </div>
  )
}

export default function BoardPage() {
  return (
    <AdminWrapper>
      <KanbanBoard />
    </AdminWrapper>
  )
}
