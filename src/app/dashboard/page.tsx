import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: visions } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const visionCount = visions?.length || 0
  const completedVisions = visions?.filter(v => v.status === 'complete').length || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back! ⚡</h1>
          <p className="text-emerald-300">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 border border-emerald-600 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">Total Visions</h3>
            <p className="text-4xl font-bold text-emerald-500">{visionCount}</p>
          </div>
          
          <div className="bg-gray-800 border border-emerald-600 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">Completed</h3>
            <p className="text-4xl font-bold text-emerald-500">{completedVisions}</p>
          </div>
          
          <div className="bg-gray-800 border border-emerald-600 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">Current Streak</h3>
            <p className="text-4xl font-bold text-emerald-500">0 days</p>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/vision/new" className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-lg font-semibold text-center transition">
              ✨ Create New Vision
            </a>
            <a href="/vision" className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg font-semibold text-center transition">
              📋 View All Visions
            </a>
          </div>
        </div>

        <div className="mt-8">
          <form action="/auth/logout" method="post">
            <button type="submit" className="text-gray-400 hover:text-white transition">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}