'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../shared-utils'
import { Button } from '../forms/Button'
import { useInShell } from '@/lib/app-shell/shell-context'
import { OverlayPortal } from './OverlayPortal'

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  variant?: 'default' | 'hero' | 'card' | 'danger' | 'success'
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    footer,
    size = 'md',
    showCloseButton = true,
    variant = 'default',
    className,
    ...props 
  }, ref) => {
    // App shell: the violet glass sheet; the dark tiles inside map to glass too.
    const inShell = useInShell()
    useEffect(() => {
      if (!isOpen) return
      // Member pages scroll inside the app shell's <main>, not the body, so lock both.
      const shellScroller = document.querySelector('main')
      const prevShellOverflow = shellScroller?.style.overflow ?? ''
      document.body.style.overflow = 'hidden'
      if (shellScroller) shellScroller.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
        if (shellScroller) shellScroller.style.overflow = prevShellOverflow
      }
    }, [isOpen])

    if (!isOpen) return null

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-7xl'
    }

    return (
      <OverlayPortal>
      <div 
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
          inShell ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/80',
        )}
        onClick={onClose}
      >
        <div
          ref={ref}
          className={cn(
            inShell
              ? 'vf-glass rounded-[24px] border border-white/[0.14] bg-[rgba(28,22,38,0.97)] shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-2xl'
              : 'bg-[#1F1F1F] border-2 border-[#333] rounded-2xl',
            'w-full relative max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden',
            sizeClasses[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
          data-studio-glass={inShell || undefined}
          {...props}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className={cn('flex items-center justify-between gap-3 p-4 sm:p-6 border-b shrink-0', inShell ? 'border-white/10' : 'border-[#333]')}>
              {title && (
                <h2 className="min-w-0 break-words text-xl font-semibold text-white">{title}</h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="shrink-0 text-neutral-400 hover:text-white transition-colors ml-auto"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto min-h-0 flex-1">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className={cn('p-4 sm:p-6 border-t shrink-0', inShell ? 'border-white/10' : 'border-[#333]')}>
              {footer}
            </div>
          )}
        </div>
      </div>
      </OverlayPortal>
    )
  }
)
Modal.displayName = 'Modal'
