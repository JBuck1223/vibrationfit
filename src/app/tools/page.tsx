import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoomHub } from '@/components/rooms/RoomHub'
export default async function Page() {
  const client = await createClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) redirect('/auth/login')
  return <RoomHub room="tools" />
}
