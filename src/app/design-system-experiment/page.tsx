// VibrationFit Design System Experiment Page
// Combined: Original focused patterns + Comprehensive component showcase

'use client'

import React, { useState, ChangeEvent } from 'react'
import { 
  Sparkles, PartyPopper, Plane, Home, Users, Heart, 
  Activity, DollarSign, Briefcase, UserPlus, Package, 
  Gift, Zap, CheckCircle, Menu, X, Eye, PenLine, CircleCheckBig, Trash2,
  Star, Target, Shield, Crown, Plus, Minus, Edit, MessageSquare,
  Layout, PanelTop, Square, Monitor, Smartphone, Grid as GridIcon,
  Palette, FileText, Tag, TrendingUp, RotateCcw, Mouse, CreditCard,
  AlignLeft, AlignCenter, AlignRight, Loader2, AlertCircle, Info
} from 'lucide-react'
import {
  Stack,
  Inline,
  Grid,
  TwoColumn,
  FourColumn,
  Switcher,
  Cover,
  Frame,
  Container,
  Card,
  Button,
  GradientButton,
  AIButton,
  Icon,
  Select,
  Badge,
  Input,
  Textarea,
  PageLayout,
  Spinner,
  ProgressBar,
} from '@/lib/design-system/components'

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
  const [inputValue, setInputValue] = useState('')
  const [textareaValue, setTextareaValue] = useState('')
  const [selectValue, setSelectValue] = useState('')
  const [progressValue, setProgressValue] = useState(75)
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadingToggle = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

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
                <p className="text-lg md:text-xl text-[#cbd5e1]">Complete design system with layout primitives, UI components, and feedback elements that work predictably across all screen sizes</p>
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
                <p className="text-[#9CA3AF] text-sm md:text-base">The 9 core containers that solve 95% of layout needs</p>
              </div>
              <Grid minWidth="200px" gap="md">
                {[
                  { name: 'Stack', desc: 'Vertical rhythm with consistent gaps', color: '#39FF14' },
                  { name: 'Inline', desc: 'Horizontal row that wraps gracefully', color: '#00FFFF' },
                  { name: 'Grid', desc: 'Auto-wrapping responsive grid', color: '#BF00FF' },
                  { name: 'TwoColumn', desc: 'Two columns that stack on mobile', color: '#39FF14' },
                  { name: 'FourColumn', desc: 'Four columns (2x2 mobile, 4x1 desktop)', color: '#00FFFF' },
                  { name: 'Switcher', desc: 'Toggles row/column at breakpoint', color: '#BF00FF' },
                  { name: 'Cover', desc: 'Centered hero with min-height', color: '#39FF14' },
                  { name: 'Frame', desc: 'Aspect ratio media wrapper', color: '#00FFFF' },
                  { name: 'Container', desc: 'Page width with responsive gutters', color: '#BF00FF' },
                ].map(({ name, desc, color }) => (
                  <Card key={name} hover>
                    <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color }}>{name}</h3>
                    <p className="text-xs md:text-sm text-[#9CA3AF]">{desc}</p>
                  </Card>
                ))}
              </Grid>
            </Stack>
          </section>

          {/* Layout Primitive Examples */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Layout Primitive Examples</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">See each primitive in action with live examples</p>
              </div>

              {/* Stack */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={Layout} size="md" color="#39FF14" />
                    Stack - Vertical Spacing
                  </h3>
                  <Stack gap="md" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                    <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Item 1</div>
                    <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg">Item 2</div>
                    <div className="p-4 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg">Item 3</div>
                  </Stack>
                </Stack>
              </Card>

              {/* Inline */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={AlignLeft} size="md" color="#00FFFF" />
                    Inline - Horizontal Spacing & Wrapping
                  </h3>
                  <Inline gap="md" wrap className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                    <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Item 1</div>
                    <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg">Item 2</div>
                    <div className="p-4 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg">Item 3</div>
                    <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Item 4</div>
                    <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg">Item 5</div>
                  </Inline>
                </Stack>
              </Card>

              {/* Grid */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={GridIcon} size="md" color="#39FF14" />
                    Grid - Responsive Grid
                  </h3>
                  <Grid cols={3} className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                    <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Item 1</div>
                    <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg">Item 2</div>
                    <div className="p-4 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg">Item 3</div>
                    <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Item 4</div>
                    <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg">Item 5</div>
                    <div className="p-4 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg">Item 6</div>
                  </Grid>
                </Stack>
              </Card>

              {/* TwoColumn */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={PanelTop} size="md" color="#00FFFF" />
                    TwoColumn - Stacks on Mobile, 50/50 on Desktop
                  </h3>
                  <TwoColumn gap="md" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                    <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Left Content</div>
                    <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg">Right Content</div>
                  </TwoColumn>
                </Stack>
              </Card>

              {/* FourColumn */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={Smartphone} size="md" color="#BF00FF" />
                    FourColumn - 2x2 on Mobile, 4x1 on Desktop
                  </h3>
                  <FourColumn gap="md" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                    <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Item A</div>
                    <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg">Item B</div>
                    <div className="p-4 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg">Item C</div>
                    <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Item D</div>
                  </FourColumn>
                </Stack>
              </Card>
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

          {/* Pattern 1.5: Two Column Layout */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Pattern 1.5: Two Column Layout</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Two columns that stack vertically on mobile</p>
              </div>
              <TwoColumn gap="lg">
                <Card variant="glass">
                  <IconTitleButton 
                    icon={Activity} 
                    title="Health & Vitality" 
                    buttonText="Start Tracking" 
                    buttonVariant="primary" 
                  />
                </Card>
                <Card variant="glass">
                  <IconTitleButton 
                    icon={Heart} 
                    title="Love & Romance" 
                    buttonText="Create Vision" 
                    buttonVariant="secondary" 
                  />
                </Card>
              </TwoColumn>
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

          {/* Pattern 2.5: Four Column Layout */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Pattern 2.5: Four Column Layout</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Four columns that show 2x2 on mobile, 4x1 on desktop</p>
              </div>
              <FourColumn gap="md">
                <Card variant="glass">
                  <Stack align="center" gap="sm" className="text-center">
                    <Icon icon={Activity} size="lg" color="#39FF14" />
                    <h4 className="font-semibold text-white">Health</h4>
                    <Button variant="primary" size="sm" fullWidth>Track</Button>
                  </Stack>
                </Card>
                <Card variant="glass">
                  <Stack align="center" gap="sm" className="text-center">
                    <Icon icon={Heart} size="lg" color="#00FFFF" />
                    <h4 className="font-semibold text-white">Love</h4>
                    <Button variant="secondary" size="sm" fullWidth>Create</Button>
                  </Stack>
                </Card>
                <Card variant="glass">
                  <Stack align="center" gap="sm" className="text-center">
                    <Icon icon={Briefcase} size="lg" color="#BF00FF" />
                    <h4 className="font-semibold text-white">Career</h4>
                    <Button variant="accent" size="sm" fullWidth>Plan</Button>
                  </Stack>
                </Card>
                <Card variant="glass">
                  <Stack align="center" gap="sm" className="text-center">
                    <Icon icon={DollarSign} size="lg" color="#FFFF00" />
                    <h4 className="font-semibold text-white">Wealth</h4>
                    <Button variant="outline" size="sm" fullWidth>Build</Button>
                  </Stack>
                </Card>
              </FourColumn>
            </Stack>
          </section>

          {/* UI Components Section */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">UI Components</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Complete set of UI components with all variants</p>
              </div>

              {/* Card Variants */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={CreditCard} size="md" color="#39FF14" />
                    Card - Container Component
                  </h3>
                  <Grid cols={3} className="gap-6">
                    <Card variant="default" className="p-6">
                      <Icon icon={CreditCard} size="lg" color="#39FF14" className="mb-3" />
                      <h4 className="text-lg font-semibold mb-2">Default Card</h4>
                      <p className="text-neutral-400 text-sm">Standard card with subtle styling.</p>
                    </Card>
                    <Card variant="elevated" className="p-6">
                      <Icon icon={CreditCard} size="lg" color="#00FFFF" className="mb-3" />
                      <h4 className="text-lg font-semibold mb-2">Elevated Card</h4>
                      <p className="text-neutral-400 text-sm">Card with enhanced shadow and depth.</p>
                    </Card>
                    <Card variant="glass" className="p-6">
                      <Icon icon={CreditCard} size="lg" color="#BF00FF" className="mb-3" />
                      <h4 className="text-lg font-semibold mb-2">Glass Card</h4>
                      <p className="text-neutral-400 text-sm">Card with frosted glass effect.</p>
                    </Card>
                  </Grid>
                </Stack>
              </Card>

              {/* Buttons */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={Mouse} size="md" color="#00FFFF" />
                    Buttons - Interactive Elements
                  </h3>
                  <Grid cols={2} gap="md">
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-medium mb-2 text-white">Variants</h4>
                        <Button variant="primary" fullWidth>Primary</Button>
                        <Button variant="secondary" fullWidth>Secondary</Button>
                        <Button variant="accent" fullWidth>Accent</Button>
                        <Button variant="ghost" fullWidth>Ghost</Button>
                        <Button variant="outline" fullWidth>Outline</Button>
                        <Button variant="danger" fullWidth>Danger</Button>
                      </Stack>
                    </Card>
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-medium mb-2 text-white">Sizes</h4>
                        <Button variant="primary" size="sm" fullWidth>Small</Button>
                        <Button variant="primary" size="md" fullWidth>Medium</Button>
                        <Button variant="primary" size="lg" fullWidth>Large</Button>
                        <Button variant="primary" size="xl" fullWidth>Extra Large</Button>
                      </Stack>
                    </Card>
                  </Grid>

                  {/* Gradient Buttons */}
                  <Card variant="default" className="p-4">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">Gradient Buttons</h4>
                      <Inline gap="md" wrap>
                        <GradientButton gradient="brand">Brand</GradientButton>
                        <GradientButton gradient="green">Green</GradientButton>
                        <GradientButton gradient="teal">Teal</GradientButton>
                        <GradientButton gradient="purple">Purple</GradientButton>
                        <GradientButton gradient="cosmic">Cosmic</GradientButton>
                      </Inline>
                    </Stack>
                  </Card>

                  {/* AI Buttons */}
                  <Card variant="default" className="p-4">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">AI Buttons</h4>
                      <Inline gap="md" wrap>
                        <AIButton size="sm">Small AI</AIButton>
                        <AIButton size="md">Medium AI</AIButton>
                        <AIButton size="lg">Large AI</AIButton>
                        <AIButton>Ask AI Assistant</AIButton>
                      </Inline>
                    </Stack>
                  </Card>
                </Stack>
              </Card>

              {/* Feedback Components */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={Loader2} size="md" color="#39FF14" />
                    Feedback Components
                  </h3>
                  
                  {/* Spinner */}
                  <Card variant="default" className="p-4">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">Spinner - Loading Indicators</h4>
                      <Inline gap="md" wrap>
                        <Stack className="items-center">
                          <Spinner size="sm" variant="primary" />
                          <p className="text-xs text-neutral-400 mt-2">Small Primary</p>
                        </Stack>
                        <Stack className="items-center">
                          <Spinner size="md" variant="secondary" />
                          <p className="text-xs text-neutral-400 mt-2">Medium Secondary</p>
                        </Stack>
                        <Stack className="items-center">
                          <Spinner size="lg" variant="accent" />
                          <p className="text-xs text-neutral-400 mt-2">Large Accent</p>
                        </Stack>
                        <Stack className="items-center">
                          <Spinner size="xl" variant="branded" />
                          <p className="text-xs text-neutral-400 mt-2">XL Branded</p>
                        </Stack>
                      </Inline>
                    </Stack>
                  </Card>

                  {/* ProgressBar */}
                  <Card variant="default" className="p-4">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">ProgressBar - Progress Indicators</h4>
                      <Stack gap="md">
                        <ProgressBar value={25} max={100} variant="primary" showLabel label="Primary Progress" />
                        <ProgressBar value={50} max={100} variant="secondary" showLabel />
                        <ProgressBar value={75} max={100} variant="accent" size="lg" />
                        <ProgressBar value={100} max={100} variant="success" size="sm" />
                        <ProgressBar value={30} max={100} variant="warning" />
                        <ProgressBar value={80} max={100} variant="danger" />
                      </Stack>
                    </Stack>
                  </Card>
                </Stack>
              </Card>

              {/* Form Components */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={FileText} size="md" color="#39FF14" />
                    Form Components
                  </h3>
                  
                  {/* Input */}
                  <Card variant="default" className="p-4">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">Input - Text Input Fields</h4>
                      <Stack gap="md">
                        <Input
                          label="Default Input"
                          placeholder="Enter text here"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                        />
                        <Input
                          label="Input with Error"
                          placeholder="This field has an error"
                          value="Invalid input"
                          error="This is an error message"
                        />
                        <Input
                          label="Disabled Input"
                          placeholder="This input is disabled"
                          value="Disabled text"
                          disabled
                        />
                      </Stack>
                    </Stack>
                  </Card>

                  {/* Textarea */}
                  <Card variant="default" className="p-4">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">Textarea - Multi-line Text Input</h4>
                      <Stack gap="md">
                        <Textarea
                          label="Default Textarea"
                          placeholder="Enter your message"
                          value={textareaValue}
                          onChange={(e) => setTextareaValue(e.target.value)}
                          rows={3}
                        />
                        <Textarea
                          label="Textarea with Error"
                          placeholder="This field has an error"
                          value="Invalid message"
                          error="This is an error message"
                          rows={3}
                        />
                      </Stack>
                    </Stack>
                  </Card>

                  {/* Select */}
                  <Card variant="default" className="p-4">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">Select - Dropdown Selection</h4>
                      <Select
                        label="Choose an Option"
                        value={selectValue}
                        onChange={(e) => setSelectValue(e.target.value)}
                        options={[
                          { value: '', label: 'Select an option' },
                          { value: 'option1', label: 'Option 1' },
                          { value: 'option2', label: 'Option 2' },
                          { value: 'option3', label: 'Option 3' }
                        ]}
                      />
                    </Stack>
                  </Card>
                </Stack>
              </Card>

              {/* Badges */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={Tag} size="md" color="#39FF14" />
                    Badge - Status Indicators
                  </h3>
                  <Inline gap="md" wrap>
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="accent">Accent</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="danger">Danger</Badge>
                    <Badge variant="info">Info</Badge>
                    <Badge variant="premium">Premium</Badge>
                    <Badge variant="neutral">Neutral</Badge>
                  </Inline>
                </Stack>
              </Card>
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

          {/* Button Containers */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Button Containers</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Responsive button layouts for different use cases</p>
              </div>
              
              {/* 2 Buttons - Always side by side */}
              <Card>
                <Stack gap="sm">
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">1. Two Buttons - Always Side by Side</h3>
                  <p className="text-sm text-[#9CA3AF] mb-4">2 buttons that fill the container side by side on mobile and desktop</p>
                  <div className="flex gap-4">
                    <Button variant="primary" fullWidth>Primary Action</Button>
                    <Button variant="secondary" fullWidth>Secondary Action</Button>
                  </div>
                </Stack>
              </Card>

              {/* 3 Buttons - Stack on mobile */}
              <Card>
                <Stack gap="sm">
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">2. Three Buttons - Stack on Mobile</h3>
                  <p className="text-sm text-[#9CA3AF] mb-4">3 buttons side by side on desktop, stacked on mobile</p>
                  <div className="flex flex-col md:flex-row gap-4">
                    <Button variant="primary" fullWidth>Primary Action</Button>
                    <Button variant="secondary" fullWidth>Secondary Action</Button>
                    <Button variant="accent" fullWidth>Accent Action</Button>
                  </div>
                </Stack>
              </Card>

              {/* 4 Buttons - 2x2 grid */}
              <Card>
                <Stack gap="sm">
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">3. Four Buttons - 2x2 Grid</h3>
                  <p className="text-sm text-[#9CA3AF] mb-4">4 buttons in 2 rows of 2 on mobile and desktop</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="primary" fullWidth>Primary Action</Button>
                    <Button variant="secondary" fullWidth>Secondary Action</Button>
                    <Button variant="accent" fullWidth>Accent Action</Button>
                    <Button variant="outline" fullWidth>Outline Action</Button>
                  </div>
                </Stack>
              </Card>

              {/* 4 Buttons - Responsive layout */}
              <Card>
                <Stack gap="sm">
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">4. Four Buttons - Responsive Layout</h3>
                  <p className="text-sm text-[#9CA3AF] mb-4">4 buttons side by side on desktop, 2x2 grid on mobile</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="primary" fullWidth>Primary Action</Button>
                    <Button variant="secondary" fullWidth>Secondary Action</Button>
                    <Button variant="accent" fullWidth>Accent Action</Button>
                    <Button variant="outline" fullWidth>Outline Action</Button>
                  </div>
                </Stack>
              </Card>

              {/* 5 Buttons - Responsive layout */}
              <Card>
                <Stack gap="sm">
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">5. Five Buttons - Responsive Layout</h3>
                  <p className="text-sm text-[#9CA3AF] mb-4">5 buttons inline on desktop, 1 full-width + 2x2 grid on mobile</p>
                  <div className="flex flex-col md:flex-row gap-4">
                    <Button variant="primary" fullWidth className="md:hidden">Primary Action</Button>
                    <div className="hidden md:flex gap-4 flex-1">
                      <Button variant="primary" fullWidth>Primary</Button>
                      <Button variant="secondary" fullWidth>Secondary</Button>
                      <Button variant="accent" fullWidth>Accent</Button>
                      <Button variant="outline" fullWidth>Outline</Button>
                      <Button variant="ghost" fullWidth>Ghost</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:hidden">
                      <Button variant="secondary" fullWidth>Secondary</Button>
                      <Button variant="accent" fullWidth>Accent</Button>
                      <Button variant="outline" fullWidth>Outline</Button>
                      <Button variant="ghost" fullWidth>Ghost</Button>
                    </div>
                  </div>
                </Stack>
              </Card>

              {/* 6 Buttons - Responsive layout */}
              <Card>
                <Stack gap="sm">
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">6. Six Buttons - Responsive Layout</h3>
                  <p className="text-sm text-[#9CA3AF] mb-4">6 buttons inline on desktop, 3 rows of 2 on mobile</p>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <Button variant="primary" fullWidth>Primary</Button>
                    <Button variant="secondary" fullWidth>Secondary</Button>
                    <Button variant="accent" fullWidth>Accent</Button>
                    <Button variant="outline" fullWidth>Outline</Button>
                    <Button variant="ghost" fullWidth>Ghost</Button>
                    <Button variant="danger" fullWidth>Danger</Button>
                  </div>
                </Stack>
              </Card>
            </Stack>
          </section>

          {/* Component Composition Example */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Component Composition Example</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Recreating complex layouts using our design system components</p>
              </div>
              
              {/* Version Card Example */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">Version Card - Built with Design System Components</h3>
                  <p className="text-sm text-[#9CA3AF] mb-4">This recreates the complex HTML card using our clean, reusable components</p>
                  
                  {/* The actual version card */}
                  <Card variant="glass" className="p-4">
                    <Switcher gap="lg" className="items-start md:items-center justify-between">
                      {/* Left side - Version info */}
                      <div className="flex-1">
                        <Stack gap="sm">
                          <Inline align="center" gap="sm">
                            <span className="text-sm font-medium text-white">Version 2</span>
                            <Badge variant="neutral">Complete</Badge>
                            <span className="text-sm text-[#9CA3AF]">100% complete</span>
                          </Inline>
                          <Stack gap="xs">
                            <p className="text-xs text-[#9CA3AF]">
                              <span className="font-medium">Created:</span> 10/5/2025 at 5:15 PM
                            </p>
                            <p className="text-xs text-[#9CA3AF]">
                              <span className="font-mono">ID:</span> 572c11b6-a367-4cfa-b2df-48c801da6b84
                            </p>
                          </Stack>
                        </Stack>
                      </div>
                      
                      {/* Right side - 4 buttons using responsive layout */}
                      <div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto justify-center md:justify-end">
                        <Button variant="outline" size="sm" className="flex items-center justify-center gap-2">
                          <Icon icon={Eye} size="xs" />
                          View
                        </Button>
                        <Button variant="secondary" size="sm" className="flex items-center justify-center gap-2">
                          <Icon icon={PenLine} size="xs" />
                          Edit
                        </Button>
                        <Button variant="primary" size="sm" className="flex items-center justify-center gap-2">
                          Deploy
                        </Button>
                        <Button variant="danger" size="sm" className="flex items-center justify-center gap-2">
                          <Icon icon={Trash2} size="xs" />
                          Delete
                        </Button>
                      </div>
                    </Switcher>
                  </Card>
                  
                  {/* Code explanation */}
                  <Card variant="outlined" className="p-4">
                    <Stack gap="sm">
                      <h4 className="font-semibold text-white">Components Used:</h4>
                      <ul className="text-sm text-[#9CA3AF] space-y-1">
                        <li>• <strong>Card</strong> - Main container and glass variant for the inner card</li>
                        <li>• <strong>Switcher</strong> - Responsive layout with justify-between (stack on mobile, row on desktop)</li>
                        <li>• <strong>Stack</strong> - Vertical spacing for version info</li>
                        <li>• <strong>Inline</strong> - Horizontal layout for title, badge, and status</li>
                        <li>• <strong>Badge</strong> - Status indicator</li>
                        <li>• <strong>Button</strong> - All 4 action buttons with variants, sizes, and horizontal icon layout</li>
                        <li>• <strong>Icon</strong> - Icons positioned horizontally next to text (not stacked)</li>
                        <li>• <strong>Mixed Layout</strong> - Grid 2x2 on mobile, flex row on desktop for buttons</li>
                      </ul>
                      
                      <div className="mt-4 p-3 bg-[#1F1F1F] rounded-lg border border-[#333]">
                        <h5 className="font-semibold text-white mb-2">Key Implementation Details:</h5>
                        <ul className="text-xs text-[#9CA3AF] space-y-1">
                          <li>• <strong>Button Container:</strong> <code>grid grid-cols-2 md:flex md:flex-row</code></li>
                          <li>• <strong>Button Layout:</strong> <code>w-full md:w-auto justify-center md:justify-end</code></li>
                          <li>• <strong>Icon + Text:</strong> <code>flex items-center justify-center gap-2</code></li>
                          <li>• <strong>Switcher:</strong> <code>justify-between</code> for proper spacing</li>
                          <li>• <strong>Mobile:</strong> 2x2 grid, centered buttons, full width</li>
                          <li>• <strong>Desktop:</strong> Horizontal row, right-aligned, natural sizing</li>
                        </ul>
                      </div>
                    </Stack>
                  </Card>
                </Stack>
              </Card>
            </Stack>
          </section>

          {/* Categories Grid */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">All Life Categories</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Responsive grid - click to select (7 across on desktop, 2 across on mobile)</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4 md:gap-6">
                {VISION_CATEGORIES.map((category) => (
                  <CategoryCard 
                    key={category.key} 
                    category={category} 
                    selected={selectedCategory === category.key} 
                    onClick={() => setSelectedCategory(selectedCategory === category.key ? '' : category.key)} 
                  />
                ))}
              </div>
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

          {/* Interactive Demo Section */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Interactive Demo</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Test loading states and progress tracking</p>
              </div>
              
              <Card variant="glass">
                <Stack gap="md">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Loading & Progress Demo</h3>
                    <p className="text-neutral-400">Test the interactive components</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Loading Demo */}
                    <Card variant="default" className="p-4">
                      <Stack gap="md">
                        <h4 className="font-semibold text-white">Loading States</h4>
                        <Button 
                          variant="primary" 
                          onClick={handleLoadingToggle}
                          loading={isLoading}
                          fullWidth
                        >
                          {isLoading ? 'Loading...' : 'Start Loading Demo'}
                        </Button>
                        <div className="text-center">
                          <p className="text-sm text-neutral-400 mb-2">Current Status:</p>
                          {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <Spinner size="sm" variant="primary" />
                              <span className="text-sm text-[#39FF14]">Loading...</span>
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-400">Ready</span>
                          )}
                        </div>
                      </Stack>
                    </Card>

                    {/* Progress Demo */}
                    <Card variant="default" className="p-4">
                      <Stack gap="md">
                        <h4 className="font-semibold text-white">Progress Tracking</h4>
                        <ProgressBar 
                          value={progressValue} 
                          max={100} 
                          variant="primary" 
                          showLabel 
                          label={`${progressValue}% Complete`}
                        />
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setProgressValue(Math.max(0, progressValue - 10))}
                            disabled={progressValue <= 0}
                          >
                            -10%
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setProgressValue(Math.min(100, progressValue + 10))}
                            disabled={progressValue >= 100}
                          >
                            +10%
                          </Button>
                        </div>
                      </Stack>
                    </Card>
                  </div>
                </Stack>
              </Card>
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
                  <p><strong className="text-white">2. Compose with Components:</strong> Use Button, Card, Icon, Select, Badge, Input, Textarea, Spinner, ProgressBar inside your layouts</p>
                  <p><strong className="text-white">3. Use Composite Patterns:</strong> IconTitleButton, CategoryCard, StatCard for common use cases</p>
                  <p><strong className="text-white">4. Everything is Mobile-First:</strong> All components automatically adapt to screen size</p>
                  <p><strong className="text-white">5. Special Components:</strong> GradientButton for hero sections, AIButton for AI features</p>
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