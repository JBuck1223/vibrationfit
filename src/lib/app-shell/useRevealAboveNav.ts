'use client'

import { useEffect, useRef } from 'react'

/**
 * For a dropdown that opens in the page (an absolute menu under its trigger):
 * once it is open, keep it clear of the app shell's bottom bar on phones.
 * It scrolls the page when there is room, and otherwise opens the menu
 * upward above its trigger. Returns a ref for the menu element.
 */
export function useRevealAboveNav<T extends HTMLElement = HTMLDivElement>(open: boolean) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!open) return
    const el = ref.current
    const frame = requestAnimationFrame(() => {
      if (!el) return
      // The phone pill bar; hidden (zero height) on desktop.
      const nav = document.querySelector('[data-shell-pill]')?.getBoundingClientRect()
      const navTop = nav && nav.height > 0 ? nav.top : window.innerHeight
      const limit = Math.min(navTop, window.innerHeight) - 12
      const rect = el.getBoundingClientRect()
      if (rect.bottom <= limit) return

      const scroller = document.scrollingElement
      const scrollRoom = scroller ? scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop : 0
      const anchor = el.offsetParent?.getBoundingClientRect()
      const header = document.querySelector('[data-shell-header]')?.getBoundingClientRect()
      const roomAbove = anchor ? anchor.top - (header?.bottom ?? 0) - 8 : 0

      if (rect.bottom - limit > scrollRoom && anchor && roomAbove >= rect.height) {
        // Not enough page left below: open upward instead.
        el.style.top = 'auto'
        el.style.bottom = '100%'
        el.style.marginTop = '0'
        el.style.marginBottom = '0.5rem'
        return
      }
      // Whatever scrolls the page, keep the menu's bottom above the bar.
      el.style.scrollMarginBottom = `${window.innerHeight - limit}px`
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
    return () => {
      cancelAnimationFrame(frame)
      if (el) {
        el.style.top = ''
        el.style.bottom = ''
        el.style.marginTop = ''
        el.style.marginBottom = ''
      }
    }
  }, [open])
  return ref
}
