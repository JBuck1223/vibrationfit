'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  FileText, 
  Sparkles, 
  ChevronLeft,
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { 
  Container, 
  Stack, 
  Card, 
  Button, 
  Spinner, 
  PageHero,
  Text
} from '@/lib/design-system/components'
import { StoriesList } from '@/lib/stories'

interface VisionBoardItem {
  id: string
  name: string
  description: string | null
  image_url: string | null
  categories: string[] | null
}

export default function VisionBoardStoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [itemId, setItemId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<VisionBoardItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const p = await params
      setItemId(p.id)
    })()
  }, [params])

  useEffect(() => {
    if (!itemId) return
    loadItem()
  }, [itemId])

  async function loadItem() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: itemData, error: itemError } = await supabase
      .from('vision_board_items')
      .select('id, name, description, image_url, categories')
      .eq('id', itemId)
      .eq('user_id', user.id)
      .single()

    if (itemError) {
      setError('Vision board item not found')
      setLoading(false)
      return
    }

    setItem(itemData)
    setLoading(false)
  }

  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (error || !item) {
    return (
      <Container size="xl">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <Text className="text-red-400 mb-4">{error || 'Item not found'}</Text>
          <Button asChild variant="outline">
            <Link href="/vision-board">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Vision Board
            </Link>
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero */}
        <PageHero
          eyebrow="VISION BOARD"
          title={`Stories for "${item.name}"`}
          subtitle="Create immersive narratives to bring your vision to life through story and audio."
        >
          <div className="flex justify-center">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/vision-board/${itemId}`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Item
              </Link>
            </Button>
          </div>
        </PageHero>

        {/* Item Preview */}
        {item.image_url && (
          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Text className="text-white font-medium truncate">{item.name}</Text>
                {item.description && (
                  <Text size="sm" className="text-neutral-400 line-clamp-2">{item.description}</Text>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Stories List */}
        <Card className="p-4 md:p-6 lg:p-8">
          <StoriesList
            entityType="vision_board_item"
            entityId={itemId}
            createUrl={`/vision-board/${itemId}/stories/new`}
            storyUrlPrefix={`/vision-board/${itemId}/stories`}
            showCreateButton={true}
            showDeleteButton={true}
            emptyStateMessage="No stories yet. Create your first story to bring this vision to life."
          />
        </Card>

        {/* Quick Actions */}
        <Card className="p-4 md:p-6 lg:p-8">
          <h3 className="text-lg font-semibold text-white mb-4">Create a Story</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href={`/vision-board/${itemId}/stories/new?mode=viva`}>
              <Card variant="elevated" hover className="p-4 cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">VIVA Story</h4>
                    <Text size="sm" className="text-neutral-400">
                      Let VIVA create an immersive story about achieving this vision.
                    </Text>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-500" />
                </div>
              </Card>
            </Link>

            <Link href={`/vision-board/${itemId}/stories/new?mode=write`}>
              <Card variant="elevated" hover className="p-4 cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">Write Your Own</h4>
                    <Text size="sm" className="text-neutral-400">
                      Record, dictate, or write your story. Use VIVA to enhance your words.
                    </Text>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-500" />
                </div>
              </Card>
            </Link>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
