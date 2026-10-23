import { redirect } from 'next/navigation'

// Listen and Audio were the same library; Listen now opens Audio.
export default function ListenPage() {
  redirect('/audio')
}
