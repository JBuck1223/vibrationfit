import Image, { type ImageProps } from 'next/image'

export function MarketingImage(props: ImageProps) {
  return <Image {...props} unoptimized />
}
