'use client'

import { useEffect, useState } from 'react'
import { PageLayout, Container, Card, Button, Badge } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { Image as ImageIcon, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface GeneratedImage {
  id: string
  image_url: string
  prompt: string
  revised_prompt?: string
  size?: string
  quality?: string
  style_used?: string
  generated_at: string
}

export default function GeneratedGalleryPage() {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'generated' | 'uploaded'>('generated')

  useEffect(() => {
    loadImages()
  }, [tab])

  const loadImages = async () => {
    try {
      const endpoint = tab === 'generated' ? '/api/gallery/generated' : '/api/gallery/uploaded'
      const res = await fetch(endpoint, { credentials: 'include' })
      const data = await res.json()
      setImages(data.images || [])
    } catch (e) {
      console.error('Failed to load gallery', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <Container size="xl" className="py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/vision-board" className="text-neutral-400 hover:text-white flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Vision Board
            </Link>
          </div>
          <div>
            <Badge variant="info">VIVA Gallery</Badge>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">My Vision Board Library</h1>
        <div className="mb-6 flex items-center gap-2">
          <Button variant={tab === 'generated' ? 'primary' : 'secondary'} onClick={() => setTab('generated')}>Generated</Button>
          <Button variant={tab === 'uploaded' ? 'primary' : 'secondary'} onClick={() => setTab('uploaded')}>Uploaded</Button>
        </div>

        {loading ? (
          <p className="text-neutral-400">Loading...</p>
        ) : images.length === 0 ? (
          <Card className="p-8 text-center">
            <ImageIcon className="w-8 h-8 mx-auto mb-3 text-neutral-500" />
            <p className="text-neutral-300">No {tab} images yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <Card key={img.id} className="p-3">
                <img src={img.image_url} alt="Generated" className="w-full rounded-xl mb-3" />
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>{img.style_used || '—'}</span>
                  <span>{new Date(img.generated_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/vision-board/new?from=gallery&id=${img.id}`}>
                    <Button variant="primary">Use</Button>
                  </Link>
                  <a href={img.image_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary">Open</Button>
                  </a>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/gallery/generated?id=${img.id}`, { method: 'DELETE', credentials: 'include' })
                        if (!res.ok) throw new Error('Failed to delete')
                        setImages(prev => prev.filter(i => i.id !== img.id))
                      } catch (e) {
                        console.error('Delete failed', e)
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </PageLayout>
  )
}


