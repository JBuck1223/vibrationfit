'use client'

import { useState } from 'react'
import { LifeActivationBanner } from '@/components/life-activation/LifeActivationBanner'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'

function missingPersonalInfo(profile: Record<string, unknown> | null | undefined): string[] {
  if (!profile?.id) return []
  const text = (key: string) => (typeof profile[key] === 'string' ? (profile[key] as string).trim() : '')
  const missing: string[] = []
  if (!text('first_name')) missing.push('first name')
  if (!text('last_name')) missing.push('last name')
  if (!text('date_of_birth')) missing.push('birthday')
  if (text('phone').replace(/\D/g, '').length < 10) missing.push('phone')
  return missing
}

export function ProfileBeginBanner() {
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <>
      <LifeActivationBanner
        onboardingStep="world"
        title={LIFE_ACTIVATION_COPY.profile.title}
        body={LIFE_ACTIVATION_COPY.profile.body}
        doneLabel={LIFE_ACTIVATION_COPY.profile.cta}
        onBeforeDone={async () => {
          const res = await fetch('/api/profile')
          const data = res.ok ? await res.json().catch(() => null) : null
          const profile = data?.profile as Record<string, unknown> | undefined
          if (!profile?.id) {
            setNotice(LIFE_ACTIVATION_COPY.profile.needProfile)
            return false
          }
          const missing = missingPersonalInfo(profile)
          if (missing.length > 0) {
            setNotice(LIFE_ACTIVATION_COPY.profile.missing(missing))
            return false
          }
          setNotice(null)
          return true
        }}
      />
      {notice ? <p className="mb-6 text-sm text-neutral-300">{notice}</p> : null}
    </>
  )
}
