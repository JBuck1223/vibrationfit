'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, Button, Badge, DeleteConfirmationDialog, Heading, Text, Stack, CreatedDateBadge } from '@/lib/design-system/components'
import { VersionCard } from '../components/VersionCard'
import { VISION_CATEGORIES, getVisionCategory } from '@/lib/design-system/vision-categories'
import { UserProfile } from '@/lib/supabase/profile'
import { ProfileField } from '../components/ProfileField'
import { SavedRecordings } from '@/components/SavedRecordings'
import { 
  User, 
  Heart, 
  Users, 
  Activity, 
  MapPin, 
  Briefcase, 
  DollarSign,
  Edit3,
  FileText,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  Camera,
  Clock,
  Home,
  Building,
  GraduationCap,
  Star,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  History,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Plane,
  UserPlus,
  Package,
  CheckCircle2
} from 'lucide-react'
import NextImage from 'next/image'

// Helper function to get category info from design system
const getCategoryInfo = (categoryId: string) => {
  // Map profile category filters to vision category keys
  const categoryMapping: Record<string, string> = {
    'love': 'love',
    'family': 'family', 
    'health': 'health',
    'home': 'home',
    'work': 'work',
    'money': 'money',
    'fun': 'fun',
    'travel': 'travel',
    'social': 'social',
    'stuff': 'stuff',
    'spirituality': 'spirituality',
    'giving': 'giving'
  }
  
  const visionCategoryKey = categoryMapping[categoryId] || categoryId
  const category = getVisionCategory(visionCategoryKey)
  
  if (category) {
    return {
      id: categoryId,
      title: category.label,
      icon: category.icon,
      color: 'text-primary-500',
      order: category.order
    }
  }
  
  // Fallback for categories not in vision categories
  return {
    id: categoryId,
    title: categoryId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: User,
    color: 'text-primary-500',
    order: 999 // High number to put unmapped categories at the end
  }
}

// Helper function to get profile categories in design system order
const getOrderedProfileCategories = () => {
  const profileCategories = [
    'love',
    'family', 
    'health',
    'home',
    'work',
    'money',
    'fun',
    'travel',
    'social',
    'stuff',
    'spirituality',
    'giving'
  ]
  
  return profileCategories
    .map(categoryId => getCategoryInfo(categoryId))
    .sort((a, b) => a.order - b.order)
}


interface ProfileViewPageProps {}

