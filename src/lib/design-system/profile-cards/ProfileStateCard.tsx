import { Card } from '@/lib/design-system/components'
import { Compass } from 'lucide-react'

interface ProfileStateCardProps {
  stateText?: string | null
  categoryLabel: string
}

export function ProfileStateCard({ stateText, categoryLabel }: ProfileStateCardProps) {
  return (
    <Card 
      variant="outlined" 
      className="border-[#00FFFF] bg-[#00FFFF]/5 hover:bg-[#00FFFF]/10 transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-[#00FFFF]/20 rounded-lg flex items-center justify-center shrink-0">
          <Compass className="w-5 h-5 text-[#00FFFF]" />
        </div>
        <h3 className="text-base md:text-lg font-semibold text-[#00FFFF]">
          Current State from Profile
        </h3>
      </div>
      
      {stateText ? (
        <div>
          <p className="text-xs text-[#00FFFF]/70 mb-2 font-medium">Your Current State of {categoryLabel}</p>
          <p className="text-sm md:text-base text-neutral-200 leading-relaxed whitespace-pre-line">{stateText}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-neutral-400 text-sm">
            No current state recorded yet for {categoryLabel}.
          </p>
          <p className="text-[#00FFFF]/70 text-xs italic">
            Describing your current state helps VIVA understand where you are today.
          </p>
        </div>
      )}
    </Card>
  )
}
