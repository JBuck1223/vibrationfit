import { Card } from '@/lib/design-system/components'
import { AlertTriangle } from 'lucide-react'

interface ProfileContrastCardProps {
  contrastText?: string | null
  worryText?: string | null
  categoryLabel: string
}

export function ProfileContrastCard({ contrastText, worryText, categoryLabel }: ProfileContrastCardProps) {
  const hasData = contrastText || worryText

  return (
    <Card 
      variant="outlined" 
      className="border-[#FF0040] bg-[#FF0040]/5 hover:bg-[#FF0040]/10 transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-[#FF0040]/20 rounded-lg flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-[#FF0040]" />
        </div>
        <h3 className="text-base md:text-lg font-semibold text-[#FF0040]">
          Contrast from Profile
        </h3>
      </div>
      
      {hasData ? (
        <div className="space-y-4">
          {contrastText && (
            <div>
              <p className="text-xs text-[#FF0040]/70 mb-2 font-medium">What's Not Working</p>
              <p className="text-sm md:text-base text-neutral-200 leading-relaxed">{contrastText}</p>
            </div>
          )}
          
          {worryText && (
            <div>
              <p className="text-xs text-[#FF0040]/70 mb-2 font-medium">Your Worries & Concerns</p>
              <p className="text-sm md:text-base text-neutral-200 leading-relaxed">{worryText}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-neutral-400 text-sm">
            No contrast or worries recorded yet for {categoryLabel}.
          </p>
          <p className="text-[#FF0040]/70 text-xs italic">
            Acknowledging contrast helps VIVA understand what you want to move away from.
          </p>
        </div>
      )}
    </Card>
  )
}

