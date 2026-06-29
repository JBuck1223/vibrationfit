'use client'

import React from 'react'
import Link from 'next/link'
import { Button, type ButtonProps } from './Button'

export interface ButtonLinkProps extends Omit<ButtonProps, 'asChild' | 'onClick'> {
  href: string
}

export function ButtonLink({ href, children, ...buttonProps }: ButtonLinkProps) {
  const isExternal =
    href.startsWith('http') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#')

  if (isExternal) {
    return (
      <Button asChild {...buttonProps}>
        <a href={href}>{children}</a>
      </Button>
    )
  }

  return (
    <Button asChild {...buttonProps}>
      <Link href={href}>{children}</Link>
    </Button>
  )
}
