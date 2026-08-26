import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { LifeExplorerNav } from './LifeExplorerNav'

export const metadata: Metadata = {
  title: 'Life Explorer | Vibration Fit Homeschool',
  description: 'Curiosity-driven daily lessons for Vibration Fit Homeschool.',
}

// Today · Week · Map · Progress · Profile — one tab per time horizon.
// Each tab carries its own panel row (e.g. Week → Coming Week / Calendar / New Direction / Resources).
export default async function LifeExplorerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Expedition-as-place context for the top bar, fetched server-side so the
  // nav never waterfalls a client request.
  let expeditionTitle: string | null = null
  let lifeCategory: string | null = null
  let studentName: string | null = null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: student } = await supabase
        .from('le_students')
        .select('id, name')
        .eq('active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (student) {
        studentName = student.name
        const { data: expedition } = await supabase
          .from('le_expeditions')
          .select('title, life_category')
          .eq('student_id', student.id)
          .eq('status', 'active')
          .maybeSingle()
        expeditionTitle = expedition?.title || null
        lifeCategory = expedition?.life_category || null
      }
    }
  } catch {
    // Nav renders fine without context.
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <LifeExplorerNav
        expeditionTitle={expeditionTitle}
        lifeCategory={lifeCategory}
        studentName={studentName}
      />
      {/* Horizontal padding for every surface (Container adds none by design);
          bottom padding on mobile so the fixed tab bar never covers content.
          Book reader is full-screen and strips this padding via :has(). */}
      <div className="px-4 md:px-6 pb-24 md:pb-0 has-[[data-book-reader]]:p-0 has-[[data-lesson-page]]:px-0 has-[[data-lesson-page]]:pt-0">{children}</div>
    </div>
  )
}
