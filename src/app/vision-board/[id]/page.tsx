import { redirect } from 'next/navigation'

export default async function VisionBoardItemRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const { edit } = await searchParams
  redirect(`/manifestations/${id}${edit === '1' ? '?edit=1' : ''}`)
}
