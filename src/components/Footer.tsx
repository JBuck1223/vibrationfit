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
              width={272}
              height={24}
              loading="eager"
            />
          </Link>

          {/* Legal & support links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/terms-of-service" className="text-neutral-400 transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="text-neutral-400 transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/contact" className="text-neutral-400 transition-colors hover:text-white">
              Contact
            </Link>
            <a
              href="mailto:support@vibrationfit.com"
              className="text-neutral-400 transition-colors hover:text-white"
            >
              Support
            </a>
          </nav>

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
