'use client'

import { Card, Button } from '@/lib/design-system/components'
import { CheckCircle, BookOpen, Plus } from 'lucide-react'

interface JournalSuccessScreenProps {
  onCreateAnother: () => void
  onViewJournal: () => void
  entryTitle?: string
}

export function JournalSuccessScreen({ 
  onCreateAnother, 
  onViewJournal,
  entryTitle 
}: JournalSuccessScreenProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card variant="elevated" className="max-w-lg w-full text-center p-8 md:p-12">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary-500/10 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-primary-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-white mb-3">
          Entry Saved! 🎉
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-neutral-300 mb-8">
          {entryTitle ? (
            <>Your journal entry <span className="text-primary-500 font-semibold">"{entryTitle}"</span> has been saved successfully.</>
          ) : (
            <>Your journal entry has been saved successfully.</>
          )}
        </p>

        {/* Stats/Info */}
        <div className="bg-neutral-800/50 rounded-xl p-6 mb-8">
          <p className="text-sm text-neutral-400 mb-2">
            Keep building your practice
          </p>
          <p className="text-neutral-300">
            Regular journaling helps you track progress, reflect on experiences, and maintain alignment with your vision.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onCreateAnother}
            variant="primary"
            size="lg"
            className="w-full"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Another Entry
          </Button>
          
          <Button
            onClick={onViewJournal}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            View Journal
          </Button>
        </div>
      </Card>
    </div>
  )
}

