'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Badge, Spinner, Heading, Text, Stack } from '@/lib/design-system/components'
import { X, GitCompare, ChevronLeft, ChevronRight } from 'lucide-react'

interface VersionComparisonProps {
  version1Id: string
  version2Id: string
  onClose: () => void
}

interface ComparisonData {
  version1: {
    id: string
    version_number: number
    is_draft: boolean
    is_active: boolean
    created_at: string
    updated_at: string
  }
  version2: {
    id: string
    version_number: number
    is_draft: boolean
    is_active: boolean
    created_at: string
    updated_at: string
  }
  diff: Record<string, {
    old: string | null
    new: string | null
    type?: string
  }>
  categorized: Record<string, Array<{ field: string; change: any }>>
  summary: {
    totalChanges: number
    categories: Array<{ name: string; label: string; count: number }>
  }
  fieldLabels: Record<string, string>
}

export const VersionComparison: React.FC<VersionComparisonProps> = ({
  version1Id,
  version2Id,
  onClose
}) => {
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchComparison()
  }, [version1Id, version2Id])

  const fetchComparison = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/profile/compare?version1=${version1Id}&version2=${version2Id}`
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to compare versions' }))
        throw new Error(errorData.error || 'Failed to compare versions')
      }

      const data = await response.json()
      setComparison(data)
    } catch (err) {
      console.error('Error fetching comparison:', err)
      setError(err instanceof Error ? err.message : 'Failed to load comparison')
    } finally {
      setIsLoading(false)
    }
  }

  const formatValue = (value: string | null, type?: string): string => {
    if (value === null || value === '') return '(empty)'
    if (type === 'array') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed.join(', ') : value
      } catch {
        return value
      }
    }
    return value
  }

  const getChangesToShow = (): Record<string, Array<{ field: string; change: any }>> => {
    if (!comparison) return {}
    
    // Group changes by category
    const grouped: Record<string, Array<{ field: string; change: any }>> = {}
    
    if (selectedCategory === 'all') {
      // Group all changes by category
      Object.entries(comparison.diff).forEach(([field, change]) => {
        const category = comparison.summary.categories.find(cat =>
          comparison.categorized[cat.name]?.some(c => c.field === field)
        )?.name || 'other'
        
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push({ field, change })
      })
    } else {
      // Group changes for selected category
      grouped[selectedCategory] = comparison.categorized[selectedCategory] || []
    }
    
    return grouped
  }

  if (isLoading) {
    return (
      <Card className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="flex items-center justify-center py-12">
          <Spinner variant="primary" size="lg" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Text className="text-red-400 mb-4">{error}</Text>
          <Button variant="primary" onClick={fetchComparison}>
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  if (!comparison) {
    return null
  }

  const changesToShow = getChangesToShow()
  const categories = ['all', ...comparison.summary.categories.map(c => c.name)]

  return (
    <Card className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
            <GitCompare className="w-5 h-5 text-primary-500" />
          </div>
          <Heading level={2} className="text-white">Compare Versions</Heading>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Version Headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card variant="outlined" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info">Version {comparison.version1.version_number}</Badge>
            {comparison.version1.is_active && (
              <Badge variant="success" className="text-xs">Active</Badge>
            )}
            {comparison.version1.is_draft && (
              <Badge variant="warning" className="text-xs">Draft</Badge>
            )}
          </div>
          <Text size="sm" className="text-neutral-400">
            {new Date(comparison.version1.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </Text>
        </Card>
        <Card variant="outlined" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={comparison.version2.is_active ? 'success' : 'info'}>
              Version {comparison.version2.version_number}
            </Badge>
            {comparison.version2.is_active && (
              <Badge variant="success" className="text-xs">Active</Badge>
            )}
            {comparison.version2.is_draft && (
              <Badge variant="warning" className="text-xs">Draft</Badge>
            )}
          </div>
          <Text size="sm" className="text-neutral-400">
            {new Date(comparison.version2.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </Text>
        </Card>
      </div>

      {/* Summary */}
      {comparison.summary.totalChanges > 0 && (
        <Card className="mb-6 p-4 bg-primary-500/10 border border-primary-500/20">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div>
              <Text size="lg" className="font-bold text-white">
                {comparison.summary.totalChanges} {comparison.summary.totalChanges === 1 ? 'Change' : 'Changes'}
              </Text>
              <Text size="sm" className="text-neutral-400">
                Across {comparison.summary.categories.length} {comparison.summary.categories.length === 1 ? 'category' : 'categories'}
              </Text>
            </div>
            <div className="flex flex-wrap gap-2">
              {comparison.summary.categories.map(cat => (
                <Badge key={cat.name} variant="info" className="text-xs">
                  {cat.label}: {cat.count}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Category Filter */}
      {comparison.summary.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => {
            const categoryInfo = cat === 'all'
              ? { name: 'all', label: 'All Changes', count: comparison.summary.totalChanges }
              : comparison.summary.categories.find(c => c.name === cat)
            
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'ghost' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat 
                  ? "bg-primary-500/20 border-primary-500/50 text-black hover:bg-primary-500/30 font-medium" 
                  : "flex items-center gap-2"
                }
              >
                {categoryInfo?.label || cat}
                {categoryInfo && categoryInfo.count > 0 && (
                  <Badge 
                    variant={selectedCategory === cat ? 'secondary' : 'info'} 
                    className={`text-xs px-1 ${
                      selectedCategory === cat ? 'bg-black text-white border-black' : ''
                    }`}
                  >
                    {categoryInfo.count}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>
      )}

      {/* Comparison Table */}
      {(() => {
        const groupedChanges = getChangesToShow()
        const categoryKeys = Object.keys(groupedChanges)
        
        if (categoryKeys.length === 0) {
          return (
            <Card className="p-12 text-center">
              <Text className="text-neutral-400">
                {selectedCategory === 'all'
                  ? 'No changes between these versions'
                  : `No changes in ${comparison.summary.categories.find(c => c.name === selectedCategory)?.label || selectedCategory}`}
              </Text>
            </Card>
          )
        }

        return (
          <div className="space-y-6">
            {categoryKeys.map(category => {
              const categoryChanges = groupedChanges[category]
              const categoryInfo = comparison.summary.categories.find(c => c.name === category)
              
              return (
                <div key={category}>
                  {/* Section Header */}
                  <div className="mb-4">
                    <Heading level={3} className="text-white mb-1">
                      {categoryInfo?.label || category}
                    </Heading>
                    <Text size="sm" className="text-neutral-400">
                      {categoryChanges.length} {categoryChanges.length === 1 ? 'change' : 'changes'}
                    </Text>
                  </div>

                  {/* Changes in this section */}
                  <div className="space-y-4">
                    {categoryChanges.map(({ field, change }) => {
                      const fieldLabel = comparison.fieldLabels[field] || field
                      const oldValue = formatValue(change.old, change.type)
                      const newValue = formatValue(change.new, change.type)
                      
                      // Only show if values actually differ
                      const valuesDiffer = oldValue !== newValue || 
                        (change.old === null && change.new !== null) ||
                        (change.old !== null && change.new === null)
                      
                      if (!valuesDiffer) {
                        return null
                      }

                      return (
                        <Card key={field} variant="outlined" className="p-4 hover:border-primary-500/50 transition-colors">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Old Value */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Text size="xs" className="text-neutral-500 font-medium">
                                  {fieldLabel}
                                </Text>
                              </div>
                              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <Text className="text-red-300 break-words">
                                  {oldValue === '(empty)' ? (
                                    <span className="text-neutral-500 italic">{oldValue}</span>
                                  ) : (
                                    <span className="line-through">{oldValue}</span>
                                  )}
                                </Text>
                              </div>
                            </div>

                            {/* New Value */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Text size="xs" className="text-neutral-500 font-medium">
                                  {fieldLabel}
                                </Text>
                                <ChevronRight className="w-4 h-4 text-primary-500" />
                              </div>
                              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <Text className="text-green-300 break-words">
                                  {newValue === '(empty)' ? (
                                    <span className="text-neutral-500 italic">{newValue}</span>
                                  ) : (
                                    newValue
                                  )}
                                </Text>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}
    </Card>
  )
}

