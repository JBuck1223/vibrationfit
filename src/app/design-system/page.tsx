'use client'

// VibrationFit Design System - Master Component Listing
// Browse all design system components and navigate to individual showcases

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { 
  Card, 
  Button, 
} from '@/lib/design-system/components'
import {
  DESIGN_SYSTEM_COMPONENTS,
  COMPONENT_CATEGORIES,
  getComponentsByCategory,
  type ComponentMetadata
} from './components'
import { 
  Icon,
  Stack,
  Grid,
  Inline
} from '@/lib/design-system/components'
import { Search, ChevronDown, ChevronRight, Copy, Check, Palette } from 'lucide-react'
import { getComponentProps } from './component/[componentName]/component-props'

export default function DesignSystemMasterPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(COMPONENT_CATEGORIES)
  )
  const [copiedComponent, setCopiedComponent] = useState<string | null>(null)
  const [showColorPalette, setShowColorPalette] = useState(false)
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const filteredComponents = DESIGN_SYSTEM_COMPONENTS.filter(comp =>
    comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const componentsByCategory = COMPONENT_CATEGORIES.reduce((acc, category) => {
    acc[category] = getComponentsByCategory(category).filter(comp =>
      filteredComponents.includes(comp)
    )
    return acc
  }, {} as Record<string, ComponentMetadata[]>)

  const generateComponentCopyText = (component: ComponentMetadata): string => {
    const props = getComponentProps(component.id)
    const requiredProps = props.filter(p => p.required)
    const optionalProps = props.filter(p => !p.required && p.name !== 'className' && p.name !== 'children').slice(0, 3)
    
    let usageExample = `<${component.exportName}>`
    if (requiredProps.length > 0) {
      const firstRequired = requiredProps[0]
      if (firstRequired.name === 'children') {
        usageExample = `<${component.exportName}>Content</${component.exportName}>`
      } else {
        usageExample = `<${component.exportName} ${firstRequired.name}="..." />`
      }
    } else if (component.id === 'button' || component.id === 'card') {
      usageExample = `<${component.exportName}>Content</${component.exportName}>`
    } else {
      usageExample = `<${component.exportName} />`
    }

    let copyText = `Component: ${component.name}\n`
    copyText += `Category: ${component.category}\n`
    copyText += `Description: ${component.description}\n\n`
    copyText += `Import:\nimport { ${component.exportName} } from '@/lib/design-system/components'\n\n`
    copyText += `Basic Usage:\n${usageExample}\n\n`
    
    if (requiredProps.length > 0) {
      copyText += `Required Props:\n`
      requiredProps.forEach(prop => {
        copyText += `  - ${prop.name}: ${prop.type}${prop.description ? ` - ${prop.description}` : ''}\n`
      })
      copyText += '\n'
    }
    
    if (optionalProps.length > 0) {
      copyText += `Common Optional Props:\n`
      optionalProps.forEach(prop => {
        const defaultValue = prop.defaultValue ? ` (default: ${prop.defaultValue})` : ''
        copyText += `  - ${prop.name}: ${prop.type}${defaultValue}${prop.description ? ` - ${prop.description}` : ''}\n`
      })
    }
    
    copyText += `\nView full documentation: ${component.path}`

    return copyText
  }

  const handleCopyComponent = (component: ComponentMetadata) => {
    const copyText = generateComponentCopyText(component)
    navigator.clipboard.writeText(copyText)
    setCopiedComponent(component.id)
    setTimeout(() => setCopiedComponent(null), 2000)
  }

  return (
    <Stack gap="lg">
      <div className="text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
          VibrationFit Design System
        </h1>
        <p className="text-base md:text-lg text-neutral-400 max-w-2xl mx-auto">
          Explore all design system components individually. Each component has its own showcase page with examples, props, and usage guidelines.
        </p>
      </div>

      {/* Search & Color Palette */}
      <Stack gap="sm">
        <Card className="p-4 md:p-6">
          <div className="relative">
            <Icon 
              icon={Search} 
              size="sm" 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-800 border-2 border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </Card>

        {/* Color Palette Quick Access */}
        <Card className="p-3 md:p-4">
          <button
            onClick={() => setShowColorPalette(!showColorPalette)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Icon icon={Palette} size="sm" color="#39FF14" />
              <span className="text-sm md:text-base font-semibold text-white">Color Palette</span>
            </div>
            <Icon 
              icon={showColorPalette ? ChevronDown : ChevronRight} 
              size="sm" 
              className="text-neutral-400"
            />
          </button>

          {showColorPalette && (
            <div className="mt-4 pt-4 border-t border-neutral-700">
              <Stack gap="sm">
                <ColorPaletteDropdown onCopy={(hex) => {
                  navigator.clipboard.writeText(hex)
                  setCopiedColor(hex)
                  setTimeout(() => setCopiedColor(null), 1500)
                }} copiedColor={copiedColor} />
                <div className="pt-2 border-t border-neutral-700">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push('/design-system/component/color-palette')}
                  >
                    View Full Color Palette →
                  </Button>
                </div>
              </Stack>
            </div>
          )}
        </Card>
      </Stack>

      {/* Components by Category */}
      <Stack gap="md">
        {COMPONENT_CATEGORIES.map((category) => {
              const components = componentsByCategory[category]
              if (components.length === 0) return null

              const isExpanded = expandedCategories.has(category)

              return (
                <Card key={category} className="p-4 md:p-6">
                  <Stack gap="md">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Icon 
                          icon={isExpanded ? ChevronDown : ChevronRight} 
                          size="sm" 
                          className="text-neutral-400"
                        />
                        <h2 className="text-xl md:text-2xl font-bold text-white">
                          {category}
                        </h2>
                        <span className="text-sm text-neutral-400">
                          ({components.length})
                        </span>
                      </div>
                    </button>

                    {/* Components Grid */}
                    {isExpanded && (
                      <Grid 
                        minWidth="250px" 
                        gap="md"
                        className="mt-2"
                      >
                        {components.map((component) => (
                          <Card
                            key={component.id}
                            variant="outlined"
                            hover
                            className="p-4 md:p-6 cursor-pointer"
                            onClick={() => router.push(component.path)}
                          >
                            <Stack gap="sm">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Icon 
                                    icon={component.icon} 
                                    size="sm" 
                                    color="#39FF14"
                                    className="opacity-80"
                                  />
                                </div>
                                <h3 className="text-base md:text-lg font-semibold text-white">
                                  {component.name}
                                </h3>
                              </div>
                              <p className="text-xs md:text-sm text-neutral-400 line-clamp-2">
                                {component.description}
                              </p>
                              <Inline gap="sm" wrap>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 min-w-0 shrink"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(component.path)
                                  }}
                                >
                                  View →
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCopyComponent(component)
                                  }}
                                  title="Copy component info"
                                >
                                  <Icon 
                                    icon={copiedComponent === component.id ? Check : Copy} 
                                    size="sm"
                                    className={copiedComponent === component.id ? 'text-primary-500' : ''}
                                  />
                                </Button>
                              </Inline>
                            </Stack>
                          </Card>
                        ))}
                      </Grid>
                    )}
                  </Stack>
                </Card>
              )
            })}
      </Stack>

      {/* Quick Stats */}
      <Card variant="outlined" className="p-4 md:p-6">
        <Inline gap="md" className="flex-wrap justify-center">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary-500">
              {DESIGN_SYSTEM_COMPONENTS.length}
            </div>
            <div className="text-xs md:text-sm text-neutral-400">Components</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-secondary-500">
              {COMPONENT_CATEGORIES.length}
            </div>
            <div className="text-xs md:text-sm text-neutral-400">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-accent-500">
              100%
            </div>
            <div className="text-xs md:text-sm text-neutral-400">Mobile-First</div>
          </div>
        </Inline>
      </Card>
    </Stack>
  )
}

