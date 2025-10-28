'use client'

// Component Examples - Extracted from main design system page
// Each component gets its own examples section

import React, { useState } from 'react'
import {
  Card,
  Button,
  Stack,
  Grid,
  Inline,
  TwoColumn,
  FourColumn,
  Switcher,
  Cover,
  Frame,
  Container,
  Icon,
  Badge,
  Input,
  Textarea,
  VIVAButton,
  Spinner,
  ProgressBar,
  Video,
  Modal,
  ItemListCard,
  PricingCard,
  OfferStack,
  ActionButtons,
  AudioPlayer,
  PlaylistPlayer,
  Heading,
  Text,
  Title,
  BulletedList,
  OrderedList,
  ListItem,
  Select,
  DeleteConfirmationDialog,
  InsufficientTokensDialog,
  InsufficientStorageDialog,
} from '@/lib/design-system/components'
import {
  Layout,
  AlignLeft,
  Grid as GridIcon,
  PanelTop,
  Smartphone,
  Square,
  Monitor,
  Play,
  Image,
  MousePointer,
  ArrowRight,
  Star,
  Heart,
  Share,
  Settings,
  Plus,
  Download,
  Loader2,
  List,
  Crown,
  Package,
  Sparkles,
  Brain,
  Headphones,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  Tag,
  CreditCard,
  Mouse,
  Activity,
  Zap,
  BookOpen,
  CalendarDays,
  HardDrive,
} from 'lucide-react'
import { type AudioTrack } from '@/lib/design-system/components'
import type { ComponentMetadata } from '../../components'

