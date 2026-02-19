import Link from 'next/link'
import Image from 'next/image'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'

interface FooterProps {
  className?: string
}

export function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`bg-black border-t border-neutral-800 py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src={ASSETS.brand.logoWhite}
              alt="Vibration Fit"
              width={120}
              height={24}
              style={{ width: 'auto', height: '1.5rem' }}
            />
          </Link>
          
          {/* Copyright */}
          <p className="text-neutral-500 text-xs">
            COPYRIGHT VIBRATION FIT, INC. {currentYear}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