// Color Palette Dropdown Component
function ColorPaletteDropdown({ onCopy, copiedColor }: { onCopy: (hex: string) => void, copiedColor: string | null }) {
  const ColorRow = ({ hex, name, tokens, description }: { hex: string, name: string, tokens?: string, description: string }) => {
    // Determine if we should use dark text (for light colors)
    const isLightColor = hex === '#FFFF00' || hex === '#39FF14' || hex === '#00FF88' || hex === '#00FFFF' || hex === '#06B6D4'
    const textColor = isLightColor ? '#000000' : '#FFFFFF'
    
    return (
      <div className="flex items-center gap-2 py-1">
        <div 
          className="w-5 h-5 rounded-full border border-white/20 shadow-md flex-shrink-0" 
          style={{ backgroundColor: hex, boxShadow: `0 0 6px ${hex}40` }}
        ></div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white truncate">{name}{tokens && ` (${tokens})`}</p>
          <p className="text-[10px] text-neutral-500 truncate">{description}</p>
        </div>
        <button
          onClick={() => onCopy(hex)}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all hover:scale-105 active:scale-95 flex-shrink-0 shadow-md"
          style={{ 
            backgroundColor: hex,
            color: textColor,
            boxShadow: `0 2px 8px ${hex}60`
          }}
          title="Copy hex code"
        >
          <span>{hex}</span>
          {copiedColor === hex ? (
            <Icon icon={Check} size="xs" color={textColor} />
          ) : (
            <Icon icon={Copy} size="xs" color={textColor} />
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <Card variant="outlined" className="p-3 bg-neutral-900/50">
        <div className="space-y-1">
          <h6 className="text-xs font-semibold text-[#39FF14] mb-1.5">Primary</h6>
          <ColorRow hex="#39FF14" name="Primary Green" tokens="50, 500" description="Electric Lime" />
          <ColorRow hex="#00FF88" name="Electric Green" tokens="100, 600" description="Neon Electric" />
          <ColorRow hex="#00CC44" name="Forest Green" tokens="200, 700" description="Electric Forest" />
        </div>
      </Card>
      <Card variant="outlined" className="p-3 bg-neutral-900/50">
        <div className="space-y-1">
          <h6 className="text-xs font-semibold text-[#00FFFF] mb-1.5">Secondary</h6>
          <ColorRow hex="#00FFFF" name="Neon Cyan" tokens="50, 500" description="Neon Cyan (main)" />
          <ColorRow hex="#06B6D4" name="Bright Cyan" tokens="100, 600" description="Bright Cyan" />
          <ColorRow hex="#0F766E" name="Teal Dark" tokens="700" description="Teal Darker" />
        </div>
      </Card>
      <Card variant="outlined" className="p-3 bg-neutral-900/50">
        <div className="space-y-1">
          <h6 className="text-xs font-semibold text-[#BF00FF] mb-1.5">Accent</h6>
          <ColorRow hex="#BF00FF" name="Neon Purple" tokens="50, 500" description="Neon Purple" />
          <ColorRow hex="#A855F7" name="Bright Purple" tokens="100, 600" description="Brighter Purple" />
          <ColorRow hex="#601B9F" name="Primary Purple" tokens="700" description="Primary Purple" />
          <ColorRow hex="#B629D4" name="Violet" tokens="800" description="Violet" />
        </div>
      </Card>
      <Card variant="outlined" className="p-3 bg-neutral-900/50">
        <div className="space-y-1">
          <h6 className="text-xs font-semibold text-[#FFFF00] mb-1.5">Energy</h6>
          <ColorRow hex="#FFFF00" name="Neon Yellow" description="Neon Yellow" />
          <ColorRow hex="#FF6600" name="Neon Orange" description="Neon Orange" />
          <ColorRow hex="#FF0080" name="Neon Pink" description="Neon Pink" />
          <ColorRow hex="#FF0040" name="Neon Red" description="Neon Red" />
        </div>
      </Card>
      <Card variant="outlined" className="p-3 bg-neutral-900/50">
        <div className="space-y-1">
          <h6 className="text-xs font-semibold text-white mb-1.5">Semantic</h6>
          <ColorRow hex="#39FF14" name="Success" description="Above Green Line" />
          <ColorRow hex="#00FFFF" name="Info" description="Clarity" />
          <ColorRow hex="#FFFF00" name="Warning" description="Celebration" />
          <ColorRow hex="#FF0040" name="Error" description="Below Green Line" />
          <ColorRow hex="#BF00FF" name="Premium" description="Premium / AI" />
        </div>
      </Card>
      <Card variant="outlined" className="p-3 bg-neutral-900/50">
        <div className="space-y-1">
          <h6 className="text-xs font-semibold text-neutral-400 mb-1.5">Neutrals</h6>
          <ColorRow hex="#000000" name="Pure Black" description="Primary bg" />
          <ColorRow hex="#1F1F1F" name="Dark Gray" description="Cards" />
          <ColorRow hex="#404040" name="Medium Gray" description="Borders" />
          <ColorRow hex="#666666" name="Light Gray" description="Borders" />
          <ColorRow hex="#9CA3AF" name="Tertiary Text" description="Text" />
        </div>
      </Card>
    </div>
  )
}
