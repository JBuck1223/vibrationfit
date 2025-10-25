'use client'

import React, { useState, useEffect } from 'react'
import { Button, Card, Badge, Spinner } from '@/lib/design-system/components'
import { 
  GitBranch, 
  Save, 
  CheckCircle, 
  Edit3, 
  Trash2, 
  Clock, 
  AlertCircle,
  Copy,
  Eye,
  MoreVertical
} from 'lucide-react'

// ============================================================================
// Profile Version Management Component
// ============================================================================

interface ProfileVersion {
  id: string
  version_number: number
  is_draft: boolean
  is_active: boolean
  version_notes?: string
  parent_version_id?: string
  completion_percentage: number
  created_at: string
  updated_at: string
}

interface VersionManagerProps {
  userId: string
  onVersionSelect?: (versionId: string) => void
  onVersionCreate?: (sourceVersionId: string, isDraft: boolean) => void
  onVersionCommit?: (draftId: string) => void
  onVersionDelete?: (versionId: string) => void
  className?: string
}

export const ProfileVersionManager: React.FC<VersionManagerProps> = ({
  userId,
  onVersionSelect,
  onVersionCreate,
  onVersionCommit,
  onVersionDelete,
  className = ''
}) => {
  const [versions, setVersions] = useState<ProfileVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch versions
  const fetchVersions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile/versions')
      if (!response.ok) throw new Error('Failed to fetch versions')
      
      const data = await response.json()
      setVersions(data.versions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch versions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVersions()
  }, [userId])

  // Handle version actions
  const handleCreateDraft = async (sourceVersionId: string) => {
    try {
      setActionLoading(sourceVersionId)
      const response = await fetch('/api/profile/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceProfileId: sourceVersionId,
          versionNotes: 'Draft created from version'
        })
      })

      if (!response.ok) throw new Error('Failed to create draft')
      
      await fetchVersions()
      onVersionCreate?.(sourceVersionId, true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCommitDraft = async (draftId: string) => {
    try {
      setActionLoading(draftId)
      const response = await fetch('/api/profile/versions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftProfileId: draftId })
      })

      if (!response.ok) throw new Error('Failed to commit draft')
      
      await fetchVersions()
      onVersionCommit?.(draftId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to commit draft')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSetActive = async (versionId: string) => {
    try {
      setActionLoading(versionId)
      const response = await fetch('/api/profile/versions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: versionId })
      })

      if (!response.ok) throw new Error('Failed to set version as active')
      
      await fetchVersions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set version as active')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading(versionId)
      const response = await fetch(`/api/profile/versions/${versionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete version')
      
      await fetchVersions()
      onVersionDelete?.(versionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete version')
    } finally {
      setActionLoading(null)
    }
  }

  const getVersionStatus = (version: ProfileVersion) => {
    if (version.is_active) return { label: 'Active', variant: 'success' as const }
    if (version.is_draft) return { label: 'Draft', variant: 'warning' as const }
    return { label: 'Complete', variant: 'info' as const }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Spinner variant="primary" size="md" />
          <span className="ml-3 text-neutral-300">Loading versions...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center text-red-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GitBranch className="w-6 h-6 text-primary-500" />
          <h3 className="text-xl font-semibold text-white">Profile Versions</h3>
        </div>
        <Badge variant="info" className="text-sm">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-8 text-neutral-400">
          <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No versions found</p>
          <p className="text-sm">Create your first profile version to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map((version) => {
            const status = getVersionStatus(version)
            const isSelected = selectedVersionId === version.id
            const isLoading = actionLoading === version.id

            return (
              <div
                key={version.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected 
                    ? 'border-primary-500 bg-primary-500/10' 
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                      <span className="text-sm text-neutral-400">
                        v{version.version_number}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-neutral-300">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(version.updated_at)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-neutral-300">
                      <div className="w-2 h-2 bg-primary-500 rounded-full" />
                      <span>{version.completion_percentage}% complete</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View/Select Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedVersionId(version.id)
                        onVersionSelect?.(version.id)
                      }}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {isSelected ? 'Selected' : 'View'}
                    </Button>

                    {/* Action Buttons */}
                    {version.is_active ? (
                      // Active version actions
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCreateDraft(version.id)}
                        disabled={isLoading}
                        className="gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Create Draft
                      </Button>
                    ) : version.is_draft ? (
                      // Draft version actions
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleCommitDraft(version.id)}
                          disabled={isLoading}
                          className="gap-2"
                        >
                          {isLoading ? (
                            <Spinner variant="primary" size="sm" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Commit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVersion(version.id)}
                          disabled={isLoading}
                          className="gap-2 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      // Complete version actions
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSetActive(version.id)}
                          disabled={isLoading}
                          className="gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Set Active
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCreateDraft(version.id)}
                          disabled={isLoading}
                          className="gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Create Draft
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVersion(version.id)}
                          disabled={isLoading}
                          className="gap-2 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {version.version_notes && (
                  <div className="mt-3 p-3 bg-neutral-800 rounded-lg">
                    <p className="text-sm text-neutral-300">{version.version_notes}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default ProfileVersionManager
