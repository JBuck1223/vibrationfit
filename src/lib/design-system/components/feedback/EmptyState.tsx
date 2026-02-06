'use client'

import React from 'react'
import Link from 'next/link'
import { LucideIcon, FileText } from 'lucide-react'
import { cn } from '../shared-utils'
import { Card } from '../cards/Card'
import { Stack } from '../layout/Stack'
import { Text } from '../typography/Text'
import { Button } from '../forms/Button'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  icon?: LucideIcon
}

interface EmptyStateProps {
  /** Lucide icon to display. Defaults to FileText */
  icon?: LucideIcon
  /** Main title text */
  title: string
  /** Description/helper text */
  description?: string
  /** Primary action button */
  action?: EmptyStateAction
  /** Secondary action button */
  secondaryAction?: EmptyStateAction
  /** Additional class names for the container */
  className?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * EmptyState - A consistent empty state component for use across the app
 * 
 * Use this when a feature/section has no content yet (e.g., no journal entries,
 * no audio sets, no stories, etc.)
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={FileText}
 *   title="No Daily Papers yet"
 *   description="Start with gratitude, set three aligned actions, and add one fun promise."
 *   action={{
 *     label: "Add Entry",
 *     href: "/daily-paper/new",
 *     icon: Plus
 *   }}
 *   secondaryAction={{
 *     label: "Resources",
 *     href: "/daily-paper/resources",
 *     variant: "outline"
 *   }}
 * />
 * ```
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      icon: Icon = FileText,
      title,
      description,
      action,
      secondaryAction,
      className,
      size = 'md',
    },
    ref
  ) => {
    const sizeStyles = {
      sm: {
        icon: 'w-8 h-8',
        iconWrapper: 'w-12 h-12',
        title: 'text-base',
        description: 'text-xs max-w-xs',
        padding: 'p-4 md:p-6',
      },
      md: {
        icon: 'w-10 h-10',
        iconWrapper: 'w-16 h-16',
        title: 'text-lg',
        description: 'text-sm max-w-sm',
        padding: 'p-6 md:p-8 lg:p-10',
      },
      lg: {
        icon: 'w-12 h-12',
        iconWrapper: 'w-20 h-20',
        title: 'text-xl',
        description: 'text-base max-w-md',
        padding: 'p-8 md:p-10 lg:p-12',
      },
    }

    const styles = sizeStyles[size]

    const renderAction = (actionConfig: EmptyStateAction, isPrimary: boolean) => {
      const ActionIcon = actionConfig.icon
      const buttonContent = (
        <>
          {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
          {actionConfig.label}
        </>
      )

      const buttonVariant = actionConfig.variant || (isPrimary ? 'primary' : 'outline')

      if (actionConfig.href) {
        return (
          <Button
            variant={buttonVariant}
            size="sm"
            asChild
            className="w-full md:w-auto"
          >
            <Link href={actionConfig.href}>{buttonContent}</Link>
          </Button>
        )
      }

      return (
        <Button
          variant={buttonVariant}
          size="sm"
          onClick={actionConfig.onClick}
          className="w-full md:w-auto"
        >
          {buttonContent}
        </Button>
      )
    }

    return (
      <Card
        ref={ref}
        variant="outlined"
        className={cn(
          'bg-[#111111] border-dashed border-[#333]',
          styles.padding,
          className
        )}
      >
        <Stack gap="md" className="items-center text-center">
          {/* Icon */}
          <div className="flex justify-center w-full">
            <div
              className={cn(
                'rounded-full bg-neutral-800/50 flex items-center justify-center',
                styles.iconWrapper
              )}
            >
              <Icon className={cn('text-neutral-400', styles.icon)} />
            </div>
          </div>

          {/* Title */}
          <Text
            size="lg"
            className={cn('text-white font-semibold', styles.title)}
          >
            {title}
          </Text>

          {/* Description */}
          {description && (
            <p
              className={cn(
                'text-neutral-400 mx-auto',
                styles.description
              )}
            >
              {description}
            </p>
          )}

          {/* Actions */}
          {(action || secondaryAction) && (
            <div className="grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-4 md:justify-center items-center md:max-w-2xl md:mx-auto w-full pt-2">
              {action && renderAction(action, true)}
              {secondaryAction && renderAction(secondaryAction, false)}
            </div>
          )}
        </Stack>
      </Card>
    )
  }
)

EmptyState.displayName = 'EmptyState'
