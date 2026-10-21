export function GET(request: Request) {
  const source = new URL(request.url)
  const segment = source.pathname.split('/').filter(Boolean)[1] || 'dashboard'
  const allowed = [
    'dashboard',
    'home',
    'begin',
    'listen',
    'capture',
    'tribe',
    'viva',
    'tools',
    'account',
  ]
  if (!allowed.includes(segment))
    return new Response('Concept not found', { status: 404 })
  return Response.redirect(
    new URL(`/room/${segment === 'home' ? 'dashboard' : segment}`, source),
    307,
  )
}
