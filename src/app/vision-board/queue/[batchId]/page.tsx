import { redirect } from 'next/navigation'

export default async function VisionBoardQueueBatchRedirect({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = await params
  redirect(`/manifestations/queue/${batchId}`)
}
