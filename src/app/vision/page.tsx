import { redirect } from 'next/navigation'
import { VisionHome } from '@/components/app-shell/vision/VisionHome'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Vision | Vibration Fit' }

export default async function VisionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return <VisionHome />
}
