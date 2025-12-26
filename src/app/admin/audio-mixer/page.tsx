"use client"

import React, { useState, useEffect } from 'react'
import { Button, Card, Container, Stack, Badge, Input, Modal, Spinner, PageHero, Textarea } from '@/lib/design-system/components'
import { Plus, Trash2, Music, Settings, Volume2, Music2, Star, Play, Pause } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface BackgroundTrack {
  id: string
  name: string
  display_name: string
  category: string
  file_url: string
  duration_seconds: number | null
  description: string | null
  is_active: boolean
  sort_order: number
}

interface MixRatio {
  id: string
  name: string
  voice_volume: number
  bg_volume: number
  description: string | null
  is_active: boolean
  sort_order: number
  icon: string | null
}

interface RecommendedCombo {
  id: string
  name: string
  description: string | null
  background_track_id: string
  mix_ratio_id: string
  sort_order: number
  is_active: boolean
  background_track?: BackgroundTrack
  mix_ratio?: MixRatio
}

type TabType = 'tracks' | 'ratios' | 'combos'

export default function AudioMixerAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('tracks')
  const [loading, setLoading] = useState(true)
  
  // Background Tracks
  const [backgroundTracks, setBackgroundTracks] = useState<BackgroundTrack[]>([])
  const [showTrackModal, setShowTrackModal] = useState(false)
  const [editingTrack, setEditingTrack] = useState<BackgroundTrack | null>(null)
  const [trackFormData, setTrackFormData] = useState({
    name: '',
    display_name: '',
    category: 'nature',
    file_url: '',
    description: '',
    sort_order: 0
  })

  // Mix Ratios
  const [mixRatios, setMixRatios] = useState<MixRatio[]>([])
  const [showRatioModal, setShowRatioModal] = useState(false)
  const [editingRatio, setEditingRatio] = useState<MixRatio | null>(null)
  const [ratioFormData, setRatioFormData] = useState({
    name: '',
    voice_volume: 50,
    bg_volume: 50,
    description: '',
    icon: '',
    sort_order: 0
  })

  // Recommended Combos
  const [recommendedCombos, setRecommendedCombos] = useState<RecommendedCombo[]>([])
  const [showComboModal, setShowComboModal] = useState(false)
  const [editingCombo, setEditingCombo] = useState<RecommendedCombo | null>(null)
  const [comboFormData, setComboFormData] = useState({
    name: '',
    description: '',
    background_track_id: '',
    mix_ratio_id: '',
    sort_order: 0
  })

  // Audio playback
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()

    if (activeTab === 'tracks') {
      const { data } = await supabase
        .from('audio_background_tracks')
        .select('*')
        .order('sort_order')
      if (data) setBackgroundTracks(data)
    } else if (activeTab === 'ratios') {
      const { data } = await supabase
        .from('audio_mix_ratios')
        .select('*')
        .order('sort_order')
      if (data) setMixRatios(data)
    } else if (activeTab === 'combos') {
      const { data } = await supabase
        .from('audio_recommended_combos')
        .select(`
          *,
          background_track:audio_background_tracks!audio_recommended_combos_background_track_id_fkey(*),
          mix_ratio:audio_mix_ratios!audio_recommended_combos_mix_ratio_id_fkey(*)
        `)
        .order('sort_order')
      if (data) setRecommendedCombos(data)
      
      // Also load tracks and ratios for the form
      const { data: tracks } = await supabase
        .from('audio_background_tracks')
        .select('*')
        .eq('is_active', true)
        .order('display_name')
      if (tracks) setBackgroundTracks(tracks)
      
      const { data: ratios } = await supabase
        .from('audio_mix_ratios')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (ratios) setMixRatios(ratios)
    }

    setLoading(false)
  }

  // Background Track Functions
  const handleSaveTrack = async () => {
    if (!trackFormData.name || !trackFormData.display_name || !trackFormData.file_url) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const trackData = {
        name: trackFormData.name.toLowerCase().replace(/\s+/g, '-'),
        display_name: trackFormData.display_name,
        category: trackFormData.category,
        file_url: trackFormData.file_url,
        description: trackFormData.description || null,
        sort_order: trackFormData.sort_order,
        is_active: true
      }

      if (editingTrack) {
        const { error } = await supabase
          .from('audio_background_tracks')
          .update(trackData)
          .eq('id', editingTrack.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('audio_background_tracks')
          .insert(trackData)
        if (error) throw error
      }

      await loadData()
      setShowTrackModal(false)
      setEditingTrack(null)
      setTrackFormData({
        name: '',
        display_name: '',
        category: 'nature',
        file_url: '',
        description: '',
        sort_order: 0
      })
    } catch (error: any) {
      console.error('Error saving track:', error)
      alert(`Failed to save track: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTrack = async (id: string) => {
    if (confirm('Are you sure you want to delete this background track?')) {
      setLoading(true)
      const supabase = createClient()
      const { error } = await supabase
        .from('audio_background_tracks')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting track:', error)
        alert('Failed to delete track')
      } else {
        await loadData()
      }
      setLoading(false)
    }
  }

  const handleEditTrack = (track: BackgroundTrack) => {
    setEditingTrack(track)
    setTrackFormData({
      name: track.name,
      display_name: track.display_name,
      category: track.category,
      file_url: track.file_url,
      description: track.description || '',
      sort_order: track.sort_order
    })
    setShowTrackModal(true)
  }

  const toggleTrackPlayback = (track: BackgroundTrack) => {
    if (playingTrackId === track.id) {
      audioRef.current?.pause()
      setPlayingTrackId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(track.file_url)
      audioRef.current = audio
      audio.play()
      setPlayingTrackId(track.id)
      audio.onended = () => setPlayingTrackId(null)
    }
  }

  // Mix Ratio Functions
  const handleSaveRatio = async () => {
    if (!ratioFormData.name) {
      alert('Please enter a name')
      return
    }

    if (ratioFormData.voice_volume + ratioFormData.bg_volume !== 100) {
      alert('Voice and background volumes must add up to 100%')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const ratioData = {
        name: ratioFormData.name,
        voice_volume: ratioFormData.voice_volume,
        bg_volume: ratioFormData.bg_volume,
        description: ratioFormData.description || null,
        icon: ratioFormData.icon || null,
        sort_order: ratioFormData.sort_order,
        is_active: true
      }

      if (editingRatio) {
        const { error } = await supabase
          .from('audio_mix_ratios')
          .update(ratioData)
          .eq('id', editingRatio.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('audio_mix_ratios')
          .insert(ratioData)
        if (error) throw error
      }

      await loadData()
      setShowRatioModal(false)
      setEditingRatio(null)
      setRatioFormData({
        name: '',
        voice_volume: 50,
        bg_volume: 50,
        description: '',
        icon: '',
        sort_order: 0
      })
    } catch (error: any) {
      console.error('Error saving ratio:', error)
      alert(`Failed to save ratio: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRatio = async (id: string) => {
    if (confirm('Are you sure you want to delete this mix ratio?')) {
      setLoading(true)
      const supabase = createClient()
      const { error } = await supabase
        .from('audio_mix_ratios')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting ratio:', error)
        alert('Failed to delete ratio')
      } else {
        await loadData()
      }
      setLoading(false)
    }
  }

  const handleEditRatio = (ratio: MixRatio) => {
    setEditingRatio(ratio)
    setRatioFormData({
      name: ratio.name,
      voice_volume: ratio.voice_volume,
      bg_volume: ratio.bg_volume,
      description: ratio.description || '',
      icon: ratio.icon || '',
      sort_order: ratio.sort_order
    })
    setShowRatioModal(true)
  }

  // Recommended Combo Functions
  const handleSaveCombo = async () => {
    if (!comboFormData.name || !comboFormData.background_track_id || !comboFormData.mix_ratio_id) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const comboData = {
        name: comboFormData.name,
        description: comboFormData.description || null,
        background_track_id: comboFormData.background_track_id,
        mix_ratio_id: comboFormData.mix_ratio_id,
        sort_order: comboFormData.sort_order,
        is_active: true
      }

      if (editingCombo) {
        const { error } = await supabase
          .from('audio_recommended_combos')
          .update(comboData)
          .eq('id', editingCombo.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('audio_recommended_combos')
          .insert(comboData)
        if (error) throw error
      }

      await loadData()
      setShowComboModal(false)
      setEditingCombo(null)
      setComboFormData({
        name: '',
        description: '',
        background_track_id: '',
        mix_ratio_id: '',
        sort_order: 0
      })
    } catch (error: any) {
      console.error('Error saving combo:', error)
      alert(`Failed to save combo: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCombo = async (id: string) => {
    if (confirm('Are you sure you want to delete this recommended combo?')) {
      setLoading(true)
      const supabase = createClient()
      const { error } = await supabase
        .from('audio_recommended_combos')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting combo:', error)
        alert('Failed to delete combo')
      } else {
        await loadData()
      }
      setLoading(false)
    }
  }

  const handleEditCombo = (combo: RecommendedCombo) => {
    setEditingCombo(combo)
    setComboFormData({
      name: combo.name,
      description: combo.description || '',
      background_track_id: combo.background_track_id,
      mix_ratio_id: combo.mix_ratio_id,
      sort_order: combo.sort_order
    })
    setShowComboModal(true)
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="ADMIN"
          title="Audio Mixer Management"
          subtitle="Manage background tracks, mix ratios, and recommended combos"
        />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-700">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'tracks'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Music2 className="w-4 h-4 inline mr-2" />
            Background Tracks
          </button>
          <button
            onClick={() => setActiveTab('ratios')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'ratios'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4 inline mr-2" />
            Mix Ratios
          </button>
          <button
            onClick={() => setActiveTab('combos')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'combos'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4 inline mr-2" />
            Recommended Combos
          </button>
        </div>

        {/* Background Tracks Tab */}
        {activeTab === 'tracks' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Background Tracks ({backgroundTracks.length})</h2>
              <Button
                onClick={() => {
                  setTrackFormData({
                    name: '',
                    display_name: '',
                    category: 'nature',
                    file_url: '',
                    description: '',
                    sort_order: backgroundTracks.length
                  })
                  setEditingTrack(null)
                  setShowTrackModal(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Track
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {backgroundTracks.map((track) => (
                <Card key={track.id} variant="elevated" className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{track.display_name}</h3>
                      <p className="text-xs text-neutral-400">{track.name}</p>
                    </div>
                    <Badge 
                      variant={track.category === 'nature' ? 'success' : track.category === 'ambient' ? 'accent' : 'primary'}
                      className="text-xs"
                    >
                      {track.category}
                    </Badge>
                  </div>

                  {track.description && (
                    <p className="text-sm text-neutral-400 mb-3">{track.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                    <span>Sort: {track.sort_order}</span>
                    {track.is_active ? (
                      <Badge variant="success" className="text-xs">Active</Badge>
                    ) : (
                      <Badge variant="neutral" className="text-xs">Inactive</Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => toggleTrackPlayback(track)}
                    >
                      {playingTrackId === track.id ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Stop Preview
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Preview
                        </>
                      )}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditTrack(track)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteTrack(track.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Mix Ratios Tab */}
        {activeTab === 'ratios' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Mix Ratios ({mixRatios.length})</h2>
              <Button
                onClick={() => {
                  setRatioFormData({
                    name: '',
                    voice_volume: 50,
                    bg_volume: 50,
                    description: '',
                    icon: '',
                    sort_order: mixRatios.length
                  })
                  setEditingRatio(null)
                  setShowRatioModal(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Ratio
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mixRatios.map((ratio) => (
                <Card key={ratio.id} variant="elevated" className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{ratio.name}</h3>
                      <p className="text-sm text-neutral-400 mt-1">
                        {ratio.voice_volume}% voice • {ratio.bg_volume}% background
                      </p>
                    </div>
                  </div>

                  {ratio.description && (
                    <p className="text-sm text-neutral-400 mb-3">{ratio.description}</p>
                  )}

                  <div className="mb-3">
                    <div className="flex h-4 rounded-full overflow-hidden">
                      <div
                        className="bg-primary-500"
                        style={{ width: `${ratio.voice_volume}%` }}
                      />
                      <div
                        className="bg-secondary-500"
                        style={{ width: `${ratio.bg_volume}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                    <span>Sort: {ratio.sort_order}</span>
                    {ratio.icon && <span>Icon: {ratio.icon}</span>}
                    {ratio.is_active ? (
                      <Badge variant="success" className="text-xs">Active</Badge>
                    ) : (
                      <Badge variant="neutral" className="text-xs">Inactive</Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditRatio(ratio)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteRatio(ratio.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Recommended Combos Tab */}
        {activeTab === 'combos' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Recommended Combos ({recommendedCombos.length})</h2>
              <Button
                onClick={() => {
                  setComboFormData({
                    name: '',
                    description: '',
                    background_track_id: '',
                    mix_ratio_id: '',
                    sort_order: recommendedCombos.length
                  })
                  setEditingCombo(null)
                  setShowComboModal(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Combo
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedCombos.map((combo) => (
                <Card key={combo.id} variant="elevated" className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-lg font-semibold text-white">{combo.name}</h3>
                      </div>
                      {combo.description && (
                        <p className="text-sm text-neutral-400">{combo.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Music2 className="w-4 h-4 text-primary-500" />
                      <span className="text-white font-medium">
                        {combo.background_track?.display_name || 'Unknown Track'}
                      </span>
                      <Badge variant="neutral" className="text-xs">
                        {combo.background_track?.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Volume2 className="w-4 h-4 text-secondary-500" />
                      <span className="text-white font-medium">
                        {combo.mix_ratio?.name || 'Unknown Ratio'}
                      </span>
                      <span className="text-neutral-400 text-xs">
                        ({combo.mix_ratio?.voice_volume}/{combo.mix_ratio?.bg_volume})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                    <span>Sort: {combo.sort_order}</span>
                    {combo.is_active ? (
                      <Badge variant="success" className="text-xs">Active</Badge>
                    ) : (
                      <Badge variant="neutral" className="text-xs">Inactive</Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditCombo(combo)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteCombo(combo.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Stack>

      {/* Background Track Modal */}
      <Modal
        isOpen={showTrackModal}
        onClose={() => {
          setShowTrackModal(false)
          setEditingTrack(null)
        }}
        title={editingTrack ? 'Edit Background Track' : 'Add Background Track'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Internal Name (lowercase, no spaces) *
            </label>
            <Input
              value={trackFormData.name}
              onChange={(e) => setTrackFormData({ ...trackFormData, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder="e.g., ocean-waves-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Display Name *
            </label>
            <Input
              value={trackFormData.display_name}
              onChange={(e) => setTrackFormData({ ...trackFormData, display_name: e.target.value })}
              placeholder="e.g., Ocean Waves"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Category *
            </label>
            <select
              value={trackFormData.category}
              onChange={(e) => setTrackFormData({ ...trackFormData, category: e.target.value })}
              className="w-full px-6 py-3 rounded-full bg-[#1F1F1F] text-white text-sm border-2 border-[#333] focus:border-primary-500 focus:outline-none"
            >
              <option value="nature">Nature</option>
              <option value="ambient">Ambient</option>
              <option value="music">Music</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              File URL *
            </label>
            <Input
              value={trackFormData.file_url}
              onChange={(e) => setTrackFormData({ ...trackFormData, file_url: e.target.value })}
              placeholder="https://media.vibrationfit.com/site-assets/audio/mixing-tracks/..."
              className="font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <Textarea
              value={trackFormData.description}
              onChange={(e) => setTrackFormData({ ...trackFormData, description: e.target.value })}
              placeholder="Brief description of the track"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Sort Order
            </label>
            <Input
              type="number"
              value={trackFormData.sort_order}
              onChange={(e) => setTrackFormData({ ...trackFormData, sort_order: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowTrackModal(false)
                setEditingTrack(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSaveTrack}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : 'Save Track'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mix Ratio Modal */}
      <Modal
        isOpen={showRatioModal}
        onClose={() => {
          setShowRatioModal(false)
          setEditingRatio(null)
        }}
        title={editingRatio ? 'Edit Mix Ratio' : 'Add Mix Ratio'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Name *
            </label>
            <Input
              value={ratioFormData.name}
              onChange={(e) => setRatioFormData({ ...ratioFormData, name: e.target.value })}
              placeholder="e.g., Voice Focused (70/30)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Voice Volume (%) *
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={ratioFormData.voice_volume}
                onChange={(e) => {
                  const voice = parseInt(e.target.value) || 0
                  setRatioFormData({ ...ratioFormData, voice_volume: voice, bg_volume: 100 - voice })
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
                value={ratioFormData.bg_volume}
                onChange={(e) => {
                  const bg = parseInt(e.target.value) || 0
                  setRatioFormData({ ...ratioFormData, bg_volume: bg, voice_volume: 100 - bg })
                }}
              />
            </div>
          </div>

          <div className="h-4 flex rounded-full overflow-hidden">
            <div
              className="bg-primary-500"
              style={{ width: `${ratioFormData.voice_volume}%` }}
            />
            <div
              className="bg-secondary-500"
              style={{ width: `${ratioFormData.bg_volume}%` }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <Textarea
              value={ratioFormData.description}
              onChange={(e) => setRatioFormData({ ...ratioFormData, description: e.target.value })}
              placeholder="Brief description of this mix ratio"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Icon (optional)
            </label>
            <Input
              value={ratioFormData.icon}
              onChange={(e) => setRatioFormData({ ...ratioFormData, icon: e.target.value })}
              placeholder="e.g., volume-2, music"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Sort Order
            </label>
            <Input
              type="number"
              value={ratioFormData.sort_order}
              onChange={(e) => setRatioFormData({ ...ratioFormData, sort_order: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowRatioModal(false)
                setEditingRatio(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSaveRatio}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : 'Save Ratio'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Recommended Combo Modal */}
      <Modal
        isOpen={showComboModal}
        onClose={() => {
          setShowComboModal(false)
          setEditingCombo(null)
        }}
        title={editingCombo ? 'Edit Recommended Combo' : 'Add Recommended Combo'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Combo Name *
            </label>
            <Input
              value={comboFormData.name}
              onChange={(e) => setComboFormData({ ...comboFormData, name: e.target.value })}
              placeholder="e.g., Sleep Journey"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <Textarea
              value={comboFormData.description}
              onChange={(e) => setComboFormData({ ...comboFormData, description: e.target.value })}
              placeholder="Why this combo works well"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Background Track *
            </label>
            <select
              value={comboFormData.background_track_id}
              onChange={(e) => setComboFormData({ ...comboFormData, background_track_id: e.target.value })}
              className="w-full px-6 py-3 rounded-full bg-[#1F1F1F] text-white text-sm border-2 border-[#333] focus:border-primary-500 focus:outline-none"
            >
              <option value="">Select a background track...</option>
              {backgroundTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.display_name} ({track.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Mix Ratio *
            </label>
            <select
              value={comboFormData.mix_ratio_id}
              onChange={(e) => setComboFormData({ ...comboFormData, mix_ratio_id: e.target.value })}
              className="w-full px-6 py-3 rounded-full bg-[#1F1F1F] text-white text-sm border-2 border-[#333] focus:border-primary-500 focus:outline-none"
            >
              <option value="">Select a mix ratio...</option>
              {mixRatios.map((ratio) => (
                <option key={ratio.id} value={ratio.id}>
                  {ratio.name} ({ratio.voice_volume}/{ratio.bg_volume})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Sort Order
            </label>
            <Input
              type="number"
              value={comboFormData.sort_order}
              onChange={(e) => setComboFormData({ ...comboFormData, sort_order: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowComboModal(false)
                setEditingCombo(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSaveCombo}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : 'Save Combo'}
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}
