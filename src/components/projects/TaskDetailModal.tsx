'use client'

import { Modal } from '@/lib/design-system/components'
import type { IdeaAttachment, IdeaTask, ProjectNote, ProjectReferenceLink } from '@/lib/projects/types'
import { ProjectNotesSection } from './ProjectNotesSection'
import { ProjectLinksSection } from './ProjectLinksSection'
import { ProjectMediaSection } from './ProjectMediaSection'

interface TaskDetailModalProps {
  projectId: string
  task: IdeaTask | null
  notes: ProjectNote[]
  links: ProjectReferenceLink[]
  attachments: IdeaAttachment[]
  onClose: () => void
  onChanged: () => void
}

export function TaskDetailModal({
  projectId,
  task,
  notes,
  links,
  attachments,
  onClose,
  onChanged,
}: TaskDetailModalProps) {
  if (!task) return null

  const taskNotes = notes.filter(n => n.task_id === task.id)
  const taskLinks = links.filter(l => l.task_id === task.id)
  // Media directly on the task, plus media attached via its notes
  const taskNoteIds = new Set(taskNotes.map(n => n.id))
  const taskMedia = attachments.filter(
    a => a.task_id === task.id || (a.note_id !== null && taskNoteIds.has(a.note_id))
  )

  return (
    <Modal
      isOpen={!!task}
      onClose={onClose}
      title={task.title}
      size="lg"
      className="!border !border-white/[0.06] bg-[#1F1F1F]/95 backdrop-blur-xl shadow-2xl"
    >
      <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-white">Notes</h3>
          <ProjectNotesSection
            projectId={projectId}
            taskId={task.id}
            notes={taskNotes}
            attachments={attachments}
            onChanged={onChanged}
          />
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-white">Links</h3>
          <ProjectLinksSection
            projectId={projectId}
            taskId={task.id}
            links={taskLinks}
            onChanged={onChanged}
          />
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-white">Media</h3>
          <ProjectMediaSection
            projectId={projectId}
            taskId={task.id}
            attachments={taskMedia}
            onChanged={onChanged}
          />
        </section>
      </div>
    </Modal>
  )
}
