// VibrationFit Design System - Live Component Library with Smart Navigation
// Complete design system with layout primitives, UI components, and responsive guidelines
// Now with intelligent show/hide sections using anchor navigation

'use client'

import React, { useState, ChangeEvent } from 'react'
import { 
  Sparkles, PartyPopper, Plane, Home, Users, Heart, 
  Activity, DollarSign, Briefcase, UserPlus, Package, 
  Gift, Zap, CheckCircle, Menu, X, Eye, PenLine, CircleCheckBig, Trash2,
  Star, Target, Shield, Crown, Plus, Minus, Edit, MessageSquare,
  Layout, PanelTop, Square, Monitor, Smartphone, Grid as GridIcon,
  Palette, FileText, Tag, TrendingUp, RotateCcw, Mouse, CreditCard,
  AlignLeft, AlignCenter, AlignRight, Loader2, AlertCircle, Info,
  ArrowRight, Play, Download, Share, Settings, MousePointer, Check, List, Image,
  Brain, Mic, Calendar, BookOpen, Headphones, Clock, BarChart3, CalendarDays
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
  VIVAButton,
  Icon,
  Select,
  Badge,
  Input,
  Textarea,
  Spinner,
  ProgressBar,
  Video,
  Modal,
  ItemListCard,
  PricingCard,
  BulletedList,
  ListItem,
  OrderedList,
  OfferStack,
  ActionButtons,
  DeleteConfirmationDialog,
} from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'


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
      className={`cursor-pointer aspect-square ${selected ? 'ring-2 ring-[#39FF14] border-[#39FF14]' : ''}`}
      onClick={onClick}
    >
      <Stack align="center" gap="xs" className="text-center px-2 justify-center h-full">
        <Icon icon={IconComponent} size="sm" color={selected ? '#39FF14' : '#00FFFF'} className="opacity-80" />
        <h4 className="text-xs font-medium text-neutral-300">{category.label}</h4>
      </Stack>
    </Card>
  )
}

