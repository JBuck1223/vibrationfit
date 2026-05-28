'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PenLine, Loader2 } from 'lucide-react'
import type { CommitmentOccurrence } from '@/lib/map/types'
import { MapJournalReflectModal } from './MapJournalReflectModal'

const inlineBtnClass =
  'inline-flex items-center gap-0.5 px-2 py-1 text-[10px] rounded-lg font-medium transition-all border border-transparent bg-neutral-800 text-neutral-400 hover:bg-primary-500/10 hover:text-primary-400 hover:border-primary-500/20'

const inlineBtnLinkedClass =
  'inline-flex items-center gap-0.5 px-2 py-1 text-[10px] rounded-lg font-medium transition-all border border-primary-500/40 bg-primary-500/20 text-primary-400 hover:bg-primary-500/25'

export function MapOccurrenceJournal({
  occurrence,
  commitmentTitle,
  lifeCategory,
  onUpdated,
}: {
  occurrence: CommitmentOccurrence
  commitmentTitle: string
  lifeCategory?: string
  onUpdated: () => void | Promise<void>
}) {
  const [modalOpen, setModalOpen] = useState(false)

  const journalId = occurrence.journal_entry_id
  const hasJournal = Boolean(journalId)

  if (hasJournal) {
    return (
      <Link
        href={`/journal/${journalId}`}
        className={inlineBtnLinkedClass}
        title="View journal entry"
      >
        <PenLine className="w-3 h-3" aria-hidden />
        Journal
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={inlineBtnClass}
        title="Add journal reflection"
      >
        <PenLine className="w-3 h-3" aria-hidden />
        Journal
      </button>

      <MapJournalReflectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={onUpdated}
        mapLink={{
          occurrenceId: occurrence.id,
          commitmentTitle,
          occurredOn: occurrence.occurred_on,
          category: lifeCategory,
        }}
      />
    </>
  )
}
