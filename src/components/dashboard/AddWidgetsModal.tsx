'use client'

import { Plus, RotateCcw } from 'lucide-react'
import { Button, Modal } from '@/lib/design-system/components'
import { WIDGET_META_BY_ID, type WidgetId } from '@/lib/dashboard/widgets/registry'

interface AddWidgetsModalProps {
  isOpen: boolean
  onClose: () => void
  hiddenIds: WidgetId[]
  onAdd: (id: WidgetId) => void
  onReset: () => void
}

export function AddWidgetsModal({ isOpen, onClose, hiddenIds, onAdd, onReset }: AddWidgetsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add widgets"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onReset()
              onClose()
            }}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset to default
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      {hiddenIds.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">
          Every widget is already on your dashboard.
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {hiddenIds.map((id) => {
            const meta = WIDGET_META_BY_ID[id]
            return (
              <li key={id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{meta.title}</p>
                  <p className="text-xs text-neutral-400">{meta.description}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => onAdd(id)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
