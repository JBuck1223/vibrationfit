'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button } from '@/lib/design-system/components'
import { UserProfile } from '@/lib/supabase/profile'
import { 
  User, 
  Heart, 
  Users, 
  Activity, 
  MapPin, 
  Briefcase, 
  DollarSign,
  Edit3,
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
  Plus
} from 'lucide-react'
import NextImage from 'next/image'

interface ProfileViewPageProps {}

export default function ProfileViewPage({}: ProfileViewPageProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  // Check for version parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const versionId = urlParams.get('versionId')
    if (versionId) {
      fetchProfileVersion(versionId)
    }
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfile(data.profile || {})
      setCompletionPercentage(data.completionPercentage || 0)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
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
    } catch (error) {
      console.error('Error fetching profile version:', error)
      setError('Failed to load profile version')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Not specified'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-neutral-400">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="container mx-auto px-4 py-8">
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
              <p className="text-neutral-400">Complete overview of your personal information</p>
            </div>
            <Button
              onClick={() => router.push('/profile/edit')}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </Button>
            <Button
              onClick={() => router.push('/profile/new')}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Version
            </Button>
          </div>

          {/* Completion Progress */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Profile Completion</h2>
              <span className={`text-2xl font-bold ${getCompletionColor(completionPercentage)}`}>
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-neutral-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${getCompletionBg(completionPercentage)}`}
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-neutral-400 mt-2">
              {completionPercentage >= 80 
                ? "Excellent! Your profile is well-completed." 
                : completionPercentage >= 60 
                ? "Good progress! A few more details would be helpful."
                : "Keep going! Complete more sections to unlock your full potential."
              }
            </p>
          </Card>
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
            <p className="text-neutral-400 mb-4">
              {profile.email || 'your.email@example.com'}
            </p>
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
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Date of Birth</p>
                    <p className="text-white font-medium">
                      {profile.date_of_birth ? formatDate(profile.date_of_birth) : 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Age</p>
                    <p className="text-white font-medium">
                      {profile.date_of_birth ? formatAge(profile.date_of_birth) : 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Gender</p>
                    <p className="text-white font-medium">
                      {profile.gender || 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-400">Phone</p>
                    <p className="text-white font-medium">
                      {profile.phone || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Relationship */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-500" />
              Relationship
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Status</p>
                <p className="text-white font-medium">
                  {profile.relationship_status || 'Not specified'}
                </p>
              </div>
              {profile.partner_name && (
                <div>
                  <p className="text-sm text-neutral-400">Partner</p>
                  <p className="text-white font-medium">{profile.partner_name}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Family */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Family
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Has Children</p>
                <p className="text-white font-medium">
                  {profile.has_children === true ? 'Yes' : profile.has_children === false ? 'No' : 'Not specified'}
                </p>
              </div>
              {profile.has_children && profile.number_of_children && (
                <div>
                  <p className="text-sm text-neutral-400">Number of Children</p>
                  <p className="text-white font-medium">{profile.number_of_children}</p>
                </div>
              )}
              {profile.children_ages && profile.children_ages.length > 0 && (
                <div>
                  <p className="text-sm text-neutral-400">Children's Ages</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.children_ages.map((age, index) => (
                      <span key={index} className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-sm">
                        Child {index + 1}: {age} {age === '1' ? 'year' : 'years'} old
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Health */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" />
              Health & Wellness
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Exercise Frequency</p>
                <p className="text-white font-medium">
                  {profile.exercise_frequency || 'Not specified'}
                </p>
              </div>
              {profile.health_conditions && (
                <div>
                  <p className="text-sm text-neutral-400">Health Conditions</p>
                  <p className="text-white font-medium">{profile.health_conditions}</p>
                </div>
              )}
              {profile.medications && (
                <div>
                  <p className="text-sm text-neutral-400">Medications</p>
                  <p className="text-white font-medium">{profile.medications}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-500" />
              Location
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Living Situation</p>
                <p className="text-white font-medium">
                  {profile.living_situation || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Time at Location</p>
                <p className="text-white font-medium">
                  {profile.time_at_location || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Address</p>
                <p className="text-white font-medium">
                  {[profile.city, profile.state, profile.postal_code, profile.country]
                    .filter(Boolean)
                    .join(', ') || 'Not specified'}
                </p>
              </div>
            </div>
          </Card>

          {/* Career */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary-500" />
              Career
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Employment Type</p>
                <p className="text-white font-medium">
                  {profile.employment_type || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Occupation</p>
                <p className="text-white font-medium">
                  {profile.occupation || 'Not specified'}
                </p>
              </div>
              {profile.company && (
                <div>
                  <p className="text-sm text-neutral-400">Company</p>
                  <p className="text-white font-medium">{profile.company}</p>
                </div>
              )}
              {profile.time_in_role && (
                <div>
                  <p className="text-sm text-neutral-400">Time in Role</p>
                  <p className="text-white font-medium">{profile.time_in_role}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Financial */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-500" />
              Financial
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Household Income</p>
                <p className="text-white font-medium">
                  {profile.household_income || 'Not specified'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push('/profile/edit')}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </Button>
          <Button
            onClick={() => router.push('/profile/new')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Version
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
