'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Spinner } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/vibe-tribe/PostCard'
import type { VibePost } from '@/lib/vibe-tribe/types'

export default function VibeTribePostPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const commentId = searchParams.get('comment')
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<VibePost | null>(null)
  const [missing, setMissing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      if (cancelled) return
      setUserId(user.id)

      const { data: account } = await supabase
        .from('user_accounts')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!cancelled) {
        setIsAdmin(account?.role === 'admin' || account?.role === 'super_admin')
      }

      const response = await fetch(`/api/vibe-tribe/posts/${params.id}`)
      if (cancelled) return
      if (!response.ok) {
        setMissing(true)
        setLoading(false)
        return
      }
      const data = await response.json()
      setPost(data.post)
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-black">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-black">
      <div className="max-w-[772px] mx-auto px-4 pt-16 md:pt-6 pb-16">
        <Link
          href="/vibe-tribe"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Vibe Tribe
        </Link>

        {missing || !post || !userId ? (
          <p className="text-neutral-300">This post is no longer available.</p>
        ) : (
          <PostCard
            post={post}
            currentUserId={userId}
            isAdmin={isAdmin}
            mentionedUsers={post.mentioned_users || []}
            initialCommentsOpen
            highlightCommentId={commentId}
          />
        )}
      </div>
    </div>
  )
}
