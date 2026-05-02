'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button, Container, Stack } from '@/lib/design-system/components'
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface IntensiveStepWrapperProps {
  stepNumber: number
  title: string
  subtitle?: string
  icon?: LucideIcon
  nextHref?: string
  nextLabel?: string
  backHref?: string
  showNextButton?: boolean
  isComplete?: boolean
  onComplete?: () => void | Promise<void>
  children: React.ReactNode
}

export function IntensiveStepWrapper({
  stepNumber,
  title,
  subtitle,
  icon: Icon,
  nextHref,
  nextLabel,
  backHref,
  showNextButton = true,
  isComplete,
  onComplete,
  children,
}: IntensiveStepWrapperProps) {
  const router = useRouter()

  return (
    <Container size="xl" className="pt-2 pb-6 sm:pb-8">
      <Stack gap="lg">
        {/* Step header */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/20 text-primary-500 text-sm font-bold">
            {stepNumber}
          </div>
          {Icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
              <Icon className="h-4 w-4 text-primary-500" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-neutral-400 truncate">{subtitle}</p>
            )}
          </div>
          {isComplete && (
            <CheckCircle className="ml-auto h-5 w-5 shrink-0 text-primary-500" />
          )}
        </div>

        {children}

        {/* Navigation footer */}
        {(showNextButton || backHref) && (
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            {backHref ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(backHref)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}
            {showNextButton && nextHref && (
              <Button
                variant="primary"
                onClick={() => {
                  if (onComplete) onComplete()
                  router.push(nextHref)
                }}
              >
                {nextLabel || 'Next Step'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </Stack>
    </Container>
  )
}
