// VibrationFit Design System Experiment Page
// Path: /src/app/design-system-experiment/page.tsx

'use client'

import React, { useState } from 'react'
import { 
  Sparkles, PartyPopper, Plane, Home, Users, Heart, 
  Activity, DollarSign, Briefcase, UserPlus, Package, 
  Gift, Zap, CheckCircle, Menu, X 
} from 'lucide-react'
import {
  Stack,
  Inline,
  Grid,
  Switcher,
  Cover,
  Container,
  Card,
  Button,
  Icon,
  Select,
  Badge,
  Input,
  Textarea,
  PageLayout,
} from '../../lib/design-system/test/components'

// Vision Categories
const VISION_CATEGORIES = [
  { key: 'forward', label: 'Forward', icon: Sparkles },
  { key: 'fun', label: 'Fun / Recreation', icon: PartyPopper },
  { key: 'travel', label: 'Travel / Adventure', icon: Plane },
  { key: 'home', label: 'Home / Environment', icon: Home },
  { key: 'family', label: 'Family / Parenting', icon: Users },
  { key: 'romance', label: 'Love / Romance', icon: Heart },
  { key: 'health', label: 'Health / Vitality', icon: Activity },
  { key: 'money', label: 'Money / Wealth', icon: DollarSign },
  { key: 'business', label: 'Business / Career', icon: Briefcase },
  { key: 'social', label: 'Social / Friends', icon: UserPlus },
  { key: 'possessions', label: 'Possessions / Stuff', icon: Package },
  { key: 'giving', label: 'Giving / Legacy', icon: Gift },
  { key: 'spirituality', label: 'Spirituality', icon: Zap },
  { key: 'conclusion', label: 'Conclusion', icon: CheckCircle },
]

// Composite Patterns
const IconTitleButton = ({ icon, title, buttonText, buttonVariant = 'primary', onButtonClick }: any) => (
  <Stack align="center" gap="md" className="text-center">
    <Icon icon={icon} size="xl" color="#39FF14" />
    <h3 className="text-xl md:text-2xl font-bold text-white">{title}</h3>
    <Button variant={buttonVariant} onClick={onButtonClick}>{buttonText}</Button>
  </Stack>
)

const CategoryCard = ({ category, selected = false, onClick }: any) => {
  const IconComponent = category.icon
  return (
    <Card 
      variant={selected ? 'elevated' : 'default'} 
      hover 
      className={`cursor-pointer ${selected ? 'ring-2 ring-[#39FF14] border-[#39FF14]' : ''}`}
      onClick={onClick}
    >
      <Stack align="center" gap="sm" className="text-center">
        <Icon icon={IconComponent} size="lg" color={selected ? '#39FF14' : '#00FFFF'} />
        <h4 className="text-base md:text-lg font-semibold text-white">{category.label}</h4>
        {selected && <Badge variant="primary">Selected</Badge>}
      </Stack>
    </Card>
  )
}

const StatCard = ({ icon, label, value, trend, variant = 'primary' }: any) => {
  const colorMap: any = { primary: '#39FF14', secondary: '#00FFFF', accent: '#BF00FF' }
  return (
    <Card variant="glass">
      <Stack gap="sm">
        <Inline justify="between" align="center">
          <Icon icon={icon} size="md" color={colorMap[variant]} />
          {trend && <Badge variant={trend > 0 ? 'primary' : 'error'}>{trend > 0 ? '+' : ''}{trend}%</Badge>}
        </Inline>
        <div>
          <p className="text-xs md:text-sm text-[#9CA3AF]">{label}</p>
          <p className="text-2xl md:text-3xl font-bold text-white mt-1">{value}</p>
        </div>
      </Stack>
    </Card>
  )
}

