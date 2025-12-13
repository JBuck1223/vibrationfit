import { Container, Spinner } from '@/lib/design-system/components'

export default function DashboardLoading() {
  return (
    <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Spinner size="lg" />
    </Container>
  )
}
