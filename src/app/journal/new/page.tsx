'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageLayout, Container, Card, Input, Button, Textarea } from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { uploadMultipleUserFiles } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'

const LIFE_CATEGORIES = [
  'Fun / Recreation',
  'Variety / Travel / Adventure',
  'Home / Environment',
  'Family / Parenting',
  'Love / Romance / Partner',
  'Health / Body / Vitality',
  'Money / Wealth / Investments',
  'Business / Career / Work',
  'Social / Friends',
  'Giving / Contribution / Legacy',
  'Things / Belongings / Stuff',
  'Expansion / Spirituality',
  'Other'
]

const ENTRY_TYPES = [
  { value: 'evidence', label: 'Connecting the Dots (evidence)' },
  { value: 'contrast', label: 'Contrast (I know what I don\'t want)' },
  { value: 'clarity', label: 'Clarity (I know what I want)' },
  { value: 'other', label: 'Other' }
]

export default function NewJournalEntryPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    entryType: '',
    categories: [] as string[]
  })

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to create a journal entry')
        return
      }

      // Upload files if any
      let imageUrls: string[] = []
      if (files.length > 0) {
        const uploadResults = await uploadMultipleUserFiles('journal', files, user.id)
        imageUrls = uploadResults.map((result: { url: string; key: string; error?: string }) => result.url)
        
        // Check for upload errors
        const errors = uploadResults.filter((result: { url: string; key: string; error?: string }) => result.error)
        if (errors.length > 0) {
          alert(`Some uploads failed: ${errors.map((e: { error?: string }) => e.error).join(', ')}`)
          return
        }
      }

      // Create journal entry
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          date: formData.date,
          title: formData.title,
          content: formData.content,
          entry_type: formData.entryType,
          categories: formData.categories,
          image_urls: imageUrls
        })

      if (error) throw error

      // Update user stats
      await supabase.rpc('increment_journal_stats', { p_user_id: user.id })

      router.push('/journal')
    } catch (error) {
      console.error('Error creating journal entry:', error)
      alert('Failed to create journal entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <Container size="md" className="py-8">
        <div className="py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              New Journal Entry
            </h1>
            <p className="text-neutral-400">
              Capture your thoughts, evidence, and insights
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />

              {/* Title */}
              <Input
                label="Entry Title"
                type="text"
                placeholder="If this were an email, what would the subject line be?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              {/* Life Categories */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-3">
                  Life Category (Select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {LIFE_CATEGORIES.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 p-3 bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="w-4 h-4 text-primary-500 bg-neutral-700 border-neutral-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-200">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Entry Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-3">
                  Entry Type
                </label>
                <div className="space-y-2">
                  {ENTRY_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors"
                    >
                      <input
                        type="radio"
                        name="entryType"
                        value={type.value}
                        checked={formData.entryType === type.value}
                        onChange={(e) => setFormData({ ...formData, entryType: e.target.value })}
                        className="w-4 h-4 text-primary-500 bg-neutral-700 border-neutral-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-200">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-3">
                  Upload Evidence (Photos, Videos, Audio)
                </label>
                <FileUpload
                  accept="image/*,video/*,audio/*"
                  multiple
                  maxFiles={5}
                  maxSize={500}
                  onUpload={setFiles}
                  label="Choose Files"
                />
              </div>

              {/* Journal Content */}
              <Textarea
                label="Journal Entry"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={10}
                placeholder="Write your journal entry here..."
              />

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Entry'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </Container>
    </PageLayout>
  )
}