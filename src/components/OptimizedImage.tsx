import { NextImage } from '@/lib/design-system'
import { useLazyImage } from '@/hooks/useLazyLoading'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  onClick?: () => void
  quality?: number
  sizes?: string
  priority?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  onClick,
  quality = 85,
  sizes,
  priority = false
}: OptimizedImageProps) {
  const { elementRef, shouldLoad, imageLoaded, imageError } = useLazyImage(src, {
    rootMargin: '100px',
    threshold: 0.1,
    triggerOnce: true
  })

  const [isLoading, setIsLoading] = useState(true)

  // Show placeholder while loading
  if (!shouldLoad || (!imageLoaded && !imageError)) {
    return (
      <div
        ref={elementRef}
        className={`bg-neutral-800 animate-pulse rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-lg" />
      </div>
    )
  }

  // Show error state
  if (imageError) {
    return (
      <div
        className={`bg-neutral-800 rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-neutral-500">
          <div className="text-sm">Failed to load</div>
        </div>
      </div>
    )
  }

  return (
    <NextImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onClick={onClick}
      quality={quality}
      sizes={sizes}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      onLoad={() => setIsLoading(false)}
      onError={() => setIsLoading(false)}
    />
  )
}
