'use client'

import { useEffect, useState } from 'react'
import {  Container, Card, Button, Badge, Stack, Icon } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { Image as ImageIcon, ArrowLeft, Trash2, Plus } from 'lucide-react'
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
    <>
      <Container size="xl" className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/vision-board" className="text-neutral-400 hover:text-white flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> 
              Back to Vision Board
            </Link>
            <Badge variant="info">VIVA Gallery</Badge>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Vision Board Library</h1>
            <p className="text-neutral-400">Browse and manage your generated and uploaded images</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-2 mb-8">
            <Button 
              variant={tab === 'generated' ? 'primary' : 'secondary'} 
              onClick={() => setTab('generated')}
              className="flex items-center gap-2"
            >
              <Icon icon={ImageIcon} size="sm" />
              Generated
            </Button>
            <Button 
              variant={tab === 'uploaded' ? 'primary' : 'secondary'} 
              onClick={() => setTab('uploaded')}
              className="flex items-center gap-2"
            >
              <Icon icon={ImageIcon} size="sm" />
              Uploaded
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <Card className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading your gallery...</p>
          </Card>
        ) : images.length === 0 ? (
          <Card className="p-8 text-center">
            <Icon icon={ImageIcon} size="xl" color="#666" className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No {tab} images yet</h3>
            <p className="text-neutral-400 mb-6">Start creating your vision board by generating or uploading images.</p>
            <Button asChild>
              <Link href="/vision-board/new">
                <Icon icon={Plus} size="sm" />
                Create New Item
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {images.map((img) => (
              <Card key={img.id} hover className="overflow-hidden">
                <Stack gap="xs">
                  {/* Image - Mobile-first responsive */}
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-800">
                    <img 
                      src={img.image_url} 
                      alt={img.prompt || 'Generated image'} 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                    />
                  </div>

                  {/* Image Info - Mobile optimized */}
                  <div className="px-2">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {img.style_used || 'Default'}
                      </Badge>
                      <span className="text-xs text-neutral-400 flex-shrink-0">
                        {new Date(img.generated_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Prompt Preview - Mobile text */}
                    {img.prompt && (
                      <p className="text-xs text-neutral-300 line-clamp-2 mb-2">
                        {img.prompt}
                      </p>
                    )}
                  </div>

                  {/* Actions - Mobile-first buttons */}
                  <div className="px-2 pb-2">
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1 text-xs">
                        <Link href={`/vision-board/new?from=gallery&id=${img.id}`}>
                          <Icon icon={Plus} size="sm" />
                          <span className="hidden sm:inline">Use</span>
                          <span className="sm:hidden">Use</span>
                        </Link>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={async () => {
                          if (!confirm('Are you sure you want to delete this image?')) return
                          try {
                            const res = await fetch(`/api/gallery/generated?id=${img.id}`, { 
                              method: 'DELETE', 
                              credentials: 'include' 
                            })
                            if (!res.ok) throw new Error('Failed to delete')
                            setImages(prev => prev.filter(i => i.id !== img.id))
                          } catch (e) {
                            console.error('Delete failed', e)
                          }
                        }}
                        className="px-2 sm:px-3"
                      >
                        <Icon icon={Trash2} size="sm" />
                        <span className="hidden sm:inline ml-1">Delete</span>
                      </Button>
                    </div>
                  </div>
                </Stack>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </>
  )
}


