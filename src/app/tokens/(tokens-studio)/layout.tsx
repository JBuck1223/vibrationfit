import { TokensLayoutClient } from '@/components/dashboard-tokens/TokensLayoutClient'

export default function TokensStudioLayout({ children }: { children: React.ReactNode }) {
  return <TokensLayoutClient>{children}</TokensLayoutClient>
}