export default function ProfileDetailPage() {
  const router = useRouter()
  const params = useParams()
  const profileId = params.id as string
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [deletingVersion, setDeletingVersion] = useState<string | null>(null)
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null)
  const [isViewingVersion, setIsViewingVersion] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [versionToDelete, setVersionToDelete] = useState<any>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  // Refresh profile when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProfile()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Load profile version based on ID parameter
  useEffect(() => {
    if (profileId) {
      setCurrentVersionId(profileId)
      fetchProfileVersion(profileId)
    }
  }, [profileId])

  // Update version viewing state when versions data is available
  useEffect(() => {
    if (!profileId) {
      setIsViewingVersion(false)
      setCurrentVersionId(null)
    } else {
      // When viewing a specific profile ID, set the version ID but allow editing
      setIsViewingVersion(false) // Allow editing on view pages
      setCurrentVersionId(profileId)
    }
  }, [profileId])

  const fetchProfile = async () => {
    try {
      // Add cache-busting parameter to force fresh data
      const timestamp = Date.now()
      const response = await fetch(`/api/profile?t=${timestamp}&includeVersions=true`)
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      console.log('Profile view: Fetched data:', data)
      console.log('Profile view: Versions received:', data.versions?.length || 0)
      setProfile(data.profile || {})
      setCompletionPercentage(data.completionPercentage || 0)
      setVersions(data.versions || [])
      
      // Get user ID from Supabase
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const deleteVersion = async (versionId: string) => {
    // Note: Confirmation is handled by confirmDeleteVersion via DeleteConfirmationDialog
    // No browser confirm() needed here
    setDeletingVersion(versionId)
    try {
      const response = await fetch(`/api/profile?versionId=${versionId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete version' }))
        throw new Error(errorData.error || 'Failed to delete version')
      }

      // Refresh the profile to get updated versions list
      await fetchProfile()
    } catch (error) {
      console.error('Error deleting version:', error)
      throw error // Re-throw so confirmDeleteVersion can handle it
    } finally {
      setDeletingVersion(null)
    }
  }

  const fetchProfileVersion = async (versionId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/profile?versionId=${versionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch profile version')
      }
      const data = await response.json()
      setProfile(data.profile || {})
      setCompletionPercentage(data.completionPercentage || 0)
      setCurrentVersionId(versionId)
      
      // Always set as viewing version when viewing a specific ID
      setIsViewingVersion(false) // Allow editing on view pages
      
      // Also fetch versions list to get full version info
      const versionsResponse = await fetch(`/api/profile?includeVersions=true`)
      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json()
        setVersions(versionsData.versions || [])
      }
    } catch (error) {
      console.error('Error fetching profile version:', error)
      setError('Failed to load profile version')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldSave = async (fieldKey: string, newValue: any) => {
    try {
      // Save to database via API - include profileId to update the correct profile
      const response = await fetch(`/api/profile?profileId=${profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [fieldKey]: newValue
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save field' }))
        throw new Error(errorData.error || 'Failed to save field')
      }

      const data = await response.json()
      
      // Update the local profile state with the saved data
      setProfile(prev => ({
        ...prev,
        [fieldKey]: newValue,
      }))
      
      // Update completion percentage if provided
      if (data.completionPercentage !== undefined) {
        setCompletionPercentage(data.completionPercentage)
      }
      
      console.log('Field saved successfully:', fieldKey, newValue)
    } catch (error) {
      console.error('Error saving field:', error)
      throw error // Re-throw so the ProfileField component can handle it
    }
  }

  // Commit draft handler - uses API endpoint
  const commitDraft = useCallback(async () => {
    try {
      const response = await fetch('/api/profile/versions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commitDraft: true
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to commit draft' }))
        throw new Error(errorData.error || 'Failed to commit draft')
      }

      // Refresh the profile to get updated versions list
      await fetchProfile()
    } catch (error) {
      console.error('Error committing draft:', error)
      alert(error instanceof Error ? error.message : 'Failed to commit draft')
    }
  }, [])

  // Delete confirmation handlers
  const handleDeleteVersion = (version: any) => {
    setVersionToDelete(version)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteVersion = async () => {
    if (!versionToDelete) return
    
    try {
      await deleteVersion(versionToDelete.id)
      // Only close dialog on success
      setDeleteDialogOpen(false)
      setVersionToDelete(null)
    } catch (error) {
      console.error('Error deleting version:', error)
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete version. Please try again.'
      alert(errorMessage)
      // Keep dialog open so user can try again or cancel
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified'
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateString.split('T')[0].split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Not specified'
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateOfBirth.split('T')[0].split('-')
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} years old`
  }

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400'
    if (percentage >= 60) return 'text-yellow-400'
    if (percentage >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getCompletionBg = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    if (percentage >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getCurrentVersionInfo = () => {
    if (!profileId) return null
    // Find the version info for the current profileId
    const versionInfo = versions.find(v => v.id === profileId)
    if (versionInfo) return versionInfo
    
    // If not in versions list yet, use profile data directly
    if (profile && profile.id === profileId) {
      const profileAny = profile as any
      return {
        id: profile.id,
        version_number: profileAny.version_number,
        is_draft: profileAny.is_draft,
        is_active: profileAny.is_active,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    }
    
    return null
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextMedia = () => {
    if (profile.progress_photos) {
      setLightboxIndex((prev) => (prev + 1) % profile.progress_photos!.length)
    }
  }

  const prevMedia = () => {
    if (profile.progress_photos) {
      setLightboxIndex((prev) => (prev - 1 + profile.progress_photos!.length) % profile.progress_photos!.length)
    }
  }

  const isVideo = (url: string) => {
    return /\.(mp4|webm|quicktime)$/i.test(url) || url.includes('video/')
  }

  // Helper function to render fields for each category
  const renderCategoryFields = (categoryId: string) => {
    switch (categoryId) {
      case 'love':
        return (
          <>
            <ProfileField 
              label="Status" 
              value={profile.relationship_status}
              editable={!isViewingVersion}
              fieldKey="relationship_status"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'Single', label: 'Single' },
                { value: 'Dating', label: 'Dating' },
                { value: 'In a Relationship', label: 'In a Relationship' },
                { value: 'Engaged', label: 'Engaged' },
                { value: 'Married', label: 'Married' },
                { value: 'Separated', label: 'Separated' },
                { value: 'Divorced', label: 'Divorced' },
                { value: 'Widowed', label: 'Widowed' },
              ]}
            />
            <ProfileField 
              label="Partner" 
              value={profile.partner_name}
              editable={!isViewingVersion}
              fieldKey="partner_name"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="Relationship Length" 
              value={profile.relationship_length}
              editable={!isViewingVersion}
              fieldKey="relationship_length"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'Less than 1 year', label: 'Less than 1 year' },
                { value: '1-2 years', label: '1-2 years' },
                { value: '3-5 years', label: '3-5 years' },
                { value: '6-10 years', label: '6-10 years' },
                { value: '10+ years', label: '10+ years' },
              ]}
            />
            <ProfileField 
              label="My Current Story Around Romance & Partnership" 
              value={profile.love_story}
              type="story"
              editable={!isViewingVersion}
              fieldKey="love_story"
              onSave={handleFieldSave}
            />
          </>
        )
      
      case 'family':
        return (
          <>
            <ProfileField 
              label="Has Children" 
              value={profile.has_children} 
              type="boolean"
              editable={!isViewingVersion}
              fieldKey="has_children"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="Number of Children" 
              value={profile.number_of_children}
              type="number"
              editable={!isViewingVersion}
              fieldKey="number_of_children"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="Children's Ages" 
              value={profile.children_ages} 
              type="array"
              editable={!isViewingVersion}
              fieldKey="children_ages"
              onSave={handleFieldSave}
              placeholder="Add child's age (e.g., 5, 12, 16)"
            />
            <ProfileField 
              label="My Current Story Around Family & Parenting" 
              value={profile.family_story}
              type="story"
              editable={!isViewingVersion}
              fieldKey="family_story"
              onSave={handleFieldSave}
            />
          </>
        )
      
      case 'health':
        return (
          <>
            <ProfileField 
              label="Height" 
              value={profile.height ? `${profile.height} ${profile.units === 'US' ? 'inches' : 'cm'}` : null}
              editable={!isViewingVersion}
              fieldKey="height"
              onSave={handleFieldSave}
              type="number"
            />
            <ProfileField 
              label="Weight" 
              value={profile.weight ? `${profile.weight} ${profile.units === 'US' ? 'lbs' : 'kg'}` : null}
              editable={!isViewingVersion}
              fieldKey="weight"
              onSave={handleFieldSave}
              type="number"
            />
            <ProfileField 
              label="Units" 
              value={profile.units}
              editable={!isViewingVersion}
              fieldKey="units"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'US', label: 'US (inches, lbs)' },
                { value: 'Metric', label: 'Metric (cm, kg)' },
              ]}
            />
            <ProfileField 
              label="Exercise Frequency" 
              value={profile.exercise_frequency}
              editable={!isViewingVersion}
              fieldKey="exercise_frequency"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'Never', label: 'Never' },
                { value: '1-2 times per week', label: '1-2 times per week' },
                { value: '3-4 times per week', label: '3-4 times per week' },
                { value: '5+ times per week', label: '5+ times per week' },
                { value: 'Daily', label: 'Daily' },
              ]}
            />
            <ProfileField 
              label="My Current Story Around Health & Vitality" 
              value={profile.health_story}
              type="story"
              editable={!isViewingVersion}
              fieldKey="health_story"
              onSave={handleFieldSave}
            />
          </>
        )
      
      case 'home':
        return (
          <>
            <ProfileField 
              label="Living Situation" 
              value={profile.living_situation}
              editable={!isViewingVersion}
              fieldKey="living_situation"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'Own', label: 'Own' },
                { value: 'Rent', label: 'Rent' },
                { value: 'Living with family', label: 'Living with family' },
                { value: 'Other', label: 'Other' },
              ]}
            />
            <ProfileField 
              label="Time at Location" 
              value={profile.time_at_location}
              editable={!isViewingVersion}
              fieldKey="time_at_location"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'Less than 1 year', label: 'Less than 1 year' },
                { value: '1-2 years', label: '1-2 years' },
                { value: '3-5 years', label: '3-5 years' },
                { value: '6-10 years', label: '6-10 years' },
                { value: '10+ years', label: '10+ years' },
              ]}
            />
            <ProfileField 
              label="City" 
              value={profile.city}
              editable={!isViewingVersion}
              fieldKey="city"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="State" 
              value={profile.state}
              editable={!isViewingVersion}
              fieldKey="state"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="Postal Code" 
              value={profile.postal_code}
              editable={!isViewingVersion}
              fieldKey="postal_code"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="Country" 
              value={profile.country}
              editable={!isViewingVersion}
              fieldKey="country"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="My Current Story Around Home & Environment" 
              value={profile.home_story}
              type="story"
              editable={!isViewingVersion}
              fieldKey="home_story"
              onSave={handleFieldSave}
            />
          </>
        )
      
      case 'work':
        return (
          <>
            <ProfileField 
              label="Employment Type" 
              value={profile.employment_type}
              editable={!isViewingVersion}
              fieldKey="employment_type"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Self-employed', label: 'Self-employed' },
                { value: 'Business Owner', label: 'Business Owner' },
                { value: 'Freelance', label: 'Freelance' },
                { value: 'Unemployed', label: 'Unemployed' },
                { value: 'Retired', label: 'Retired' },
                { value: 'Student', label: 'Student' },
              ]}
            />
            <ProfileField 
              label="Occupation" 
              value={profile.occupation}
              editable={!isViewingVersion}
              fieldKey="occupation"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="Company" 
              value={profile.company}
              editable={!isViewingVersion}
              fieldKey="company"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="Time in Role" 
              value={profile.time_in_role}
              editable={!isViewingVersion}
              fieldKey="time_in_role"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'Less than 1 year', label: 'Less than 1 year' },
                { value: '1-2 years', label: '1-2 years' },
                { value: '3-5 years', label: '3-5 years' },
                { value: '5-10 years', label: '5-10 years' },
                { value: '10+ years', label: '10+ years' },
              ]}
            />
            <ProfileField 
              label="Education" 
              value={profile.education}
              editable={!isViewingVersion}
              fieldKey="education"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'High School', label: 'High School' },
                { value: 'Some College', label: 'Some College' },
                { value: 'Associate Degree', label: 'Associate Degree' },
                { value: 'Bachelor\'s Degree', label: 'Bachelor\'s Degree' },
                { value: 'Master\'s Degree', label: 'Master\'s Degree' },
                { value: 'Doctorate', label: 'Doctorate' },
                { value: 'Prefer not to say', label: 'Prefer not to say' },
              ]}
            />
            <ProfileField 
              label="Education Description" 
              value={profile.education_description}
              editable={!isViewingVersion}
              fieldKey="education_description"
              onSave={handleFieldSave}
              type="story"
            />
            <ProfileField 
              label="My Current Story Around Career & Work" 
              value={profile.work_story}
              type="story"
              editable={!isViewingVersion}
              fieldKey="work_story"
              onSave={handleFieldSave}
            />
          </>
        )
      
      case 'money':
        return (
          <>
            <ProfileField 
              label="Currency" 
              value={profile.currency}
              editable={!isViewingVersion}
              fieldKey="currency"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'CAD', label: 'CAD ($)' },
                { value: 'AUD', label: 'AUD ($)' },
              ]}
            />
            <ProfileField 
              label="Household Income" 
              value={profile.household_income}
              editable={!isViewingVersion}
              fieldKey="household_income"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'Under 25,000', label: 'Under $25,000' },
                { value: '25,000-49,999', label: '$25,000-$49,999' },
                { value: '50,000-74,999', label: '$50,000-$74,999' },
                { value: '75,000-99,999', label: '$75,000-$99,999' },
                { value: '100,000-249,999', label: '$100,000-$249,999' },
                { value: '250,000-499,999', label: '$250,000-$499,999' },
                { value: '500,000+', label: '$500,000+' },
              ]}
            />
            <ProfileField 
              label="Savings & Retirement" 
              value={profile.savings_retirement}
              editable={!isViewingVersion}
              fieldKey="savings_retirement"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'Under 10,000', label: 'Under $10,000' },
                { value: '10,000-24,999', label: '$10,000-$24,999' },
                { value: '25,000-49,999', label: '$25,000-$49,999' },
                { value: '50,000-99,999', label: '$50,000-$99,999' },
                { value: '100,000-249,999', label: '$100,000-$249,999' },
                { value: '250,000-499,999', label: '$250,000-$499,999' },
                { value: '500,000+', label: '$500,000+' },
              ]}
            />
            <ProfileField 
              label="Assets & Equity" 
              value={profile.assets_equity}
              editable={!isViewingVersion}
              fieldKey="assets_equity"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'Under 10,000', label: 'Under $10,000' },
                { value: '10,000-24,999', label: '$10,000-$24,999' },
                { value: '25,000-49,999', label: '$25,000-$49,999' },
                { value: '50,000-99,999', label: '$50,000-$99,999' },
                { value: '100,000-249,999', label: '$100,000-$249,999' },
                { value: '250,000-499,999', label: '$250,000-$499,999' },
                { value: '500,000+', label: '$500,000+' },
              ]}
            />
            <ProfileField 
              label="Consumer Debt" 
              value={profile.consumer_debt}
              editable={!isViewingVersion}
              fieldKey="consumer_debt"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'None', label: 'None' },
                { value: 'Under 10,000', label: 'Under $10,000' },
                { value: '10,000-24,999', label: '$10,000-$24,999' },
                { value: '25,000-49,999', label: '$25,000-$49,999' },
                { value: '50,000+', label: '$50,000+' },
              ]}
            />
            <ProfileField 
              label="My Current Story Around Money & Wealth" 
              value={profile.money_story}
              type="story"
              editable={!isViewingVersion}
              fieldKey="money_story"
              onSave={handleFieldSave}
            />
          </>
        )
      
      case 'fun':
        return (
          <>
            <ProfileField 
              label="Current Hobbies" 
              value={profile.hobbies} 
              type="array"
              editable={!isViewingVersion}
              fieldKey="hobbies"
              onSave={handleFieldSave}
              placeholder="Add a hobby"
            />
            <ProfileField 
              label="Leisure Time Per Week" 
              value={profile.leisure_time_weekly}
              editable={!isViewingVersion}
              fieldKey="leisure_time_weekly"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: '0-5 hours', label: '0-5 hours' },
                { value: '6-15 hours', label: '6-15 hours' },
                { value: '16-25 hours', label: '16-25 hours' },
                { value: '25+ hours', label: '25+ hours' },
              ]}
            />
            <ProfileField 
              label="My Current Story Around Fun & Recreation" 
              value={profile.fun_story}
              type="story"
              editable={!isViewingVersion}
              fieldKey="fun_story"
              onSave={handleFieldSave}
            />
          </>
        )
      
      case 'travel':
        return (
          <>
            <ProfileField 
              label="Travel Frequency" 
              value={profile.travel_frequency}
              editable={!isViewingVersion}
              fieldKey="travel_frequency"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'never', label: 'Never' },
                { value: 'yearly', label: 'Yearly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
            <ProfileField 
              label="Has Valid Passport" 
              value={profile.passport} 
              type="boolean"
              editable={!isViewingVersion}
              fieldKey="passport"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="Countries Visited" 
              value={profile.countries_visited}
              type="number"
              editable={!isViewingVersion}
              fieldKey="countries_visited"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="My Current Story Around Travel & Adventure" 
              value={profile.travel_story}
              type="story"
              editable={!isViewingVersion}
              fieldKey="travel_story"
              onSave={handleFieldSave}
            />
          </>
        )
      
      case 'social':
        return (
          <>
            <ProfileField 
              label="Close Friends Count" 
              value={profile.close_friends_count}
              editable={!isViewingVersion}
              fieldKey="close_friends_count"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: '0', label: '0' },
                { value: '1-3', label: '1-3' },
                { value: '4-8', label: '4-8' },
                { value: '9+', label: '9+' },
              ]}
            />
            <ProfileField 
              label="Social Preference" 
              value={profile.social_preference}
              editable={!isViewingVersion}
              fieldKey="social_preference"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'introvert', label: 'Introvert' },
                { value: 'ambivert', label: 'Ambivert' },
                { value: 'extrovert', label: 'Extrovert' },
              ]}
            />
            <ProfileField 
              label="My Current Story Around Social & Friends" 
              value={profile.social_story}
              type="story"
              editable={!isViewingVersion}
              fieldKey="social_story"
              onSave={handleFieldSave}
            />
          </>
        )
      
      case 'stuff':
        return (
          <>
            <ProfileField 
              label="Lifestyle Category" 
              value={profile.lifestyle_category}
              editable={!isViewingVersion}
              fieldKey="lifestyle_category"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'minimalist', label: 'Minimalist' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'luxury', label: 'Luxury' },
              ]}
            />
            <ProfileField 
              label="Primary Vehicle" 
              value={profile.primary_vehicle}
              editable={!isViewingVersion}
              fieldKey="primary_vehicle"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="My Current Story Around Possessions & Lifestyle" 
              value={profile.stuff_story}
              type="story"
              editable={!isViewingVersion}
              fieldKey="stuff_story"
              onSave={handleFieldSave}
            />
          </>
        )
      
      case 'spirituality':
        return (
          <>
            <ProfileField 
              label="Spiritual Practice" 
              value={profile.spiritual_practice}
              editable={!isViewingVersion}
              fieldKey="spiritual_practice"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'none', label: 'None' },
                { value: 'religious', label: 'Religious' },
                { value: 'spiritual', label: 'Spiritual' },
                { value: 'secular', label: 'Secular' },
              ]}
            />
            <ProfileField 
              label="Meditation Frequency" 
              value={profile.meditation_frequency}
              editable={!isViewingVersion}
              fieldKey="meditation_frequency"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'never', label: 'Never' },
                { value: 'rarely', label: 'Rarely' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'daily', label: 'Daily' },
              ]}
            />
            <ProfileField 
              label="Personal Growth Focus" 
              value={profile.personal_growth_focus} 
              type="boolean"
              editable={!isViewingVersion}
              fieldKey="personal_growth_focus"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="My Current Story Around Spirituality & Growth" 
              value={profile.spirituality_story}
              type="story"
              editable={!isViewingVersion}
              fieldKey="spirituality_story"
              onSave={handleFieldSave}
            />
          </>
        )
      
      case 'giving':
        return (
          <>
            <ProfileField 
              label="Volunteer Status" 
              value={profile.volunteer_status}
              editable={!isViewingVersion}
              fieldKey="volunteer_status"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'none', label: 'None' },
                { value: 'occasional', label: 'Occasional' },
                { value: 'regular', label: 'Regular' },
                { value: 'frequent', label: 'Frequent' },
              ]}
            />
            <ProfileField 
              label="Annual Charitable Giving" 
              value={profile.charitable_giving}
              editable={!isViewingVersion}
              fieldKey="charitable_giving"
              onSave={handleFieldSave}
              type="select"
              selectOptions={[
                { value: 'none', label: 'None' },
                { value: '<500', label: 'Under $500' },
                { value: '500-2000', label: '$500-$2,000' },
                { value: '2000+', label: '$2,000+' },
              ]}
            />
            <ProfileField 
              label="Legacy Mindset" 
              value={profile.legacy_mindset} 
              type="boolean"
              editable={!isViewingVersion}
              fieldKey="legacy_mindset"
              onSave={handleFieldSave}
            />
            <ProfileField 
              label="My Current Story Around Giving & Legacy" 
              value={profile.giving_story}
              type="story"
              editable={!isViewingVersion}
              fieldKey="giving_story"
              onSave={handleFieldSave}
            />
          </>
        )
      
      default:
        return null
    }
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      
      switch (e.key) {
        case 'Escape':
          closeLightbox()
          break
        case 'ArrowLeft':
          prevMedia()
          break
        case 'ArrowRight':
          nextMedia()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen])

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading your profile...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <User className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Profile Error</h2>
            <p className="text-neutral-400 mb-6">{error}</p>
            <Button onClick={fetchProfile} variant="primary">
              Try Again
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
        {/* Header */}
        <div className="mb-8">
          {/* Mobile Header */}
          <div className="md:hidden space-y-4 mb-6">
            {/* Title and Badge */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">My Profile</h1>
                {getCurrentVersionInfo() && (
                  <div className="flex items-center gap-2">
                    <Badge variant="info">
                      Version {getCurrentVersionInfo()?.version_number}
                    </Badge>
                    {getCurrentVersionInfo()?.is_draft ? (
                      <Badge variant="warning">
                        Draft
                      </Badge>
                    ) : getCurrentVersionInfo()?.is_active ? (
                      <Badge variant="success">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="info">
                        Complete
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <p className="text-neutral-400 text-sm">
                {getCurrentVersionInfo()?.created_at 
                  ? `Saved on ${new Date(getCurrentVersionInfo().created_at).toLocaleDateString()} at ${new Date(getCurrentVersionInfo().created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                  : 'This is your profile information.'
                }
              </p>
            </div>

            {/* Action Buttons - Stacked */}
            <div className="space-y-2">
              <Button
                onClick={() => router.push(`/profile/${profileId}/edit`)}
                variant="primary"
                className="w-full"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              
              <Button
                onClick={() => setShowVersions(!showVersions)}
                variant="outline"
                className="w-full"
              >
                <Star className="w-4 h-4 mr-2" />
                {showVersions ? 'Hide' : 'Show'} Versions
              </Button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">My Profile</h1>
                {getCurrentVersionInfo() && (
                  <div className="flex items-center gap-2">
                    <Badge variant="info">
                      Version {getCurrentVersionInfo()?.version_number}
                    </Badge>
                    {getCurrentVersionInfo()?.is_draft ? (
                      <Badge variant="warning">
                        Draft
                      </Badge>
                    ) : getCurrentVersionInfo()?.is_active ? (
                      <Badge variant="success">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="info">
                        Complete
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <p className="text-neutral-400">
                {getCurrentVersionInfo()?.created_at 
                  ? `Saved on ${new Date(getCurrentVersionInfo().created_at).toLocaleDateString()} at ${new Date(getCurrentVersionInfo().created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                  : 'Complete overview of your profile information'
                }
              </p>
            </div>
            <Button
              onClick={() => router.push(`/profile/${profileId}/edit`)}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </Button>
            <Button
              onClick={() => setShowVersions(!showVersions)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              {showVersions ? 'Hide' : 'Show'} Versions
            </Button>
          </div>

        </div>

        {/* Main Content */}
        <div>
          {/* Versions List */}
          {showVersions && (
            <Card className="p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
                <Heading level={3} className="text-white text-lg md:text-xl">Profile Versions</Heading>
                <Badge variant="info">{versions.length} {versions.length === 1 ? 'Version' : 'Versions'}</Badge>
              </div>
              {versions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <Text size="sm" className="text-neutral-400 mb-2">No saved versions yet</Text>
                  <Text size="xs" className="text-neutral-500">Create your first version to get started</Text>
                </div>
              ) : (
                <Stack gap="md">
                  {versions.map((version) => {
                    return (
                      <VersionCard
                        key={version.id}
                        version={version}
                        actions={
                          <>
                            <Button
                              onClick={() => router.push(`/profile/${version.id}`)}
                              variant="primary"
                              size="sm"
                              className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              onClick={() => handleDeleteVersion(version)}
                              variant="danger"
                              size="sm"
                              className="text-xs md:text-sm flex-1 md:flex-none min-w-0 shrink flex items-center justify-center gap-2"
                              disabled={deletingVersion === version.id}
                            >
                              {deletingVersion === version.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </>
                        }
                      />
                    )
                  })}
                </Stack>
              )}
            </Card>
          )}
        </div>



        {/* Profile Picture and Basic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Profile Picture */}
          <Card className="p-6 text-center">
            <div className="relative inline-block mb-4">
              {profile.profile_picture_url ? (
                <div className="w-32 h-32 rounded-full overflow-hidden bg-neutral-800 border-4 border-primary-500/20">
                  <NextImage
                    src={profile.profile_picture_url}
                    alt="Profile picture"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 border-4 border-primary-500/20 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">
              {profile.first_name && profile.last_name 
                ? `${profile.first_name} ${profile.last_name}`
                : 'Your Name'
              }
            </h3>
            {userId && (
              <p className="text-xs text-neutral-500 mb-4 font-mono">
                ID: {userId}
              </p>
            )}
            <Button
              onClick={() => router.push('/profile/edit')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Update Photo
            </Button>
          </Card>

          {/* Quick Stats */}
          <div className="lg:col-span-2 space-y-4 h-full">
            
            <Card className="p-6 h-full">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileField
                  label="Email"
                  value={profile.email}
                  editable={!isViewingVersion}
                  fieldKey="email"
                  onSave={handleFieldSave}
                  type="text"
                />
                <ProfileField
                  label="Date of Birth"
                  value={profile.date_of_birth}
                  editable={!isViewingVersion}
                  fieldKey="date_of_birth"
                  onSave={handleFieldSave}
                  type="text"
                />
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Age</p>
                    <p className="text-white font-medium">
                      {profile.date_of_birth ? formatAge(profile.date_of_birth) : 'Not specified'}
                    </p>
                  </div>
                </div>
                <ProfileField
                  label="Gender"
                  value={profile.gender}
                  editable={!isViewingVersion}
                  fieldKey="gender"
                  onSave={handleFieldSave}
                  type="select"
                  selectOptions={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Prefer not to say', label: 'Prefer not to say' },
                  ]}
                />
                <ProfileField
                  label="Phone"
                  value={profile.phone}
                  editable={!isViewingVersion}
                  fieldKey="phone"
                  onSave={handleFieldSave}
                  type="text"
                />
                <ProfileField
                  label="Ethnicity"
                  value={profile.ethnicity}
                  editable={!isViewingVersion}
                  fieldKey="ethnicity"
                  onSave={handleFieldSave}
                  type="select"
                  selectOptions={[
                    { value: 'Asian', label: 'Asian' },
                    { value: 'Black', label: 'Black' },
                    { value: 'Hispanic', label: 'Hispanic' },
                    { value: 'Middle Eastern', label: 'Middle Eastern' },
                    { value: 'Multi-ethnic', label: 'Multi-ethnic' },
                    { value: 'Native American', label: 'Native American' },
                    { value: 'Pacific Islander', label: 'Pacific Islander' },
                    { value: 'White', label: 'White' },
                    { value: 'Other', label: 'Other' },
                    { value: 'Prefer not to say', label: 'Prefer not to say' },
                  ]}
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Detailed Sections */}
        {/* Current Version Information & Profile Completion */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Version Information */}
          {versions.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-[#39FF14]" />
                Version Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-400">Version ID:</span>
                  <span className="font-mono text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                    {profileId || versions[0]?.id}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-400">Last Updated:</span>
                  <CreatedDateBadge 
                    createdAt={getCurrentVersionInfo()?.created_at || versions[0]?.created_at || new Date().toISOString()} 
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Profile Completion */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" />
              Profile Completion
            </h3>
            <div className="text-center mb-4">
              <span className="text-4xl font-bold text-[#39FF14]">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-neutral-700 rounded-full h-3 mb-3">
              <div
                className="h-3 rounded-full transition-all duration-500 bg-[#39FF14]"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-neutral-400 text-center">
              {completionPercentage >= 80 
                ? "Excellent! Your profile is well-completed." 
                : completionPercentage >= 60 
                ? "Good progress! A few more details would be helpful."
                : "Keep going! Complete more sections to unlock your full potential."
              }
            </p>
            {isViewingVersion && getCurrentVersionInfo() && (
              <p className="text-xs text-neutral-500 text-center mt-2">
                Version {getCurrentVersionInfo()?.version_number} • Saved on {new Date(getCurrentVersionInfo()?.created_at).toLocaleDateString()}
              </p>
            )}
          </Card>
        </div>

        {/* Version Notes & Media */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Version Notes */}
          {profile.version_notes && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                Version Notes
              </h3>
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                <p className="text-white whitespace-pre-wrap">{profile.version_notes}</p>
              </div>
            </Card>
          )}

          {/* Media */}
          {profile.progress_photos && profile.progress_photos.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary-500" />
                Media
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {profile.progress_photos.map((media, index) => (
                  <div key={index} className="relative group">
                    {isVideo(media) ? (
                      <div className="relative">
                        <video
                          src={media}
                          className="w-full aspect-[4/3] object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
                          onClick={() => openLightbox(index)}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={media}
                        alt={`Media ${index + 1}`}
                        className="w-full aspect-[4/3] object-cover rounded-lg border border-neutral-700 hover:border-primary-500 transition-colors cursor-pointer"
                        onClick={() => openLightbox(index)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-neutral-400 mt-3">
                {profile.progress_photos.length} media file{profile.progress_photos.length !== 1 ? 's' : ''} • Click to view in lightbox
              </p>
            </Card>
          )}
        </div>

        {/* Life Category Cards - Ordered by Design System */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {getOrderedProfileCategories().map((category) => {
            const IconComponent = category.icon
            
            return (
              <Card key={category.id} className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <IconComponent className="w-5 h-5 text-primary-500" />
                  {category.title}
                </h3>
                <div className="space-y-3">
                  {renderCategoryFields(category.id)}
                  
                  {/* Saved Recordings */}
                  <SavedRecordings
                    recordings={profile.story_recordings || []}
                    categoryFilter={category.id}
                  />
                </div>
              </Card>
            )
          })}
        </div>


      {/* Lightbox */}
      {lightboxOpen && profile.progress_photos && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            {profile.progress_photos.length > 1 && (
              <>
                <button
                  onClick={prevMedia}
                  className="absolute left-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextMedia}
                  className="absolute right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Media Content */}
            <div className="max-w-4xl max-h-full w-full h-full flex items-center justify-center">
              {isVideo(profile.progress_photos[lightboxIndex]) ? (
                <video
                  src={profile.progress_photos[lightboxIndex]}
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <img
                  src={profile.progress_photos[lightboxIndex]}
                  alt={`Media ${lightboxIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Media Counter */}
            {profile.progress_photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {lightboxIndex + 1} of {profile.progress_photos.length}
              </div>
            )}

            {/* Thumbnail Strip */}
            {profile.progress_photos.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
                {profile.progress_photos.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setLightboxIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === lightboxIndex ? 'border-primary-500' : 'border-neutral-600'
                    }`}
                  >
                    {isVideo(media) ? (
                      <div className="relative w-full h-full">
                        <video
                          src={media}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={media}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setVersionToDelete(null)
        }}
        onConfirm={confirmDeleteVersion}
        itemName={`Version ${versionToDelete?.version_number || ''}`}
        itemType="profile version"
        isLoading={deletingVersion === versionToDelete?.id}
        loadingText="Deleting version..."
      />
    </>
  )
}
