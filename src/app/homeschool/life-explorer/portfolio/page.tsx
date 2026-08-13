import { redirect } from 'next/navigation'

// The portfolio's visual form is the Journey Feed on the Profile surface;
// evaluator-ready packets export from the Learning Map's Reports tab.
export default function PortfolioRedirect() {
  redirect('/homeschool/life-explorer/profile')
}
