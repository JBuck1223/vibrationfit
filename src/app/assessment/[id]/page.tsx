import { redirect } from 'next/navigation'

type AssessmentRouteParams = {
  params: {
    id: string
  }
}

export default function AssessmentIdPage({ params }: AssessmentRouteParams) {
  redirect(`/assessment/${params.id}/results`)
}