// Main Component
export default function DesignSystemExperiment() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <PageLayout>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#1F1F1F] border-b-2 border-[#333]">
        <Container>
          <Inline justify="between" align="center" className="py-4">
            <h1 className="text-xl md:text-2xl font-bold text-[#39FF14]">VibrationFit Component System</h1>
            <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </Inline>
        </Container>
      </div>

      <Container className="py-12">
        <Stack gap="xl">
          
          {/* Hero */}
          <section>
            <Cover minHeight="300px" className="bg-gradient-to-br from-[#39FF14]/20 via-[#00FFFF]/10 to-[#BF00FF]/20 rounded-3xl border-2 border-[#333]">
              <Stack align="center" gap="md" className="text-center max-w-3xl">
                <h2 className="text-3xl md:text-5xl font-bold text-white">Mobile-First Component System</h2>
                <p className="text-lg md:text-xl text-[#cbd5e1]">7 layout primitives + behavioral components that work predictably across all screen sizes</p>
                <Inline gap="sm" className="mt-4">
                  <Button variant="primary" size="lg">Get Started</Button>
                  <Button variant="outline" size="lg">View Docs</Button>
                </Inline>
              </Stack>
            </Cover>
          </section>

          {/* Layout Primitives */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Layout Primitives</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">The 7 core containers that solve 95% of layout needs</p>
              </div>
              <Grid minWidth="200px" gap="md">
                {[
                  { name: 'Stack', desc: 'Vertical rhythm with consistent gaps', color: '#39FF14' },
                  { name: 'Inline', desc: 'Horizontal row that wraps gracefully', color: '#00FFFF' },
                  { name: 'Grid', desc: 'Auto-wrapping responsive grid', color: '#BF00FF' },
                  { name: 'Switcher', desc: 'Toggles row/column at breakpoint', color: '#39FF14' },
                  { name: 'Cover', desc: 'Centered hero with min-height', color: '#00FFFF' },
                  { name: 'Frame', desc: 'Aspect ratio media wrapper', color: '#BF00FF' },
                  { name: 'Container', desc: 'Page width with responsive gutters', color: '#39FF14' },
                ].map(({ name, desc, color }) => (
                  <Card key={name} hover>
                    <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color }}>{name}</h3>
                    <p className="text-xs md:text-sm text-[#9CA3AF]">{desc}</p>
                  </Card>
                ))}
              </Grid>
            </Stack>
          </section>

          {/* Pattern 1 */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Pattern 1: Icon + Title + Button</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Centered, stacked layout - responsive by default</p>
              </div>
              <Card variant="glass">
                <IconTitleButton icon={Zap} title="Start Your Journey" buttonText="Get Started" onButtonClick={() => alert('Clicked!')} />
              </Card>
            </Stack>
          </section>

          {/* Pattern 2 */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Pattern 2: Three Column Layout</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Grid that automatically stacks on mobile</p>
              </div>
              <Grid minWidth="280px" gap="md">
                <Card variant="glass"><IconTitleButton icon={Activity} title="Health & Vitality" buttonText="Start Tracking" buttonVariant="primary" /></Card>
                <Card variant="glass"><IconTitleButton icon={Heart} title="Love & Romance" buttonText="Create Vision" buttonVariant="secondary" /></Card>
                <Card variant="glass"><IconTitleButton icon={Briefcase} title="Career Success" buttonText="Plan Goals" buttonVariant="accent" /></Card>
              </Grid>
            </Stack>
          </section>

          {/* Pattern 3 */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Pattern 3: Category Selector</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Dropdown pulling from 14 life categories</p>
              </div>
              <Card variant="glass">
                <Stack gap="md">
                  <Select
                    label="Select a Life Category"
                    placeholder="Choose a category..."
                    value={selectedCategory}
                    onChange={(e: any) => setSelectedCategory(e.target.value)}
                    options={VISION_CATEGORIES.map(cat => ({ value: cat.key, label: cat.label }))}
                  />
                  {selectedCategory && (
                    <Card variant="elevated">
                      <Stack align="center" gap="sm">
                        <Icon icon={VISION_CATEGORIES.find(c => c.key === selectedCategory)?.icon || Sparkles} size="xl" color="#39FF14" />
                        <h3 className="text-xl font-bold text-white">{VISION_CATEGORIES.find(c => c.key === selectedCategory)?.label}</h3>
                        <Button variant="primary" size="sm">Create Vision for This Category</Button>
                      </Stack>
                    </Card>
                  )}
                </Stack>
              </Card>
            </Stack>
          </section>

          {/* Buttons */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Button System</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Pill-shaped buttons with smooth hover effects</p>
              </div>
              <Grid minWidth="280px" gap="md">
                <Card>
                  <Stack gap="sm">
                    <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">Variants</h3>
                    <Button variant="primary" fullWidth>Primary</Button>
                    <Button variant="secondary" fullWidth>Secondary</Button>
                    <Button variant="accent" fullWidth>Accent</Button>
                    <Button variant="ghost" fullWidth>Ghost</Button>
                    <Button variant="outline" fullWidth>Outline</Button>
                    <Button variant="danger" fullWidth>Danger</Button>
                  </Stack>
                </Card>
                <Card>
                  <Stack gap="sm">
                    <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">Sizes</h3>
                    <Button variant="primary" size="sm" fullWidth>Small</Button>
                    <Button variant="primary" size="md" fullWidth>Medium</Button>
                    <Button variant="primary" size="lg" fullWidth>Large</Button>
                    <Button variant="primary" size="xl" fullWidth>Extra Large</Button>
                  </Stack>
                </Card>
              </Grid>
            </Stack>
          </section>

          {/* Categories Grid */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">All Life Categories</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Responsive grid - click to select</p>
              </div>
              <Grid minWidth="180px" gap="md">
                {VISION_CATEGORIES.map((category) => (
                  <CategoryCard key={category.key} category={category} selected={selectedCategory === category.key} onClick={() => setSelectedCategory(category.key)} />
                ))}
              </Grid>
            </Stack>
          </section>

          {/* Stats */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Dashboard Stats Pattern</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Responsive stat cards with icons and trends</p>
              </div>
              <Grid minWidth="200px" gap="md">
                <StatCard icon={Activity} label="Workouts This Week" value="12" trend={15} variant="primary" />
                <StatCard icon={Zap} label="Current Streak" value="7 days" trend={20} variant="secondary" />
                <StatCard icon={CheckCircle} label="Goals Achieved" value="24" trend={8} variant="accent" />
                <StatCard icon={Heart} label="Alignment Score" value="87%" trend={-3} variant="primary" />
              </Grid>
            </Stack>
          </section>

          {/* Forms */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Form Components</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Inputs and textareas with proper focus states</p>
              </div>
              <Grid minWidth="300px" gap="md">
                <Card>
                  <Stack gap="sm">
                    <Input label="Email Address" placeholder="your@email.com" helperText="We'll never share your email" />
                    <Input label="Password" type="password" placeholder="Enter password" />
                    <Input label="With Error" error="This field is required" placeholder="Enter value" />
                  </Stack>
                </Card>
                <Card>
                  <Textarea label="Your Vision" placeholder="Describe your vision..." rows={6} helperText="Be as detailed as you like" />
                </Card>
              </Grid>
            </Stack>
          </section>

          {/* Responsive Demo */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Responsive Behavior: Switcher</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Automatically switches from row to column on mobile</p>
              </div>
              <Card variant="glass">
                <Switcher gap="lg">
                  <Card variant="elevated" className="flex-1">
                    <Stack align="center" gap="sm">
                      <Icon icon={Sparkles} size="lg" color="#39FF14" />
                      <h4 className="font-semibold text-white text-center">Desktop: Side by Side</h4>
                      <p className="text-xs md:text-sm text-[#9CA3AF] text-center">These cards appear in a row on desktop</p>
                    </Stack>
                  </Card>
                  <Card variant="elevated" className="flex-1">
                    <Stack align="center" gap="sm">
                      <Icon icon={Activity} size="lg" color="#00FFFF" />
                      <h4 className="font-semibold text-white text-center">Mobile: Stacked</h4>
                      <p className="text-xs md:text-sm text-[#9CA3AF] text-center">But stack vertically on mobile devices</p>
                    </Stack>
                  </Card>
                  <Card variant="elevated" className="flex-1">
                    <Stack align="center" gap="sm">
                      <Icon icon={Zap} size="lg" color="#BF00FF" />
                      <h4 className="font-semibold text-white text-center">Automatic</h4>
                      <p className="text-xs md:text-sm text-[#9CA3AF] text-center">No manual breakpoint management needed</p>
                    </Stack>
                  </Card>
                </Switcher>
              </Card>
            </Stack>
          </section>

          {/* Instructions */}
          <section>
            <Card variant="glass" className="border-2 border-[#39FF14]/30">
              <Stack gap="md">
                <h2 className="text-xl md:text-2xl font-bold text-[#39FF14]">How to Use This System</h2>
                <div className="text-[#cbd5e1] space-y-4 text-sm md:text-base">
                  <p><strong className="text-white">1. Choose a Layout Primitive:</strong> Stack, Inline, Grid, Switcher, Cover, Frame, or Container</p>
                  <p><strong className="text-white">2. Compose with Components:</strong> Use Button, Card, Icon, Select, Badge inside your layouts</p>
                  <p><strong className="text-white">3. Use Composite Patterns:</strong> IconTitleButton, CategoryCard, StatCard for common use cases</p>
                  <p><strong className="text-white">4. Everything is Mobile-First:</strong> All components automatically adapt to screen size</p>
                  <p className="text-[#39FF14] font-semibold">⚡ Rebuild your entire site using ONLY these primitives and components for 100% predictable, mobile-friendly behavior.</p>
                </div>
              </Stack>
            </Card>
          </section>

        </Stack>
      </Container>
    </PageLayout>
  )
}
