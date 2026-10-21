import { DashboardAreaBar } from '@/components/dashboard/DashboardAreaBar'
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardAreaBar />
      <div className="px-4 py-6">{children}</div>
    </>
  )
}
