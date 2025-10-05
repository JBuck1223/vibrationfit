import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageLayout, Container, Card, Button, Badge } from '@/lib/design-system'
import Link from 'next/link'
import { Plus, Calendar, CheckCircle, Circle, XCircle, Filter, Grid3X3, Trash2 } from 'lucide-react'
import { VisionBoardDeleteButton } from '@/components/VisionBoardDeleteButton'

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
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'primary' },
  { value: 'actualized', label: 'Actualized', color: 'warning' },
  { value: 'inactive', label: 'Inactive', color: 'neutral' },
]

export default async function VisionBoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: items } = await supabase
    .from('vision_board_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const totalItems = items?.length || 0
  const actualizedItems = items?.filter(item => item.status === 'actualized').length || 0
  const activeItems = items?.filter(item => item.status === 'active').length || 0

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUS_OPTIONS.find(s => s.value === status)
    if (!statusConfig) return null

    return (
      <Badge 
        variant={statusConfig.color as any}
        className="flex items-center gap-1"
      >
        {status === 'actualized' && <CheckCircle className="w-3 h-3" />}
        {status === 'active' && <Circle className="w-3 h-3" />}
        {status === 'inactive' && <XCircle className="w-3 h-3" />}
        {statusConfig.label}
      </Badge>
    )
  }

  return (
    <PageLayout>
      <Container size="xl" className="py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">🎯 Vision Board</h1>
              <p className="text-secondary-500">Visualize and track your conscious creations</p>
            </div>
            <Button asChild>
              <Link href="/vision-board/new">
                <Plus className="w-5 h-5 mr-2" />
                Add Creation
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <h3 className="text-neutral-400 text-sm mb-2">Total Creations</h3>
              <p className="text-3xl font-bold text-primary-500">{totalItems}</p>
            </Card>
            
            <Card>
              <h3 className="text-neutral-400 text-sm mb-2">Active</h3>
              <p className="text-3xl font-bold text-primary-500">{activeItems}</p>
            </Card>
            
            <Card>
              <h3 className="text-neutral-400 text-sm mb-2">Actualized</h3>
              <p className="text-3xl font-bold text-warning-500">{actualizedItems}</p>
            </Card>
            
            <Card>
              <h3 className="text-neutral-400 text-sm mb-2">Success Rate</h3>
              <p className="text-3xl font-bold text-secondary-500">
                {totalItems > 0 ? Math.round((actualizedItems / totalItems) * 100) : 0}%
              </p>
            </Card>
          </div>
        </div>

        {/* Vision Board Grid */}
        {items && items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <Card 
                key={item.id} 
                className={`hover:border-primary-500 transition-all duration-200 hover:scale-105 ${
                  item.status === 'actualized' ? 'ring-2 ring-warning-500/30' : ''
                }`}
              >
                <div className="space-y-4">
                  {/* Image */}
                  <div className="relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-neutral-800 rounded-lg flex items-center justify-center">
                        <Grid3X3 className="w-12 h-12 text-neutral-600" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(item.status)}
                    </div>

                    {/* Actualized Indicator */}
                    {item.status === 'actualized' && (
                      <div className="absolute top-2 left-2">
                        <div className="bg-warning-500 text-black p-1 rounded-full">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-neutral-300 text-sm line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Categories */}
                    {item.categories && item.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.categories.slice(0, 2).map((category: string, index: number) => (
                          <span
                            key={index}
                            className="text-xs bg-primary-500/20 text-primary-500 px-2 py-1 rounded"
                          >
                            {category.split(' / ')[0]}
                          </span>
                        ))}
                        {item.categories.length > 2 && (
                          <span className="text-xs text-neutral-400">
                            +{item.categories.length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center text-neutral-400 text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(item.created_at).toLocaleDateString()}
                      {item.actualized_at && (
                        <span className="ml-2 text-warning-500">
                          Actualized {new Date(item.actualized_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/vision-board/${item.id}`}>
                        {item.status === 'actualized' ? 'View' : 'Edit'}
                      </Link>
                    </Button>
                    <VisionBoardDeleteButton
                      itemId={item.id}
                      itemName={item.name}
                      imageUrl={item.image_url}
                      status={item.status}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-white mb-4">No creations yet</h3>
              <p className="text-neutral-400 mb-8">
                Start building your vision board by adding your first creation. 
                Visualize what you want to manifest in your life.
              </p>
              <Button asChild size="lg">
                <Link href="/vision-board/new">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Creation
                </Link>
              </Button>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link 
            href="/dashboard" 
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </Container>
    </PageLayout>
  )
}
