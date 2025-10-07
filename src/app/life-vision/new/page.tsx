'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageLayout, Container } from '@/lib/design-system/components'
import { Sparkles } from 'lucide-react'

export default function NewVisionPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to Viva (the new primary vision creation path)
    router.replace('/life-vision/create-with-viva')
  }, [router])

  return (
    <PageLayout>
      <Container className="py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#8B5CF6] flex items-center justify-center animate-pulse">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Starting Viva...</h2>
            <p className="text-neutral-400">Your personal Vibe Assistant is ready to guide you</p>
          </div>
        </div>
      </Container>
    </PageLayout>
  )
}
