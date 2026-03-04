'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Container,
  Stack,
  Card,
  PageHero,
  Button,
  Input,
  Textarea,
  Select,
  DatePicker,
  Spinner,
  Modal,
  CategoryCard,
} from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import {
  ArrowLeft,
  DollarSign,
  Heart,
  Calendar,
  Edit3,
  Save,
  Trash2,
  HelpCircle,
  Upload,
  Sparkles,
} from 'lucide-react'
import { FileUpload } from '@/components/FileUpload'
import { AIImageGenerator } from '@/components/AIImageGenerator'
import { uploadUserFile, deleteUserFile } from '@/lib/storage/s3-storage-presigned'
import { colors } from '@/lib/design-system/tokens'

interface AbundanceEvent {
  id: string
  user_id: string
  date: string
  value_type: 'money' | 'value'
  amount: number | null
  vision_category: string | null
  entry_category: string | null
  note: string
  image_url: string | null
  created_at: string
}

const VALUE_TYPES = [
  { value: 'money', label: 'Money' },
  { value: 'value', label: 'Value (intangible)' },
]

const ENTRY_CATEGORY_OPTIONS = [
  { value: 'gift', label: 'Gift' },
  { value: 'discount', label: 'Discount' },
  { value: 'income', label: 'Income' },
  { value: 'found_money', label: 'Found Money' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'support', label: 'Support / Kindness' },
  { value: 'synchronicity', label: 'Synchronicity' },
]

const ENTRY_LABELS: Record<string, string> = {
  gift: 'Gift',
  discount: 'Discount',
  income: 'Income',
  found_money: 'Found Money',
  opportunity: 'Opportunity',
  support: 'Support / Kindness',
  synchronicity: 'Synchronicity',
}

const visionCategoriesForAbundance = VISION_CATEGORIES.filter(
  (cat) => cat.key !== 'forward' && cat.key !== 'conclusion'
).sort((a, b) => a.order - b.order)

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatAmountWithCommas(value: string): string {
  if (!value) return ''
  const stripped = value.replace(/,/g, '')
  const parts = stripped.split('.')
  const intPart = parts[0].replace(/\D/g, '') || '0'
  const decPart = parts[1]?.replace(/\D/g, '').slice(0, 2) ?? ''
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formatted = decPart ? `${withCommas}.${decPart}` : withCommas
  return stripped.endsWith('.') ? `${formatted}.` : formatted
}

function parseAmountInput(value: string): string {
  if (!value) return ''
  const stripped = value.replace(/,/g, '')
  const parts = stripped.split('.')
  const intPart = parts[0].replace(/\D/g, '') || '0'
  const decPart = parts[1]?.replace(/\D/g, '').slice(0, 2) ?? ''
  const hasTrailingDot = stripped.endsWith('.')
  if (decPart) return `${intPart}.${decPart}`
  if (hasTrailingDot) return `${intPart}.`
  return intPart
}

