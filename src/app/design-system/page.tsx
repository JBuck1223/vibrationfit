import React from 'react'
import { 
  PageLayout, 
  Container, 
  Card, 
  Button, 
  GradientButton, 
  AIButton,
  Badge,
  ProgressBar,
  Spinner,
  Input,
  Textarea
} from '@/lib/design-system/components'

export default function DesignSystemPage() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-black text-white">
        <Container size="xl" className="py-12">
          {/* Header */}
          <div className="text-center mb-16 py-12 bg-gradient-to-br from-[#199D67] to-[#14B8A6] rounded-3xl">
            <h1 className="text-5xl font-bold mb-4">VibrationFit Brand Kit</h1>
            <p className="text-xl text-white/90">Color Guidelines & Component Library</p>
          </div>

          {/* System Colors */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 pb-2 border-b-4 border-[#199D67]">System Colors</h2>
            <p className="text-[#9CA3AF] mb-8 text-lg">Core system colors used throughout the platform for consistent branding.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Primary */}
              <Card variant="default">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-[#199D67] rounded-xl shadow-lg"></div>
                  <div>
                    <h3 className="text-2xl font-semibold">Primary</h3>
                    <div className="font-mono text-lg text-[#9CA3AF]">#199D67</div>
                  </div>
                </div>
                <div className="text-[#cbd5e1] mb-4 leading-relaxed">
                  Main brand color representing growth, alignment, and living "above the Green Line."
                </div>
                <div className="bg-[#199D67]/10 p-4 rounded-lg border-l-4 border-[#199D67]">
                  <div className="text-[#199D67] font-semibold mb-2">When to use:</div>
                  <ul className="text-sm text-[#cbd5e1] space-y-1">
                    <li>• Primary CTA buttons</li>
                    <li>• Success states</li>
                    <li>• Main navigation active states</li>
                    <li>• "Above the Green Line" moments</li>
                  </ul>
                </div>
              </Card>

              {/* Secondary */}
              <Card variant="default">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-[#14B8A6] rounded-xl shadow-lg"></div>
                  <div>
                    <h3 className="text-2xl font-semibold">Secondary</h3>
                    <div className="font-mono text-lg text-[#9CA3AF]">#14B8A6</div>
                  </div>
                </div>
                <div className="text-[#cbd5e1] mb-4 leading-relaxed">
                  Secondary color representing clarity, flow, and calm energy.
                </div>
                <div className="bg-[#14B8A6]/10 p-4 rounded-lg border-l-4 border-[#14B8A6]">
                  <div className="text-[#14B8A6] font-semibold mb-2">When to use:</div>
                  <ul className="text-sm text-[#cbd5e1] space-y-1">
                    <li>• Info cards</li>
                    <li>• Progress bars</li>
                    <li>• Links and interactive text</li>
                    <li>• Secondary buttons</li>
                  </ul>
                </div>
              </Card>

              {/* Accent */}
              <Card variant="default">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-[#8B5CF6] rounded-xl shadow-lg"></div>
                  <div>
                    <h3 className="text-2xl font-semibold">Accent</h3>
                    <div className="font-mono text-lg text-[#9CA3AF]">#8B5CF6</div>
                  </div>
                </div>
                <div className="text-[#cbd5e1] mb-4 leading-relaxed">
                  Premium accent color for special moments and premium features.
                </div>
                <div className="bg-[#8B5CF6]/10 p-4 rounded-lg border-l-4 border-[#8B5CF6]">
                  <div className="text-[#8B5CF6] font-semibold mb-2">When to use:</div>
                  <ul className="text-sm text-[#cbd5e1] space-y-1">
                    <li>• Hover states</li>
                    <li>• AI Vibrational Assistant</li>
                    <li>• Premium feature highlights</li>
                    <li>• Special mystical moments</li>
                  </ul>
                </div>
              </Card>
            </div>
          </section>

          {/* Button Showcase */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 pb-2 border-b-4 border-[#199D67]">Button System</h2>
            <p className="text-[#9CA3AF] mb-8 text-lg">Modern, pill-shaped buttons with smooth interactions.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Standard Buttons */}
              <Card>
                <h3 className="text-2xl font-semibold text-[#199D67] mb-6">Standard Buttons</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Button variant="primary" className="w-full">Primary Button</Button>
                    <p className="text-sm text-[#9CA3AF]">Main CTAs, primary actions</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="secondary" className="w-full">Secondary Button</Button>
                    <p className="text-sm text-[#9CA3AF]">Supporting actions, info</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="accent" className="w-full">Accent Button</Button>
                    <p className="text-sm text-[#9CA3AF]">Premium features, special actions</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full">Ghost Button</Button>
                    <p className="text-sm text-[#9CA3AF]">Subtle actions within cards</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">Outline Button</Button>
                    <p className="text-sm text-[#9CA3AF]">Tertiary actions, cancel</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="danger" className="w-full">Danger Button</Button>
                    <p className="text-sm text-[#9CA3AF]">Destructive actions</p>
                  </div>
                </div>
              </Card>

              {/* Gradient Buttons */}
              <Card>
                <h3 className="text-2xl font-semibold text-[#14B8A6] mb-6">Gradient Buttons</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <GradientButton gradient="brand" className="w-full">Brand Harmony</GradientButton>
                    <p className="text-sm text-[#9CA3AF]">Hero CTAs, main actions</p>
                  </div>
                  <div className="space-y-2">
                    <GradientButton gradient="green" className="w-full">Green Energy</GradientButton>
                    <p className="text-sm text-[#9CA3AF]">Growth, success moments</p>
                  </div>
                  <div className="space-y-2">
                    <GradientButton gradient="teal" className="w-full">Clarity Flow</GradientButton>
                    <p className="text-sm text-[#9CA3AF]">Calm energy, water themes</p>
                  </div>
                  <div className="space-y-2">
                    <GradientButton gradient="purple" className="w-full">Purple Power</GradientButton>
                    <p className="text-sm text-[#9CA3AF]">Premium, mystical elements</p>
                  </div>
                  <div className="space-y-2">
                    <GradientButton gradient="cosmic" className="w-full">Cosmic Journey</GradientButton>
                    <p className="text-sm text-[#9CA3AF]">Transformational moments</p>
                  </div>
                  <div className="space-y-2">
                    <AIButton className="w-full">Ask AI Assistant</AIButton>
                    <p className="text-sm text-[#9CA3AF]">AI features with mystical glow</p>
                  </div>
                </div>
              </Card>

              {/* Button Sizes */}
              <Card>
                <h3 className="text-2xl font-semibold text-[#8B5CF6] mb-6">Button Sizes</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Button variant="primary" size="sm">Small Button</Button>
                    <p className="text-sm text-[#9CA3AF]">Compact actions, inline usage</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="primary" size="md">Medium Button (Default)</Button>
                    <p className="text-sm text-[#9CA3AF]">Standard size for most actions</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="primary" size="lg">Large Button</Button>
                    <p className="text-sm text-[#9CA3AF]">Prominent CTAs</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="primary" size="xl">Extra Large Button</Button>
                    <p className="text-sm text-[#9CA3AF]">Hero sections</p>
                  </div>
                </div>
              </Card>

              {/* Button States */}
              <Card>
                <h3 className="text-2xl font-semibold text-[#FFB701] mb-6">Interactive States</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Button variant="primary">Normal State</Button>
                    <p className="text-sm text-[#9CA3AF]">Default appearance</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="primary" className="hover:bg-[#5EC49A] -translate-y-0.5 shadow-[0_6px_20px_rgba(25,157,103,0.4)]">Hover State</Button>
                    <p className="text-sm text-[#9CA3AF]">Lifts up 2px, brighter color</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="primary" loading>Loading State</Button>
                    <p className="text-sm text-[#9CA3AF]">Shows spinner during async actions</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="primary" disabled>Disabled State</Button>
                    <p className="text-sm text-[#9CA3AF]">50% opacity, cursor not-allowed</p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Color Palette */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 pb-2 border-b-4 border-[#199D67]">Complete Color Palette</h2>
            
            {/* Primary Green Family */}
            <div className="mb-12">
              <h3 className="text-2xl font-semibold text-[#199D67] mb-6">Primary Green Family</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variant="outlined">
                  <div className="h-32 bg-[#199D67] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Primary Green</h4>
                  <p className="font-mono text-[#9CA3AF] mb-2">#199D67</p>
                  <p className="text-sm text-[#cbd5e1]">Main brand color, primary CTAs</p>
                </Card>
                <Card variant="outlined">
                  <div className="h-32 bg-[#5EC49A] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Green Light</h4>
                  <p className="font-mono text-[#9CA3AF] mb-2">#5EC49A</p>
                  <p className="text-sm text-[#cbd5e1]">Hover states, lighter accents</p>
                </Card>
                <Card variant="outlined">
                  <div className="h-32 bg-[#A8E5CE] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Green Lighter</h4>
                  <p className="font-mono text-[#9CA3AF] mb-2">#A8E5CE</p>
                  <p className="text-sm text-[#cbd5e1]">Backgrounds, subtle highlights</p>
                </Card>
              </div>
            </div>

            {/* Teal Family */}
            <div className="mb-12">
              <h3 className="text-2xl font-semibold text-[#14B8A6] mb-6">Teal (Secondary) Family</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variant="outlined">
                  <div className="h-32 bg-[#14B8A6] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Teal</h4>
                  <p className="font-mono text-[#9CA3AF] mb-2">#14B8A6</p>
                  <p className="text-sm text-[#cbd5e1]">Secondary actions, links</p>
                </Card>
                <Card variant="outlined">
                  <div className="h-32 bg-[#2DD4BF] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Teal Light</h4>
                  <p className="font-mono text-[#9CA3AF] mb-2">#2DD4BF</p>
                  <p className="text-sm text-[#cbd5e1]">Hover states, bright accents</p>
                </Card>
                <Card variant="outlined">
                  <div className="h-32 bg-[#0D9488] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Teal Dark</h4>
                  <p className="font-mono text-[#9CA3AF] mb-2">#0D9488</p>
                  <p className="text-sm text-[#cbd5e1]">Active states, deep moments</p>
                </Card>
              </div>
            </div>

            {/* Purple Family */}
            <div className="mb-12">
              <h3 className="text-2xl font-semibold text-[#8B5CF6] mb-6">Purple (Accent) Family</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card variant="outlined">
                  <div className="h-32 bg-[#601B9F] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Primary Purple</h4>
                  <p className="font-mono text-sm text-[#9CA3AF] mb-2">#601B9F</p>
                  <p className="text-xs text-[#cbd5e1]">Premium base</p>
                </Card>
                <Card variant="outlined">
                  <div className="h-32 bg-[#8B5CF6] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Accent Purple</h4>
                  <p className="font-mono text-sm text-[#9CA3AF] mb-2">#8B5CF6</p>
                  <p className="text-xs text-[#cbd5e1]">Main accent</p>
                </Card>
                <Card variant="outlined">
                  <div className="h-32 bg-[#7C3AED] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Button Purple</h4>
                  <p className="font-mono text-sm text-[#9CA3AF] mb-2">#7C3AED</p>
                  <p className="text-xs text-[#cbd5e1]">Active states</p>
                </Card>
                <Card variant="outlined">
                  <div className="h-32 bg-[#B629D4] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Violet</h4>
                  <p className="font-mono text-sm text-[#9CA3AF] mb-2">#B629D4</p>
                  <p className="text-xs text-[#cbd5e1]">Special accents</p>
                </Card>
                <Card variant="outlined">
                  <div className="h-32 bg-[#C4B5FD] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Purple Lighter</h4>
                  <p className="font-mono text-sm text-[#9CA3AF] mb-2">#C4B5FD</p>
                  <p className="text-xs text-[#cbd5e1]">Backgrounds</p>
                </Card>
              </div>
            </div>

            {/* Energy Colors */}
            <div className="mb-12">
              <h3 className="text-2xl font-semibold text-[#FFB701] mb-6">Energy Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card variant="outlined">
                  <div className="h-32 bg-[#D03739] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Vibrant Red</h4>
                  <p className="font-mono text-[#9CA3AF] mb-2">#D03739</p>
                  <p className="text-sm text-[#cbd5e1]">Alerts, below green line</p>
                </Card>
                <Card variant="outlined">
                  <div className="h-32 bg-[#EF4444] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Red Light</h4>
                  <p className="font-mono text-[#9CA3AF] mb-2">#EF4444</p>
                  <p className="text-sm text-[#cbd5e1]">Hover states, warnings</p>
                </Card>
                <Card variant="outlined">
                  <div className="h-32 bg-[#FFB701] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Energy Yellow</h4>
                  <p className="font-mono text-[#9CA3AF] mb-2">#FFB701</p>
                  <p className="text-sm text-[#cbd5e1]">Celebration, wins</p>
                </Card>
                <Card variant="outlined">
                  <div className="h-32 bg-[#FCD34D] rounded-xl mb-4"></div>
                  <h4 className="text-lg font-semibold mb-2">Yellow Light</h4>
                  <p className="font-mono text-[#9CA3AF] mb-2">#FCD34D</p>
                  <p className="text-sm text-[#cbd5e1]">Subtle highlights</p>
                </Card>
              </div>
            </div>
          </section>

          {/* Badges & Status */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 pb-2 border-b-4 border-[#199D67]">Badges & Status Indicators</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <h3 className="text-2xl font-semibold text-[#199D67] mb-6">Badge Variants</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="success">Success</Badge>
                    <span className="text-sm text-[#9CA3AF]">Above Green Line, aligned</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="info">Info</Badge>
                    <span className="text-sm text-[#9CA3AF]">Clarity, in progress</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="warning">Warning</Badge>
                    <span className="text-sm text-[#9CA3AF]">Celebration, actualized</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="error">Error</Badge>
                    <span className="text-sm text-[#9CA3AF]">Below Green Line, contrast</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="premium">Premium</Badge>
                    <span className="text-sm text-[#9CA3AF]">AI Assistant, special</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="neutral">Neutral</Badge>
                    <span className="text-sm text-[#9CA3AF]">Inactive, paused</span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-2xl font-semibold text-[#14B8A6] mb-6">Progress Bars</h3>
                <div className="space-y-6">
                  <ProgressBar 
                    value={75} 
                    variant="primary" 
                    label="Vision Completion"
                  />
                  <ProgressBar 
                    value={50} 
                    variant="secondary" 
                    label="Alignment Score"
                  />
                  <ProgressBar 
                    value={90} 
                    variant="accent" 
                    label="Premium Features"
                  />
                </div>
              </Card>
            </div>
          </section>

          {/* Form Components */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 pb-2 border-b-4 border-[#199D67]">Form Components</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <h3 className="text-2xl font-semibold text-[#199D67] mb-6">Inputs</h3>
                <div className="space-y-4">
                  <Input 
                    label="Email Address" 
                    placeholder="your@email.com"
                    helperText="We'll never share your email"
                  />
                  <Input 
                    label="Password" 
                    type="password"
                    placeholder="Enter password"
                  />
                  <Input 
                    label="With Error" 
                    error="This field is required"
                    placeholder="Enter value"
                  />
                </div>
              </Card>

              <Card>
                <h3 className="text-2xl font-semibold text-[#14B8A6] mb-6">Textarea</h3>
                <Textarea 
                  label="Your Vision"
                  placeholder="Describe your vision..."
                  rows={6}
                  helperText="Be as detailed as you like"
                />
              </Card>
            </div>
          </section>

          {/* Loading States */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 pb-2 border-b-4 border-[#199D67]">Loading States</h2>
            
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <Spinner variant="primary" size="lg" className="mx-auto mb-4" />
                  <p className="text-sm text-[#9CA3AF]">Primary Spinner</p>
                </div>
                <div className="text-center">
                  <Spinner variant="secondary" size="lg" className="mx-auto mb-4" />
                  <p className="text-sm text-[#9CA3AF]">Secondary Spinner</p>
                </div>
                <div className="text-center">
                  <Spinner variant="accent" size="lg" className="mx-auto mb-4" />
                  <p className="text-sm text-[#9CA3AF]">Accent Spinner</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Best Practices */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 pb-2 border-b-4 border-[#199D67]">Best Practices</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-2 border-[#199D67]">
                <h3 className="text-2xl font-semibold text-[#199D67] mb-6">✓ Do</h3>
                <ul className="space-y-3 text-[#cbd5e1]">
                  <li className="flex items-start gap-3">
                    <span className="text-[#199D67] mt-1">•</span>
                    <span>Use primary green for main CTAs and success states</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#199D67] mt-1">•</span>
                    <span>Maintain high contrast ratios for accessibility</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#199D67] mt-1">•</span>
                    <span>Use gradients sparingly for special moments</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#199D67] mt-1">•</span>
                    <span>Test colors in both light and dark contexts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#199D67] mt-1">•</span>
                    <span>Use consistent color meanings across the app</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#199D67] mt-1">•</span>
                    <span>Apply hover states that lift elements up</span>
                  </li>
                </ul>
              </Card>

              <Card className="border-2 border-[#D03739]">
                <h3 className="text-2xl font-semibold text-[#D03739] mb-6">✗ Don't</h3>
                <ul className="space-y-3 text-[#cbd5e1]">
                  <li className="flex items-start gap-3">
                    <span className="text-[#D03739] mt-1">•</span>
                    <span>Don't use too many colors in one interface</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#D03739] mt-1">•</span>
                    <span>Don't use red for positive actions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#D03739] mt-1">•</span>
                    <span>Don't ignore accessibility guidelines</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#D03739] mt-1">•</span>
                    <span>Don't use colors inconsistently</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#D03739] mt-1">•</span>
                    <span>Don't overuse gradients or effects</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#D03739] mt-1">•</span>
                    <span>Don't use squared buttons (always pill-shaped)</span>
                  </li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Download Section */}
          <section className="mb-16">
            <Card className="bg-gradient-to-br from-[#1F1F1F] to-[#0a0a0a] text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Build?</h2>
              <p className="text-[#9CA3AF] mb-6 text-lg">
                Use this design system as your single source of truth for all VibrationFit development.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GradientButton gradient="brand" size="lg">
                  Start Building
                </GradientButton>
                <Button variant="outline" size="lg">
                  View Documentation
                </Button>
              </div>
            </Card>
          </section>
        </Container>
      </div>
    </PageLayout>
  )
}