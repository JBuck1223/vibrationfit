"use client"

import React, { useState, useEffect } from 'react'
import { Button, Card, Container, Stack, Badge, Input, Modal, Spinner } from '@/lib/design-system/components'
import { Plus, Trash2, Music, Settings, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Track {
  filename: string
  variant: string
  url: string
}

interface Variant {
  id: string
  name: string
  voiceVolume: number
  bgVolume: number
  backgroundTrack: string
}

export default function AudioMixerAdminPage() {
  const [loading, setLoading] = useState(false)
  const [variants, setVariants] = useState<Variant[]>([
    { id: 'standard', name: 'Voice Only', voiceVolume: 100, bgVolume: 0, backgroundTrack: '' },
    { id: 'sleep', name: 'Sleep (Ocean Waves)', voiceVolume: 30, bgVolume: 70, backgroundTrack: 'Ocean-Waves-1.mp3' },
    { id: 'meditation', name: 'Meditation', voiceVolume: 50, bgVolume: 50, backgroundTrack: 'Ocean-Waves-1.mp3' },
    { id: 'energy', name: 'Energy', voiceVolume: 80, bgVolume: 20, backgroundTrack: 'Ocean-Waves-1.mp3' },
  ])
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)
  const [formData, setFormData] = useState({ id: '', name: '', voiceVolume: 50, bgVolume: 50, backgroundTrack: '' })

  const handleSave = () => {
    if (!formData.id || !formData.name) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.voiceVolume + formData.bgVolume !== 100) {
      alert('Voice and background volumes must add up to 100%')
      return
    }

    setLoading(true)
    
    if (editingVariant) {
      // Update existing
      setVariants(variants.map(v => v.id === editingVariant.id ? formData : v))
    } else {
      // Add new
      setVariants([...variants, { ...formData, id: formData.id.toLowerCase().replace(/\s+/g, '-') }])
    }
    
    setShowAddModal(false)
    setEditingVariant(null)
    setFormData({ id: '', name: '', voiceVolume: 50, bgVolume: 50, backgroundTrack: '' })
    setLoading(false)
    
    // TODO: Save to database or config file
    alert('Saved! (Remember to update the code files manually)')
  }

  const handleDelete = (id: string) => {
    if (id === 'standard') {
      alert('Cannot delete the standard variant')
      return
    }
    if (confirm('Are you sure you want to delete this variant?')) {
      setVariants(variants.filter(v => v.id !== id))
      // TODO: Save to database or config file
    }
  }

  const handleEdit = (variant: Variant) => {
    setEditingVariant(variant)
    setFormData(variant)
    setShowAddModal(true)
  }

  return (
    <Container size="xl" className="py-8">
      <Stack gap="lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Audio Mixer Admin</h1>
            <p className="text-neutral-400 mt-2">Manage background tracks and audio variants</p>
          </div>
          <Button onClick={() => {
            setFormData({ id: '', name: '', voiceVolume: 50, bgVolume: 50, backgroundTrack: '' })
            setEditingVariant(null)
            setShowAddModal(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Button>
        </div>

        {/* Variants List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {variants.map((variant) => (
            <Card key={variant.id} variant="elevated" className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
                    <Music className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{variant.name}</h3>
                    <p className="text-sm text-neutral-400">ID: {variant.id}</p>
                  </div>
                </div>
                {variant.id === 'standard' && (
                  <Badge variant="success">System</Badge>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Voice Volume:</span>
                  <span className="text-white font-semibold">{variant.voiceVolume}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Background:</span>
                  <span className="text-white font-semibold">{variant.bgVolume}%</span>
                </div>
                {variant.backgroundTrack && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Track:</span>
                    <span className="text-primary-500 font-mono text-xs">{variant.backgroundTrack}</span>
                  </div>
                )}
              </div>

              {variant.id !== 'standard' && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(variant)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(variant.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card variant="glass" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-3">How to use</h3>
          <div className="space-y-2 text-sm text-neutral-400">
            <p>• Upload background tracks to: <code className="text-primary-500">s3://vibration-fit-client-storage/site-assets/audio/mixing-tracks/</code></p>
            <p>• File names should be lowercase with hyphens (e.g., ocean-waves-1.mp3)</p>
            <p>• After adding variants here, update the code in:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code className="text-primary-500">src/lib/audio/backgroundMixing.ts</code> - Background track URLs</li>
              <li><code className="text-primary-500">src/app/api/audio/mix/route.ts</code> - Volume percentages</li>
              <li><code className="text-primary-500">src/app/life-vision/[id]/audio/page.tsx</code> - Variant selection UI</li>
            </ul>
          </div>
        </Card>
      </Stack>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingVariant(null)
          setFormData({ id: '', name: '', voiceVolume: 50, bgVolume: 50, backgroundTrack: '' })
        }}
        title={editingVariant ? 'Edit Variant' : 'Add New Variant'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              ID (lowercase, no spaces)
            </label>
            <Input
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder="e.g., focus, nature"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Display Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Focus Mode"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Voice Volume (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.voiceVolume}
                onChange={(e) => {
                  const voice = parseInt(e.target.value) || 0
                  setFormData({ ...formData, voiceVolume: voice, bgVolume: 100 - voice })
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Background Volume (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.bgVolume}
                onChange={(e) => {
                  const bg = parseInt(e.target.value) || 0
                  setFormData({ ...formData, bgVolume: bg, voiceVolume: 100 - bg })
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Background Track Filename (optional)
            </label>
            <Input
              value={formData.backgroundTrack}
              onChange={(e) => setFormData({ ...formData, backgroundTrack: e.target.value })}
              placeholder="e.g., ocean-waves-1.mp3"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowAddModal(false)
                setEditingVariant(null)
                setFormData({ id: '', name: '', voiceVolume: 50, bgVolume: 50, backgroundTrack: '' })
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}