const StatCard = ({ icon, label, value, variant = 'primary' }: any) => {
  const badgeStyles: any = {
    primary: 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]',
    secondary: 'bg-[#00FFFF]/20 border-[#00FFFF] text-[#00FFFF]',
    accent: 'bg-[#BF00FF]/20 border-[#BF00FF] text-[#BF00FF]',
    success: 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]',
    warning: 'bg-[#FFFF00]/20 border-[#FFFF00] text-[#FFFF00]',
    danger: 'bg-[#FF0040]/20 border-[#FF0040] text-[#FF0040]',
    error: 'bg-[#FF0040]/20 border-[#FF0040] text-[#FF0040]',
    info: 'bg-[#00FFFF]/20 border-[#00FFFF] text-[#00FFFF]',
    premium: 'bg-[#BF00FF]/20 border-[#BF00FF] text-[#BF00FF]',
    neutral: 'bg-[#9CA3AF]/20 border-[#9CA3AF] text-[#9CA3AF]'
  }
  return (
    <Card variant="glass" className="group hover:scale-105 transition-transform duration-300">
      <div className="p-6 md:p-8 text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border ${badgeStyles[variant]}`}>
          <Icon icon={icon} size="sm" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
        <p className="text-neutral-400">{label}</p>
      </div>
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
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg' | 'xl' | 'full'>('md')
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'annual' | '28day'>('annual')
  const [showDeleteDemo, setShowDeleteDemo] = useState(false)
  
  // New state for section visibility
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set(['overview']))

  const handleLoadingToggle = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  const toggleSection = (sectionId: string) => {
    setVisibleSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const showSection = (sectionId: string) => {
    setVisibleSections(prev => new Set(prev).add(sectionId))
  }

  const hideSection = (sectionId: string) => {
    setVisibleSections(prev => {
      const newSet = new Set(prev)
      newSet.delete(sectionId)
      return newSet
    })
  }

  const showAllSections = () => {
    setVisibleSections(new Set([
      'overview', 'layout-primitives', 'layout-examples', 'patterns', 'ui-components',
      'buttons', 'cards', 'badges', 'inputs', 'progress', 'video', 'modals',
      'pricing-cards', 'lists', 'feedback', 'composite-patterns', 'responsive'
    ]))
  }

  const hideAllSections = () => {
    setVisibleSections(new Set(['overview']))
  }

  return (
    <>
      <Stack gap="xl">
          
          {/* Hero */}
          <section>
            <Cover minHeight="300px" className="bg-gradient-to-br from-[#39FF14]/20 via-[#00FFFF]/10 to-[#BF00FF]/20 rounded-3xl border-2 border-[#333]">
              <Stack align="center" gap="md" className="text-center max-w-4xl">
                <h2 className="text-3xl md:text-5xl font-bold text-white">VibrationFit Design System</h2>
                <p className="text-lg md:text-xl text-[#cbd5e1]">Complete component library with layout primitives, UI components, and mobile-first responsive guidelines</p>
                <Inline gap="sm" className="mt-4">
                  <Button variant="primary" size="lg">Get Started</Button>
                  <Button variant="outline" size="lg">View Docs</Button>
                </Inline>
              </Stack>
            </Cover>
          </section>

          {/* Smart Navigation */}
          <section id="navigation">
            <Card className="bg-gradient-to-r from-[#39FF14]/10 to-[#00FFFF]/10 border-[#39FF14]/30">
              <Stack gap="md">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Smart Navigation</h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={showAllSections}>
                      Show All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={hideAllSections}>
                      Hide All
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <Button 
                    variant={visibleSections.has('overview') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('overview')}
                  >
                    <Icon icon={Layout} size="sm" className="mr-2" />
                    Overview
                  </Button>
                  <Button 
                    variant={visibleSections.has('layout-primitives') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('layout-primitives')}
                  >
                    <Icon icon={Layout} size="sm" className="mr-2" />
                    Layout Primitives
                  </Button>
                  <Button 
                    variant={visibleSections.has('layout-examples') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('layout-examples')}
                  >
                    <Icon icon={GridIcon} size="sm" className="mr-2" />
                    Layout Examples
                  </Button>
                  <Button 
                    variant={visibleSections.has('patterns') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('patterns')}
                  >
                    <Icon icon={Sparkles} size="sm" className="mr-2" />
                    Patterns
                  </Button>
                  <Button 
                    variant={visibleSections.has('ui-components') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('ui-components')}
                  >
                    <Icon icon={Square} size="sm" className="mr-2" />
                    UI Components
                  </Button>
                  <Button 
                    variant={visibleSections.has('buttons') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('buttons')}
                  >
                    <Icon icon={MousePointer} size="sm" className="mr-2" />
                    Buttons
                  </Button>
                  <Button 
                    variant={visibleSections.has('cards') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('cards')}
                  >
                    <Icon icon={Square} size="sm" className="mr-2" />
                    Cards
                  </Button>
                  <Button 
                    variant={visibleSections.has('badges') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('badges')}
                  >
                    <Icon icon={Tag} size="sm" className="mr-2" />
                    Badges
                  </Button>
                  <Button 
                    variant={visibleSections.has('inputs') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('inputs')}
                  >
                    <Icon icon={Edit} size="sm" className="mr-2" />
                    Inputs
                  </Button>
                  <Button 
                    variant={visibleSections.has('progress') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('progress')}
                  >
                    <Icon icon={Activity} size="sm" className="mr-2" />
                    Progress
                  </Button>
                  <Button 
                    variant={visibleSections.has('video') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('video')}
                  >
                    <Icon icon={Play} size="sm" className="mr-2" />
                    Video
                  </Button>
                  <Button 
                    variant={visibleSections.has('modals') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('modals')}
                  >
                    <Icon icon={Monitor} size="sm" className="mr-2" />
                    Modals
                  </Button>
                  <Button 
                    variant={visibleSections.has('pricing-cards') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('pricing-cards')}
                  >
                    <Icon icon={CreditCard} size="sm" className="mr-2" />
                    Pricing
                  </Button>
                  <Button 
                    variant={visibleSections.has('lists') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('lists')}
                  >
                    <Icon icon={List} size="sm" className="mr-2" />
                    Lists
                  </Button>
                  <Button 
                    variant={visibleSections.has('feedback') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('feedback')}
                  >
                    <Icon icon={CheckCircle} size="sm" className="mr-2" />
                    Feedback
                  </Button>
                  <Button 
                    variant={visibleSections.has('composite-patterns') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('composite-patterns')}
                  >
                    <Icon icon={Sparkles} size="sm" className="mr-2" />
                    Composite Patterns
                  </Button>
                  <Button 
                    variant={visibleSections.has('responsive') ? 'primary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => toggleSection('responsive')}
                  >
                    <Icon icon={Smartphone} size="sm" className="mr-2" />
                    Responsive
                  </Button>
                </div>
              </Stack>
            </Card>
          </section>

          {/* Overview Section */}
          {visibleSections.has('overview') && (
            <section id="overview">
              <Card>
                <Stack gap="lg">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Design System Overview</h2>
                    <p className="text-[#9CA3AF] text-sm md:text-base">Complete component library with mobile-first responsive design principles</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card variant="elevated" className="p-6">
                      <Stack gap="md" align="center">
                        <div className="w-12 h-12 bg-[#39FF14]/20 rounded-xl flex items-center justify-center">
                          <Icon icon={Palette} size="lg" color="#39FF14" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Brand Colors</h3>
                        <div className="flex gap-2">
                          <div className="w-6 h-6 bg-[#39FF14] rounded-full"></div>
                          <div className="w-6 h-6 bg-[#00FFFF] rounded-full"></div>
                          <div className="w-6 h-6 bg-[#8B5CF6] rounded-full"></div>
                          <div className="w-6 h-6 bg-[#FFB701] rounded-full"></div>
                        </div>
                      </Stack>
                    </Card>

                    <Card variant="elevated" className="p-6">
                      <Stack gap="md" align="center">
                        <div className="w-12 h-12 bg-[#00FFFF]/20 rounded-xl flex items-center justify-center">
                          <Icon icon={Smartphone} size="lg" color="#00FFFF" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Mobile-First</h3>
                        <p className="text-sm text-neutral-400 text-center">Every component is designed for mobile first, then enhanced for desktop</p>
                      </Stack>
                    </Card>

                    <Card variant="elevated" className="p-6">
                      <Stack gap="md" align="center">
                        <div className="w-12 h-12 bg-[#8B5CF6]/20 rounded-xl flex items-center justify-center">
                          <Icon icon={CheckCircle} size="lg" color="#8B5CF6" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Accessible</h3>
                        <p className="text-sm text-neutral-400 text-center">WCAG compliant with proper focus states and keyboard navigation</p>
                      </Stack>
                    </Card>
                  </div>
                </Stack>
              </Card>
            </section>
          )}

          {/* Layout Primitives */}
          {visibleSections.has('layout-primitives') && (
            <section id="layout-primitives">
              <Stack gap="lg">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Layout Primitives</h2>
                  <p className="text-[#9CA3AF] text-sm md:text-base">The 7 core containers that solve 95% of layout needs</p>
                </div>
                <Grid minWidth="200px" gap="md">
                  {[
                    { name: 'Stack', desc: 'Vertical rhythm with consistent gaps', color: '#39FF14' },
                    { name: 'Inline', desc: 'Horizontal row that stacks on mobile', color: '#00FFFF' },
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
          )}

          {/* Layout Primitive Examples */}
          {visibleSections.has('layout-examples') && (
            <section id="layout-examples">
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
                    <div className="bg-[#1F1F1F] p-4 rounded-lg">
                      <code className="text-sm text-[#39FF14]">{`<Stack gap="md">`}</code>
                      <Stack gap="md" className="mt-4">
                        <div className="bg-[#39FF14]/20 p-3 rounded-lg">
                          <code className="text-xs text-[#39FF14]">{`<Stack gap="md">`}</code>
                        </div>
                        <div className="bg-[#00FFFF]/20 p-3 rounded-lg">
                          <code className="text-xs text-[#00FFFF]">{`<Stack gap="lg">`}</code>
                        </div>
                        <div className="bg-[#8B5CF6]/20 p-3 rounded-lg">
                          <code className="text-xs text-[#8B5CF6]">{`<Stack gap="xl">`}</code>
                        </div>
                      </Stack>
                    </div>
                  </Stack>
                </Card>

                {/* Grid */}
                <Card>
                  <Stack gap="md">
                    <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Icon icon={GridIcon} size="md" color="#BF00FF" />
                      Grid - Responsive Layouts
                    </h3>
                    <div className="bg-[#1F1F1F] p-4 rounded-lg">
                      <code className="text-sm text-[#BF00FF]">{`<Grid minWidth="200px" gap="md">`}</code>
                      <Grid minWidth="200px" gap="md" className="mt-4">
                        <div className="bg-[#39FF14]/20 p-3 rounded-lg text-center text-xs">Item 1</div>
                        <div className="bg-[#39FF14]/20 p-3 rounded-lg text-center text-xs">Item 2</div>
                        <div className="bg-[#39FF14]/20 p-3 rounded-lg text-center text-xs">Item 3</div>
                        <div className="bg-[#39FF14]/20 p-3 rounded-lg text-center text-xs">Item 4</div>
                      </Grid>
                    </div>
                  </Stack>
                </Card>
              </Stack>
            </section>
          )}

          {/* Patterns */}
          {visibleSections.has('patterns') && (
            <section id="patterns">
              <Stack gap="lg">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Pattern 1: Icon + Title + Button</h2>
                  <p className="text-[#9CA3AF] text-sm md:text-base">Common pattern for feature cards and CTAs</p>
                </div>
                <Grid minWidth="250px" gap="md">
                  <Card variant="glass"><IconTitleButton icon={Activity} title="Health & Vitality" buttonText="Start Tracking" buttonVariant="primary" /></Card>
                  <Card variant="glass"><IconTitleButton icon={Heart} title="Love & Romance" buttonText="Create Vision" buttonVariant="secondary" /></Card>
                  <Card variant="glass"><IconTitleButton icon={Briefcase} title="Career & Business" buttonText="Plan Goals" buttonVariant="accent" /></Card>
                  <Card variant="glass"><IconTitleButton icon={Users} title="Relationships" buttonText="Connect" buttonVariant="ghost" /></Card>
                </Grid>
              </Stack>
            </section>
          )}

          {/* UI Components */}
          {visibleSections.has('ui-components') && (
            <section id="ui-components">
              <Stack gap="lg">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">UI Components</h2>
                  <p className="text-[#9CA3AF] text-sm md:text-base">Core interactive elements with consistent styling and behavior</p>
                </div>

                {/* Buttons */}
                <Card>
                  <Stack gap="md">
                    <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Icon icon={MousePointer} size="md" color="#39FF14" />
                      Buttons
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>

                    {/* VIVA Buttons */}
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-medium mb-2 text-white">VIVA Buttons</h4>
                        <Inline gap="md" wrap>
                          <VIVAButton size="sm">Small VIVA</VIVAButton>
                          <VIVAButton size="md">Medium VIVA</VIVAButton>
                          <VIVAButton size="lg">Large VIVA</VIVAButton>
                          <VIVAButton>Ask VIVA Assistant</VIVAButton>
                        </Inline>
                      </Stack>
                    </Card>

                    {/* ActionButtons */}
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-medium mb-2 text-white">ActionButtons</h4>
                        <p className="text-sm text-neutral-400 mb-4">Standardized View/Delete button pair</p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-neutral-300 mb-2">Default (with labels):</p>
                            <ActionButtons
                              versionType="completed"
                              viewHref="/vision-board/example"
                              onDelete={() => console.log('Delete clicked')}
                            />
                          </div>
                          <div>
                            <p className="text-sm text-neutral-300 mb-2">Icon-only (compact):</p>
                            <ActionButtons
                              versionType="completed"
                              viewHref="/vision-board/example"
                              onDelete={() => console.log('Delete clicked')}
                              showLabels={false}
                              size="sm"
                            />
                          </div>
                        </div>
                      </Stack>
                    </Card>
                  </Stack>
                </Card>
              </Stack>
            </section>
          )}

          {/* Feedback Components */}
          {visibleSections.has('feedback') && (
            <section id="feedback">
              <Stack gap="lg">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Feedback Components</h2>
                  <p className="text-[#9CA3AF] text-sm md:text-base">Status indicators, progress bars, and user feedback elements</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card variant="default" className="p-6">
                    <Stack gap="md">
                      <h4 className="text-lg font-medium text-white">Badges</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="primary">Primary</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="accent">Accent</Badge>
                        <Badge variant="neutral">Ghost</Badge>
                        <Badge variant="neutral">Outline</Badge>
                      </div>
                    </Stack>
                  </Card>

                  <Card variant="default" className="p-6">
                    <Stack gap="md">
                      <h4 className="text-lg font-medium text-white">Spinners</h4>
                      <div className="flex gap-4">
                        <Spinner variant="primary" size="sm" />
                        <Spinner variant="secondary" size="md" />
                        <Spinner variant="accent" size="lg" />
                      </div>
                    </Stack>
                  </Card>
                </div>

                <Card variant="default" className="p-6">
                  <Stack gap="md">
                    <h4 className="text-lg font-medium text-white">Progress Bars</h4>
                    <div className="space-y-4">
                      <ProgressBar value={25} max={100} variant="primary" showLabel label="Primary Progress" />
                      <ProgressBar value={50} max={100} variant="secondary" showLabel />
                      <ProgressBar value={75} max={100} variant="accent" showLabel />
                    </div>
                  </Stack>
                </Card>
              </Stack>
            </section>
          )}

          {/* Modals */}
          {visibleSections.has('modals') && (
            <section id="modals">
              <Stack gap="lg">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Overlay Components</h2>
                  <p className="text-[#9CA3AF] text-sm md:text-base">Modals, dialogs, and overlay components</p>
                </div>

                <Card variant="default" className="p-6">
                  <Stack gap="md">
                    <h4 className="text-lg font-medium text-white">Modal Sizes</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="primary" onClick={() => { setModalSize('sm'); setModalOpen(true); }}>Small Modal</Button>
                      <Button variant="secondary" onClick={() => { setModalSize('md'); setModalOpen(true); }}>Medium Modal</Button>
                      <Button variant="accent" onClick={() => { setModalSize('lg'); setModalOpen(true); }}>Large Modal</Button>
                      <Button variant="ghost" onClick={() => { setModalSize('xl'); setModalOpen(true); }}>Extra Large Modal</Button>
                    </div>
                  </Stack>
                </Card>

                <Card variant="default" className="p-6">
                  <Stack gap="md">
                    <h4 className="text-lg font-medium text-white">DeleteConfirmationDialog</h4>
                    <p className="text-sm text-neutral-400 mb-4">Beautiful delete confirmation popup</p>
                    <Button 
                      variant="danger" 
                      onClick={() => setShowDeleteDemo(true)}
                    >
                      Show Delete Dialog
                    </Button>
                  </Stack>
                </Card>
              </Stack>
            </section>
          )}

          {/* Composite Patterns */}
          {visibleSections.has('composite-patterns') && (
            <section id="composite-patterns">
              <Stack gap="lg">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Composite Patterns</h2>
                  <p className="text-[#9CA3AF] text-sm md:text-base">Complex components built from simpler primitives</p>
                </div>

                <Card variant="default" className="p-6">
                  <Stack gap="md">
                    <h4 className="text-lg font-medium text-white">Dashboard Stats Pattern</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard icon={Activity} label="Workouts This Week" value="12" variant="primary" />
                      <StatCard icon={Zap} label="Current Streak" value="7 days" variant="secondary" />
                      <StatCard icon={Heart} label="Alignment Score" value="87%" variant="primary" />
                      <StatCard icon={Target} label="Goals Completed" value="23" variant="accent" />
                    </div>
                  </Stack>
                </Card>
              </Stack>
            </section>
          )}

          {/* Responsive Guidelines */}
          {visibleSections.has('responsive') && (
            <section id="responsive">
              <Stack gap="lg">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Responsive Guidelines</h2>
                  <p className="text-[#9CA3AF] text-sm md:text-base">Mobile-first design rules and responsive patterns</p>
                </div>

                <Card variant="default" className="p-6">
                  <Stack gap="md">
                    <h4 className="text-lg font-medium text-white">Mobile-First Rules</h4>
                    <div className="space-y-4">
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                        <h5 className="font-medium text-red-400 mb-2">🚨 CRITICAL RULES</h5>
                        <ul className="text-sm text-neutral-300 space-y-1">
                          <li>• NEVER allow content to flow off-screen on mobile</li>
                          <li>• ALWAYS prioritize mobile user experience</li>
                          <li>• ALWAYS use responsive grids and layouts</li>
                        </ul>
                      </div>
                      <div className="bg-[#39FF14]/10 border border-[#39FF14]/20 p-4 rounded-lg">
                        <h5 className="font-medium text-[#39FF14] mb-2">✅ Best Practices</h5>
                        <ul className="text-sm text-neutral-300 space-y-1">
                          <li>• Use responsive text sizes: text-sm md:text-base</li>
                          <li>• Use responsive padding: px-2 md:px-4</li>
                          <li>• Test on 375px viewport minimum</li>
                          <li>• Ensure 44px+ touch targets</li>
                        </ul>
                      </div>
                    </div>
                  </Stack>
                </Card>
              </Stack>
            </section>
          )}

        </Stack>

        {/* Modals */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`${modalSize.toUpperCase()} Modal`}
          size={modalSize}
        >
          <div className="p-6">
            <p className="text-neutral-300 mb-4">
              This is a {modalSize} modal example. You can use different sizes for different content types.
            </p>
            <div className="flex gap-3">
              <Button variant="primary" onClick={() => setModalOpen(false)}>Close</Button>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </Modal>

        <DeleteConfirmationDialog
          isOpen={showDeleteDemo}
          onClose={() => setShowDeleteDemo(false)}
          onConfirm={() => {
            console.log('Delete confirmed!')
            setShowDeleteDemo(false)
          }}
          itemName="Design System Demo Item"
          itemType="Example"
          isLoading={false}
        />
    </>
  )
}