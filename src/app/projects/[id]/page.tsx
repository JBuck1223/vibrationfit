import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Action groups now live inside their owning manifestation. */
export default async function ProjectRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('manifestation_id')
    .eq('id', id)
    .maybeSingle()

  if (project?.manifestation_id) {
    redirect(`/manifestations/${project.manifestation_id}`)
  }
  redirect('/manifestations')
}
