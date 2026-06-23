import { createClient } from '@/lib/supabase/server'
import { GlobalLayout } from '@/components/GlobalLayout'

export async function GlobalLayoutShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <GlobalLayout initialAuthenticated={!!session}>
      {children}
    </GlobalLayout>
  )
}
