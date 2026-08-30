'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'
import { Badge } from '../badges/Badge'
import { Icon } from '../utils/Icon'
import type { LucideIcon } from 'lucide-react'
import { PageHero } from './PageHero'

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
  /** @deprecated Ignored — gradient overlay was removed with the boxed hero. */
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
      className = '',
      children,
      gradient: _gradient,
      ...props
    },
    ref
  ) => {
    const hasBadgesOrMeta = badges.length > 0 || metaItems.length > 0
    const hasActions = actions.length > 0

    const actionButtons = hasActions ? (
      <>
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
                className={cn('inline-flex items-center gap-1.5', action.className)}
                asChild
              >
                <Link href={action.href}>
                  {ActionIcon && <Icon icon={ActionIcon} size="sm" className="shrink-0" />}
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
              className={cn('inline-flex items-center gap-1.5', action.className)}
            >
              {ActionIcon && !action.loading && (
                <Icon icon={ActionIcon} size="sm" className="shrink-0" />
              )}
              <span>{action.label}</span>
            </Button>
          )
        })}
      </>
    ) : null

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <PageHero eyebrow={eyebrow} title={title} subtitle={subtitle}>
          {actionButtons}
        </PageHero>

        {hasBadgesOrMeta && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {badges.map((badge, index) => {
              const BadgeIcon = badge.icon
              return (
                <Badge
                  key={`badge-${index}`}
                  variant={badge.variant ?? 'neutral'}
                  className={badge.className}
                >
                  {BadgeIcon && <Icon icon={BadgeIcon} size="sm" className="mr-1" />}
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
                    'flex items-center gap-1.5 text-xs text-neutral-400',
                    item.className
                  )}
                >
                  {MetaIcon && <Icon icon={MetaIcon} size="sm" className="text-neutral-500" />}
                  <span className="font-medium text-neutral-300">{item.label}:</span>
                  <span>{item.value}</span>
                </div>
              )
            })}
          </div>
        )}

        {children && <div className="mt-3">{children}</div>}
      </div>
    )
  }
)
PageHeader.displayName = 'PageHeader'
