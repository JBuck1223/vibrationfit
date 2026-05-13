'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function CalibrationRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/intensive/dashboard') }, [router])
  return null
}
