'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  // Layout Primitives
  Stack,
  Inline,
  Grid,
  TwoColumn,
  FourColumn,
  Switcher,
  Cover,
  Frame,
  Container,
  
  // UI Components
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
  
  // Feedback Components
  Spinner,
  ProgressBar,
} from '@/lib/design-system/components'

// Icons for demonstrations
import { 
  Sparkles, 
  Star, 
  Zap, 
  Target, 
  Heart, 
  Users, 
  Settings, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Shield,
  Crown,
  X,
  Plus,
  Minus,
  Edit,
  Trash,
  Eye,
  MessageSquare,
  Layout,
  PanelTop,
  Square,
  Monitor,
  Smartphone,
  Grid as GridIcon,
  Palette,
  FileText,
  Tag,
  TrendingUp,
  RotateCcw,
  Mouse,
  CreditCard,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react'

export default function DesignSystemExperiment() {
  // State for interactive components
  const [inputValue, setInputValue] = useState('')
  const [textareaValue, setTextareaValue] = useState('')
  const [selectValue, setSelectValue] = useState('')
  const [progressValue, setProgressValue] = useState(75)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleLoadingToggle = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <PageLayout>
      <Container size="xl" className="py-12">
        <Stack gap="xl" align="center">
          
          {/* Header */}
          <Stack gap="md" align="center" className="text-center">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-[#39FF14] via-[#00FFFF] to-[#BF00FF] bg-clip-text text-transparent">
              VibrationFit Design System
            </h1>
            <p className="text-xl text-neutral-300 max-w-3xl">
              Complete mobile-first design system with 21 components, layout primitives, and feedback elements. 
              Test and perfect all variants, props, and interactions here before production use.
            </p>
            <Badge variant="premium" className="text-sm">
              <Icon icon={Crown} size="sm" className="mr-1" />
              Production Ready
            </Badge>
          </Stack>

          {/* Layout Primitives Section */}
          <Card className="w-full">
            <Stack gap="lg">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-[#39FF14] mb-2">Layout Primitives</h2>
                <p className="text-neutral-400">9 core layout components for responsive design</p>
              </div>
              
              {/* Stack */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={Layout} size="md" color="#39FF14" />
                  Stack - Vertical Layout
                </h3>
                <Stack gap="md" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                  <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg flex items-center gap-3">
                    <Icon icon={Star} size="sm" color="#39FF14" />
                    <span>Stack Item 1 - Primary</span>
                  </div>
                  <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg flex items-center gap-3">
                    <Icon icon={Zap} size="sm" color="#00FFFF" />
                    <span>Stack Item 2 - Secondary</span>
                  </div>
                  <div className="p-4 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg flex items-center gap-3">
                    <Icon icon={Sparkles} size="sm" color="#BF00FF" />
                    <span>Stack Item 3 - Accent</span>
                  </div>
                </Stack>
              </div>

              {/* Inline */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={AlignLeft} size="md" color="#00FFFF" />
                  Inline - Horizontal Layout
                </h3>
                <Inline gap="md" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                  <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg flex items-center gap-3">
                    <Icon icon={Target} size="sm" color="#39FF14" />
                    <span>Inline 1</span>
                  </div>
                  <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg flex items-center gap-3">
                    <Icon icon={Heart} size="sm" color="#00FFFF" />
                    <span>Inline 2</span>
                  </div>
                  <div className="p-4 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg flex items-center gap-3">
                    <Icon icon={Users} size="sm" color="#BF00FF" />
                    <span>Inline 3</span>
                  </div>
                </Inline>
              </div>

              {/* Grid */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={GridIcon} size="md" color="#BF00FF" />
                  Grid - Responsive Grid Layout
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-medium mb-2 text-neutral-300">Auto-fit Grid (default)</h4>
                    <Grid className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                      {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="p-4 bg-gradient-to-br from-[#39FF14]/20 to-[#00FFFF]/20 border border-[#39FF14]/30 rounded-lg text-center">
                          <Icon icon={Star} size="md" color="#39FF14" className="mx-auto mb-2" />
                          <span>Auto {i + 1}</span>
                        </div>
                      ))}
                    </Grid>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-2 text-neutral-300">Fixed 3-Column Grid</h4>
                    <Grid cols={3} className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                      {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="p-4 bg-gradient-to-br from-[#00FFFF]/20 to-[#BF00FF]/20 border border-[#00FFFF]/30 rounded-lg text-center">
                          <Icon icon={Zap} size="md" color="#00FFFF" className="mx-auto mb-2" />
                          <span>Fixed {i + 1}</span>
                        </div>
                      ))}
                    </Grid>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-2 text-neutral-300">Fixed 4-Column Grid</h4>
                    <Grid cols={4} className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                      {Array.from({ length: 8 }, (_, i) => (
                        <div key={i} className="p-3 bg-gradient-to-br from-[#BF00FF]/20 to-[#39FF14]/20 border border-[#BF00FF]/30 rounded-lg text-center">
                          <Icon icon={Sparkles} size="sm" color="#BF00FF" className="mx-auto mb-1" />
                          <span className="text-sm">4-Col {i + 1}</span>
                        </div>
                      ))}
                    </Grid>
                  </div>
                </div>
              </div>

              {/* TwoColumn */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={PanelTop} size="md" color="#39FF14" />
                  TwoColumn - Responsive 2-Column Layout
                </h3>
                <TwoColumn className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                  <div className="p-6 bg-gradient-to-br from-[#39FF14]/20 to-[#00FFFF]/20 border border-[#39FF14]/30 rounded-lg">
                    <Icon icon={Target} size="lg" color="#39FF14" className="mb-3" />
                    <h4 className="text-xl font-semibold mb-2">Left Column</h4>
                    <p className="text-neutral-300">This column stacks on mobile and sits side-by-side on desktop.</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-[#00FFFF]/20 to-[#BF00FF]/20 border border-[#00FFFF]/30 rounded-lg">
                    <Icon icon={Heart} size="lg" color="#00FFFF" className="mb-3" />
                    <h4 className="text-xl font-semibold mb-2">Right Column</h4>
                    <p className="text-neutral-300">Perfect for content that needs to be responsive and accessible.</p>
                  </div>
                </TwoColumn>
              </div>

              {/* FourColumn */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={GridIcon} size="md" color="#00FFFF" />
                  FourColumn - Responsive 4-Column Layout
                </h3>
                <FourColumn className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="p-4 bg-gradient-to-br from-[#39FF14]/20 to-[#BF00FF]/20 border border-[#39FF14]/30 rounded-lg text-center">
                      <Icon icon={Star} size="md" color="#39FF14" className="mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Column {i + 1}</h4>
                      <p className="text-xs text-neutral-400">2x2 on mobile, 4x1 on desktop</p>
                    </div>
                  ))}
                </FourColumn>
              </div>

              {/* Switcher */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={Settings} size="md" color="#BF00FF" />
                  Switcher - Flexible Layout
                </h3>
                <Switcher className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                  <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">
                    <Icon icon={Settings} size="sm" color="#39FF14" className="mb-2" />
                    <span>Flexible Item 1</span>
                  </div>
                  <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg">
                    <Icon icon={Settings} size="sm" color="#00FFFF" className="mb-2" />
                    <span>Flexible Item 2</span>
                  </div>
                  <div className="p-4 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg">
                    <Icon icon={Settings} size="sm" color="#BF00FF" className="mb-2" />
                    <span>Flexible Item 3</span>
                  </div>
                </Switcher>
              </div>

              {/* Cover */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={Monitor} size="md" color="#39FF14" />
                  Cover - Full Coverage Layout
                </h3>
                <div className="relative h-64 bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden">
                  <Cover className="p-8">
                    <div className="text-center">
                      <Icon icon={Shield} size="xl" color="#39FF14" className="mx-auto mb-4" />
                      <h4 className="text-2xl font-bold mb-2">Cover Content</h4>
                      <p className="text-neutral-300">This content covers the full area with proper positioning.</p>
                    </div>
                  </Cover>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/10 to-[#BF00FF]/10 pointer-events-none" />
                </div>
              </div>

              {/* Frame */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={Square} size="md" color="#00FFFF" />
                  Frame - Constrained Layout
                </h3>
                <Frame className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                  <div className="p-6 bg-gradient-to-br from-[#00FFFF]/20 to-[#39FF14]/20 border border-[#00FFFF]/30 rounded-lg text-center">
                    <Icon icon={Square} size="lg" color="#00FFFF" className="mx-auto mb-3" />
                    <h4 className="text-xl font-semibold mb-2">Framed Content</h4>
                    <p className="text-neutral-300">This content is properly framed with consistent spacing.</p>
                  </div>
                </Frame>
              </div>

              {/* Container */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={Square} size="md" color="#BF00FF" />
                  Container - Page Width Container
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-medium mb-2 text-neutral-300">Container Sizes</h4>
                    <div className="space-y-2">
                      <Container size="sm" className="p-4 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded">
                        <span className="text-sm">Small Container (max-w-3xl)</span>
                      </Container>
                      <Container size="md" className="p-4 bg-[#00FFFF]/10 border border-[#00FFFF]/30 rounded">
                        <span className="text-sm">Medium Container (max-w-5xl)</span>
                      </Container>
                      <Container size="default" className="p-4 bg-[#BF00FF]/10 border border-[#BF00FF]/30 rounded">
                        <span className="text-sm">Default Container (max-w-7xl)</span>
                      </Container>
                      <Container size="lg" className="p-4 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded">
                        <span className="text-sm">Large Container (max-w-[1400px])</span>
                      </Container>
                      <Container size="xl" className="p-4 bg-[#00FFFF]/10 border border-[#00FFFF]/30 rounded">
                        <span className="text-sm">Extra Large Container (max-w-[1600px])</span>
                      </Container>
                      <Container size="full" className="p-4 bg-[#BF00FF]/10 border border-[#BF00FF]/30 rounded">
                        <span className="text-sm">Full Width Container (max-w-none)</span>
                      </Container>
                    </div>
                  </div>
                </div>
              </div>
            </Stack>
          </Card>

          {/* UI Components Section */}
          <Card className="w-full">
            <Stack gap="lg">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-[#00FFFF] mb-2">UI Components</h2>
                <p className="text-neutral-400">12 core UI components with variants and interactions</p>
              </div>

              {/* Card Variants */}
              <div>
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
                  <Card variant="outlined" className="p-6">
                    <Icon icon={CreditCard} size="lg" color="#BF00FF" className="mb-3" />
                    <h4 className="text-lg font-semibold mb-2">Outlined Card</h4>
                    <p className="text-neutral-400 text-sm">Card with prominent border styling.</p>
                  </Card>
                </Grid>
              </div>

              {/* Button System */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={Mouse} size="md" color="#39FF14" />
                  Button System - Interactive Elements
                </h3>
                
                {/* Standard Buttons */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-4 text-neutral-300">Standard Buttons</h4>
                  <Inline gap="md" wrap className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="accent">Accent</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="danger">Danger</Button>
                  </Inline>
                </div>

                {/* Button Sizes */}
                <div className="mb- 정보">
                  <h4 className="text-lg font-medium mb-4 text-neutral-300">Button Sizes</h4>
                  <Inline gap="md" wrap className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                    <Button size="xl">Extra Large</Button>
                  </Inline>
                </div>

                {/* Button States */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-4 text-neutral-300">Button States</h4>
                  <Inline gap="md" wrap className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                    <Button>Normal</Button>
                    <Button loading>Loading</Button>
                    <Button disabled>Disabled</Button>
                    <Button fullWidth>Full Width</Button>
                  </Inline>
                </div>

                {/* Gradient Buttons */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-4 text-neutral-300">Gradient Buttons</h4>
                  <Inline gap="md" wrap className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                    <GradientButton gradient="brand">Brand</GradientButton>
                    <GradientButton gradient="green">Green</GradientButton>
                    <GradientButton gradient="teal">Teal</GradientButton>
                    <GradientButton gradient="purple">Purple</GradientButton>
                    <GradientButton gradient="cosmic">Cosmic</GradientButton>
                  </Inline>
                </div>

                {/* AI Buttons */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-4 text-neutral-300">AI Buttons</h4>
                  <Inline gap="md" wrap className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                    <AIButton size="sm">Small AI</AIButton>
                    <AIButton size="md">Medium AI</AIButton>
                    <AIButton size="lg">Large AI</AIButton>
                    <AIButton>Ask AI Assistant</AIButton>
                  </Inline>
                </div>

                {/* Button with asChild */}
                <div>
                  <h4 className="text-lg font-medium mb-4 text-neutral-300">Button with asChild (Link Integration)</h4>
                  <Inline gap="md" wrap className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                    <Button asChild variant="primary">
                      <Link href="/dashboard">
                        <Icon icon={ArrowRight} size="sm" className="mr-2" />
                        Go to Dashboard
                      </Link>
                    </Button>
                    <AIButton asChild size="md">
                      <Link href="/viva/chat">
                        <Icon icon={MessageSquare} size="sm" className="mr-2" />
                        Chat with VIVA
                      </Link>
                    </AIButton>
                  </Inline>
                </div>
              </div>

              {/* Icon System */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={Palette} size="md" color="#00FFFF" />
                  Icon System - Visual Elements
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-neutral-300">Icon Sizes</h4>
                    <Inline gap="lg" wrap className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                      <div className="flex flex-col items-center gap-2">
                        <Icon icon={Star} size="xs" color="#39FF14" />
                        <span className="text-xs text-neutral-400">XS</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Icon icon={Star} size="sm" color="#00FFFF" />
                        <span className="text-xs text-neutral-400">SM</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Icon icon={Star} size="md" color="#BF00FF" />
                        <span className="text-xs text-neutral-400">MD</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Icon icon={Star} size="lg" color="#39FF14" />
                        <span className="text-xs text-neutral-400">LG</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Icon icon={Star} size="xl" color="#00FFFF" />
                        <span className="text-xs text-neutral-400">XL</span>
                      </div>
                    </Inline>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-neutral-300">Traffic Light Icons</h4>
                    <Inline gap="md" wrap className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                      <Icon icon={CheckCircle} size="md" color="#39FF14" />
                      <Icon icon={AlertCircle} size="md" color="#FFFF00" />
                      <Icon icon={X} size="md" color="#FF0040" />
                      <Icon icon={Info} size="md" color="#00FFFF" />
                      <Icon icon={Info} size="md" color="#BF00FF" />
                      <Icon icon={AlertCircle} size="md" color="#FF8C00" />
                    </Inline>
                  </div>
                </div>
              </div>

              {/* Form Components */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={FileText} size="md" color="#BF00FF" />
                  Form Components - Input Elements
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-neutral-300">Input Fields</h4>
                    <Stack gap="md" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                      <Input 
                        placeholder="Enter your name"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                      />
                      <Textarea 
                        placeholder="Enter your message"
                        value={textareaValue}
                        onChange={(e) => setTextareaValue(e.target.value)}
                        rows={3}
                      />
                      <Select 
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
                  </div>
                </div>
              </div>

              {/* Badge System */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={Tag} size="md" color="#39FF14" />
                  Badge System - Status Indicators
                </h3>
                <Inline gap="md" wrap className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="accent">Accent</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="premium">Premium</Badge>
                  <Badge variant="neutral">Neutral</Badge>
                </Inline>
              </div>
            </Stack>
          </Card>

          {/* Feedback Components Section */}
          <Card className="w-full">
            <Stack gap="lg">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-[#BF00FF] mb-2">Feedback Components</h2>
                <p className="text-neutral-400">Loading indicators and progress tracking</p>
              </div>
              
              {/* Spinners */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={Loader2} size="md" color="#39FF14" />
                  Spinners - Loading Indicators
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-neutral-300">Spinner Variants</h4>
                    <Inline gap="lg" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                      <div className="flex flex-col items-center gap-2">
                        <Spinner size="md" variant="primary" />
                        <span className="text-xs text-neutral-400">Primary</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Spinner size="md" variant="secondary" />
                        <span className="text-xs text-neutral-400">Secondary</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Spinner size="md" variant="accent" />
                        <span className="text-xs text-neutral-400">Accent</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Spinner size="md" variant="branded" />
                        <span className="text-xs text-neutral-400">Branded</span>
                      </div>
                    </Inline>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-neutral-300">Spinner Sizes</h4>
                    <Inline gap="lg" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                      <div className="flex flex-col items-center gap-2">
                        <Spinner size="sm" variant="primary" />
                        <span className="text-xs text-neutral-400">Small</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Spinner size="md" variant="secondary" />
                        <span className="text-xs text-neutral-400">Medium</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Spinner size="lg" variant="accent" />
                        <span className="text-xs text-neutral-400">Large</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Spinner size="xl" variant="primary" />
                        <span className="text-xs text-neutral-400">Extra Large</span>
                      </div>
                    </Inline>
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Icon icon={TrendingUp} size="md" color="#00FFFF" />
                  Progress Bars - Progress Tracking
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-neutral-300">Progress Bar Variants</h4>
                    <Stack gap="md" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                      <ProgressBar 
                        value={progressValue} 
                        max={100} 
                        variant="primary" 
                        showLabel 
                        label="Primary Progress"
                      />
                      <ProgressBar 
                        value={60} 
                        max={100} 
                        variant="secondary" 
                        showLabel 
                        label="Secondary Progress"
                      />
                      <ProgressBar 
                        value={90} 
                        max={100} 
                        variant="accent" 
                        showLabel 
                        label="Accent Progress"
                      />
                      <ProgressBar 
                        value={75} 
                        max={100} 
                        variant="success" 
                        showLabel 
                        label="Success Progress"
                      />
                      <ProgressBar 
                        value={30} 
                        max={100} 
                        variant="warning" 
                        showLabel 
                        label="Warning Progress"
                      />
                      <ProgressBar 
                        value={15} 
                        max={100} 
                        variant="danger" 
                        showLabel 
                        label="Danger Progress"
                      />
                    </Stack>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-neutral-300">Progress Bar Sizes</h4>
                    <Stack gap="md" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                      <ProgressBar 
                        value={50} 
                        variant="primary" 
                        size="sm" 
                        showLabel 
                        label="Small Progress"
                      />
                      <ProgressBar 
                        value={50} 
                        variant="secondary" 
                        size="md" 
                        showLabel 
                        label="Medium Progress"
                      />
                      <ProgressBar 
                        value={50} 
                        variant="accent" 
                        size="lg" 
                        showLabel 
                        label="Large Progress"
                      />
                    </Stack>
                  </div>
                </div>
              </div>
            </Stack>
          </Card>

          {/* Interactive Demo Section */}
          <Card className="w-full">
            <Stack gap="lg">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-[#39FF14] mb-2">Interactive Demo</h2>
                <p className="text-neutral-400">Test component interactions and behaviors</p>
              </div>
              
              <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                <Stack gap="md">
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={() => setProgressValue(Math.max(0, progressValue - 10))}
                      variant="outline"
                      size="sm"
                    >
                      <Icon icon={Minus} size="sm" className="mr-1" />
                      -10%
                    </Button>
                    <ProgressBar 
                      value={progressValue} 
                      max={100} 
                      variant="primary" 
                      showLabel 
                      label="Interactive Progress"
                    />
                    <Button 
                      onClick={() => setProgressValue(Math.min(100, progressValue + 10))}
                      variant="primary"
                      size="sm"
                    >
                      <Icon icon={Plus} size="sm" className="mr-1" />
                      +10%
                    </Button>
                  </div>
                  
                  <Inline gap="md" wrap>
                    <Button 
                      onClick={() => setProgressValue(0)}
                      variant="ghost"
                      size="sm"
                    >
                      <Icon icon={RotateCcw} size="sm" className="mr-1" />
                      Reset
                    </Button>
                    <Button 
                      onClick={() => setProgressValue(25)}
                      variant="secondary"
                      size="sm"
                    >
                      25%
                    </Button>
                    <Button 
                      onClick={() => setProgressValue(50)}
                      variant="accent"
                      size="sm"
                    >
                      50%
                    </Button>
                    <Button 
                      onClick={() => setProgressValue(100)}
                      variant="primary"
                      size="sm"
                    >
                      100%
                    </Button>
                  </Inline>

                  <div className="mt-4 p-4 bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold">Loading State Demo</h4>
                      <Button 
                        onClick={handleLoadingToggle}
                        variant="primary"
                        size="sm"
                        loading={isLoading}
                      >
                        {isLoading ? 'Loading...' : 'Start Loading'}
                      </Button>
                    </div>
                    {isLoading && (
                      <div className="flex items-center justify-center py-8">
                        <Spinner size="lg" variant="primary" />
                        <span className="ml-3 text-neutral-300">Processing your request...</span>
                      </div>
                    )}
                  </div>
                </Stack>
              </div>
            </Stack>
          </Card>

          {/* Component Composition Example */}
          <Card className="w-full">
            <Stack gap="lg">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-[#00FFFF] mb-2">Component Composition</h2>
                <p className="text-neutral-400">Real-world example using multiple components together</p>
              </div>
              
              <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                <Card variant="elevated" className="p-6">
                  <Stack gap="md">
                    <Inline gap="md" align="center">
                      <Icon icon={Star} size="lg" color="#39FF14" />
                      <div>
                        <h3 className="text-xl font-semibold">Version 2</h3>
                        <Badge variant="success">Complete</Badge>
                      </div>
                      <Badge variant="info">100% complete</Badge>
                    </Inline>
                    
                    <Stack gap="xs">
                      <p className="text-sm text-neutral-400">
                        <span className="font-medium">Created:</span> 10/5/2025 at 5:15 PM
                      </p>
                      <p className="text-sm text-neutral-400">
                        <span className="font-mono">ID:</span> 572c11b6-a367-4cfa-b2df-48c801da6b84
                      </p>
                    </Stack>
                    
                    <Grid cols={2} className="mt-4">
                      <Button variant="outline" size="sm">
                        <Icon icon={Eye} size="sm" className="mr-1" />
                        View
                      </Button>
                      <Button variant="secondary" size="sm">
                        <Icon icon={Edit} size="sm" className="mr-1" />
                        Edit
                      </Button>
                      <Button variant="primary" size="sm">
                        <Icon icon={CheckCircle} size="sm" className="mr-1" />
                        Make Active
                      </Button>
                      <Button variant="danger" size="sm">
                        <Icon icon={Trash} size="sm" className="mr-1" />
                        Delete
                      </Button>
                    </Grid>
                  </Stack>
                </Card>
              </div>
            </Stack>
          </Card>

          {/* Footer */}
          <Card className="w-full">
            <Stack gap="md" align="center" className="text-center">
              <h3 className="text-2xl font-bold text-[#39FF14]">Design System Complete</h3>
              <p className="text-neutral-400 max-w-2xl">
                All 21 components are ready for production use. This comprehensive system provides 
                everything needed to build beautiful, responsive, and accessible interfaces.
              </p>
              <Inline gap="md">
                <Badge variant="success">
                  <Icon icon={CheckCircle} size="sm" className="mr-1" />
                  21 Components
                </Badge>
                <Badge variant="info">
                  <Icon icon={Smartphone} size="sm" className="mr-1" />
                  Mobile-First
                </Badge>
                <Badge variant="premium">
                  <Icon icon={Shield} size="sm" className="mr-1" />
                  Type-Safe
                </Badge>
              </Inline>
            </Stack>
          </Card>

        </Stack>
      </Container>
    </PageLayout>
  )
}