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
import { Search, ChevronDown, ChevronRight } from 'lucide-react'

export default function DesignSystemMasterPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(COMPONENT_CATEGORIES)
  )

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

      {/* Search */}
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
                                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full md:w-auto mt-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(component.path)
                                }}
                              >
                                View Component →
                              </Button>
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
