import { redirect } from 'next/navigation'

// Skill progress lives on the Profile surface (experience ledger);
// subject coverage lives on the Learning Map's coverage radar.
export default function ProgressRedirect() {
  redirect('/homeschool/life-explorer/profile')
}
