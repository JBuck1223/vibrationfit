import { notFound } from 'next/navigation'
import { RoomPreview } from '@/components/rooms/RoomPreview'
export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <RoomPreview />
}
