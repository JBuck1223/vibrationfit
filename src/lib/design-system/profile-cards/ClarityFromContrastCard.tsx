import { Card, Badge, Button, VIVALoadingOverlay } from '@/lib/design-system/components'
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
    <>
      <Card 
        variant="outlined" 
        className="!border-status-premium bg-status-premium/5"
      >
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="w-8 h-8 bg-status-premium/20 rounded-lg flex items-center justify-center shrink-0">
          <Wand2 className="w-5 h-5 text-status-premium" />
        </div>
        <h3 className="text-base md:text-lg font-semibold text-status-premium">
          Clarity from Contrast
        </h3>
        <Badge 
          variant="premium" 
          className="ml-auto"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          VIVA Generated
        </Badge>
      </div>
      
      {clarityFromContrast ? (
        <div>
          <p className="text-xs text-status-premium/70 mb-2 font-medium">Generated Clarity</p>
          <p className="text-sm md:text-base text-neutral-200 leading-relaxed">{clarityFromContrast}</p>
          
          {onGenerateClarity && (
            <Button
              onClick={onGenerateClarity}
              variant="outline-purple"
              size="sm"
              className="mt-4"
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
            <p className="text-status-premium/70 text-xs italic">
              This helps transform "what's not working" into "what you truly want."
            </p>
          </div>
          
          {hasContrastData && onGenerateClarity && (
            <div className="flex justify-center">
              <Button
                onClick={onGenerateClarity}
                variant="outline-purple"
                size="sm"
                loading={isGenerating}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Clarity from Contrast
              </Button>
            </div>
          )}
          
          {!hasContrastData && (
            <p className="text-neutral-500 text-xs">
              Add contrast or worries to your profile to enable this feature.
            </p>
          )}
        </div>
      )}
    </Card>

    {/* VIVA Loading Overlay */}
    <VIVALoadingOverlay
      isVisible={isGenerating}
      messages={[
        "VIVA is analyzing your contrast...",
        "Transforming worries into clarity...",
        "Generating aligned vision...",
        "Crafting your positive clarity statement..."
      ]}
      cycleDuration={3500}
      estimatedTime="Usually takes 10-20 seconds"
      estimatedDuration={15000}
    />
    </>
  )
}

