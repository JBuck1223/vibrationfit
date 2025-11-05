'use client'

import React, { useState } from 'react'
import { Card, Button, Badge, Heading, Text, Stack } from '@/lib/design-system/components'
import { GitCompare, X } from 'lucide-react'

interface VersionSelectorProps {
  versions: Array<{
    id: string
    version_number: number
    is_draft: boolean
    is_active: boolean
    created_at: string
  }>
  onCompare: (version1Id: string, version2Id: string) => void
  onClose: () => void
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  versions,
  onCompare,
  onClose
}) => {
  const [selectedVersion1, setSelectedVersion1] = useState<string | null>(null)
  const [selectedVersion2, setSelectedVersion2] = useState<string | null>(null)

  const handleVersionClick = (versionId: string) => {
    if (!selectedVersion1) {
      setSelectedVersion1(versionId)
    } else if (!selectedVersion2 && versionId !== selectedVersion1) {
      setSelectedVersion2(versionId)
    } else if (versionId === selectedVersion1) {
      setSelectedVersion1(null)
      setSelectedVersion2(null)
    } else if (versionId === selectedVersion2) {
      setSelectedVersion2(null)
    } else {
      // Replace first selection
      setSelectedVersion1(versionId)
      setSelectedVersion2(null)
    }
  }

  const handleCompare = () => {
    if (selectedVersion1 && selectedVersion2) {
      onCompare(selectedVersion1, selectedVersion2)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Heading level={3} className="text-white">Select Two Versions to Compare</Heading>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Text size="sm" className="text-neutral-400 mb-4">
        Click on two versions below to compare them
      </Text>

      <Stack gap="sm" className="mb-6 max-h-96 overflow-y-auto">
        {versions.map((version) => {
          const isSelected1 = selectedVersion1 === version.id
          const isSelected2 = selectedVersion2 === version.id
          const isSelected = isSelected1 || isSelected2

          return (
            <Card
              key={version.id}
              variant={isSelected ? 'elevated' : 'outlined'}
              className={`p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'hover:border-primary-500/50'
              }`}
              onClick={() => handleVersionClick(version.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isSelected && (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isSelected1 ? 'bg-primary-500' : 'bg-secondary-500'
                    }`}>
                      <Text size="xs" className="text-white font-bold">
                        {isSelected1 ? '1' : '2'}
                      </Text>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <Text className="text-white font-semibold">
                        Version {version.version_number}
                      </Text>
                      {version.is_draft && (
                        <Badge variant="warning" className="text-xs">Draft</Badge>
                      )}
                      {version.is_active && !version.is_draft && (
                        <Badge variant="success" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <Text size="xs" className="text-neutral-400">
                      {new Date(version.created_at).toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </Stack>

      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={handleCompare}
          disabled={!selectedVersion1 || !selectedVersion2}
          className="flex-1"
        >
          <GitCompare className="w-4 h-4 mr-2" />
          Compare Versions
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Card>
  )
}

