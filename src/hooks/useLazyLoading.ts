import { useEffect, useRef, useState } from 'react'

interface UseLazyLoadingOptions {
  rootMargin?: string
  threshold?: number
  triggerOnce?: boolean
}

/**
 * Hook for lazy loading elements using Intersection Observer
 */
export function useLazyLoading(options: UseLazyLoadingOptions = {}) {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true
  } = options

  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            setHasTriggered(true)
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [rootMargin, threshold, triggerOnce])

  return {
    elementRef,
    isVisible: triggerOnce ? (hasTriggered || isVisible) : isVisible
  }
}

/**
 * Hook for lazy loading images with progressive enhancement
 */
export function useLazyImage(src: string, options: UseLazyLoadingOptions = {}) {
  const { elementRef, isVisible } = useLazyLoading(options)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (!isVisible) return

    const img = new Image()
    img.onload = () => setImageLoaded(true)
    img.onerror = () => setImageError(true)
    img.src = src
  }, [isVisible, src])

  return {
    elementRef,
    isVisible,
    imageLoaded,
    imageError,
    shouldLoad: isVisible
  }
}

/**
 * Hook for lazy loading videos with preload control
 */
export function useLazyVideo(src: string, options: UseLazyLoadingOptions = {}) {
  const { elementRef, isVisible } = useLazyLoading(options)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    if (!isVisible) return

    const video = document.createElement('video')
    video.onloadedmetadata = () => setVideoLoaded(true)
    video.onerror = () => setVideoError(true)
    video.preload = 'metadata'
    video.src = src
  }, [isVisible, src])

  return {
    elementRef,
    isVisible,
    videoLoaded,
    videoError,
    shouldLoad: isVisible
  }
}

/**
 * Hook for batch lazy loading multiple elements
 */
export function useBatchLazyLoading(
  count: number,
  options: UseLazyLoadingOptions = {}
) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set())
  const elementRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    elementRefs.current.forEach((element, index) => {
      if (!element) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleItems(prev => new Set([...prev, index]))
            if (options.triggerOnce !== false) {
              observer.unobserve(element)
            }
          } else if (options.triggerOnce === false) {
            setVisibleItems(prev => {
              const newSet = new Set(prev)
              newSet.delete(index)
              return newSet
            })
          }
        },
        {
          rootMargin: options.rootMargin || '50px',
          threshold: options.threshold || 0.1
        }
      )

      observer.observe(element)
      observers.push(observer)
    })

    return () => {
      observers.forEach(observer => observer.disconnect())
    }
  }, [count, options])

  const setElementRef = (index: number) => (element: HTMLElement | null) => {
    elementRefs.current[index] = element
  }

  return {
    setElementRef,
    isVisible: (index: number) => visibleItems.has(index),
    visibleCount: visibleItems.size
  }
}
