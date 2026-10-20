'use client'

import Link from 'next/link'

export function CreatorLink({ userId, name }: { userId: string; name: string }) {
  return (
    <Link
      href={`/snapshot/${userId}`}
      onClick={(event) => event.stopPropagation()}
      className="text-neutral-400 hover:text-[#39FF14] transition-colors underline-offset-2 hover:underline"
    >
      {name}
    </Link>
  )
}