export default function AbundanceEventPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [item, setItem] = useState<AbundanceEvent | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const [formDate, setFormDate] = useState('')
  const [formValueType, setFormValueType] = useState<'money' | 'value'>('money')
  const [formAmount, setFormAmount] = useState('')
  const [formNote, setFormNote] = useState('')
  const [formVisionCategory, setFormVisionCategory] = useState('')
  const [formEntryCategory, setFormEntryCategory] = useState('')
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchItem()
  }, [params])

  const fetchItem = async () => {
    try {
      const resolvedParams = await params
      const { data, error } = await supabase
        .from('abundance_events')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (error) throw error

      setItem(data)
      populateForm(data)
    } catch (error) {
      console.error('Error fetching abundance event:', error)
      router.push('/abundance-tracker')
    } finally {
      setLoading(false)
    }
  }

  const populateForm = (data: AbundanceEvent) => {
    setFormDate(data.date)
    setFormValueType(data.value_type)
    setFormAmount(data.amount != null ? String(data.amount) : '')
    setFormNote(data.note)
    setFormVisionCategory(data.vision_category || '')
    setFormEntryCategory(data.entry_category || '')
    setImageSource(null)
    setFile(null)
    setAiGeneratedImageUrl(null)
  }

  const handleSave = async () => {
    if (!item) return
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let imageUrl = item.image_url

      if (file || aiGeneratedImageUrl) {
        if (item.image_url) {
          try {
            const url = new URL(item.image_url)
            const oldPath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
            await deleteUserFile(oldPath)
          } catch {
            // continue even if old file cleanup fails
          }
        }

        if (file) {
          const uploadResult = await uploadUserFile('abundance', file, user.id)
          imageUrl = uploadResult.url
        } else if (aiGeneratedImageUrl) {
          imageUrl = aiGeneratedImageUrl
        }
      }

      const resolvedParams = await params
      const { error } = await supabase
        .from('abundance_events')
        .update({
          date: formDate,
          value_type: formValueType,
          amount: formAmount ? Number(formAmount.replace(/,/g, '')) : null,
          note: formNote,
          vision_category: formVisionCategory || null,
          entry_category: formEntryCategory || null,
          image_url: imageUrl,
        })
        .eq('id', resolvedParams.id)

      if (error) throw error

      setIsEditing(false)
      fetchItem()
    } catch (error) {
      console.error('Error updating abundance event:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!item) return
    setDeleting(true)

    try {
      if (item.image_url) {
        try {
          const url = new URL(item.image_url)
          const imagePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
          await deleteUserFile(imagePath)
        } catch {
          // continue even if file cleanup fails
        }
      }

      const resolvedParams = await params
      const { error } = await supabase
        .from('abundance_events')
        .delete()
        .eq('id', resolvedParams.id)

      if (error) throw error

      router.push('/abundance-tracker')
    } catch (error) {
      console.error('Error deleting abundance event:', error)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const getVisionLabel = (key: string) => {
    const cat = VISION_CATEGORIES.find((c) => c.key === key)
    return cat?.label || key
  }

  const getVisionIcon = (key: string) => {
    const cat = VISION_CATEGORIES.find((c) => c.key === key)
    return cat?.icon || DollarSign
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (!item) {
    return (
      <Container size="xl">
        <Card className="text-center py-16">
          <h2 className="text-2xl font-bold text-white mb-4">Moment not found</h2>
          <p className="text-neutral-400 mb-6">This abundance moment doesn&apos;t exist or you don&apos;t have permission to view it.</p>
          <Button asChild>
            <Link href="/abundance-tracker">Back to Abundance Tracker</Link>
          </Button>
        </Card>
      </Container>
    )
  }

  const VisionIcon = item.vision_category ? getVisionIcon(item.vision_category) : null

  return (
    <Container size="xl">
      <Stack gap="lg">
        {!isEditing && (
          <PageHero
            title="Abundance Moment"
            subtitle={new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          >
            <Button variant="ghost" size="sm" onClick={() => router.push('/abundance-tracker')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </PageHero>
        )}

        {isEditing && (
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center">Edit Abundance Moment</h2>
        )}

        <Card className="p-4 md:p-6 lg:p-8">
          {isEditing ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <DatePicker
                  label="Date"
                  value={formDate}
                  maxDate={new Date().toISOString().split('T')[0]}
                  onChange={(dateString: string) => setFormDate(dateString)}
                  required
                />
                <Select
                  label="Track as:"
                  value={formValueType}
                  onChange={(value) => setFormValueType(value as 'money' | 'value')}
                  options={VALUE_TYPES}
                />
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-neutral-200">Amount</label>
                    <button
                      type="button"
                      onClick={() => setHelpOpen(true)}
                      className="text-neutral-400 hover:text-white transition-colors p-0.5 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                      aria-label="Help: Money vs Value"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder={formValueType === 'money' ? '0.00' : 'Optional amount'}
                    value={formatAmountWithCommas(formAmount)}
                    onChange={(event) => setFormAmount(parseAmountInput(event.target.value))}
                    required={formValueType === 'money'}
                    prefix="$"
                  />
                </div>
              </div>

              <Textarea
                label="Note"
                placeholder="Describe this abundance moment in present-tense appreciation."
                value={formNote}
                onChange={(event) => setFormNote(event.target.value)}
                rows={4}
                required
              />

              <Select
                label="Kind of abundance:"
                value={formEntryCategory}
                onChange={(value) => setFormEntryCategory(value)}
                options={ENTRY_CATEGORY_OPTIONS}
                placeholder="Abundance type (optional)"
              />

              <div>
                <p className="text-sm text-neutral-400 mb-3 text-center">
                  Select categories for your abundance entry (optional)
                </p>
                <div className="grid grid-cols-4 md:grid-cols-12 gap-3">
                  {visionCategoriesForAbundance.map((category) => {
                    const isSelected = formVisionCategory === category.key
                    return (
                      <CategoryCard
                        key={category.key}
                        category={category}
                        selected={isSelected}
                        onClick={() => setFormVisionCategory(isSelected ? '' : category.key)}
                        variant="outlined"
                        selectionStyle="border"
                        iconColor={isSelected ? '#39FF14' : '#FFFFFF'}
                        selectedIconColor="#39FF14"
                        className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' : '!bg-transparent !border-[#333]'}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Image section */}
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-3">Image (optional)</label>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <Button
                    type="button"
                    variant={imageSource === 'upload' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => { setImageSource('upload'); setAiGeneratedImageUrl(null) }}
                    className="w-full sm:flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setImageSource('ai'); setFile(null) }}
                    style={imageSource === 'ai'
                      ? { backgroundColor: colors.semantic.premium, borderColor: colors.semantic.premium }
                      : { borderColor: colors.semantic.premium, color: colors.semantic.premium }
                    }
                    className={`w-full sm:flex-1 inline-flex items-center justify-center rounded-full transition-all duration-300 py-3.5 px-7 text-sm font-medium border-2 ${
                      imageSource === 'ai' ? 'text-white hover:opacity-90' : 'bg-transparent hover:bg-[#BF00FF]/10'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with VIVA
                  </button>
                </div>

                {item.image_url && !file && !aiGeneratedImageUrl && (
                  <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 mb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <img src={item.image_url} alt="Current" className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0" />
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm font-medium text-white">Current Image</p>
                        <p className="text-xs text-neutral-400">Will be replaced when you upload/generate a new image</p>
                      </div>
                    </div>
                  </div>
                )}

                {imageSource === 'upload' && (
                  <FileUpload
                    dragDrop
                    accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                    multiple={false}
                    maxFiles={1}
                    maxSize={10}
                    value={file ? [file] : []}
                    onChange={(files) => setFile(files[0] || null)}
                    onUpload={(files) => setFile(files[0] || null)}
                    dragDropText="Click to upload or drag and drop"
                    dragDropSubtext="PNG, JPG, WEBP, or HEIC (max 10MB)"
                    previewSize="lg"
                  />
                )}

                {imageSource === 'ai' && (
                  <>
                    <AIImageGenerator
                      type="vision_board"
                      onImageGenerated={(url) => setAiGeneratedImageUrl(url)}
                      title=""
                      description={formNote}
                      visionText={formNote || 'An abundance moment to celebrate.'}
                    />
                    {aiGeneratedImageUrl && (
                      <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 mt-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <img src={aiGeneratedImageUrl} alt="VIVA generated" className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0" />
                          <div className="flex-1 text-center sm:text-left">
                            <p className="text-sm font-medium text-white">Generated with VIVA</p>
                            <p className="text-xs text-neutral-400"><span className="text-green-400">Auto-selected</span></p>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setAiGeneratedImageUrl(null)} className="w-full sm:w-auto">
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-row gap-2 sm:gap-3 sm:justify-end">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => { setIsEditing(false); if (item) populateForm(item) }}
                  className="flex-1 sm:flex-none sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={saving} disabled={saving} className="flex-1 sm:flex-none sm:w-auto">
                  {saving ? 'Saving...' : (<><Save className="w-4 h-4 mr-2" />Save Changes</>)}
                </Button>
              </div>

              <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Money vs Value (intangible)" size="md">
                <div className="space-y-4 text-sm text-neutral-300">
                  <p><strong className="text-white">Money</strong> entries require an amount.</p>
                  <p><strong className="text-white">Value (intangible)</strong> entries celebrate intangible abundance -- share the story in the note and add an amount if you want to track it numerically.</p>
                </div>
              </Modal>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Image */}
              {item.image_url && (
                <div className="relative">
                  <img
                    src={item.image_url}
                    alt="Abundance moment"
                    className="w-full h-auto max-h-96 object-cover rounded-lg"
                  />
                  <div className="absolute top-3 right-3">
                    <div className={`rounded-full px-4 py-2 flex items-center gap-2 shadow-lg ${
                      item.value_type === 'money' ? 'bg-[#39FF14]/90' : 'bg-[#BF00FF]/90'
                    }`}>
                      {item.value_type === 'money' ? (
                        <DollarSign className="w-4 h-4 text-black" />
                      ) : (
                        <Heart className="w-4 h-4 text-white" />
                      )}
                      <span className={`text-sm font-semibold ${item.value_type === 'money' ? 'text-black' : 'text-white'}`}>
                        {item.value_type === 'money' ? 'Money' : 'Value'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Type badge when no image */}
              {!item.image_url && (
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    item.value_type === 'money' ? 'bg-[#39FF14]/15' : 'bg-[#BF00FF]/15'
                  }`}>
                    {item.value_type === 'money' ? (
                      <DollarSign className="w-6 h-6 text-[#39FF14]" />
                    ) : (
                      <Heart className="w-6 h-6 text-[#BF00FF]" />
                    )}
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    item.value_type === 'money'
                      ? 'bg-[#39FF14]/15 text-[#39FF14]'
                      : 'bg-[#BF00FF]/15 text-[#BF00FF]'
                  }`}>
                    {item.value_type === 'money' ? 'Money' : 'Value (intangible)'}
                  </span>
                </div>
              )}

              {/* Amount */}
              {item.amount != null && Number(item.amount) > 0 && (
                <p className="text-4xl md:text-5xl font-bold text-[#39FF14]">
                  {formatCurrency(Number(item.amount))}
                </p>
              )}

              {/* Note */}
              <div>
                <p className="text-base md:text-lg text-neutral-200 whitespace-pre-wrap leading-relaxed">
                  {item.note}
                </p>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-neutral-500" />
                  <span className="text-white px-3 py-1 border-2 border-neutral-600 rounded-lg">
                    {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {item.entry_category && (
                  <span className="text-sm px-3 py-1 rounded-full bg-[#00FFFF]/15 text-[#00FFFF]">
                    {ENTRY_LABELS[item.entry_category] || item.entry_category}
                  </span>
                )}

                {item.vision_category && VisionIcon && (
                  <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-[#BF00FF]/15 text-[#BF00FF]">
                    <VisionIcon className="w-3.5 h-3.5" />
                    {getVisionLabel(item.vision_category)}
                  </span>
                )}
              </div>

              {/* Created timestamp */}
              <div className="text-xs text-neutral-500">
                Logged {new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>

              {/* Actions */}
              <div className="flex flex-row items-center gap-2 sm:gap-3 sm:justify-end">
                <Button variant="primary" size="sm" onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none sm:w-32">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)} className="flex-1 sm:flex-none sm:w-32">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Abundance Moment</h3>
                <p className="text-neutral-300 mb-6">
                  Are you sure you want to delete this moment? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDelete}
                    loading={deleting}
                    disabled={deleting}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Stack>
    </Container>
  )
}
