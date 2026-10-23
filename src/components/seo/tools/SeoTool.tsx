import type { SeoToolId } from '@/content/seo/types'
import { VisionBoardBuilder } from './VisionBoardBuilder'
import { AffirmationGenerator } from './AffirmationGenerator'

export function SeoTool({ id, startHref }: { id: SeoToolId; startHref: string }) {
  switch (id) {
    case 'vision-board-builder':
      return <VisionBoardBuilder startHref={startHref} />
    case 'affirmation-generator':
      return <AffirmationGenerator startHref={startHref} />
  }
}
