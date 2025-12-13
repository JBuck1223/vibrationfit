import { redirect } from 'next/navigation'

type AssessmentRouteParams = {
  params: Promise<{
    id: string
  }>
}

export default async function AssessmentIdPage({ params }: AssessmentRouteParams) {
  const { id } = await params
  redirect(`/assessment/${id}/results`)
}