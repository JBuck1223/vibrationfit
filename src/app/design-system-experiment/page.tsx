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
import { 
  User, 
  Target, 
  Image, 
  BookOpen, 
  Zap 
} from 'lucide-react'

export default function DesignSystemExperimentPage() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-black text-white">
        <Container size="xl" className="py-12">
          {/* Header */}
          <div className="text-center mb-16 py-12 bg-gradient-to-br from-[#00CC44] to-[#14B8A6] rounded-3xl">
            <h1 className="text-5xl font-bold mb-4">VibrationFit Brand Kit - Experiment</h1>
            <p className="text-xl text-white/90">Color Experimentation & Testing</p>
          </div>

          {/* System Colors */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 pb-2 border-b-4 border-[#00CC44]">System Colors</h2>
            <p className="text-[#9CA3AF] mb-8 text-lg">Core system colors used throughout the platform for consistent branding.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Primary */}
              <Card variant="default">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-[#00CC44] rounded-xl shadow-lg"></div>
                  <div>
                    <h3 className="text-2xl font-semibold">Primary</h3>
                    <div className="font-mono text-lg text-[#9CA3AF]">#00CC44</div>
                  </div>
                </div>
                <div className="text-[#cbd5e1] mb-4 leading-relaxed">
                  Main brand color representing growth, alignment, and living "above the Green Line."
                </div>
                <div className="bg-[#00CC44]/10 p-4 rounded-lg border-l-4 border-[#00CC44]">
                  <div className="text-[#00CC44] font-semibold mb-2">When to use:</div>
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

          {/* Color Experimentation Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 pb-2 border-b-4 border-[#00CC44]">Color Experiments</h2>
            <p className="text-[#9CA3AF] mb-8 text-lg">Test new color combinations and variations here.</p>
            
            {/* Neon Fitness App Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Deeper Neon Green */}
              <Card variant="outlined">
                <div className="h-32 bg-[#39FF14] rounded-xl mb-4 shadow-lg shadow-[#39FF14]/30"></div>
                <h4 className="text-lg font-semibold mb-2">Deeper Neon Green</h4>
                <p className="font-mono text-[#9CA3AF] mb-2">#39FF14</p>
                <p className="text-sm text-[#cbd5e1]">Electric lime fitness green</p>
                <div className="mt-4">
                  <Button variant="primary" className="w-full" style={{backgroundColor: '#39FF14', color: '#000'}}>
                    Test Button
                  </Button>
                </div>
              </Card>

              {/* Neon Cyan */}
              <Card variant="outlined">
                <div className="h-32 bg-[#00FFFF] rounded-xl mb-4 shadow-lg shadow-[#00FFFF]/30"></div>
                <h4 className="text-lg font-semibold mb-2">Neon Cyan</h4>
                <p className="font-mono text-[#9CA3AF] mb-2">#00FFFF</p>
                <p className="text-sm text-[#cbd5e1]">Electric cyan energy</p>
                <div className="mt-4">
                  <Button variant="secondary" className="w-full" style={{backgroundColor: '#00FFFF', color: '#000'}}>
                    Test Button
                  </Button>
                </div>
              </Card>

              {/* Neon Purple */}
              <Card variant="outlined">
                <div className="h-32 bg-[#BF00FF] rounded-xl mb-4 shadow-lg shadow-[#BF00FF]/30"></div>
                <h4 className="text-lg font-semibold mb-2">Neon Purple</h4>
                <p className="font-mono text-[#9CA3AF] mb-2">#BF00FF</p>
                <p className="text-sm text-[#cbd5e1]">Electric purple power</p>
                <div className="mt-4">
                  <Button variant="accent" className="w-full" style={{backgroundColor: '#BF00FF'}}>
                    Test Button
                  </Button>
                </div>
              </Card>

              {/* Neon Orange */}
              <Card variant="outlined">
                <div className="h-32 bg-[#FF6600] rounded-xl mb-4 shadow-lg shadow-[#FF6600]/30"></div>
                <h4 className="text-lg font-semibold mb-2">Neon Orange</h4>
                <p className="font-mono text-[#9CA3AF] mb-2">#FF6600</p>
                <p className="text-sm text-[#cbd5e1]">High-intensity orange</p>
                <div className="mt-4">
                  <Button className="w-full" style={{backgroundColor: '#FF6600'}}>
                    Test Button
                  </Button>
                </div>
              </Card>

              {/* Neon Pink */}
              <Card variant="outlined">
                <div className="h-32 bg-[#FF0080] rounded-xl mb-4 shadow-lg shadow-[#FF0080]/30"></div>
                <h4 className="text-lg font-semibold mb-2">Neon Pink</h4>
                <p className="font-mono text-[#9CA3AF] mb-2">#FF0080</p>
                <p className="text-sm text-[#cbd5e1]">Electric pink energy</p>
                <div className="mt-4">
                  <Button className="w-full" style={{backgroundColor: '#FF0080'}}>
                    Test Button
                  </Button>
                </div>
              </Card>

              {/* Neon Yellow */}
              <Card variant="outlined">
                <div className="h-32 bg-[#FFFF00] rounded-xl mb-4 shadow-lg shadow-[#FFFF00]/30"></div>
                <h4 className="text-lg font-semibold mb-2">Neon Yellow</h4>
                <p className="font-mono text-[#9CA3AF] mb-2">#FFFF00</p>
                <p className="text-sm text-[#cbd5e1]">High-energy yellow</p>
                <div className="mt-4">
                  <Button className="w-full" style={{backgroundColor: '#FFFF00', color: '#000'}}>
                    Test Button
                  </Button>
                </div>
              </Card>
            </div>

            {/* Neon Gradient Experiments */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-6">Neon Gradient Experiments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <div className="h-24 bg-gradient-to-r from-[#39FF14] to-[#00FFFF] rounded-xl mb-4 shadow-lg shadow-[#39FF14]/20"></div>
                  <h4 className="text-lg font-semibold mb-2">Electric Lime to Cyan</h4>
                  <p className="text-sm text-[#cbd5e1]">High-energy fitness gradient</p>
                </Card>
                <Card>
                  <div className="h-24 bg-gradient-to-r from-[#BF00FF] to-[#FF0080] rounded-xl mb-4 shadow-lg shadow-[#BF00FF]/20"></div>
                  <h4 className="text-lg font-semibold mb-2">Purple to Pink</h4>
                  <p className="text-sm text-[#cbd5e1]">Electric power gradient</p>
                </Card>
                <Card>
                  <div className="h-24 bg-gradient-to-r from-[#FF6600] to-[#FFFF00] rounded-xl mb-4 shadow-lg shadow-[#FF6600]/20"></div>
                  <h4 className="text-lg font-semibold mb-2">Orange to Yellow</h4>
                  <p className="text-sm text-[#cbd5e1]">High-intensity energy gradient</p>
                </Card>
                <Card>
                  <div className="h-24 bg-gradient-to-r from-[#00FFFF] to-[#BF00FF] rounded-xl mb-4 shadow-lg shadow-[#00FFFF]/20"></div>
                  <h4 className="text-lg font-semibold mb-2">Cyan to Purple</h4>
                  <p className="text-sm text-[#cbd5e1]">Electric mystical gradient</p>
                </Card>
                <Card>
                  <div className="h-24 bg-gradient-to-r from-[#00FF88] to-[#FF6600] rounded-xl mb-4 shadow-lg shadow-[#00FF88]/20"></div>
                  <h4 className="text-lg font-semibold mb-2">Green to Orange</h4>
                  <p className="text-sm text-[#cbd5e1]">Vibrant energy gradient</p>
                </Card>
                <Card>
                  <div className="h-24 bg-gradient-to-r from-[#FF0080] to-[#FFFF00] rounded-xl mb-4 shadow-lg shadow-[#FF0080]/20"></div>
                  <h4 className="text-lg font-semibold mb-2">Pink to Yellow</h4>
                  <p className="text-sm text-[#cbd5e1]">Electric celebration gradient</p>
                </Card>
              </div>
            </div>
          </section>

          {/* Neon Button Testing */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 pb-2 border-b-4 border-[#00FF88]">Neon Button Testing</h2>
            <p className="text-[#9CA3AF] mb-8 text-lg">Testing neon colors with your existing button system.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Neon Primary Buttons */}
              <Card>
                <h3 className="text-2xl font-semibold text-[#00FF88] mb-6">Neon Primary Buttons</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Button variant="primary" className="w-full" style={{backgroundColor: '#39FF14', color: '#000'}}>Electric Lime Primary</Button>
                    <p className="text-sm text-[#9CA3AF]">High-energy fitness green</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="primary" className="w-full" style={{backgroundColor: '#00FFFF', color: '#000'}}>Neon Cyan Primary</Button>
                    <p className="text-sm text-[#9CA3AF]">Electric cyan energy</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="primary" className="w-full" style={{backgroundColor: '#BF00FF'}}>Neon Purple Primary</Button>
                    <p className="text-sm text-[#9CA3AF]">Electric purple power</p>
                  </div>
                </div>
              </Card>

              {/* Neon Gradient Buttons */}
              <Card>
                <h3 className="text-2xl font-semibold text-[#00FFFF] mb-6">Neon Gradient Buttons</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Button className="w-full bg-gradient-to-r from-[#39FF14] to-[#00FFFF] text-black font-bold">Electric Fitness</Button>
                    <p className="text-sm text-[#9CA3AF]">Lime to cyan gradient</p>
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full bg-gradient-to-r from-[#BF00FF] to-[#FF0080] font-bold">Electric Power</Button>
                    <p className="text-sm text-[#9CA3AF]">Purple to pink gradient</p>
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full bg-gradient-to-r from-[#FF6600] to-[#FFFF00] text-black font-bold">High Intensity</Button>
                    <p className="text-sm text-[#9CA3AF]">Orange to yellow gradient</p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Button Showcase */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 pb-2 border-b-4 border-[#00CC44]">Original Button System</h2>
            <p className="text-[#9CA3AF] mb-8 text-lg">Your current button system for comparison.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Standard Buttons */}
              <Card>
                <h3 className="text-2xl font-semibold text-[#00CC44] mb-6">Standard Buttons</h3>
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
            </div>
          </section>

          {/* Real Dashboard Elements */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 pb-2 border-b-4 border-[#39FF14]">Real Dashboard Elements</h2>
            <p className="text-[#9CA3AF] mb-8 text-lg">Testing neon colors with actual components from your dashboard.</p>
            
            {/* Key Metrics Cards */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-6">Key Metrics Cards</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                <Card className="p-3 md:p-6 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-[#39FF14]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 md:w-8 md:h-8 text-[#39FF14]" />
                  </div>
                  <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-1">1</div>
                  <div className="text-xs md:text-sm text-neutral-400">Profiles Created</div>
                </Card>
                
                <Card className="p-3 md:p-6 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-[#00FFFF]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 md:w-8 md:h-8 text-[#00FFFF]" />
                  </div>
                  <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-1">3</div>
                  <div className="text-xs md:text-sm text-neutral-400">Visions Generated</div>
                </Card>
                
                <Card className="p-3 md:p-6 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-[#BF00FF]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Image className="w-6 h-6 md:w-8 md:h-8 text-[#BF00FF]" />
                  </div>
                  <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-1">12</div>
                  <div className="text-xs md:text-sm text-neutral-400">Vision Board Items</div>
                </Card>
                
                <Card className="p-3 md:p-6 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-[#FF6600]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-[#FF6600]" />
                  </div>
                  <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-1">8</div>
                  <div className="text-xs md:text-sm text-neutral-400">Journal Entries</div>
                </Card>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-6">Feature Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#39FF14]/20 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-[#39FF14]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Life I Choose</h3>
                      <p className="text-sm text-neutral-400">Build your Life I Choose™ document</p>
                    </div>
                  </div>
                  <div className="space-y-3 md:space-y-0 md:flex md:flex-wrap">
                    <Button variant="primary" className="w-full md:w-auto" style={{backgroundColor: '#39FF14', color: '#000'}}>
                      Continue Vision
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full md:w-auto">
                      View All Versions
                    </Button>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#00FFFF]/20 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-[#00FFFF]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">VIVA Tokens</h3>
                      <p className="text-sm text-neutral-400">500 Available</p>
                    </div>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-neutral-400">Tokens Used This Month</span>
                      <span className="text-sm text-neutral-400">150 / 500</span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: '30%',
                          background: 'linear-gradient(90deg, #00FFFF, #39FF14)'
                        }}
                      ></div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#BF00FF]/20 rounded-xl flex items-center justify-center">
                      <Image className="w-6 h-6 text-[#BF00FF]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Vision Board</h3>
                      <p className="text-sm text-neutral-400">12 Total Items</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">In Progress</span>
                      <span className="text-[#BF00FF]">8</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Actualized</span>
                      <span className="text-[#39FF14]">4</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-6">Progress Bars</h3>
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">Profile Completion</h4>
                    <Badge variant="success">100% Complete</Badge>
                  </div>
                  <div className="w-full bg-neutral-700 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full" 
                      style={{ 
                        width: '100%',
                        background: 'linear-gradient(90deg, #39FF14, #00FFFF)'
                      }}
                    ></div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">Vision Progress</h4>
                    <Badge variant="info">75% Complete</Badge>
                  </div>
                  <div className="w-full bg-neutral-700 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full" 
                      style={{ 
                        width: '75%',
                        background: 'linear-gradient(90deg, #BF00FF, #FF0080)'
                      }}
                    ></div>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* Notes Section */}
          <section className="mb-16">
            <Card className="bg-gradient-to-br from-[#1F1F1F] to-[#0a0a0a]">
              <h2 className="text-3xl font-bold mb-4">Experiment Notes</h2>
              <div className="space-y-4 text-[#cbd5e1]">
                <p>Use this page to test new color combinations and see how they work with your existing components.</p>
                <p>Try different color values, gradients, and combinations to find what resonates with your brand.</p>
                <p>Remember to consider accessibility and contrast ratios when experimenting.</p>
              </div>
            </Card>
          </section>
        </Container>
      </div>
    </PageLayout>
  )
}
