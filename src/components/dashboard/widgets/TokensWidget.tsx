'use client'

import { Zap } from 'lucide-react'
import HouseholdTokenBalance from '@/components/HouseholdTokenBalance'
import { WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'

/** Display-only wrapper around the locked Token System balance card. */
export function TokensWidget(chrome: WidgetChromeProps) {
  return (
    <WidgetFrame {...chrome} title="Tokens" icon={Zap} accent="#FFFF00" href="/tokens" hrefLabel="Tokens" flush>
      <div className="p-2">
        <HouseholdTokenBalance />
      </div>
    </WidgetFrame>
  )
}
