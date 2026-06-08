/**
 * Finds the nearest scrollable ancestor of an element.
 */
export function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null
  let parent = el.parentElement
  while (parent) {
    const { overflow, overflowY } = getComputedStyle(parent)
    if (/(auto|scroll)/.test(overflow + overflowY)) return parent
    parent = parent.parentElement
  }
  return null
}

/**
 * Auto-resizes a textarea to fit its content while preserving
 * the scroll position of both the nearest scrollable ancestor
 * and the window. This prevents the "jump to top" bug caused by
 * setting `height: auto` (which temporarily collapses the textarea
 * and triggers a browser reflow that clamps scroll positions).
 *
 * Must be called synchronously from an event handler (not in rAF)
 * to avoid a visible frame of scroll disruption.
 */
export function scrollSafeAutoResize(
  textarea: HTMLTextAreaElement,
  opts: { minHeight?: number; maxHeight?: number } = {},
) {
  const scrollParent = getScrollParent(textarea)
  const prevParentScroll = scrollParent ? scrollParent.scrollTop : null
  const prevWindowScroll = window.scrollY

  textarea.style.height = 'auto'
  const scrollHeight = textarea.scrollHeight
  const minH = opts.minHeight ?? 0
  const maxH = opts.maxHeight ?? Infinity
  const newHeight = Math.min(Math.max(scrollHeight, minH), maxH)
  textarea.style.height = `${newHeight}px`
  textarea.style.overflowY = scrollHeight > maxH ? 'auto' : 'hidden'

  if (scrollParent && prevParentScroll !== null && scrollParent.scrollTop !== prevParentScroll) {
    scrollParent.scrollTop = prevParentScroll
  }
  if (window.scrollY !== prevWindowScroll) {
    window.scrollTo({ top: prevWindowScroll })
  }
}
