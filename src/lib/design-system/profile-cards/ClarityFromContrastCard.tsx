import { Card, Badge, Button } from '@/lib/design-system/components'
import { Wand2, Sparkles } from 'lucide-react'

interface ClarityFromContrastCardProps {
  clarityFromContrast?: string | null
  categoryLabel: string
  onGenerateClarity?: () => void
  isGenerating?: boolean
  hasContrastData?: boolean
}

export function ClarityFromContrastCard({ 
  clarityFromContrast, 
  categoryLabel,
  onGenerateClarity,
  isGenerating = false,
  hasContrastData = false
}: ClarityFromContrastCardProps) {
  return (
    <Card 
      variant="outlined" 
      className="border-[#BF00FF] bg-[#BF00FF]/5 hover:bg-[#BF00FF]/10 transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="w-8 h-8 bg-[#BF00FF]/20 rounded-lg flex items-center justify-center shrink-0">
          <Wand2 className="w-5 h-5 text-[#BF00FF]" />
        </div>
        <h3 className="text-base md:text-lg font-semibold text-[#BF00FF]">
          Clarity from Contrast
        </h3>
        <Badge 
          variant="premium" 
          className="!bg-[#BF00FF]/20 !text-[#BF00FF] !border-[#BF00FF]/30 ml-auto"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          VIVA Generated
        </Badge>
      </div>
      
      {clarityFromContrast ? (
        <div>
          <p className="text-xs text-[#BF00FF]/70 mb-2 font-medium">Generated Clarity</p>
          <p className="text-sm md:text-base text-neutral-200 leading-relaxed">{clarityFromContrast}</p>
          
          {onGenerateClarity && (
            <Button
              onClick={onGenerateClarity}
              variant="ghost"
              size="sm"
              className="mt-4 !text-[#BF00FF] hover:!bg-[#BF00FF]/10"
              loading={isGenerating}
            >
              Regenerate Clarity
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-neutral-400 text-sm">
              VIVA can automatically generate clarity from your contrast and worries.
            </p>
            <p className="text-[#BF00FF]/70 text-xs italic">
              This helps transform "what's not working" into "what you truly want."
            </p>
          </div>
          
          {hasContrastData && onGenerateClarity && (
            <Button
              onClick={onGenerateClarity}
              variant="accent"
              size="sm"
              className="w-full !bg-gradient-to-r !from-[#BF00FF] !to-[#8B5CF6] hover:opacity-90"
              loading={isGenerating}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Clarity from Contrast
            </Button>
          )}
          
          {!hasContrastData && (
            <p className="text-neutral-500 text-xs">
              Add contrast or worries to your profile to enable this feature.
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

