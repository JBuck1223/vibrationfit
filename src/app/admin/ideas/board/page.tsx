'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Button, Stack, PageHero, Spinner } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import {
  ArrowLeft, List, Calendar, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { IdeaProjectWithRelations, IdeaStatus } from '@/lib/ideas/types'
import { IDEA_STATUSES, getPriorityInfo } from '@/lib/ideas/types'

const BOARD_STATUSES: IdeaStatus[] = ['idea', 'planned', 'in_progress', 'review', 'done']

function KanbanBoard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<IdeaProjectWithRelations[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<IdeaStatus | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ideas?status=all')
      if (res.ok) {
        const data = await res.json()
        setProjects((data.projects || []).filter((p: IdeaProjectWithRelations) => p.status !== 'archived'))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const updateStatus = async (projectId: string, newStatus: IdeaStatus) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p))

    const res = await fetch(`/api/admin/ideas/${projectId}`, {
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

  const handleDragOver = (e: React.DragEvent, status: IdeaStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, status: IdeaStatus) => {
    e.preventDefault()
    const projectId = e.dataTransfer.getData('text/plain')
    if (projectId) {
      const project = projects.find(p => p.id === projectId)
      if (project && project.status !== status) {
        updateStatus(projectId, status)
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
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/ideas')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/ideas')}>
            <List className="w-4 h-4 mr-1" />
            List View
          </Button>
        </div>

        <PageHero
          eyebrow="IDEA HUB"
          title="Board View"
          subtitle="Drag ideas between columns to update their status"
        />

        {/* Board */}
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
          {BOARD_STATUSES.map(status => {
            const statusInfo = IDEA_STATUSES.find(s => s.value === status)!
            const columnProjects = projects.filter(p => p.status === status)
            const isDragOver = dragOverColumn === status

            return (
              <div
                key={status}
                className={`flex-shrink-0 w-72 rounded-2xl border transition-colors ${
                  isDragOver
                    ? 'border-primary-500/50 bg-primary-500/5'
                    : 'border-neutral-800 bg-neutral-900/50'
                }`}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: statusInfo.color }}
                    />
                    <span className="text-sm font-semibold text-white">{statusInfo.label}</span>
                  </div>
                  <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                    {columnProjects.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-[200px]">
                  {columnProjects.map(project => {
                    const priorityInfo = getPriorityInfo(project.priority)
                    const isDragging = draggedId === project.id

                    return (
                      <div
                        key={project.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, project.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => router.push(`/admin/ideas/${project.id}`)}
                        className={`bg-neutral-800 rounded-xl p-3 cursor-grab active:cursor-grabbing border border-neutral-700 hover:border-neutral-600 transition-all ${
                          isDragging ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        {/* Category stripe */}
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
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: priorityInfo.color }}
                          />
                          <span>{priorityInfo.label}</span>
                          {project.task_count > 0 && (
                            <>
                              <span className="text-neutral-700">|</span>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{project.task_done_count}/{project.task_count}</span>
                            </>
                          )}
                          {project.due_date && (
                            <>
                              <span className="text-neutral-700">|</span>
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </>
                          )}
                        </div>

                        {/* Tags */}
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
                      No ideas
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
