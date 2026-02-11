import { redirect } from 'next/navigation'

// Signup is only available through the homepage intensive purchase.
// Direct signup is not allowed.
export default function SignupPage() {
  redirect('/')
}
