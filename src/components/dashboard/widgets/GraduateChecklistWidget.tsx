'use client'

import { GraduationCap } from 'lucide-react'
import { GraduateChecklistCard } from '@/components/GraduateChecklistCard'
import { useDashboard } from '../DashboardContext'
import { WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'

/** Intensive graduates only: the legacy 7-item "first week" checklist. */
export function GraduateChecklistWidget(chrome: WidgetChromeProps) {
  const { server } = useDashboard()
  const progress = server.graduateChecklist?.progress
  if (!progress) return null

  return (
    <WidgetFrame {...chrome} title="Graduate Checklist" icon={GraduationCap} accent="#39FF14" flush>
      <div className="p-2">
        <GraduateChecklistCard progress={progress} />
      </div>
    </WidgetFrame>
  )
}
