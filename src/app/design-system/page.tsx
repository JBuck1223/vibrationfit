// VibrationFit Design System - Live Component Library
// Complete design system with layout primitives, UI components, and responsive guidelines

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
  AudioPlayer,
  PlaylistPlayer,
  Heading,
  Text,
  Title,
  type AudioTrack,
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

  // Sample audio tracks for showcase
  // Note: These are placeholder URLs. Replace with your actual audio files.
  // For testing with real audio files from your life vision at:
  // /life-vision/bd8e6440-a65b-4b01-bca0-28ae8e875b3f/audio
  const sampleTracks: AudioTrack[] = [
    {
      id: '1',
      title: 'Life Vision Forward',
      artist: 'VibrationFit AI',
      duration: 180,
      url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
      thumbnail: ''
    },
    {
      id: '2',
      title: 'Health & Vitality',
      artist: 'VibrationFit AI',
      duration: 210,
      url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3',
      thumbnail: ''
    },
    {
      id: '3',
      title: 'Money & Abundance',
      artist: 'VibrationFit AI',
      duration: 195,
      url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/week7-brrring.m4a',
      thumbnail: ''
    }
  ]

  const handleLoadingToggle = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
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

          {/* Feature Jump Navigation */}
          <section id="navigation">
            <Card className="bg-gradient-to-r from-[#39FF14]/10 to-[#00FFFF]/10 border-[#39FF14]/30">
              <Stack gap="md">
                <h3 className="text-xl font-bold text-white text-center">Quick Navigation</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <a href="#layout-primitives" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={Layout} size="sm" className="mr-2" />
                      Layout
                    </Button>
                  </a>
                  <a href="#buttons" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={MousePointer} size="sm" className="mr-2" />
                      Buttons
                    </Button>
                  </a>
                  <a href="#cards" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={Square} size="sm" className="mr-2" />
                      Cards
                    </Button>
                  </a>
                  <a href="#typography" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={FileText} size="sm" className="mr-2" />
                      Typography
                    </Button>
                  </a>
                  <a href="#badges" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={Tag} size="sm" className="mr-2" />
                      Badges
                    </Button>
                  </a>
                  <a href="#inputs" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={Edit} size="sm" className="mr-2" />
                      Inputs
                    </Button>
                  </a>
                  <a href="#progress" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={Activity} size="sm" className="mr-2" />
                      Progress
                    </Button>
                  </a>
                  <a href="#video" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={Play} size="sm" className="mr-2" />
                      Video
                    </Button>
                  </a>
                  <a href="#audio" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={Headphones} size="sm" className="mr-2" />
                      Audio
                    </Button>
                  </a>
                  <a href="#modals" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={Monitor} size="sm" className="mr-2" />
                      Modals
                    </Button>
                  </a>
                  <a href="#pricing-cards" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={CreditCard} size="sm" className="mr-2" />
                      Pricing
                    </Button>
                  </a>
                  <a href="#offer-stack" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={Package} size="sm" className="mr-2" />
                      Offer Stack
                    </Button>
                  </a>
                  <a href="#list-components" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={List} size="sm" className="mr-2" />
                      Lists
                    </Button>
                  </a>
                  <a href="#categories" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={Users} size="sm" className="mr-2" />
                      Categories
                    </Button>
                  </a>
                  <a href="#stats" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={TrendingUp} size="sm" className="mr-2" />
                      Stats
                    </Button>
                  </a>
                  <a href="#interactive-demo" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={Settings} size="sm" className="mr-2" />
                      Interactive
                    </Button>
                  </a>
                  <a href="#responsive-behavior" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={Smartphone} size="sm" className="mr-2" />
                      Responsive
                    </Button>
                  </a>
                  <a href="#guidelines" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Icon icon={FileText} size="sm" className="mr-2" />
                      Guidelines
                    </Button>
                  </a>
                </div>
              </Stack>
            </Card>
          </section>
{/* Color Reference */}
<Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={Palette} size="md" color="#39FF14" />
                    Color Reference - VibrationFit Brand Palette
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Primary Colors */}
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-semibold mb-2 text-[#39FF14]">Primary Colors</h4>
                  <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#39FF14] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Primary Green</p>
                              <p className="text-xs text-[#9CA3AF]">#39FF14</p>
                  </div>
                  </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#00FF88] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Electric Green</p>
                              <p className="text-xs text-[#9CA3AF]">#00FF88</p>
                  </div>
                  </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#00CC44] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Forest Green</p>
                              <p className="text-xs text-[#9CA3AF]">#00CC44</p>
                  </div>
                  </div>
                </div>
                      </Stack>
              </Card>

                    {/* Secondary Colors */}
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-semibold mb-2 text-[#00FFFF]">Secondary Colors</h4>
                  <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#00FFFF] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Neon Cyan</p>
                              <p className="text-xs text-[#9CA3AF]">#00FFFF</p>
                  </div>
                  </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#06B6D4] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Bright Cyan</p>
                              <p className="text-xs text-[#9CA3AF]">#06B6D4</p>
                </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0F766E] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Teal Dark</p>
                              <p className="text-xs text-[#9CA3AF]">#0F766E</p>
                            </div>
                          </div>
                        </div>
                      </Stack>
              </Card>

                    {/* Accent Colors */}
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-semibold mb-2 text-[#BF00FF]">Accent Colors</h4>
                  <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#BF00FF] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Neon Purple</p>
                              <p className="text-xs text-[#9CA3AF]">#BF00FF</p>
                  </div>
                  </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#A855F7] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Bright Purple</p>
                              <p className="text-xs text-[#9CA3AF]">#A855F7</p>
                  </div>
                  </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#601B9F] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Primary Purple</p>
                              <p className="text-xs text-[#9CA3AF]">#601B9F</p>
                </div>
                          </div>
                        </div>
                      </Stack>
              </Card>

                    {/* Energy Colors */}
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-semibold mb-2 text-[#FFFF00]">Energy Colors</h4>
                  <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#FFFF00] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Neon Yellow</p>
                              <p className="text-xs text-[#9CA3AF]">#FFFF00</p>
                  </div>
                  </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#FF6600] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Neon Orange</p>
                              <p className="text-xs text-[#9CA3AF]">#FF6600</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#FF0080] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Neon Pink</p>
                              <p className="text-xs text-[#9CA3AF]">#FF0080</p>
                            </div>
                          </div>
                        </div>
                      </Stack>
                    </Card>

                    {/* Warning Colors */}
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-semibold mb-2 text-[#FF3366]">Warning Colors</h4>
                  <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#FF3366] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Electric Red</p>
                              <p className="text-xs text-[#9CA3AF]">#FF3366</p>
                  </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#FF0040] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Vibrant Red</p>
                              <p className="text-xs text-[#9CA3AF]">#FF0040</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#D03739] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Contrast Red</p>
                              <p className="text-xs text-[#9CA3AF]">#D03739</p>
                            </div>
                          </div>
                        </div>
                      </Stack>
                    </Card>

                    {/* Neutral Colors */}
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-semibold mb-2 text-[#9CA3AF]">Neutral Colors</h4>
                  <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#000000] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Pure Black</p>
                              <p className="text-xs text-[#9CA3AF]">#000000</p>
                  </div>
                </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1F1F1F] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Dark Gray</p>
                              <p className="text-xs text-[#9CA3AF]">#1F1F1F</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#404040] border-2 border-white"></div>
                            <div>
                              <p className="text-sm font-medium text-white">Medium Gray</p>
                              <p className="text-xs text-[#9CA3AF]">#404040</p>
                            </div>
                          </div>
                        </div>
                      </Stack>
              </Card>
            </div>
                </Stack>
              </Card>
              
          {/* Layout Primitives */}
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
                    <div className="p-3 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg text-sm font-medium text-center">Item 1</div>
                    <div className="p-3 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg text-sm font-medium text-center">Item 2</div>
                    <div className="p-3 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg text-sm font-medium text-center">Item 3</div>
                    <div className="p-3 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg text-sm font-medium text-center">Item 4</div>
                    <div className="p-3 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg text-sm font-medium text-center">Item 5</div>
                    <div className="p-3 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg text-sm font-medium text-center">Item 6</div>
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

          {/* Loading States */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 pb-2 border-b-4 border-[#39FF14]">Loading States</h2>
            <p className="text-[#9CA3AF] mb-8 text-lg">Branded loading indicators using the VibrationFit logo.</p>
            
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <Spinner variant="primary" size="lg" className="mx-auto mb-4" />
                  <p className="text-sm text-[#9CA3AF]">Primary Loading</p>
                </div>
                <div className="text-center">
                  <Spinner variant="secondary" size="lg" className="mx-auto mb-4" />
                  <p className="text-sm text-[#9CA3AF]">Secondary Loading</p>
                </div>
                <div className="text-center">
                  <Spinner variant="accent" size="lg" className="mx-auto mb-4" />
                  <p className="text-sm text-[#9CA3AF]">Accent Loading</p>
                </div>
                <div className="text-center">
                  <Spinner variant="branded" size="lg" className="mx-auto mb-4" />
                  <p className="text-sm text-[#9CA3AF]">Branded Loading</p>
                </div>
                </div>
              </Card>
          </section>

          {/* Frame Example */}
          <section>
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Frame - Aspect Ratio Container</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Fixed aspect ratio containers perfect for videos, images, and media content</p>
              </div>
              
              <Grid minWidth="300px" gap="md">
                <Card>
                  <Stack gap="md">
                    <h4 className="text-lg font-semibold text-white">16:9 Video Frame</h4>
                    <Frame ratio="16/9" className="bg-gradient-to-br from-[#39FF14]/20 to-[#00FFFF]/20 border border-[#39FF14]/30 rounded-lg">
                      <div className="flex items-center justify-center h-full">
                        <Icon icon={Play} size="xl" color="#39FF14" />
                      </div>
                    </Frame>
                  </Stack>
                </Card>

                <Card>
                  <Stack gap="md">
                    <h4 className="text-lg font-semibold text-white">4:3 Image Frame</h4>
                    <Frame ratio="4/3" className="bg-gradient-to-br from-[#00FFFF]/20 to-[#BF00FF]/20 border border-[#00FFFF]/30 rounded-lg">
                      <div className="flex items-center justify-center h-full">
                        <Icon icon={Image} size="xl" color="#00FFFF" />
                      </div>
                    </Frame>
                  </Stack>
                </Card>

                <Card>
                  <Stack gap="md">
                    <h4 className="text-lg font-semibold text-white">1:1 Square Frame</h4>
                    <Frame ratio="1/1" className="bg-gradient-to-br from-[#BF00FF]/20 to-[#39FF14]/20 border border-[#BF00FF]/30 rounded-lg">
                      <div className="flex items-center justify-center h-full">
                        <Icon icon={Square} size="xl" color="#BF00FF" />
                      </div>
                    </Frame>
                  </Stack>
                </Card>
              </Grid>

              {/* Code Example */}
              <Card variant="glass">
                <Stack gap="sm">
                  <h4 className="text-lg font-semibold text-white">Frame Component Usage</h4>
                  <div className="bg-black/20 p-4 rounded-lg border border-[#333]">
                    <pre className="text-xs text-neutral-300 overflow-x-auto">
{`<Frame ratio="16/9" className="bg-black rounded-lg">
  <Video src="video.mp4" />
</Frame>

<Frame ratio="4/3" className="bg-gray-100 rounded-lg">
  <Image src="image.jpg" />
</Frame>

<Frame ratio="1/1" className="bg-gradient-to-br from-primary-500 to-secondary-500">
  <div className="flex items-center justify-center">
    <Icon icon={Play} />
  </div>
</Frame>`}
                    </pre>
                  </div>
                </Stack>
              </Card>
            </Stack>
          </section>

          {/* UI Components Section */}
          <section id="buttons">
            <Stack gap="lg">
                  <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">UI Components</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Complete set of UI components with all variants</p>
                  </div>

              {/* Card Variants */}
              <Card id="cards">
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={CreditCard} size="md" color="#39FF14" />
                    Card - Container Component
                  </h3>
                  <Grid minWidth="200px" className="gap-6">
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

              {/* Typography */}
              <Card id="typography">
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={FileText} size="md" color="#39FF14" />
                    Typography - Heading & Text Components
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Heading Levels */}
                    <Card variant="default" className="p-6">
                      <Stack gap="md">
                        <h4 className="text-lg font-medium text-white">Heading Levels</h4>
                        <div className="space-y-3">
                          <div>
                            <Heading level={1}>Hero Title</Heading>
                            <p className="text-xs text-neutral-400 mt-1">
                              level={1} - 24px mobile → 48px desktop → 60px XL
                            </p>
                          </div>
                          <div>
                            <Heading level={2}>Section Title</Heading>
                            <p className="text-xs text-neutral-400 mt-1">
                              level={2} - 20px mobile → 36px desktop → 48px XL
                            </p>
                          </div>
                          <div>
                            <Heading level={3}>Subsection Title</Heading>
                            <p className="text-xs text-neutral-400 mt-1">
                              level={3} - 18px mobile → 30px desktop → 36px XL
                            </p>
                          </div>
                          <div>
                            <Heading level={4}>Card Title</Heading>
                            <p className="text-xs text-neutral-400 mt-1">
                              level={4} - 18px mobile → 24px desktop • Regular weight
                            </p>
                          </div>
                        </div>
                      </Stack>
                    </Card>
                    
                    {/* Text Sizes */}
                    <Card variant="default" className="p-6">
                      <Stack gap="md">
                        <h4 className="text-lg font-medium text-white">Text Component Sizes</h4>
                        <div className="space-y-2">
                          <div>
                            <Text size="xs" className="text-white">Text xs - 12px</Text>
                            <p className="text-xs text-neutral-400 mt-1">size="xs" - 12px</p>
                          </div>
                          <div>
                            <Text size="sm" className="text-white">Text sm - 14px → 16px</Text>
                            <p className="text-xs text-neutral-400 mt-1">size="sm" - 14px mobile → 16px desktop</p>
                          </div>
                          <div>
                            <Text size="base" className="text-white">Text base - 16px → 18px</Text>
                            <p className="text-xs text-neutral-400 mt-1">size="base" - 16px mobile → 18px desktop (default)</p>
                          </div>
                          <div>
                            <Text size="lg" className="text-white">Text lg - 18px → 20px</Text>
                            <p className="text-xs text-neutral-400 mt-1">size="lg" - 18px mobile → 20px desktop</p>
                          </div>
                          <div>
                            <Text size="xl" className="text-white">Text xl - 18px → 24px</Text>
                            <p className="text-xs text-neutral-400 mt-1">size="xl" - 18px mobile → 24px desktop</p>
                          </div>
                          <div>
                            <Text size="2xl" className="text-white">Text 2xl - 20px → 30px</Text>
                            <p className="text-xs text-neutral-400 mt-1">size="2xl" - 20px mobile → 30px desktop</p>
                          </div>
                        </div>
                      </Stack>
                    </Card>
                    
                    {/* Title List Text Pattern */}
                    <Card variant="default" className="p-6">
                      <Stack gap="md">
                        <h4 className="text-lg font-medium text-white">Title List Text Pattern</h4>
                        <div className="border border-neutral-700 rounded-lg p-6">
                          <div className="flex flex-col gap-3">
                            {/* Train */}
                            <div className="flex items-start gap-3 py-4 md:items-center">
                              <Heading level={4} className="text-[#39FF14] bg-[#39FF14]/10 px-3 py-1 rounded flex-shrink-0 w-24 text-center">Train</Heading>
                              <Text size="sm" className="text-white leading-relaxed flex-1 min-w-0 break-words">
                                Complete profile + 84‑Q assessment + first Life Vision draft (with VIVA)
                              </Text>
                            </div>
                            
                            {/* Arrow Down */}
                            <div className="flex items-center gap-3 pl-0">
                              <div className="w-24 flex justify-center">
                                <svg className="w-6 h-6 text-[#39FF14]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                              </div>
                            </div>
                            
                            {/* Tune */}
                            <div className="flex items-start gap-3 py-4 md:items-center">
                              <Heading level={4} className="text-[#39FF14] bg-[#39FF14]/10 px-3 py-1 rounded flex-shrink-0 w-24 text-center">Tune</Heading>
                              <Text size="sm" className="text-white leading-relaxed flex-1 min-w-0 break-words">
                                Refine your vision, build your Vision Board, start the Activation Protocol
                              </Text>
                            </div>
                            
                            {/* Arrow Down */}
                            <div className="flex items-center gap-3 pl-0">
                              <div className="w-24 flex justify-center">
                                <svg className="w-6 h-6 text-[#39FF14]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                              </div>
                            </div>
                            
                            {/* Track */}
                            <div className="flex items-start gap-3 py-4 md:items-center">
                              <Heading level={4} className="text-[#39FF14] bg-[#39FF14]/10 px-3 py-1 rounded flex-shrink-0 w-24 text-center">Track</Heading>
                              <Text size="sm" className="text-white leading-relaxed flex-1 min-w-0 break-words">
                                Journal daily, log iterations, watch streaks and wins grow
                              </Text>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-neutral-800 rounded-lg">
                          <p className="text-xs text-neutral-400 mb-2">Pattern:</p>
                          <pre className="text-xs text-neutral-300 overflow-x-auto">
{`<div className="flex flex-col gap-3">
  <div className="flex items-start gap-3 py-4 md:items-center">
    <Heading level={4} className="text-[#39FF14] bg-[#39FF14]/10 px-3 py-1 rounded flex-shrink-0 w-24 text-center">
      Train
    </Heading>
    <Text size="sm" className="text-white leading-relaxed flex-1 min-w-0 break-words">
      Description text here
    </Text>
  </div>
  
  <div className="flex items-center gap-3 pl-0">
    <div className="w-24 flex justify-center">
      {/* Arrow icon */}
    </div>
  </div>
</div>`}
                          </pre>
                        </div>
                      </Stack>
                    </Card>
                  </div>
                  
                  {/* Documentation */}
                  <div className="mt-6 p-6 bg-neutral-800 rounded-lg">
                    <h4 className="text-lg font-semibold mb-3 text-white">Typography Documentation</h4>
                    <div className="space-y-4 text-sm text-neutral-300">
                      <div>
                        <h5 className="font-semibold text-[#39FF14] mb-2">Heading Component</h5>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li><code className="bg-neutral-900 px-1 py-0.5 rounded">&lt;Heading level={1}&gt;</code> - Hero titles (24px → 48px → 60px) • Bold</li>
                          <li><code className="bg-neutral-900 px-1 py-0.5 rounded">&lt;Heading level={2}&gt;</code> - Section titles (20px → 36px → 48px) • Bold</li>
                          <li><code className="bg-neutral-900 px-1 py-0.5 rounded">&lt;Heading level={3}&gt;</code> - Subsection titles (18px → 30px → 36px) • Bold</li>
                          <li><code className="bg-neutral-900 px-1 py-0.5 rounded">&lt;Heading level={4}&gt;</code> - Card titles (18px → 24px) • Regular</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-[#00FFFF] mb-2">Text Component</h5>
                        <p className="text-xs mb-2">All Text components default to 16px mobile and 18px desktop:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li><code className="bg-neutral-900 px-1 py-0.5 rounded">size="xs"</code> - 12px</li>
                          <li><code className="bg-neutral-900 px-1 py-0.5 rounded">size="sm"</code> - 14px → 16px (mobile → desktop)</li>
                          <li><code className="bg-neutral-900 px-1 py-0.5 rounded">size="base"</code> - 16px → 18px (mobile → desktop)</li>
                          <li><code className="bg-neutral-900 px-1 py-0.5 rounded">size="lg"</code> - 18px → 20px (mobile → desktop)</li>
                          <li><code className="bg-neutral-900 px-1 py-0.5 rounded">size="xl"</code> - 18px → 24px (mobile → desktop)</li>
                          <li><code className="bg-neutral-900 px-1 py-0.5 rounded">size="2xl"</code> - 20px → 30px (mobile → desktop)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </Stack>
              </Card>

              {/* Buttons */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={Mouse} size="md" color="#00FFFF" />
                    Buttons - Interactive Elements
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
                </Stack>
              </Card>

              {/* Standardized Action Components */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={CheckCircle} size="md" color="#39FF14" />
                    Standardized Action Components
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ActionButtons */}
                    <Card variant="default" className="p-6">
                      <Stack gap="md">
                        <h4 className="text-lg font-medium text-white">ActionButtons</h4>
                        <p className="text-sm text-[#9CA3AF] mb-4">Standardized View/Delete button pair for list cards</p>
                        
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
                          
                          <div>
                            <p className="text-sm text-neutral-300 mb-2">Custom variants:</p>
                            <ActionButtons
                              versionType="completed"
                              viewHref="/vision-board/example"
                              onDelete={() => console.log('Delete clicked')}
                              variant="secondary"
                              deleteVariant="danger"
                              size="md"
                            />
                          </div>
                        </div>
                      </Stack>
                    </Card>

                    {/* DeleteConfirmationDialog */}
                    <Card variant="default" className="p-6">
                      <Stack gap="md">
                        <h4 className="text-lg font-medium text-white">DeleteConfirmationDialog</h4>
                        <p className="text-sm text-[#9CA3AF] mb-4">Beautiful delete confirmation popup</p>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-neutral-300 mb-2">Click to see the dialog:</p>
                            <Button 
                              variant="danger" 
                              onClick={() => setShowDeleteDemo(true)}
                            >
                              Show Delete Dialog
                            </Button>
                          </div>
                          
                          <div className="text-xs text-neutral-400">
                            <p className="mb-2">Features:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Beautiful red trash icon</li>
                              <li>Customizable item type</li>
                              <li>Loading states</li>
                              <li>Mobile responsive</li>
                              <li>Accessibility built-in</li>
                            </ul>
                          </div>
                        </div>
                      </Stack>
                    </Card>
                  </div>
                </Stack>
              </Card>

              {/* Buttons with Icons */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={MousePointer} size="md" color="#39FF14" />
                    Buttons with Icons
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left side - Button with icon on left */}
                    <Card variant="default" className="p-6">
                      <Stack gap="md">
                        <h4 className="text-lg font-medium text-white">Icon Left + Text</h4>
                        <p className="text-sm text-[#9CA3AF] mb-4">Icon positioned to the left of text</p>
                        <Inline gap="md">
                          <Button variant="primary" size="lg">
                            <Icon icon={ArrowRight} size="sm" />
                            Get Started
                          </Button>
                          <Button variant="secondary" size="lg">
                            <Icon icon={Play} size="sm" />
                            Watch Video
                          </Button>
                        </Inline>
                      </Stack>
                    </Card>

                    {/* Right side - Button with icon on right */}
                    <Card variant="default" className="p-6">
                      <Stack gap="md">
                        <h4 className="text-lg font-medium text-white">Text + Icon Right</h4>
                        <p className="text-sm text-[#9CA3AF] mb-4">Icon positioned to the right of text</p>
                        <Inline gap="md">
                          <Button variant="primary" size="lg">
                            Learn More
                            <Icon icon={ArrowRight} size="sm" />
                          </Button>
                          <Button variant="secondary" size="lg">
                            Download
                            <Icon icon={Download} size="sm" />
                          </Button>
                        </Inline>
                      </Stack>
                    </Card>
                </div>

                  {/* Different sizes with icons */}
                  <Card variant="default" className="p-6">
                    <Stack gap="md">
                      <h4 className="text-lg font-medium text-white">All Sizes with Icons</h4>
                      <p className="text-sm text-[#9CA3AF] mb-4">Testing icons across all button sizes</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="primary" size="sm">
                          <Icon icon={Star} size="xs" />
                          Small
                        </Button>
                        <Button variant="primary" size="md">
                          <Icon icon={Star} size="xs" />
                          Medium
                        </Button>
                        <Button variant="primary" size="lg">
                          <Icon icon={Star} size="sm" />
                          Large
                        </Button>
                        <Button variant="primary" size="xl">
                          <Icon icon={Star} size="sm" />
                          Extra Large
                        </Button>
                </div>
                    </Stack>
              </Card>

                  {/* Icon-only buttons */}
                  <Card variant="default" className="p-6">
                    <Stack gap="md">
                      <h4 className="text-lg font-medium text-white">Icon-Only Buttons</h4>
                      <p className="text-sm text-[#9CA3AF] mb-4">Buttons with only icons, no text</p>
                      <Inline gap="md">
                        <Button variant="ghost" size="md" className="w-12 h-12 p-0">
                          <Icon icon={Heart} size="md" />
                        </Button>
                        <Button variant="ghost" size="lg" className="w-14 h-14 p-0">
                          <Icon icon={Share} size="md" />
                        </Button>
                        <Button variant="outline" size="md" className="w-12 h-12 p-0">
                          <Icon icon={Settings} size="md" />
                        </Button>
                        <Button variant="primary" size="lg" className="w-14 h-14 p-0">
                          <Icon icon={Plus} size="md" />
                        </Button>
                      </Inline>
                    </Stack>
                  </Card>
                </Stack>
              </Card>

              

              {/* Media Components */}
              <Card id="video">
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={Monitor} size="md" color="#39FF14" />
                    Media Components
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Video Component */}
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-medium mb-2 text-white">Video Player</h4>
                        <p className="text-sm text-[#9CA3AF] mb-4">Responsive video with VibrationFit styling and YouTube-style play button</p>
                        
                        <Video 
                          src="https://vibration-fit-client-storage.s3.amazonaws.com/site-assets/video/marketing/hero/intro-video-active-1080p.mp4"
                          poster="https://vibration-fit-client-storage.s3.amazonaws.com/site-assets/video/marketing/hero/intro-video-active-poster.jpg"
                          variant="default"
                          controls
                          className="w-full"
                          trackingId="intro-video-active-demo"
                          quality="auto"
                          saveProgress={false}
                          showLeadCaptureAt={50}
                          onMilestoneReached={(milestone, time) => {
                            console.log(`Video reached ${milestone}% at ${time}s`)
                            // Trigger marketing events here
                            // Example: trackEvent('video_milestone', { milestone, time })
                          }}
                          onLeadCapture={(data) => {
                            console.log('Lead captured:', data)
                            // Send to your marketing platform
                            // Example: addToMailchimp(data.email, data.name)
                          }}
                        />
                      </Stack>
                </Card>

                    {/* Modal Component */}
                    <Card variant="default" className="p-4" id="modals">
                      <Stack gap="sm">
                        <h4 className="text-lg font-medium mb-2 text-white">Modal Dialog</h4>
                        <p className="text-sm text-[#9CA3AF] mb-4">Accessible modal with overlay and animations</p>
                        
                        <Stack gap="sm">
                          <Button 
                            variant="primary" 
                            onClick={() => setModalOpen(true)}
                          >
                            Open Modal
                          </Button>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => setModalSize('sm')}
                            >
                              Small
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => setModalSize('lg')}
                            >
                              Large
                            </Button>
                          </div>
                        </Stack>
                      </Stack>
                </Card>

                    {/* Video Modal Component */}
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-medium mb-2 text-white">Video Modal</h4>
                        <p className="text-sm text-[#9CA3AF] mb-4">Modal with embedded video player</p>
                        
                        <Stack gap="sm">
                          <Button 
                            variant="primary" 
                            onClick={() => setVideoModalOpen(true)}
                          >
                            <Icon icon={Play} size="sm" className="mr-2" />
                            Open Video Modal
                          </Button>
                        </Stack>
                      </Stack>
                </Card>
                  </div>
                </Stack>
                </Card>

              {/* Audio Players */}
              <Card id="audio">
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={Headphones} size="md" color="#39FF14" />
                    Audio Players
                  </h3>
                  
                  {/* Notice about demo audio */}
                  <Card variant="outlined" className="p-4 bg-amber-500/10 border-amber-500/30">
                    <Stack gap="sm">
                      <div className="flex items-center gap-2">
                        <Icon icon={AlertCircle} size="sm" className="text-amber-500" />
                        <h4 className="text-sm font-semibold text-amber-500">Demo Audio Files</h4>
                      </div>
                      <p className="text-sm text-neutral-300">
                        The demo audio files used here are sample URLs. In production, replace these with your actual audio file URLs from your media server.
                      </p>
                    </Stack>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Individual Audio Player */}
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-medium mb-2 text-white">Individual Audio Player</h4>
                        <p className="text-sm text-[#9CA3AF] mb-4">Single track player with progress bar, volume control, and time display</p>
                        
                        <AudioPlayer 
                          track={sampleTracks[0]} 
                          showInfo={true}
                        />
                      </Stack>
                    </Card>

                    {/* Playlist Player */}
                    <Card variant="default" className="p-4">
                      <Stack gap="sm">
                        <h4 className="text-lg font-medium mb-2 text-white">Playlist Player</h4>
                        <p className="text-sm text-[#9CA3AF] mb-4">Full-featured player with shuffle, repeat, and queue management</p>
                        
                        <PlaylistPlayer 
                          tracks={sampleTracks} 
                        />
                      </Stack>
                    </Card>
                  </div>

                  {/* Usage Code Example */}
                  <Card variant="default" className="p-4 mt-6">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">Audio Player Usage</h4>
                      <div className="bg-black/20 p-4 rounded-lg border border-[#333]">
                        <pre className="text-xs text-neutral-300 overflow-x-auto">
{`// Individual Audio Player
import { AudioPlayer, type AudioTrack } from '@/lib/design-system'

const track: AudioTrack = {
  id: '1',
  title: 'Your Vision Forward',
  artist: 'VibrationFit AI',
  duration: 180,
  url: 'https://media.vibrationfit.com/audio.mp3'
}

<AudioPlayer 
  track={track} 
  showInfo={true}
  onTrackEnd={() => console.log('Track ended')}
/>

// Playlist Player
import { PlaylistPlayer } from '@/lib/design-system'

const tracks: AudioTrack[] = [/* multiple tracks */]

<PlaylistPlayer 
  tracks={tracks}
  autoPlay={false}
/>`}
                        </pre>
                      </div>
                    </Stack>
                  </Card>
                </Stack>
              </Card>

              {/* Feedback Components */}
              <Card id="progress">
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={Loader2} size="md" color="#39FF14" />
                    Feedback Components
                  </h3>
                  
                  {/* Spinner */}
                  <Card variant="default" className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div className="text-center">
                        <Spinner variant="primary" size="lg" className="mx-auto mb-4" />
                        <p className="text-sm text-[#9CA3AF]">Primary Loading</p>
              </div>
                      <div className="text-center">
                        <Spinner variant="secondary" size="lg" className="mx-auto mb-4" />
                        <p className="text-sm text-[#9CA3AF]">Secondary Loading</p>
            </div>
                      <div className="text-center">
                        <Spinner variant="accent" size="lg" className="mx-auto mb-4" />
                        <p className="text-sm text-[#9CA3AF]">Accent Loading</p>
              </div>
                      <div className="text-center">
                        <Spinner variant="branded" size="lg" className="mx-auto mb-4" />
                        <p className="text-sm text-[#9CA3AF]">Branded Loading</p>
            </div>
                    </div>
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

              {/* Item List Cards */}
              <Card id="pricing-cards">
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={List} size="md" color="#39FF14" />
                    Item List Cards
                  </h3>
                  
                  {/* Item List Card Example */}
                  <Card variant="default" className="p-4">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">Item List Card - Feature Lists</h4>
                      
                      {/* Component Usage */}
                      <ItemListCard
                        title="72-Hour Vision Activation Intensive"
                        items={[
                          'Life Vision Draft + Final',
                          'Vision Board (Custom Built)',
                          'Two Activation Audios',
                          '7-Day Streak Launcher',
                          'Small-Group Calibration',
                          'Template Vault + Prompt Library',
                        ]}
                        iconColor="#39FF14"
                        variant="default"
                      />
                      
                      <div className="text-sm text-neutral-400 mt-4">
                        <strong>Mobile Issues:</strong> Grid uses minmax(200px, 1fr) which can cause overflow on mobile.
                        <br />
                        <strong>Solution:</strong> Use responsive grid with smaller minWidth or stack on mobile.
                        <br />
                        <strong>Best Practice:</strong> Test on iPhone SE (375px) and iPhone 12 (390px) for mobile compatibility.
                      </div>
                      
                      {/* Code Example */}
                      <div className="bg-black/20 p-4 rounded-lg border border-[#333] mt-4">
                        <pre className="text-xs text-neutral-300 overflow-x-auto">
{`<ItemListCard
  title="72-Hour Vision Activation Intensive"
  items={[
    'Life Vision Draft + Final',
    'Vision Board (Custom Built)',
    'Two Activation Audios',
  ]}
  iconColor="#39FF14"
  variant="default"
/>`}
                        </pre>
                      </div>
                    </Stack>
                  </Card>
                </Stack>
                </Card>

              {/* Pricing Cards */}
              <Card>
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={Crown} size="md" color="#39FF14" />
                    Feature Cards
                  </h3>
                  
                  {/* Pricing Card Example */}
                  <Card variant="default" className="p-4">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">Feature Card - Plan Example</h4>
                      
                      {/* Component Usage */}
                      <PricingCard
                        title="Vision Pro Annual"
                        price="$999/year"
                        description="$83/month • Save vs. every-4-weeks"
                        badge="Best Value"
                        icon={Crown}
                        iconColor="#39FF14"
                        selected={true}
                        variant="elevated"
                      />
                      
                      <div className="text-sm text-neutral-400 mt-4">
                        <strong>Mobile Issues:</strong> Flex layout with w-full md:flex-1 can cause alignment issues.
                        <br />
                        <strong>Solution:</strong> Use proper responsive classes and test on mobile devices.
                      </div>
                      
                      {/* Code Example */}
                      <div className="bg-black/20 p-4 rounded-lg border border-[#333] mt-4">
                        <pre className="text-xs text-neutral-300 overflow-x-auto">
{`<PricingCard
  title="Vision Pro Annual"
  price="$999/year"
  description="$83/month • Save vs. every-4-weeks"
  badge="Best Value"
  icon={Crown}
  iconColor="#39FF14"
  selected={true}
  variant="elevated"
  onClick={() => setSelectedPlan('annual')}
/>`}
                        </pre>
                      </div>
                    </Stack>
                  </Card>
                </Stack>
                </Card>

              {/* Offer Stack Accordion */}
              <Card id="offer-stack">
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={Package} size="md" color="#39FF14" />
                    Offer Stack Accordion
                  </h3>
                  
                  {/* Offer Stack Example */}
                  <Card variant="default" className="p-4">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">OfferStack - Individual Accordion Items</h4>
                      <p className="text-sm text-neutral-400 mb-4">
                        Each item is its own accordion that can be clicked to expand and show detailed descriptions.
                        Perfect for pricing pages and feature breakdowns.
                      </p>
                      
                      {/* Component Usage */}
                      <OfferStack
                        title="What's Included in Your 72-Hour Intensive"
                        subtitle="Everything you need to activate your Life Vision"
                        items={[
                          {
                            id: 'assessment',
                            title: 'Vibration Assessment',
                            description: 'Complete 84-question assessment to identify your current vibration level and areas for growth.',
                            icon: Brain,
                            included: true
                          },
                          {
                            id: 'viva-vision',
                            title: 'VIVA Vision Creation',
                            description: 'AI-powered Life Vision creation across all 12 life categories with personalized guidance.',
                            icon: Sparkles,
                            included: true
                          },
                          {
                            id: 'vision-audio',
                            title: 'Vision Audio Generation',
                            description: 'Custom AM/PM audio tracks generated from your Life Vision for daily activation.',
                            icon: Headphones,
                            included: true
                          },
                          {
                            id: 'vision-board',
                            title: 'Vision Board Creation',
                            description: 'AI-generated vision board with 12 images (1 per category) to visualize your goals.',
                            icon: Image,
                            included: true
                          },
                          {
                            id: 'journal',
                            title: 'Journal System',
                            description: 'Three journal entry types: Gratitude, Connect-the-Dots, and Progress tracking.',
                            icon: BookOpen,
                            included: true
                          },
                          {
                            id: 'calibration-call',
                            title: '30-Min Calibration Call',
                            description: 'Live 1:1 session to refine your vision and ensure alignment with your goals.',
                            icon: CalendarDays,
                            included: true
                          },
                          {
                            id: 'activation-protocol',
                            title: 'Activation Protocol',
                            description: 'Daily rituals and completion ceremony to maintain momentum and track progress.',
                            icon: Zap,
                            included: true
                          },
                          {
                            id: '8-weeks-included',
                            title: '8 Weeks Vision Pro Included',
                            description: 'Full Vision Pro access for 8 weeks, automatically transitions to your selected plan on Day 56.',
                            icon: Crown,
                            included: true
                          }
                        ]}
                        defaultExpanded={['assessment', 'viva-vision']}
                        allowMultiple={true}
                      />
                      
                      {/* Code Example */}
                      <div className="bg-black/20 p-4 rounded-lg border border-[#333] mt-4">
                        <pre className="text-xs text-neutral-300 overflow-x-auto">
{`<OfferStack
  title="What's Included in Your 72-Hour Intensive"
  subtitle="Everything you need to activate your Life Vision"
  items={[
    {
      id: 'assessment',
      title: 'Vibration Assessment',
      description: 'Complete 84-question assessment...',
      icon: Brain,
      included: true
    },
    {
      id: 'viva-vision',
      title: 'VIVA Vision Creation',
      description: 'AI-powered Life Vision creation...',
      icon: Sparkles,
      included: true
    },
    // ... more items
  ]}
  defaultExpanded={['assessment', 'viva-vision']}
  allowMultiple={true}
/>`}
                        </pre>
                      </div>
                    </Stack>
                  </Card>
                </Stack>
              </Card>

              {/* List Components */}
              <Card id="list-components">
                <Stack gap="md">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon={List} size="md" color="#39FF14" />
                    List Components
                  </h3>
                  
                  {/* Bulleted Lists */}
                  <Card variant="default" className="p-4">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">BulletedList - Brand-Colored Lists</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="text-sm font-medium text-neutral-400 mb-2">Default</h5>
                          <BulletedList>
                            <ListItem>Vision creation and refinement</ListItem>
                            <ListItem>AI-powered insights and guidance</ListItem>
                            <ListItem>Progress tracking and analytics</ListItem>
                          </BulletedList>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-neutral-400 mb-2">Primary (Green)</h5>
                          <BulletedList variant="primary">
                            <ListItem>Above the Green Line</ListItem>
                            <ListItem>Growth and alignment</ListItem>
                            <ListItem>Success metrics</ListItem>
                          </BulletedList>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-neutral-400 mb-2">Accent (Purple)</h5>
                          <BulletedList variant="accent">
                            <ListItem>Premium AI features</ListItem>
                            <ListItem>Advanced analytics</ListItem>
                            <ListItem>Priority support</ListItem>
                          </BulletedList>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-neutral-400 mb-2">Warning (Yellow)</h5>
                          <BulletedList variant="warning">
                            <ListItem>Action required</ListItem>
                            <ListItem>Attention needed</ListItem>
                            <ListItem>Important updates</ListItem>
                          </BulletedList>
                        </div>
                      </div>
                      <div className="mt-4">
                        <pre className="bg-neutral-800 p-4 rounded-lg text-sm text-neutral-300 overflow-x-auto">
{`<BulletedList variant="primary">
  <ListItem>Above the Green Line</ListItem>
  <ListItem>Growth and alignment</ListItem>
  <ListItem>Success metrics</ListItem>
</BulletedList>`}
                        </pre>
                      </div>
                    </Stack>
                  </Card>

                  {/* List Items with Icons */}
                  <Card variant="default" className="p-4">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">ListItem - Custom Icons</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="text-sm font-medium text-neutral-400 mb-2">With Icons</h5>
                          <BulletedList>
                            <ListItem icon={CheckCircle}>Task completed</ListItem>
                            <ListItem icon={Zap}>Energy boost</ListItem>
                            <ListItem icon={Star}>Achievement unlocked</ListItem>
                            <ListItem icon={Target}>Goal achieved</ListItem>
                          </BulletedList>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-neutral-400 mb-2">Different Sizes</h5>
                          <BulletedList size="sm" spacing="tight">
                            <ListItem>Small compact list</ListItem>
                            <ListItem>Perfect for summaries</ListItem>
                          </BulletedList>
                          <div className="mt-4">
                            <BulletedList size="lg" spacing="loose">
                              <ListItem>Large prominent list</ListItem>
                              <ListItem>Great for important content</ListItem>
                            </BulletedList>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <pre className="bg-neutral-800 p-4 rounded-lg text-sm text-neutral-300 overflow-x-auto">
{`<BulletedList>
  <ListItem icon={CheckCircle}>Task completed</ListItem>
  <ListItem icon={Zap}>Energy boost</ListItem>
  <ListItem icon={Star}>Achievement unlocked</ListItem>
</BulletedList>`}
                        </pre>
                      </div>
                    </Stack>
                  </Card>

                  {/* Ordered Lists */}
                  <Card variant="default" className="p-4">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-white">OrderedList - Numbered Lists</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="text-sm font-medium text-neutral-400 mb-2">Default</h5>
                          <OrderedList>
                            <li>Create your life vision</li>
                            <li>Set specific goals</li>
                            <li>Track your progress</li>
                            <li>Celebrate achievements</li>
                          </OrderedList>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-neutral-400 mb-2">Secondary (Teal)</h5>
                          <OrderedList variant="secondary">
                            <li>Clarity and flow</li>
                            <li>Calm energy</li>
                            <li>Information processing</li>
                            <li>Mental alignment</li>
                          </OrderedList>
                        </div>
                      </div>
                      <div className="mt-4">
                        <pre className="bg-neutral-800 p-4 rounded-lg text-sm text-neutral-300 overflow-x-auto">
{`<OrderedList variant="secondary">
  <li>Clarity and flow</li>
  <li>Calm energy</li>
  <li>Information processing</li>
  <li>Mental alignment</li>
</OrderedList>`}
                        </pre>
                      </div>
                    </Stack>
                  </Card>

                  {/* Usage Guidelines */}
                  <Card variant="outlined" className="p-4 border-[#39FF14]/20">
                    <Stack gap="sm">
                      <h4 className="text-lg font-medium mb-2 text-[#39FF14]">Usage Guidelines</h4>
                      <BulletedList variant="primary" size="sm">
                        <ListItem>Use <code className="bg-neutral-800 px-1 rounded">BulletedList</code> for unordered items</ListItem>
                        <ListItem>Use <code className="bg-neutral-800 px-1 rounded">OrderedList</code> for sequential steps</ListItem>
                        <ListItem>Choose variants based on content context (primary for success, warning for alerts)</ListItem>
                        <ListItem>Add custom icons with <code className="bg-neutral-800 px-1 rounded">icon</code> prop</ListItem>
                        <ListItem>Adjust <code className="bg-neutral-800 px-1 rounded">size</code> and <code className="bg-neutral-800 px-1 rounded">spacing</code> for hierarchy</ListItem>
                      </BulletedList>
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
                          defaultValue="Invalid input"
                          error="This is an error message"
                        />
                        <Input
                          label="Disabled Input"
                          placeholder="This input is disabled"
                          defaultValue="Disabled text"
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
                          defaultValue="Invalid message"
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
              <Card id="badges">
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
                  <Card variant="glass" className="px-2.5 py-4 md:px-4">
                    <Switcher gap="lg" className="items-start md:items-center justify-between">
                      {/* Left side - Version info */}
                      <div className="flex-1">
                        <Stack gap="sm">
                          <div className="flex items-center gap-1 md:gap-3 mb-2">
                            <span className="text-sm font-medium text-white">Version 2</span>
                            <Badge variant="success">Complete</Badge>
                            <span className="text-sm text-neutral-400">100% complete</span>
                          </div>
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
          <section id="categories">
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">All Life Categories</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Responsive grid - click to select (12 across on desktop, 4 across on mobile)</p>
            </div>
              <div className="grid grid-cols-4 md:grid-cols-12 gap-2 md:gap-3">
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
          <section id="stats">
            <Stack gap="lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Dashboard Stats Pattern</h2>
                <p className="text-[#9CA3AF] text-sm md:text-base">Responsive stat cards with icons and trends</p>
              </div>
              <Grid minWidth="200px" gap="md">
                <StatCard icon={Activity} label="Workouts This Week" value="12" variant="primary" />
                <StatCard icon={Zap} label="Current Streak" value="7 days" variant="secondary" />
                <StatCard icon={CheckCircle} label="Goals Achieved" value="24" variant="accent" />
                <StatCard icon={Heart} label="Alignment Score" value="87%" variant="primary" />
              </Grid>
            </Stack>
          </section>

          {/* Forms */}
          <section id="inputs">
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
          <section id="interactive-demo">
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
          <section id="responsive-behavior">
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

          {/* Responsive Design Guidelines */}
          <section id="guidelines">
            <Card variant="glass" className="border-2 border-[#FF0040]/30">
              <Stack gap="md">
                <h2 className="text-xl md:text-2xl font-bold text-[#FF0040]">🚨 Mobile-First Design Rules</h2>
                <div className="text-[#cbd5e1] space-y-4 text-sm md:text-base">
                  
                  <div className="bg-black/20 p-4 rounded-lg border border-[#FF0040]/20">
                    <h3 className="text-white font-semibold mb-2">Grid minWidth Rules:</h3>
                    <p className="text-[#FF0040]">❌ NEVER use minWidth &gt; 350px</p>
                    <p className="text-[#39FF14]">✅ USE minWidth="300px" for content, "200px" for small items</p>
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg border border-[#FF0040]/20">
                    <h3 className="text-white font-semibold mb-2">Text Size Rules:</h3>
                    <p className="text-[#FF0040]">❌ NEVER use fixed large text (text-4xl) without responsive variants</p>
                    <p className="text-[#39FF14]">✅ ALWAYS use responsive: text-xl md:text-4xl</p>
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg border border-[#FF0040]/20">
                    <h3 className="text-white font-semibold mb-2">Spacing Rules:</h3>
                    <p className="text-[#FF0040]">❌ NEVER use fixed large spacing (mx-8) on mobile</p>
                    <p className="text-[#39FF14]">✅ ALWAYS use responsive: mx-2 md:mx-4</p>
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg border border-[#FF0040]/20">
                    <h3 className="text-white font-semibold mb-2">Testing Checklist:</h3>
                    <p className="text-white">✅ iPhone SE (375px) - smallest mobile</p>
                    <p className="text-white">✅ iPhone 12/13/14 (390px) - standard mobile</p>
                    <p className="text-white">✅ iPad (768px) - tablet breakpoint</p>
                    <p className="text-white">✅ Desktop (1200px+) - desktop experience</p>
                  </div>

                  <p className="text-[#FF0040] font-semibold">⚠️ Always test on mobile first to prevent overflow issues!</p>
                </div>
              </Stack>
              </Card>
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
                  <p><strong className="text-white">5. Special Components:</strong> VIVAButton for VIVA assistant features</p>
                  <p className="text-[#39FF14] font-semibold">⚡ Rebuild your entire site using ONLY these primitives and components for 100% predictable, mobile-friendly behavior.</p>
            </div>
              </Stack>
            </Card>
          </section>

      </Stack>
      
      {/* Modal Example */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Design System Modal"
        size={modalSize}
        variant="hero"
      >
        <Stack gap="md">
          <p className="text-[#9CA3AF]">
            This is a fully accessible modal with VibrationFit styling. 
            It includes backdrop blur, keyboard navigation, and proper ARIA attributes.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="primary" 
              onClick={() => setModalSize('sm')}
            >
              Small Size
                </Button>
            <Button 
              variant="secondary" 
              onClick={() => setModalSize('lg')}
            >
              Large Size
                </Button>
              </div>
          
          <div className="pt-4 border-t border-[#404040]">
            <Button 
              variant="outline" 
              onClick={() => setModalOpen(false)}
              className="w-full"
            >
              Close Modal
            </Button>
      </div>
        </Stack>
      </Modal>

      {/* Video Modal Example */}
      {videoModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setVideoModalOpen(false)}
        >
          {/* Semi-transparent black background */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Video container with green border */}
          <div 
            className="relative border-2 border-[#39FF14] rounded-lg overflow-hidden max-w-4xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-black">
              <Video
                src="https://vibration-fit-client-storage.s3.amazonaws.com/site-assets/video/marketing/hero/intro-video-active-1080p.mp4"
                poster="https://vibration-fit-client-storage.s3.amazonaws.com/site-assets/video/marketing/hero/intro-video-active-poster.jpg"
                className="w-full h-full"
                variant="default"
                controls
                trackingId="intro-video-modal-demo"
                quality="auto"
                saveProgress={false}
                showLeadCaptureAt={50}
                onMilestoneReached={(milestone, time) => {
                  console.log(`Video reached ${milestone}% at ${time}s`)
                }}
                onLeadCapture={(data) => {
                  console.log('Lead captured:', data)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* VISION PRO MEMBERSHIP SECTION FROM COMMIT 9236e41 */}
      <section className="py-12">
        <Stack gap="lg">
          <Stack align="center" gap="md">
            <h2 className="text-3xl font-bold text-white">Vision Pro Membership Section (From Commit 9236e41)</h2>
            <p className="text-lg text-neutral-300 text-center max-w-3xl">
              The original "Then Continue With Vision Pro Membership" section with toggle and detailed cards
            </p>
          </Stack>

          <div className="mb-16">
            <div className="text-center mb-12">
              <Badge variant="success" className="mb-4">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Then Continue With
              </Badge>
              <h2 className="text-5xl font-bold mb-4 text-white">
                Vision Pro Membership
              </h2>
              <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-8">
                Keep your vision active with ongoing access, tools, and support
              </p>

              {/* Billing Toggle */}
              <div className="inline-flex items-center gap-2 p-2 bg-neutral-800/80 backdrop-blur-sm rounded-full border border-neutral-700">
                <button 
                  onClick={() => setBillingPeriod('annual')}
                  className={`px-8 py-3.5 rounded-full font-semibold transition-all duration-300 ${
                    billingPeriod === 'annual'
                      ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/30 scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    Annual
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFB701] text-black shadow-md">
                      Save 22%
                    </span>
                  </span>
                </button>
                <button 
                  onClick={() => setBillingPeriod('28day')}
                  className={`px-8 py-3.5 rounded-full font-semibold transition-all duration-300 ${
                    billingPeriod === '28day'
                      ? 'bg-[#00FFFF] text-black shadow-lg shadow-[#00FFFF]/30 scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
                  }`}
                >
                  28-Day
                </button>
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-6 gap-y-12 max-w-5xl mx-auto">
              
              {/* Annual Plan - Show first on mobile if selected */}
              {billingPeriod === 'annual' && (
                <Card 
                  className={`p-10 transition-all relative cursor-pointer md:order-1 order-1 ${
                    billingPeriod === 'annual'
                      ? 'border-2 border-[#39FF14] bg-gradient-to-br from-primary-500/5 to-secondary-500/5 scale-105 ring-2 ring-[#39FF14]'
                      : 'border border-neutral-700 opacity-60 hover:opacity-80'
                  }`}
                  onClick={() => setBillingPeriod('annual')}
                >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-[#39FF14] text-black px-4 py-1 text-sm font-bold rounded-full shadow-lg">
                    Best Value
                  </div>
                </div>

                <div className="text-center mb-8">
                  <Crown className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">Vision Pro Annual</h3>
                  <p className="text-neutral-400 mb-6">Full year, full power</p>
                  
                  <div className="inline-flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-white">$999</span>
                    <span className="text-xl text-neutral-400">/year</span>
                  </div>
                  <div className="text-neutral-500 text-sm mb-1">
                    $76.85/28 days, billed annually
                  </div>
                  <div className="text-primary-500 text-sm font-semibold">
                    Save 22% vs $99 every 28 days
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    'VibrationFit platform access (all 12 categories)',
                    'MAP, Vision Boards, Vision Audio, Immersion Tracks',
                    'VIVA AI assistant (5M tokens)',
                    'Journal, community access',
                    'Activation history & progress tracking',
                    'Library access & future features',
                    'Transparent renewal timing (starts Day 56)',
                    '100GB storage',
                    'Priority response queue',
                    '60-day satisfaction guarantee',
                    'Price locked for 12 months',
                    '4 bonus calibration check-ins per year',
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span className="text-neutral-200 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-neutral-500 text-center mb-4">
                  Tokens reset annually at renewal
                </div>
                </Card>
              )}

              {/* 28-Day Plan - Show first on mobile if selected */}
              {billingPeriod === '28day' && (
                <Card 
                  className={`p-10 transition-all cursor-pointer md:order-2 order-1 ${
                    billingPeriod === '28day'
                      ? 'border-2 border-[#00FFFF] bg-gradient-to-br from-[#00FFFF]/10 to-[#00FFFF]/5 scale-105 ring-2 ring-[#00FFFF]'
                      : 'border border-neutral-700 opacity-60 hover:opacity-80'
                  }`}
                  onClick={() => setBillingPeriod('28day')}
                >
                <div className="text-center mb-8">
                  <Zap className="w-12 h-12 text-secondary-500 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">Vision Pro 28-Day</h3>
                  <p className="text-neutral-400 mb-6">Flexible billing cycle</p>
                  
                  <div className="inline-flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-white">$99</span>
                    <span className="text-xl text-neutral-400">/28 days</span>
                  </div>
                  <div className="text-neutral-500 text-sm mb-1">
                    Billed every 4 weeks
                  </div>
                  <div className="text-neutral-400 text-sm">
                    $1,287 per year (13 cycles)
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    'VibrationFit platform access (all 12 categories)',
                    'MAP, Vision Boards, Vision Audio, Immersion Tracks',
                    'VIVA AI assistant (375k tokens per 28 days)',
                    'Journal, community access',
                    'Activation history & progress tracking',
                    'Library access & future features',
                    'Transparent renewal timing (starts Day 56)',
                    '25GB storage',
                    'Standard support queue',
                    '30-day satisfaction guarantee',
                    'Flexible - cancel any cycle',
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-secondary-500 flex-shrink-0 mt-0.5" />
                      <span className="text-neutral-200 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-neutral-500 text-center mb-4">
                  Unused tokens roll over (max 3 cycles)
                </div>
                </Card>
              )}

              {/* Show unselected cards */}
              {billingPeriod !== 'annual' && (
                <Card 
                  className="p-10 transition-all relative cursor-pointer md:order-1 order-2 border border-neutral-700 opacity-60 hover:opacity-80"
                  onClick={() => setBillingPeriod('annual')}
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-[#39FF14] text-black px-4 py-1 text-sm font-bold rounded-full shadow-lg">
                      Best Value
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <Crown className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                    <h3 className="text-3xl font-bold text-white mb-2">Vision Pro Annual</h3>
                    <p className="text-neutral-400 mb-6">Full year, full power</p>
                    
                    <div className="inline-flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-bold text-white">$999</span>
                      <span className="text-xl text-neutral-400">/year</span>
                    </div>
                    <div className="text-neutral-500 text-sm mb-1">
                      $76.85/28 days, billed annually
                    </div>
                    <div className="text-primary-500 text-sm font-semibold">
                      Save vs $99 every 28 days
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      'VibrationFit platform access (all 12 categories)',
                      'MAP, Vision Boards, Vision Audio, Immersion Tracks',
                      'VIVA AI assistant (5M tokens)',
                      'Journal, community access',
                      'Activation history & progress tracking',
                      'Library access & future features',
                      'Transparent renewal timing (starts Day 56)',
                      '100GB storage',
                      'Priority response queue',
                      '60-day satisfaction guarantee',
                      'Price locked for 12 months',
                      '4 bonus calibration check-ins per year',
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-200 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-neutral-500 text-center mb-4">
                    Tokens reset annually at renewal
                  </div>
                </Card>
              )}

              {billingPeriod !== '28day' && (
                <Card 
                  className="p-10 transition-all cursor-pointer md:order-2 order-2 border border-neutral-700 opacity-60 hover:opacity-80"
                  onClick={() => setBillingPeriod('28day')}
                >
                  <div className="text-center mb-8">
                    <Zap className="w-12 h-12 text-secondary-500 mx-auto mb-4" />
                    <h3 className="text-3xl font-bold text-white mb-2">Vision Pro 28-Day</h3>
                    <p className="text-neutral-400 mb-6">Flexible billing cycle</p>
                    
                    <div className="inline-flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-bold text-white">$99</span>
                      <span className="text-xl text-neutral-400">/28 days</span>
                    </div>
                    <div className="text-neutral-500 text-sm mb-1">
                      $3.54 per day • Billed every 4 weeks
                    </div>
                    <div className="text-neutral-400 text-sm">
                      $1,287 per year (13 cycles)
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      'VibrationFit platform access (all 12 categories)',
                      'MAP, Vision Boards, Vision Audio, Immersion Tracks',
                      'VIVA AI assistant (375k tokens per 28 days)',
                      'Journal, community access',
                      'Activation history & progress tracking',
                      'Library access & future features',
                      'Transparent renewal timing (starts Day 56)',
                      '25GB storage',
                      'Standard support queue',
                      '30-day satisfaction guarantee',
                      'Flexible - cancel any cycle',
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-secondary-500 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-200 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-neutral-500 text-center mb-4">
                    Unused tokens roll over (max 3 cycles)
                  </div>
                </Card>
              )}
            </div>

            <div className="text-center mt-8 text-neutral-400">
              <p className="mb-2">Continuity membership bundled with your Intensive purchase</p>
              <p className="text-sm text-neutral-500">Cancel anytime • Secure payment by Stripe</p>
            </div>
          </div>

    </Stack>
  </section>

  {/* Delete Confirmation Dialog Demo */}
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