'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'
import { Badge } from '../badges/Badge'
import { Icon } from '../utils/Icon'
import type { LucideIcon } from 'lucide-react'

interface PageHeaderBadge {
  label: string
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'error' | 'info' | 'premium' | 'neutral'
  icon?: LucideIcon
  className?: string
}

interface PageHeaderMetaItem {
  label: string
  value: string | number
  icon?: LucideIcon
  className?: string
}

interface PageHeaderAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: LucideIcon
  disabled?: boolean
  loading?: boolean
  className?: string
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string
  title: string
  subtitle?: string
  badges?: PageHeaderBadge[]
  metaItems?: PageHeaderMetaItem[]
  actions?: PageHeaderAction[]
  gradient?: boolean
  className?: string
  children?: React.ReactNode
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      eyebrow,
      title,
      subtitle,
      badges = [],
      metaItems = [],
      actions = [],
      gradient = true,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const hasBadgesOrMeta = badges.length > 0 || metaItems.length > 0
    const hasActions = actions.length > 0

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        {gradient && (
          <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-transparent pointer-events-none" />
        )}

        <div className="relative z-10">
          {eyebrow && (
            <div className="text-center mb-4">
              <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                {eyebrow}
              </div>
            </div>
          )}

          <div className="text-center mb-4">
            <h1 className="text-xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm md:text-base text-neutral-400 mt-2 max-w-3xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>

          {hasBadgesOrMeta && (
            <div className="text-center mb-6">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                {badges.map((badge, index) => {
                  const BadgeIcon = badge.icon
                  return (
                    <Badge
                      key={`badge-${index}`}
                      variant={badge.variant ?? 'primary'}
                      className={cn('uppercase tracking-[0.25em]', badge.className)}
                    >
                      {BadgeIcon && (
                        <Icon icon={BadgeIcon} size="sm" className="mr-1" />
                      )}
                      {badge.label}
                    </Badge>
                  )
                })}

                {metaItems.map((item, index) => {
                  const MetaIcon = item.icon
                  return (
                    <div
                      key={`meta-${index}`}
                      className={cn(
                        'flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm',
                        item.className
                      )}
                    >
                      {MetaIcon && (
                        <Icon icon={MetaIcon} size="sm" className="text-neutral-500" />
                      )}
                      <span className="font-medium">{item.label}:</span>
                      <span>{item.value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {hasActions && (
            <div className="flex flex-row flex-wrap lg:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
              {actions.map((action, index) => {
                const ActionIcon = action.icon
                const key = `action-${index}`

                if (action.href) {
                  return (
                    <Button
                      key={key}
                      variant={action.variant ?? 'outline'}
                      size={action.size ?? 'sm'}
                      disabled={action.disabled}
                      loading={action.loading}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm',
                        action.className
                      )}
                      asChild
                    >
                      <Link href={action.href}>
                        {ActionIcon && (
                          <Icon icon={ActionIcon} size="sm" className="shrink-0" />
                        )}
                        <span>{action.label}</span>
                      </Link>
                    </Button>
                  )
                }

                return (
                  <Button
                    key={key}
                    onClick={action.onClick}
                    variant={action.variant ?? 'outline'}
                    size={action.size ?? 'sm'}
                    disabled={action.disabled}
                    loading={action.loading}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm',
                      action.className
                    )}
                  >
                    {ActionIcon && !action.loading && (
                      <Icon icon={ActionIcon} size="sm" className="shrink-0" />
                    )}
                    <span>{action.label}</span>
                  </Button>
                )
              })}
            </div>
          )}

          {children && (
            <div className="mt-6">
              {children}
            </div>
          )}
        </div>
      </div>
    )
  }
)
PageHeader.displayName = 'PageHeader'
