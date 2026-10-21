import { renderRoomPreview, isPreviewRoom } from '@/lib/room-preview/render'

// Standalone concept pages: no app layout, providers, auth, API calls or writes.
export function GET(request: Request) {
  const segment =
    new URL(request.url).pathname.split('/').filter(Boolean)[1] || 'dashboard'
  const room = segment === 'dashboard' ? 'home' : segment
  if (!isPreviewRoom(room))
    return new Response('Concept not found', { status: 404 })
  return new Response(renderRoomPreview(room), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