export function renderComponentExamples(component: ComponentMetadata): React.ReactNode {
  switch (component.id) {
    case 'stack':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-6">
            <Stack gap="md">
              <h4 className="text-lg font-semibold text-white">Stack - Vertical Spacing</h4>
              <Stack gap="md" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Item 1</div>
                <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg">Item 2</div>
                <div className="p-4 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg">Item 3</div>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      )

    case 'inline':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-6">
            <Stack gap="md">
              <h4 className="text-lg font-semibold text-white">Inline - Horizontal Spacing & Wrapping</h4>
              <Inline gap="md" wrap className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Item 1</div>
                <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg">Item 2</div>
                <div className="p-4 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg">Item 3</div>
                <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Item 4</div>
                <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg">Item 5</div>
              </Inline>
            </Stack>
          </Card>
        </Stack>
      )

    case 'grid':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-6">
            <Stack gap="md">
              <h4 className="text-lg font-semibold text-white">Grid - Responsive Grid</h4>
              <Grid minWidth="200px" gap="md" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                <div className="p-3 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg text-sm font-medium text-center">Item 1</div>
                <div className="p-3 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg text-sm font-medium text-center">Item 2</div>
                <div className="p-3 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg text-sm font-medium text-center">Item 3</div>
                <div className="p-3 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg text-sm font-medium text-center">Item 4</div>
                <div className="p-3 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg text-sm font-medium text-center">Item 5</div>
                <div className="p-3 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg text-sm font-medium text-center">Item 6</div>
              </Grid>
            </Stack>
          </Card>
        </Stack>
      )

    case 'two-column':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-6">
            <Stack gap="md">
              <h4 className="text-lg font-semibold text-white">TwoColumn - Stacks on Mobile, 50/50 on Desktop</h4>
              <TwoColumn gap="md" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Left Content</div>
                <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg">Right Content</div>
              </TwoColumn>
            </Stack>
          </Card>
        </Stack>
      )

    case 'four-column':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-6">
            <Stack gap="md">
              <h4 className="text-lg font-semibold text-white">FourColumn - 2x2 on Mobile, 4x1 on Desktop</h4>
              <FourColumn gap="md" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Item A</div>
                <div className="p-4 bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg">Item B</div>
                <div className="p-4 bg-[#BF00FF]/20 border border-[#BF00FF]/30 rounded-lg">Item C</div>
                <div className="p-4 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-lg">Item D</div>
              </FourColumn>
            </Stack>
          </Card>
        </Stack>
      )

    case 'card':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-6">
            <Stack gap="md">
              <h4 className="text-lg font-semibold text-white">Card Variants</h4>
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
        </Stack>
      )

    case 'button':
      return (
        <Stack gap="md">
          <Grid minWidth="300px" gap="md">
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
          
          {/* Icon Left + Text */}
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

          {/* Text + Icon Right */}
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

          {/* All Sizes with Icons */}
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

          {/* Icon-Only Buttons */}
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
      )

    case 'spinner':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-6">
            <Grid minWidth="150px" gap="md">
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
            </Grid>
          </Card>
        </Stack>
      )

    case 'progress-bar':
      return (
        <Stack gap="md">
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
      )

    case 'heading':
      return (
        <Stack gap="md">
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
        </Stack>
      )

    case 'text':
      return (
        <Stack gap="md">
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
        </Stack>
      )

    case 'action-buttons':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-4 md:p-6">
            <Stack gap="md">
              <h4 className="text-base md:text-lg font-medium text-white">ActionButtons</h4>
              <p className="text-xs md:text-sm text-[#9CA3AF] mb-4">Standardized View/Delete button pair for list cards. Buttons fit side-by-side on mobile when space allows, wrap to stack only if needed.</p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs md:text-sm text-neutral-300 mb-2">Default (with labels):</p>
                  <ActionButtons
                    versionType="completed"
                    viewHref="/vision-board/example"
                    onDelete={() => console.log('Delete clicked')}
                  />
                </div>
                
                <div>
                  <p className="text-xs md:text-sm text-neutral-300 mb-2">Icon-only (compact):</p>
                  <ActionButtons
                    versionType="completed"
                    viewHref="/vision-board/example"
                    onDelete={() => console.log('Delete clicked')}
                    showLabels={false}
                    size="sm"
                  />
                </div>
                
                <div>
                  <p className="text-xs md:text-sm text-neutral-300 mb-2">Custom variants:</p>
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
        </Stack>
      )

    case 'badge':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-6">
            <Stack gap="md">
              <h4 className="text-lg font-semibold text-white">Badge Variants</h4>
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
      )

    case 'input':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-4">
            <Stack gap="sm">
              <h4 className="text-lg font-medium mb-2 text-white">Input - Text Input Fields</h4>
              <Stack gap="md">
                <Input
                  label="Default Input"
                  placeholder="Enter text here"
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
        </Stack>
      )

    case 'textarea':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-4">
            <Stack gap="sm">
              <h4 className="text-lg font-medium mb-2 text-white">Textarea - Multi-line Text Input</h4>
              <Stack gap="md">
                <Textarea
                  label="Default Textarea"
                  placeholder="Enter your message"
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
        </Stack>
      )

    case 'frame':
      return (
        <Stack gap="md">
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
        </Stack>
      )

    case 'viva-button':
      return (
        <Stack gap="md">
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
      )

    case 'bulleted-list':
      return (
        <Stack gap="md">
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
            </Stack>
          </Card>
        </Stack>
      )

    case 'ordered-list':
      return (
        <Stack gap="md">
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
            </Stack>
          </Card>
        </Stack>
      )

    case 'list-item':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-4">
            <Stack gap="sm">
              <h4 className="text-lg font-medium mb-2 text-white">ListItem - Custom Icons</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-neutral-400 mb-2">With Icons</h5>
                  <BulletedList>
                    <ListItem icon={CheckCircle}>Task completed</ListItem>
                    <ListItem icon={Star}>Achievement unlocked</ListItem>
                    <ListItem icon={Heart}>Favorite feature</ListItem>
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
            </Stack>
          </Card>
        </Stack>
      )

    case 'switcher':
      return (
        <Stack gap="md">
          <Card variant="glass">
            <Stack gap="md">
              <h4 className="text-lg font-semibold text-white">Switcher - Responsive Row/Column</h4>
              <p className="text-sm text-neutral-400">Automatically switches from row to column on mobile</p>
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
            </Stack>
          </Card>
        </Stack>
      )

    case 'cover':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-6">
            <Stack gap="md">
              <h4 className="text-lg font-semibold text-white">Cover - Centered Hero Section</h4>
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
            </Stack>
          </Card>
        </Stack>
      )

    case 'container':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-6">
            <Stack gap="md">
              <h4 className="text-lg font-semibold text-white">Container - Page Width with Responsive Gutters</h4>
              <Container size="xl" className="p-6 bg-neutral-900 rounded-lg border border-neutral-700">
                <p className="text-white">Container content with responsive padding</p>
                <p className="text-neutral-400 text-sm mt-2">This container automatically adjusts its max-width and padding based on screen size</p>
              </Container>
            </Stack>
          </Card>
        </Stack>
      )

    case 'select':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-4">
            <Stack gap="sm">
              <h4 className="text-lg font-medium mb-2 text-white">Select - Dropdown Selection</h4>
              <Select
                label="Choose an Option"
                placeholder="Select an option"
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
      )

    case 'icon':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-6">
            <Stack gap="md">
              <h4 className="text-lg font-semibold text-white">Icon - Consistent Icon Wrapper</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Icon icon={Heart} size="xs" color="#39FF14" className="mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">XS Size</p>
                </div>
                <div className="text-center">
                  <Icon icon={Star} size="sm" color="#00FFFF" className="mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">SM Size</p>
                </div>
                <div className="text-center">
                  <Icon icon={Zap} size="md" color="#BF00FF" className="mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">MD Size</p>
                </div>
                <div className="text-center">
                  <Icon icon={Sparkles} size="lg" color="#39FF14" className="mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">LG Size</p>
                </div>
                <div className="text-center">
                  <Icon icon={Crown} size="xl" color="#00FFFF" className="mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">XL Size</p>
                </div>
              </div>
            </Stack>
          </Card>
        </Stack>
      )

    case 'video':
      return (
        <Stack gap="md">
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
                }}
                onLeadCapture={(data) => {
                  console.log('Lead captured:', data)
                }}
              />
            </Stack>
          </Card>
        </Stack>
      )

    case 'modal':
      const ModalDemo = () => {
        const [modalOpen, setModalOpen] = useState(false)
        const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md')
        return (
          <Stack gap="md">
            <Card variant="default" className="p-4">
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
                <Button 
                  variant="outline" 
                  onClick={() => setModalOpen(false)}
                  className="w-full"
                >
                  Close Modal
                </Button>
              </Stack>
            </Modal>
          </Stack>
        )
      }
      return <ModalDemo />

    case 'audio-player':
      const sampleTrack: AudioTrack = {
        id: '1',
        title: 'Your Vision Forward',
        artist: 'VibrationFit AI',
        duration: 180,
        url: 'https://example.com/audio.mp3'
      }
      return (
        <Stack gap="md">
          <Card variant="outlined" className="p-4 bg-amber-500/10 border-amber-500/30">
            <Stack gap="sm">
              <div className="flex items-center gap-2">
                <Icon icon={AlertCircle} size="sm" className="text-amber-500" />
                <h4 className="text-sm font-semibold text-amber-500">Demo Audio Files</h4>
              </div>
              <p className="text-sm text-neutral-300">
                The demo audio files used here are sample URLs. In production, replace these with your actual audio file URLs.
              </p>
            </Stack>
          </Card>
          <Card variant="default" className="p-4">
            <Stack gap="sm">
              <h4 className="text-lg font-medium mb-2 text-white">Individual Audio Player</h4>
              <p className="text-sm text-[#9CA3AF] mb-4">Single track player with progress bar, volume control, and time display</p>
              <AudioPlayer 
                track={sampleTrack} 
                showInfo={true}
              />
            </Stack>
          </Card>
        </Stack>
      )

    case 'playlist-player':
      const sampleTracks: AudioTrack[] = [
        {
          id: '1',
          title: 'Your Vision Forward',
          artist: 'VibrationFit AI',
          duration: 180,
          url: 'https://example.com/audio1.mp3'
        },
        {
          id: '2',
          title: 'Alignment Activation',
          artist: 'VibrationFit AI',
          duration: 240,
          url: 'https://example.com/audio2.mp3'
        },
        {
          id: '3',
          title: 'Daily Activation',
          artist: 'VibrationFit AI',
          duration: 200,
          url: 'https://example.com/audio3.mp3'
        }
      ]
      return (
        <Stack gap="md">
          <Card variant="outlined" className="p-4 bg-amber-500/10 border-amber-500/30">
            <Stack gap="sm">
              <div className="flex items-center gap-2">
                <Icon icon={AlertCircle} size="sm" className="text-amber-500" />
                <h4 className="text-sm font-semibold text-amber-500">Demo Audio Files</h4>
              </div>
              <p className="text-sm text-neutral-300">
                The demo audio files used here are sample URLs. In production, replace these with your actual audio file URLs.
              </p>
            </Stack>
          </Card>
          <Card variant="default" className="p-4">
            <Stack gap="sm">
              <h4 className="text-lg font-medium mb-2 text-white">Playlist Player</h4>
              <p className="text-sm text-[#9CA3AF] mb-4">Full-featured player with shuffle, repeat, and queue management</p>
              <PlaylistPlayer 
                tracks={sampleTracks} 
              />
            </Stack>
          </Card>
        </Stack>
      )

    case 'title':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-6">
            <Stack gap="md">
              <h4 className="text-lg font-semibold text-white">Title Component</h4>
              <Title level="hero">
                Vision Pro Annual
              </Title>
              <Title level="section">
                Start Your Journey
              </Title>
              <Title level="card">
                Card Title
              </Title>
            </Stack>
          </Card>
        </Stack>
      )

    case 'delete-confirmation-dialog':
      const DeleteDialogDemo = () => {
        const [showDialog, setShowDialog] = useState(false)
        return (
          <Stack gap="md">
            <Card variant="default" className="p-4 md:p-6">
              <Stack gap="md">
                <h4 className="text-base md:text-lg font-medium text-white">DeleteConfirmationDialog</h4>
                <p className="text-xs md:text-sm text-[#9CA3AF] mb-4">Beautiful delete confirmation popup</p>
                <Button 
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDialog(true)}
                  className="w-full md:w-auto"
                >
                  Show Delete Dialog
                </Button>
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
              </Stack>
            </Card>
            <DeleteConfirmationDialog
              isOpen={showDialog}
              onClose={() => setShowDialog(false)}
              onConfirm={() => {
                console.log('Delete confirmed!')
                setShowDialog(false)
              }}
              itemName="Design System Demo Item"
              itemType="Example"
              isLoading={false}
            />
          </Stack>
        )
      }
      return <DeleteDialogDemo />

    case 'insufficient-tokens-dialog':
      const TokensDialogDemo = () => {
        const [showDialog, setShowDialog] = useState(false)
        return (
          <Stack gap="md">
            <Card variant="default" className="p-4 md:p-6">
              <Stack gap="md">
                <h4 className="text-base md:text-lg font-medium text-white">InsufficientTokensDialog</h4>
                <p className="text-xs md:text-sm text-[#9CA3AF] mb-4">Beautiful dialog shown when user runs out of tokens</p>
                <Button 
                  variant="accent"
                  size="sm"
                  onClick={() => setShowDialog(true)}
                  className="w-full md:w-auto"
                >
                  Show Insufficient Tokens Dialog
                </Button>
                <div className="text-xs text-neutral-400">
                  <p className="mb-2">Features:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Animated energy icon (Zap)</li>
                    <li>Shows current token balance</li>
                    <li>Smart messaging with token estimates</li>
                    <li>Direct link to purchase tokens</li>
                    <li>Mobile responsive</li>
                  </ul>
                </div>
              </Stack>
            </Card>
            <InsufficientTokensDialog
              isOpen={showDialog}
              onClose={() => setShowDialog(false)}
              tokensRemaining={0}
              estimatedTokens={5000}
              actionName="generate blueprint"
            />
          </Stack>
        )
      }
      return <TokensDialogDemo />

    case 'insufficient-storage-dialog':
      const StorageDialogDemo = () => {
        const [showDialog, setShowDialog] = useState(false)
        return (
          <Stack gap="md">
            <Card variant="default" className="p-4 md:p-6">
              <Stack gap="md">
                <h4 className="text-base md:text-lg font-medium text-white">InsufficientStorageDialog</h4>
                <p className="text-xs md:text-sm text-[#9CA3AF] mb-4">Beautiful dialog shown when user runs out of storage</p>
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDialog(true)}
                  className="w-full md:w-auto"
                >
                  Show Insufficient Storage Dialog
                </Button>
                <div className="text-xs text-neutral-400">
                  <p className="mb-2">Features:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Animated storage icon (HardDrive)</li>
                    <li>Shows storage usage and quota</li>
                    <li>Visual progress bar</li>
                    <li>Smart messaging with file size estimates</li>
                    <li>Direct link to upgrade storage</li>
                  </ul>
                </div>
              </Stack>
            </Card>
            <InsufficientStorageDialog
              isOpen={showDialog}
              onClose={() => setShowDialog(false)}
              storageUsedGB={24.5}
              storageQuotaGB={25}
              estimatedSizeGB={2.5}
              actionName="upload file"
            />
          </Stack>
        )
      }
      return <StorageDialogDemo />

    case 'item-list-card':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-4">
            <Stack gap="sm">
              <h4 className="text-lg font-medium mb-2 text-white">Item List Card - Feature Lists</h4>
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
            </Stack>
          </Card>
        </Stack>
      )

    case 'pricing-card':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-4">
            <Stack gap="sm">
              <h4 className="text-lg font-medium mb-2 text-white">Feature Card - Plan Example</h4>
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
            </Stack>
          </Card>
        </Stack>
      )

    case 'offer-stack':
      return (
        <Stack gap="md">
          <Card variant="default" className="p-4">
            <Stack gap="sm">
              <h4 className="text-lg font-medium mb-2 text-white">OfferStack - Individual Accordion Items</h4>
              <p className="text-sm text-neutral-400 mb-4">
                Each item is its own accordion that can be clicked to expand and show detailed descriptions.
                Perfect for pricing pages and feature breakdowns.
              </p>
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
                    id: 'calibration-call',
                    title: '30-Min Calibration Call',
                    description: 'Live 1:1 session to refine your vision and ensure alignment with your goals.',
                    icon: CalendarDays,
                    included: true
                  }
                ]}
                defaultExpanded={['assessment', 'viva-vision']}
                allowMultiple={true}
              />
            </Stack>
          </Card>
        </Stack>
      )

    default:
      return (
        <Card className="p-8 text-center">
          <p className="text-neutral-400">
            Examples coming soon for {component.name}
          </p>
        </Card>
      )
  }
}

