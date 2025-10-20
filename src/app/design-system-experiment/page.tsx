'use client'

import React, { useState } from 'react'
import { 
  Stack,
  Inline,
  Grid,
  Switcher,
  Cover,
  Frame,
  Container,
  TwoColumn,
  FourColumn,
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
  Loader2
} from 'lucide-react'

export default function DesignSystemExperiment() {
  const [inputValue, setInputValue] = useState('')
  const [textareaValue, setTextareaValue] = useState('')
  const [selectValue, setSelectValue] = useState('')
  const [progressValue, setProgressValue] = useState(75)

  return (
    <PageLayout>
      <Container size="xl" className="py-12">
        <Stack gap="xl" align="center">
          
          {/* Header */}
          <Stack gap="md" align="center" className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-[#39FF14] to-[#00FFFF] bg-clip-text text-transparent">
              VibrationFit Design System
            </h1>
            <p className="text-xl text-neutral-300 max-w-2xl">
              Complete mobile-first design system with layout primitives, components, and feedback elements
            </p>
          </Stack>

          {/* Layout Primitives */}
          <Card className="w-full">
            <Stack gap="lg">
              <h2 className="text-3xl font-bold text-[#39FF14]">Layout Primitives</h2>
              
              {/* Stack */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Stack - Vertical Layout</h3>
                <Stack gap="md" className="p-4 bg-neutral-900 rounded-lg">
                  <div className="p-3 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded">Item 1</div>
                  <div className="p-3 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded">Item 2</div>
                  <div className="p-3 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded">Item 3</div>
                </Stack>
              </div>

              {/* Inline */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Inline - Horizontal Layout</h3>
                <Inline gap="md" className="p-4 bg-neutral-900 rounded-lg">
                  <div className="p-3 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded">Item 1</div>
                  <div className="p-3 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded">Item 2</div>
                  <div className="p-3 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded">Item 3</div>
                </Inline>
              </div>

              {/* Grid */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Grid - Responsive Grid</h3>
                <Grid cols={3} className="p-4 bg-neutral-900 rounded-lg">
                  <div className="p-3 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded">Item 1</div>
                  <div className="p-3 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded">Item 2</div>
                  <div className="p-3 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded">Item 3</div>
                  <div className="p-3 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded">Item 4</div>
                  <div className="p-3 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded">Item 5</div>
                  <div className="p-3 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded">Item 6</div>
                </Grid>
              </div>

              {/* TwoColumn */}
              <div>
                <h3 className="text-xl font-semibold mb-4">TwoColumn - Responsive 2-Column</h3>
                <TwoColumn className="p-4 bg-neutral-900 rounded-lg">
                  <div className="p-3 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded">Left Column</div>
                  <div className="p-3 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded">Right Column</div>
                </TwoColumn>
              </div>

              {/* FourColumn */}
              <div>
                <h3 className="text-xl font-semibold mb-4">FourColumn - Responsive 4-Column</h3>
                <FourColumn className="p-4 bg-neutral-900 rounded-lg">
                  <div className="p-3 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded">Item 1</div>
                  <div className="p-3 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded">Item 2</div>
                  <div className="p-3 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded">Item 3</div>
                  <div className="p-3 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded">Item 4</div>
                </FourColumn>
              </div>
            </Stack>
          </Card>

          {/* Button System */}
          <Card className="w-full">
            <Stack gap="lg">
              <h2 className="text-3xl font-bold text-[#39FF14]">Button System</h2>
              
              {/* Standard Buttons */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Standard Buttons</h3>
                <Inline gap="md" wrap className="p-4 bg-neutral-900 rounded-lg">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="accent">Accent</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="danger">Danger</Button>
                </Inline>
              </div>

              {/* Button Sizes */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Button Sizes</h3>
                <Inline gap="md" wrap className="p-4 bg-neutral-900 rounded-lg">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                </Inline>
              </div>

              {/* Gradient Buttons */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Gradient Buttons</h3>
                <Inline gap="md" wrap className="p-4 bg-neutral-900 rounded-lg">
                  <GradientButton gradient="brand">Brand</GradientButton>
                  <GradientButton gradient="green">Green</GradientButton>
                  <GradientButton gradient="teal">Teal</GradientButton>
                  <GradientButton gradient="purple">Purple</GradientButton>
                  <GradientButton gradient="cosmic">Cosmic</GradientButton>
                </Inline>
              </div>

              {/* AI Buttons */}
              <div>
                <h3 className="text-xl font-semibold mb-4">AI Buttons</h3>
                <Inline gap="md" wrap className="p-4 bg-neutral-900 rounded-lg">
                  <AIButton size="sm">Small AI</AIButton>
                  <AIButton size="md">Medium AI</AIButton>
                  <AIButton size="lg">Large AI</AIButton>
                  <AIButton>Ask AI Assistant</AIButton>
                </Inline>
              </div>
            </Stack>
          </Card>

          {/* Feedback Components */}
          <Card className="w-full">
            <Stack gap="lg">
              <h2 className="text-3xl font-bold text-[#39FF14]">Feedback Components</h2>
              
              {/* Spinners */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Spinners</h3>
                <Inline gap="lg" className="p-4 bg-neutral-900 rounded-lg">
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

              {/* Progress Bars */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Progress Bars</h3>
                <Stack gap="md" className="p-4 bg-neutral-900 rounded-lg">
                  <div>
                    <ProgressBar 
                      value={progressValue} 
                      max={100} 
                      variant="primary" 
                      showLabel 
                      label="Primary Progress"
                    />
                  </div>
                  <div>
                    <ProgressBar 
                      value={60} 
                      max={100} 
                      variant="secondary" 
                      showLabel 
                      label="Secondary Progress"
                    />
                  </div>
                  <div>
                    <ProgressBar 
                      value={90} 
                      max={100} 
                      variant="success" 
                      showLabel 
                      label="Success Progress"
                    />
                  </div>
                  <div>
                    <ProgressBar 
                      value={30} 
                      max={100} 
                      variant="warning" 
                      showLabel 
                      label="Warning Progress"
                    />
                  </div>
                  <div>
                    <ProgressBar 
                      value={15} 
                      max={100} 
                      variant="danger" 
                      showLabel 
                      label="Danger Progress"
                    />
                  </div>
                </Stack>
              </div>
            </Stack>
          </Card>

          {/* Form Components */}
          <Card className="w-full">
            <Stack gap="lg">
              <h2 className="text-3xl font-bold text-[#39FF14]">Form Components</h2>
              
              {/* Inputs */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Inputs</h3>
                <Stack gap="md" className="p-4 bg-neutral-900 rounded-lg">
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

              {/* Badges */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Badges</h3>
                <Inline gap="md" wrap className="p-4 bg-neutral-900 rounded-lg">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="accent">Accent</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                </Inline>
              </div>
            </Stack>
          </Card>

          {/* Icons */}
          <Card className="w-full">
            <Stack gap="lg">
              <h2 className="text-3xl font-bold text-[#39FF14]">Icons</h2>
              
              <Inline gap="lg" wrap className="p-4 bg-neutral-900 rounded-lg">
                <Icon icon={Sparkles} size="sm" color="#39FF14" />
                <Icon icon={Star} size="md" color="#00FFFF" />
                <Icon icon={Zap} size="lg" color="#BF00FF" />
                <Icon icon={Target} size="xl" color="#39FF14" />
                <Icon icon={Heart} size="md" color="#FF6B6B" />
                <Icon icon={Users} size="md" color="#4ECDC4" />
                <Icon icon={Settings} size="md" color="#FFE66D" />
                <Icon icon={CheckCircle} size="md" color="#51CF66" />
                <Icon icon={AlertCircle} size="md" color="#FF8787" />
                <Icon icon={Info} size="md" color="#74C0FC" />
              </Inline>
            </Stack>
          </Card>

          {/* Interactive Demo */}
          <Card className="w-full">
            <Stack gap="lg">
              <h2 className="text-3xl font-bold text-[#39FF14]">Interactive Demo</h2>
              
              <div className="p-4 bg-neutral-900 rounded-lg">
                <Stack gap="md">
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={() => setProgressValue(Math.max(0, progressValue - 10))}
                      variant="outline"
                      size="sm"
                    >
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
                      +10%
                    </Button>
                  </div>
                  
                  <Inline gap="md" wrap>
                    <Button 
                      onClick={() => setProgressValue(0)}
                      variant="ghost"
                      size="sm"
                    >
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
                </Stack>
              </div>
            </Stack>
          </Card>

          {/* Component Composition Example */}
          <Card className="w-full">
            <Stack gap="lg">
              <h2 className="text-3xl font-bold text-[#39FF14]">Component Composition</h2>
              
              <div className="p-4 bg-neutral-900 rounded-lg">
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
                        <Icon icon={Sparkles} size="sm" />
                        View
                      </Button>
                      <Button variant="secondary" size="sm">
                        <Icon icon={Target} size="sm" />
                        Edit
                      </Button>
                      <Button variant="primary" size="sm">
                        <Icon icon={CheckCircle} size="sm" />
                        Make Active
                      </Button>
                      <Button variant="danger" size="sm">
                        <Icon icon={AlertCircle} size="sm" />
                        Delete
                      </Button>
                    </Grid>
                  </Stack>
                </Card>
              </div>
            </Stack>
          </Card>

        </Stack>
      </Container>
    </PageLayout>
  )
}