/**
 * Finds the nearest scrollable ancestor of an element.
 */
export function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null
  let parent = el.parentElement
  while (parent) {
    const { overflow, overflowY } = getComputedStyle(parent)
    if (/(auto|scroll|overlay)/.test(overflow + overflowY)) return parent
    parent = parent.parentElement
  }
  return null
}

export type ScrollAnchor = {
  ancestors: { node: HTMLElement; top: number }[]
  windowY: number
  field: HTMLInputElement | HTMLTextAreaElement
  fieldScroll: number
  start: number | null
  end: number | null
  direction: 'forward' | 'backward' | 'none'
}

function scrollableAncestors(el: HTMLElement) {
  const ancestors: { node: HTMLElement; top: number }[] = []
  let parent = el.parentElement
  while (parent) {
    const { overflow, overflowY } = getComputedStyle(parent)
    if (/(auto|scroll|overlay)/.test(overflow + overflowY)) {
      ancestors.push({ node: parent, top: parent.scrollTop })
    }
    parent = parent.parentElement
  }
  return ancestors
}

/** Snapshot caret and scroll positions before a controlled input re-render. */
export function captureScrollAnchor(field: HTMLInputElement | HTMLTextAreaElement): ScrollAnchor {
  return {
    ancestors: scrollableAncestors(field),
    windowY: window.scrollY,
    field,
    fieldScroll: field.scrollTop,
    start: field.selectionStart,
    end: field.selectionEnd,
    direction: field.selectionDirection ?? 'none',
  }
}

function writeScroll(current: number, saved: number, write: (value: number) => void) {
  if (current !== saved) write(saved)
}

/** Put the caret and every scrollable ancestor back where capture left them. */
export function restoreScrollAnchor(anchor: ScrollAnchor) {
  const restorePositions = () => {
    writeScroll(anchor.field.scrollTop, anchor.fieldScroll, value => { anchor.field.scrollTop = value })
    for (const box of anchor.ancestors) {
      writeScroll(box.node.scrollTop, box.top, value => { box.node.scrollTop = value })
    }
    writeScroll(window.scrollY, anchor.windowY, value => { window.scrollTo(0, value) })
  }

  restorePositions()
  if (
    document.activeElement === anchor.field &&
    anchor.start != null &&
    anchor.end != null &&
    (anchor.field.selectionStart !== anchor.start || anchor.field.selectionEnd !== anchor.end)
  ) {
    anchor.field.setSelectionRange(anchor.start, anchor.end, anchor.direction)
  }
  // setSelectionRange scrolls the caret into view. Put the viewport back after that.
  restorePositions()
}

/**
 * Auto-resizes a textarea to fit its content while preserving scroll
 * positions. Measuring from 0px collapses the field for one layout,
 * and the browser clamps every scrollable ancestor to the new bottom.
 *
 * Must be called synchronously from an event handler or useLayoutEffect
 * (not in rAF) to avoid a visible frame of scroll disruption.
 */
export function scrollSafeAutoResize(
  textarea: HTMLTextAreaElement,
  opts: { minHeight?: number; maxHeight?: number } = {},
) {
  const ancestors = scrollableAncestors(textarea)
  const prevWindowScroll = window.scrollY
  const prevFieldScroll = textarea.scrollTop

  // 0px, not auto: a textarea with overflow hidden reports scrollHeight as its
  // current box, so auto leaves a long section only a few lines tall.
  textarea.style.height = '0px'
  const scrollHeight = textarea.scrollHeight
  const minH = opts.minHeight ?? 0
  const maxH = opts.maxHeight ?? Infinity
  const newHeight = Math.min(Math.max(scrollHeight, minH), maxH)
  textarea.style.height = `${newHeight}px`
  const clamped = scrollHeight > maxH
  textarea.style.overflowY = clamped ? 'auto' : 'hidden'

  writeScroll(textarea.scrollTop, clamped ? prevFieldScroll : 0, value => { textarea.scrollTop = value })
  for (const box of ancestors) {
    writeScroll(box.node.scrollTop, box.top, value => { box.node.scrollTop = value })
  }
  writeScroll(window.scrollY, prevWindowScroll, value => { window.scrollTo(0, value) })
}
