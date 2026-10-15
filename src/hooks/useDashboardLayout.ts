'use client'

import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { arrayMove } from '@dnd-kit/sortable'
import { keys } from '@/lib/query/keys'
import {
  DEFAULT_LAYOUT,
  normalizeLayout,
  type DashboardLayout,
  type DashboardWidgetPlacement,
} from '@/lib/dashboard/layout'
import { WIDGET_META_BY_ID, type WidgetId, type WidgetSize } from '@/lib/dashboard/widgets/registry'

async function fetchLayout(): Promise<DashboardLayout> {
  const res = await fetch('/api/dashboard/layout')
  if (!res.ok) throw new Error('Failed to load dashboard layout')
  const data = await res.json()
  return normalizeLayout(data.layout)
}

async function putLayout(layout: DashboardLayout): Promise<DashboardLayout> {
  const res = await fetch('/api/dashboard/layout', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(layout),
  })
  if (!res.ok) throw new Error('Failed to save dashboard layout')
  const data = await res.json()
  return normalizeLayout(data.layout)
}

export function useDashboardLayout() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: keys.dashboardLayout,
    queryFn: fetchLayout,
    staleTime: 60_000,
  })

  const mutation = useMutation({
    mutationFn: putLayout,
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: keys.dashboardLayout })
      const previous = queryClient.getQueryData<DashboardLayout>(keys.dashboardLayout)
      queryClient.setQueryData(keys.dashboardLayout, next)
      return { previous }
    },
    onError: (_err, _next, context) => {
      if (context?.previous) queryClient.setQueryData(keys.dashboardLayout, context.previous)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(keys.dashboardLayout, data)
    },
  })

  const layout = query.data ?? DEFAULT_LAYOUT

  const save = useCallback(
    (widgets: DashboardWidgetPlacement[]) => {
      mutation.mutate(normalizeLayout({ version: 1, widgets }))
    },
    [mutation],
  )

  const reorder = useCallback(
    (activeId: WidgetId, overId: WidgetId) => {
      if (activeId === overId) return
      if (WIDGET_META_BY_ID[activeId].pinned || WIDGET_META_BY_ID[overId].pinned) return
      const from = layout.widgets.findIndex((w) => w.id === activeId)
      const to = layout.widgets.findIndex((w) => w.id === overId)
      if (from < 0 || to < 0) return
      save(arrayMove(layout.widgets, from, to))
    },
    [layout.widgets, save],
  )

  const setVisible = useCallback(
    (id: WidgetId, visible: boolean) => {
      if (WIDGET_META_BY_ID[id].pinned) return
      save(layout.widgets.map((w) => (w.id === id ? { ...w, visible } : w)))
    },
    [layout.widgets, save],
  )

  const setSize = useCallback(
    (id: WidgetId, size: WidgetSize) => {
      save(layout.widgets.map((w) => (w.id === id ? { ...w, size } : w)))
    },
    [layout.widgets, save],
  )

  const reset = useCallback(() => {
    save(DEFAULT_LAYOUT.widgets)
  }, [save])

  return {
    layout,
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
    reorder,
    setVisible,
    setSize,
    reset,
  }
}
