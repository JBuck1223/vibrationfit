'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Wand2, Sparkles, ArrowRight } from 'lucide-react'

import { 
  PageLayout, 
  Container, 
  Card, 
  Button,
  Badge,
  Spinner,
  Textarea
} from '@/lib/design-system/components'

export default function RefineVisionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [visionId, setVisionId] = useState<string | null>(null)
  const [refinementNotes, setRefinementNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get active intensive
      const { data: intensiveData } = await supabase
        .from('intensive_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_status', 'pending')
        .single()

      if (intensiveData) {
        setIntensiveId(intensiveData.id)
      }

      // Get latest vision
      const { data: visionData } = await supabase
        .from('life_visions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (visionData) {
        setVisionId(visionData.id)
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefine = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Mark as refined in checklist
      const { error } = await supabase
        .from('intensive_checklist')
        .update({
          vision_refined: true,
          vision_refined_at: new Date().toISOString()
        })
        .eq('intensive_id', intensiveId)

      if (error) throw error

      router.push('/intensive/dashboard')
    } catch (error) {
      console.error('Error refining vision:', error)
      alert('Failed to save refinement. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Container size="lg" className="py-16">
        
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/intensive/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Badge variant="premium" className="mb-4">
            <Wand2 className="w-4 h-4 inline mr-2" />
            Step 5 of 10
          </Badge>
          
          <h1 className="text-4xl font-bold mb-4">
            Refine Your Vision with VIVA
          </h1>
          <p className="text-xl text-neutral-400">
            Enhance your vision with specific details and deeper clarity
          </p>
        </div>

        <Card>
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-secondary-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Vision Refinement Session</h2>
            <p className="text-neutral-400 mb-8 max-w-2xl mx-auto">
              This feature will allow you to have an interactive session with VIVA to deepen and clarify your vision. 
              VIVA will ask targeted questions about each area of your life vision to add richness and specificity.
            </p>
            
            <div className="max-w-xl mx-auto mb-8">
              <Textarea
                placeholder="For now, add any refinement notes or additional thoughts about your vision..."
                value={refinementNotes}
                onChange={(e) => setRefinementNotes(e.target.value)}
                rows={6}
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleRefine}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Continue to Next Step'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>

      </Container>
    </PageLayout>
  )
}

