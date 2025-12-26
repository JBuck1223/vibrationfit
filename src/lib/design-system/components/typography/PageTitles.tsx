'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '../shared-utils'
import { Button, type ButtonProps } from '../forms/Button'
import { Badge, type BadgeProps } from '../badges/Badge'
import { Icon } from '../utils/Icon'
import type { LucideIcon } from 'lucide-react'

interface PageTitleMetaItem {
  label: string
  value: string
  icon?: LucideIcon
}

export interface PageTitleAction {
  label: string
  onClick?: () => void
  href?: string
  target?: '_self' | '_blank' | '_parent' | '_top'
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  className?: string
}

interface PageTitlesProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  supportingText?: React.ReactNode
  breadcrumbs?: React.ReactNode
  status?: {
    label: React.ReactNode
    variant?: BadgeProps['variant']
  }
  metaItems?: PageTitleMetaItem[]
  actions?: PageTitleAction[]
  alignment?: 'left' | 'center'
  children?: React.ReactNode
}

export const PageTitles = React.forwardRef<HTMLDivElement, PageTitlesProps>(
  (
    {
      eyebrow,
      title,
      subtitle,
      supportingText,
      breadcrumbs,
      status,
      metaItems = [],
      actions = [],
      alignment = 'left',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isCenterAligned = alignment === 'center'
    const alignmentClasses = isCenterAligned ? 'items-center text-center' : 'items-start text-left'
    const textAlignment = isCenterAligned ? 'text-center' : 'text-left'
    const hasMetaItems = metaItems.length > 0
    const hasActions = actions.length > 0

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-8">
          <div className={cn('flex flex-col gap-3 md:gap-4', alignmentClasses)}>
            {breadcrumbs && (
              <div className={cn('text-xs md:text-sm text-neutral-500', textAlignment)}>
                {breadcrumbs}
              </div>
            )}

            {eyebrow && (
              <div className="text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                {eyebrow}
              </div>
            )}

            <div className={cn('flex flex-col gap-3 md:gap-4 w-full', isCenterAligned ? 'items-center' : 'items-start')}>
              <div
                className={cn(
                  'flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full',
                  isCenterAligned ? 'items-center' : 'items-start md:items-center'
                )}
              >
                <h1 className={cn('text-3xl md:text-5xl font-bold leading-tight text-white', textAlignment)}>
                  {title}
                </h1>
                {status?.label && (
                  <Badge
                    variant={status.variant ?? 'primary'}
                    className="whitespace-nowrap"
                  >
                    {status.label}
                  </Badge>
                )}
              </div>

              {subtitle && (
                <p className={cn('text-sm md:text-lg text-neutral-300 max-w-3xl', textAlignment)}>
                  {subtitle}
                </p>
              )}

              {supportingText && (
                <p className={cn('text-xs md:text-sm text-neutral-400 max-w-2xl', textAlignment)}>
                  {supportingText}
                </p>
              )}

              {hasMetaItems && (
                <div
                  className={cn(
                    'flex flex-col sm:flex-row sm:flex-wrap gap-3 md:gap-4 pt-2',
                    isCenterAligned ? 'items-center justify-center' : 'items-start'
                  )}
                >
                  {metaItems.map((item, index) => (
                    <div
                      key={`${item.label}-${item.value}-${index}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-neutral-700 bg-neutral-900/60"
                    >
                      {item.icon && (
                        <Icon icon={item.icon} size="sm" className="text-primary-500" />
                      )}
                      <div className="text-left">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                          {item.label}
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {children}
            </div>
          </div>

          {hasActions && (
            <div
              className={cn(
                'w-full md:w-auto flex flex-col gap-2 sm:flex-row md:flex-col md:gap-3',
                isCenterAligned
                  ? 'items-center sm:items-center md:items-center'
                  : 'items-stretch sm:items-center md:items-end'
              )}
            >
              {actions.map((action, index) => {
                const {
                  label,
                  variant = 'primary',
                  size = 'sm',
                  icon: ActionIcon,
                  iconPosition = 'left',
                  href,
                  target,
                  onClick,
                  className: actionClassName = '',
                  loading,
                } = action

                const key = `${label}-${index}`

                if (href) {
                  return (
                    <Button
                      key={key}
                      variant={variant}
                      size={size}
                      className={cn('w-full sm:w-auto md:w-full', actionClassName)}
                      loading={loading}
                      asChild
                    >
                      <Link
                        href={href}
                        target={target}
                        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
                      >
                        {ActionIcon && iconPosition === 'left' && (
                          <Icon icon={ActionIcon} size="sm" className="shrink-0" />
                        )}
                        <span className="truncate">{label}</span>
                        {ActionIcon && iconPosition === 'right' && (
                          <Icon icon={ActionIcon} size="sm" className="shrink-0" />
                        )}
                      </Link>
                    </Button>
                  )
                }

                return (
                  <Button
                    key={key}
                    variant={variant}
                    size={size}
                    onClick={onClick}
                    loading={loading}
                    className={cn('w-full sm:w-auto md:w-full', actionClassName)}
                  >
                    {ActionIcon && iconPosition === 'left' && (
                      <Icon icon={ActionIcon} size="sm" className="shrink-0" />
                    )}
                    <span className="truncate">{label}</span>
                    {ActionIcon && iconPosition === 'right' && (
                      <Icon icon={ActionIcon} size="sm" className="shrink-0" />
                    )}
                  </Button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }
)
PageTitles.displayName = 'PageTitles'

