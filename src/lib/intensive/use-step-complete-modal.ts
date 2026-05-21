'use client'

import { useState, useCallback } from 'react'
import { markIntensiveStep, type IntensiveStepType } from './checklist'
import { getStepByChecklistKey } from './step-mapping'

/**
 * Marks an intensive checklist step complete and opens IntensiveStepCompleteModal.
 */
export function useIntensiveStepCompleteModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [stepId, setStepId] = useState('')

  const showModalForChecklistKey = useCallback((checklistKey: IntensiveStepType) => {
    const step = getStepByChecklistKey(checklistKey)
    if (step) {
      setStepId(step.id)
      setIsOpen(true)
    }
  }, [])

  const completeAndShowModal = useCallback(
    async (checklistKey: IntensiveStepType) => {
      const success = await markIntensiveStep(checklistKey)
      if (success) {
        showModalForChecklistKey(checklistKey)
      }
      return success
    },
    [showModalForChecklistKey]
  )

  const closeModal = useCallback(() => setIsOpen(false), [])

  return {
    isOpen,
    stepId,
    completeAndShowModal,
    showModalForChecklistKey,
    closeModal,
  }
}
