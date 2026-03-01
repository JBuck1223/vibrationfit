'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Badge, Input, Stack, PageHero } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { createClient } from '@/lib/supabase/client'
import { Search, UserPlus, Shield, Mail, Calendar, CheckCircle, Clock, RefreshCw, AlertCircle, Zap, Trash2 } from 'lucide-react'
import Image from 'next/image'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string
  is_admin: boolean
  user_metadata: any
  tokens_remaining?: number
  tokens_used?: number
  storage_quota_gb?: number
  membership_tier?: string
  intensive_active_status?: string | null  // 'pending' | 'in_progress' | null
  intensive_active_id?: string | null
  intensive_completed_count?: number
  intensive_total_count?: number
  token_packs?: Array<{ name: string; purchased_at: string }>
  profile_photo_url?: string
  profile_picture_url?: string
  full_name?: string
  first_name?: string
  last_name?: string
  role?: string
}

function UsersAdminContent() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [adjustTokens, setAdjustTokens] = useState<Record<string, number>>({})
  const [adjustStorage, setAdjustStorage] = useState<Record<string, number>>({})
  const [showProductDropdown, setShowProductDropdown] = useState<Record<string, boolean>>({})
  const [enrollingUser, setEnrollingUser] = useState<string | null>(null)
  const [enrollFeedback, setEnrollFeedback] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({})
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Available products for enrollment
  const availableProducts = [
    { id: 'intensive', name: 'Activation Intensive', price: '$497' },
    { id: 'token_pack_1000', name: '1000 Token Pack', price: '$29' },
    { id: 'token_pack_5000', name: '5000 Token Pack', price: '$99' },
    { id: 'token_pack_10000', name: '10000 Token Pack', price: '$179' },
    { id: 'vision_pro_annual', name: 'Vision Pro Annual', price: '$997/year' },
    { id: 'vision_pro_28day', name: 'Vision Pro 28-Day', price: '$97/month' }
  ]

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserTokens = (userId: string, delta: number) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { 
            ...user, 
            tokens_remaining: (user.tokens_remaining || 0) + delta,
            tokens_used: (user.tokens_used || 0) - delta
          }
        : user
    ))
  }

  const updateUserStorage = (userId: string, addedGb: number) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, storage_quota_gb: (user.storage_quota_gb || 0) + addedGb }
        : user
    ))
  }

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users/toggle-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAdmin: !currentStatus })
      })

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, is_admin: !currentStatus }
            : user
        ))
      }
    } catch (error) {
      console.error('Failed to toggle admin status:', error)
    }
  }

  const addAdminByEmail = async () => {
    if (!newAdminEmail) return

    try {
      const response = await fetch('/api/admin/users/add-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail })
      })

      if (response.ok) {
        setNewAdminEmail('')
        setShowAddAdmin(false)
        fetchUsers() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to add admin:', error)
    }
  }

  const handleDeleteUser = async (targetUserId: string) => {
    setDeletingUserId(targetUserId)
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('[Delete User] Full response:', JSON.stringify(data, null, 2))
        const debugInfo = data.debug ? '\n\nDebug log:\n' + data.debug.join('\n') : ''
        throw new Error((data.error || data.details || 'Delete failed') + debugInfo)
      }
      if (data.debug) {
        console.log('[Delete User] Success debug log:', data.debug.join('\n'))
      }
      setShowDeleteConfirm(null)
      fetchUsers()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeletingUserId(null)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const adminUsers = filteredUsers.filter(user => user.is_admin)
  const regularUsers = filteredUsers.filter(user => !user.is_admin)

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading users...</p>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          title="User Management"
          subtitle="Manage users and admin permissions"
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <div className="text-center">
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-primary-500 mb-2">
              {users.length}
            </div>
            <div className="text-xs md:text-sm text-neutral-400">Total Users</div>
          </div>
        </Card>
        
        <Card className="p-4 md:p-6">
          <div className="text-center">
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-secondary-500 mb-2">
              {adminUsers.length}
            </div>
            <div className="text-xs md:text-sm text-neutral-400">Admin Users</div>
          </div>
        </Card>
        
        <Card className="p-4 md:p-6">
          <div className="text-center">
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-accent-500 mb-2">
              {regularUsers.length}
            </div>
            <div className="text-xs md:text-sm text-neutral-400">Regular Users</div>
          </div>
        </Card>
      </div>

      {/* Search and Add Admin */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Search users by email or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchUsers()}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Search className="w-4 h-4" />
          Refresh
        </Button>
        
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddAdmin(true)}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add Admin
        </Button>
      </div>

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Add New Admin
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddAdmin(false)
                    setNewAdminEmail('')
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={addAdminByEmail}
                  disabled={!newAdminEmail}
                >
                  Add Admin
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Admin Users */}
      {adminUsers.length > 0 && (
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-semibold text-white">Admin Users</h2>
            <Badge variant="success">{adminUsers.length}</Badge>
          </div>
          
          <div className="space-y-4">
            {adminUsers.map((user) => (
              <div key={user.id} className="p-4 md:p-6 bg-primary-500/10 rounded-xl border border-primary-500/30 space-y-4 md:space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                  <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                    {(user.profile_photo_url || user.profile_picture_url) ? (
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden flex-shrink-0 shadow-lg border-2 border-primary-500/30">
                        <Image
                          src={user.profile_photo_url || user.profile_picture_url || ''}
                          alt={`${user.email} profile`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Shield className="w-6 h-6 md:w-8 md:h-8 text-black" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-white text-base md:text-xl truncate">{user.full_name || user.email}</span>
                        <Badge variant="success" className="text-xs flex-shrink-0">Admin</Badge>
                      </div>
                      {user.full_name && (
                        <div className="text-xs md:text-sm text-neutral-400 truncate mb-1">{user.email}</div>
                      )}
                      <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-neutral-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                        {user.last_sign_in_at && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 md:w-4 md:h-4" />
                            {new Date(user.last_sign_in_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex items-center gap-3 md:gap-6 w-full sm:w-auto justify-start sm:justify-end">
                    <div className="text-center min-w-0 flex-shrink">
                      <div className="text-base md:text-xl lg:text-2xl font-bold text-primary-400 break-all">{user.tokens_remaining || 0}</div>
                      <div className="text-xs text-neutral-400 whitespace-nowrap">Tokens</div>
                    </div>
                    <div className="text-center min-w-0 flex-shrink">
                      <div className="text-base md:text-xl lg:text-2xl font-bold text-secondary-400 break-all">{user.storage_quota_gb || 0}GB</div>
                      <div className="text-xs text-neutral-400 whitespace-nowrap">Storage</div>
                    </div>
                  </div>
                </div>

                {/* Products Section */}
                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-semibold text-neutral-200">Active Products & Enrollments</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {user.membership_tier && (
                      <Badge variant="premium" className="text-sm">{user.membership_tier}</Badge>
                    )}
                    {/* Intensive enrollment status */}
                    {user.intensive_active_status === 'in_progress' && (
                      <Badge variant="success" className="text-sm flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Intensive: In Progress
                      </Badge>
                    )}
                    {user.intensive_active_status === 'pending' && (
                      <Badge variant="warning" className="text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Intensive: Pending
                      </Badge>
                    )}
                    {!user.intensive_active_status && (user.intensive_completed_count || 0) > 0 && (
                      <Badge variant="neutral" className="text-sm flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Intensive: Completed ({user.intensive_completed_count}x)
                      </Badge>
                    )}
                    {user.token_packs?.map((pack, idx) => (
                      <Badge key={idx} variant="info" className="text-sm">{pack.name}</Badge>
                    ))}
                    {(!user.membership_tier && !user.intensive_active_status && !(user.intensive_completed_count) && (!user.token_packs || user.token_packs.length === 0)) && (
                      <span className="text-sm text-neutral-500 italic">No active products</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      type="number"
                      placeholder="± tokens"
                      className="flex-1 min-w-0"
                      value={adjustTokens[user.id] ?? ''}
                      onChange={(e) => setAdjustTokens(prev => ({ ...prev, [user.id]: parseInt(e.target.value || '0', 10) }))}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!((adjustTokens[user.id] ?? 0) !== 0)}
                      className="whitespace-nowrap flex-shrink-0"
                      onClick={async () => {
                        const delta = adjustTokens[user.id] ?? 0
                        console.log('Token adjustment clicked:', { userId: user.id, delta })
                        if (!delta) return
                        
                        try {
                          const res = await fetch('/api/admin/users/adjust-tokens', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ userId: user.id, delta })
                          })
                          
                          console.log('API response:', res.status, res.ok)
                          
                          if (res.ok) {
                            updateUserTokens(user.id, delta)
                            // Clear the input only on success
                            setAdjustTokens(prev => ({ ...prev, [user.id]: 0 }))
                          } else {
                            const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }))
                            console.error('Token adjustment failed:', errorData)
                            // Show user-friendly error
                            alert(`Failed to adjust tokens: ${errorData.error || errorData.details || 'Unknown error'}`)
                          }
                        } catch (error: any) {
                          console.error('Token adjustment error:', error)
                          alert(`Error: ${error.message || 'Failed to adjust tokens'}`)
                        }
                      }}
                    >{(adjustTokens[user.id] ?? 0) > 0 ? 'Add' : (adjustTokens[user.id] ?? 0) < 0 ? 'Deduct' : 'Apply'}</Button>
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      type="number"
                      placeholder="+ GB to add"
                      className="flex-1 min-w-0"
                      value={adjustStorage[user.id] ?? ''}
                      onChange={(e) => setAdjustStorage(prev => ({ ...prev, [user.id]: parseInt(e.target.value || '0', 10) }))}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!((adjustStorage[user.id] ?? 0) > 0)}
                      className="whitespace-nowrap flex-shrink-0"
                      onClick={async () => {
                        const quota = adjustStorage[user.id] ?? 0
                        if (!quota || quota <= 0) return
                        try {
                          const res = await fetch('/api/admin/users/adjust-storage', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ userId: user.id, storageQuotaGb: quota })
                          })
                          if (res.ok) {
                            updateUserStorage(user.id, quota)
                            setAdjustStorage(prev => ({ ...prev, [user.id]: 0 }))
                          } else {
                            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
                            alert(`Failed to add storage: ${errorData.error || 'Unknown error'}`)
                          }
                        } catch (error: any) {
                          alert(`Error: ${error.message || 'Failed to add storage'}`)
                        }
                      }}
                    >Add Storage</Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                    className="text-red-400 border-red-400 hover:bg-red-400/10 w-full"
                  >
                    Remove Admin
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                    disabled={deletingUserId === user.id}
                    onClick={() => setShowDeleteConfirm(user.id)}
                  >
                    {deletingUserId === user.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Deleting...
                      </span>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Regular Users */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="w-5 h-5 text-neutral-400" />
          <h2 className="text-xl font-semibold text-white">Regular Users</h2>
          <Badge variant="neutral">{regularUsers.length}</Badge>
        </div>
        
        {regularUsers.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            No regular users found
          </div>
        ) : (
          <div className="space-y-4">
            {regularUsers.map((user) => (
              <div key={user.id} className="p-4 md:p-6 bg-gradient-to-r from-neutral-800 to-neutral-800/80 rounded-xl border border-neutral-600 space-y-4 md:space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                  <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                    {(user.profile_photo_url || user.profile_picture_url) ? (
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden flex-shrink-0 shadow-lg border-2 border-neutral-500/30">
                        <Image
                          src={user.profile_photo_url || user.profile_picture_url || ''}
                          alt={`${user.email} profile`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-neutral-600 to-neutral-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Mail className="w-6 h-6 md:w-8 md:h-8 text-neutral-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-white text-base md:text-xl truncate">{user.full_name || user.email}</span>
                      </div>
                      {user.full_name && (
                        <div className="text-xs md:text-sm text-neutral-400 truncate mb-1">{user.email}</div>
                      )}
                      <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-neutral-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                        {user.last_sign_in_at && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 md:w-4 md:h-4" />
                            {new Date(user.last_sign_in_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex items-center gap-3 md:gap-6 w-full sm:w-auto justify-start sm:justify-end">
                    <div className="text-center min-w-0 flex-shrink">
                      <div className="text-base md:text-xl lg:text-2xl font-bold text-primary-400 break-all">{user.tokens_remaining || 0}</div>
                      <div className="text-xs text-neutral-400 whitespace-nowrap">Tokens</div>
                    </div>
                    <div className="text-center min-w-0 flex-shrink">
                      <div className="text-base md:text-xl lg:text-2xl font-bold text-secondary-400 break-all">{user.storage_quota_gb || 0}GB</div>
                      <div className="text-xs text-neutral-400 whitespace-nowrap">Storage</div>
                    </div>
                  </div>
                </div>

                {/* Products Section */}
                <div className="bg-neutral-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-semibold text-neutral-200">Active Products & Enrollments</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {user.membership_tier && (
                      <Badge variant="premium" className="text-sm">{user.membership_tier}</Badge>
                    )}
                    {/* Intensive enrollment status */}
                    {user.intensive_active_status === 'in_progress' && (
                      <Badge variant="success" className="text-sm flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Intensive: In Progress
                      </Badge>
                    )}
                    {user.intensive_active_status === 'pending' && (
                      <Badge variant="warning" className="text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Intensive: Pending
                      </Badge>
                    )}
                    {!user.intensive_active_status && (user.intensive_completed_count || 0) > 0 && (
                      <Badge variant="neutral" className="text-sm flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Intensive: Completed ({user.intensive_completed_count}x)
                      </Badge>
                    )}
                    {user.token_packs?.map((pack, idx) => (
                      <Badge key={idx} variant="info" className="text-sm">{pack.name}</Badge>
                    ))}
                    {(!user.membership_tier && !user.intensive_active_status && !(user.intensive_completed_count) && (!user.token_packs || user.token_packs.length === 0)) && (
                      <span className="text-sm text-neutral-500 italic">No active products</span>
                    )}
                  </div>
                </div>
                
                {/* Admin Controls */}
                <div className="flex flex-col gap-3 pt-3 border-t border-neutral-600">
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      type="number"
                      placeholder="± tokens"
                      className="flex-1 min-w-0"
                      value={adjustTokens[user.id] ?? ''}
                      onChange={(e) => setAdjustTokens(prev => ({ ...prev, [user.id]: parseInt(e.target.value || '0', 10) }))}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!((adjustTokens[user.id] ?? 0) !== 0)}
                      className="whitespace-nowrap flex-shrink-0"
                      onClick={async () => {
                        const delta = adjustTokens[user.id] ?? 0
                        console.log('Token adjustment clicked:', { userId: user.id, delta })
                        if (!delta) return
                        
                        try {
                          const res = await fetch('/api/admin/users/adjust-tokens', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ userId: user.id, delta })
                          })
                          
                          console.log('API response:', res.status, res.ok)
                          
                          if (res.ok) {
                            updateUserTokens(user.id, delta)
                            // Clear the input only on success
                            setAdjustTokens(prev => ({ ...prev, [user.id]: 0 }))
                          } else {
                            const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }))
                            console.error('Token adjustment failed:', errorData)
                            // Show user-friendly error
                            alert(`Failed to adjust tokens: ${errorData.error || errorData.details || 'Unknown error'}`)
                          }
                        } catch (error: any) {
                          console.error('Token adjustment error:', error)
                          alert(`Error: ${error.message || 'Failed to adjust tokens'}`)
                        }
                      }}
                    >{(adjustTokens[user.id] ?? 0) > 0 ? 'Add' : (adjustTokens[user.id] ?? 0) < 0 ? 'Deduct' : 'Apply'}</Button>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      type="number"
                      placeholder="+ GB to add"
                      className="flex-1 min-w-0"
                      value={adjustStorage[user.id] ?? ''}
                      onChange={(e) => setAdjustStorage(prev => ({ ...prev, [user.id]: parseInt(e.target.value || '0', 10) }))}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!((adjustStorage[user.id] ?? 0) > 0)}
                      className="whitespace-nowrap flex-shrink-0"
                      onClick={async () => {
                        const quota = adjustStorage[user.id] ?? 0
                        if (!quota || quota <= 0) return
                        try {
                          const res = await fetch('/api/admin/users/adjust-storage', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ userId: user.id, storageQuotaGb: quota })
                          })
                          if (res.ok) {
                            updateUserStorage(user.id, quota)
                            setAdjustStorage(prev => ({ ...prev, [user.id]: 0 }))
                          } else {
                            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
                            alert(`Failed to add storage: ${errorData.error || 'Unknown error'}`)
                          }
                        } catch (error: any) {
                          alert(`Error: ${error.message || 'Failed to add storage'}`)
                        }
                      }}
                    >Add Storage</Button>
                  </div>

                  {/* Enrollment feedback */}
                  {enrollFeedback[user.id] && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      enrollFeedback[user.id].type === 'success' 
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                      {enrollFeedback[user.id].type === 'success' 
                        ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> 
                        : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                      {enrollFeedback[user.id].message}
                    </div>
                  )}

                  <div className="relative w-full">
                    <Button
                      variant="accent"
                      size="sm"
                      className="w-full whitespace-nowrap"
                      disabled={enrollingUser === user.id}
                      onClick={() => setShowProductDropdown(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                    >
                      {enrollingUser === user.id ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Enrolling...
                        </span>
                      ) : 'Enroll Product'}
                    </Button>
                    {showProductDropdown[user.id] && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg z-10">
                        <div className="p-2">
                          {availableProducts.map((product) => {
                            // Show context for intensive enrollment
                            const isIntensive = product.id === 'intensive'
                            const hasActiveIntensive = !!user.intensive_active_status
                            const completedCount = user.intensive_completed_count || 0

                            return (
                              <button
                                key={product.id}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-neutral-700 rounded flex flex-col gap-1"
                                onClick={async () => {
                                  if (isIntensive) {
                                    // If user has an active intensive, confirm re-enrollment
                                    if (hasActiveIntensive) {
                                      const confirmed = window.confirm(
                                        `This user already has an active intensive (${user.intensive_active_status}). Creating a new enrollment will not affect the existing one. Continue?`
                                      )
                                      if (!confirmed) {
                                        setShowProductDropdown(prev => ({ ...prev, [user.id]: false }))
                                        return
                                      }
                                    }

                                    setEnrollingUser(user.id)
                                    setEnrollFeedback(prev => {
                                      const copy = { ...prev }
                                      delete copy[user.id]
                                      return copy
                                    })
                                    
                                    try {
                                      const res = await fetch('/api/admin/intensive/enroll', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ userId: user.id })
                                      })

                                      if (res.ok) {
                                        const data = await res.json()
                                        setEnrollFeedback(prev => ({
                                          ...prev,
                                          [user.id]: {
                                            type: 'success',
                                            message: completedCount > 0
                                              ? `New Activation Intensive created (enrollment #${completedCount + 1 + (hasActiveIntensive ? 1 : 0)})`
                                              : 'Enrolled in Activation Intensive successfully'
                                          }
                                        }))
                                        // Refresh user list to show updated status
                                        fetchUsers()
                                      } else {
                                        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
                                        setEnrollFeedback(prev => ({
                                          ...prev,
                                          [user.id]: {
                                            type: 'error',
                                            message: `Failed: ${errorData.error || 'Unknown error'}`
                                          }
                                        }))
                                      }
                                    } catch (err: any) {
                                      setEnrollFeedback(prev => ({
                                        ...prev,
                                        [user.id]: {
                                          type: 'error',
                                          message: `Error: ${err.message || 'Network error'}`
                                        }
                                      }))
                                    } finally {
                                      setEnrollingUser(null)
                                    }
                                  }
                                  // Add other product enrollments here
                                  setShowProductDropdown(prev => ({ ...prev, [user.id]: false }))
                                }}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{product.name}</span>
                                  <span className="text-neutral-400">{product.price}</span>
                                </div>
                                {isIntensive && completedCount > 0 && (
                                  <span className="text-xs text-neutral-400">
                                    {completedCount} completed{hasActiveIntensive ? `, 1 ${user.intensive_active_status}` : ''}
                                  </span>
                                )}
                                {isIntensive && hasActiveIntensive && completedCount === 0 && (
                                  <span className="text-xs text-yellow-400">
                                    Has active intensive ({user.intensive_active_status})
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full whitespace-nowrap"
                    onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                  >
                    Make Admin
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                    disabled={deletingUserId === user.id}
                    onClick={() => setShowDeleteConfirm(user.id)}
                  >
                    {deletingUserId === user.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Deleting...
                      </span>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete User Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="max-w-md w-full border-red-500/30">
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-white">Delete User?</h3>
              <p className="text-neutral-300 text-sm">
                This will permanently delete the user, their S3 storage folder, and all related data.
                This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      </Stack>
    </Container>
  )
}

export default function UsersAdminPage() {
  return (
    <AdminWrapper>
      <UsersAdminContent />
    </AdminWrapper>
  )
}
