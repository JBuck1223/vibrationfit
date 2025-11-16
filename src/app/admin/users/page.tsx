'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Badge, Input } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { createClient } from '@/lib/supabase/client'
import { Search, UserPlus, Shield, Mail, Calendar } from 'lucide-react'
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
  intensive_enrolled?: boolean
  token_packs?: Array<{ name: string; purchased_at: string }>
  profile_photo_url?: string
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

  const updateUserStorage = (userId: string, quota: number) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, storage_quota_gb: quota }
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
        <div className="mb-8 md:mb-12">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-4">User Management</h1>
        <p className="text-sm md:text-base lg:text-lg text-neutral-400">
          Manage users and admin permissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
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
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
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
        <Card className="p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-semibold text-white">Admin Users</h2>
            <Badge variant="success">{adminUsers.length}</Badge>
          </div>
          
          <div className="space-y-4">
            {adminUsers.map((user) => (
              <div key={user.id} className="p-6 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl border border-primary-500/30 space-y-6">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {user.profile_photo_url ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-lg border-2 border-primary-500/30">
                        <Image
                          src={user.profile_photo_url}
                          alt={`${user.email} profile`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-white text-xl">{user.email}</span>
                        <Badge variant="success" className="text-sm">Admin</Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-neutral-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                        {user.last_sign_in_at && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {new Date(user.last_sign_in_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-400">{user.tokens_remaining || 0}</div>
                      <div className="text-xs text-neutral-400">Tokens</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary-400">{user.storage_quota_gb || 0}GB</div>
                      <div className="text-xs text-neutral-400">Storage</div>
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
                    {user.intensive_enrolled && (
                      <Badge variant="premium" className="text-sm">Activation Intensive</Badge>
                    )}
                    {user.token_packs?.map((pack, idx) => (
                      <Badge key={idx} variant="info" className="text-sm">{pack.name}</Badge>
                    ))}
                    {(!user.membership_tier && !user.intensive_enrolled && (!user.token_packs || user.token_packs.length === 0)) && (
                      <span className="text-sm text-neutral-500 italic">No active products</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="± tokens"
                      className="w-28"
                      value={adjustTokens[user.id] ?? 0}
                      onChange={(e) => setAdjustTokens(prev => ({ ...prev, [user.id]: parseInt(e.target.value || '0', 10) }))}
                    />
                    <Button
                      variant="outline"
                      disabled={!((adjustTokens[user.id] ?? 0) !== 0)}
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
                    >{(adjustTokens[user.id] ?? 0) > 0 ? 'Add Tokens' : (adjustTokens[user.id] ?? 0) < 0 ? 'Deduct Tokens' : 'Apply'}</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="GB quota"
                      className="w-28"
                      value={adjustStorage[user.id] ?? 0}
                      onChange={(e) => setAdjustStorage(prev => ({ ...prev, [user.id]: parseInt(e.target.value || '0', 10) }))}
                    />
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const quota = adjustStorage[user.id] ?? 0
                        if (!quota) return
                        const res = await fetch('/api/admin/users/adjust-storage', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: user.id, storageQuotaGb: quota })
                        })
                        if (res.ok) {
                          updateUserStorage(user.id, quota)
                        }
                      }}
                    >Set Storage</Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                    className="text-red-400 border-red-400 hover:bg-red-400/10"
                  >
                    Remove Admin
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
              <div key={user.id} className="p-6 bg-gradient-to-r from-neutral-800 to-neutral-800/80 rounded-xl border border-neutral-600 space-y-6">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {user.profile_photo_url ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-lg border-2 border-neutral-500/30">
                        <Image
                          src={user.profile_photo_url}
                          alt={`${user.email} profile`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-neutral-600 to-neutral-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Mail className="w-8 h-8 text-neutral-300" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-white text-xl">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-neutral-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                        {user.last_sign_in_at && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {new Date(user.last_sign_in_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-400">{user.tokens_remaining || 0}</div>
                      <div className="text-xs text-neutral-400">Tokens</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary-400">{user.storage_quota_gb || 0}GB</div>
                      <div className="text-xs text-neutral-400">Storage</div>
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
                    {user.intensive_enrolled && (
                      <Badge variant="premium" className="text-sm">Activation Intensive</Badge>
                    )}
                    {user.token_packs?.map((pack, idx) => (
                      <Badge key={idx} variant="info" className="text-sm">{pack.name}</Badge>
                    ))}
                    {(!user.membership_tier && !user.intensive_enrolled && (!user.token_packs || user.token_packs.length === 0)) && (
                      <span className="text-sm text-neutral-500 italic">No active products</span>
                    )}
                  </div>
                </div>
                
                {/* Admin Controls */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-neutral-600">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="± tokens"
                      className="w-32"
                      value={adjustTokens[user.id] ?? 0}
                      onChange={(e) => setAdjustTokens(prev => ({ ...prev, [user.id]: parseInt(e.target.value || '0', 10) }))}
                    />
                    <Button
                      variant="outline"
                      disabled={!((adjustTokens[user.id] ?? 0) !== 0)}
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
                  
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="GB quota"
                      className="w-32"
                      value={adjustStorage[user.id] ?? 0}
                      onChange={(e) => setAdjustStorage(prev => ({ ...prev, [user.id]: parseInt(e.target.value || '0', 10) }))}
                    />
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const quota = adjustStorage[user.id] ?? 0
                        if (!quota) return
                        const res = await fetch('/api/admin/users/adjust-storage', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: user.id, storageQuotaGb: quota })
                        })
                        if (res.ok) {
                          updateUserStorage(user.id, quota)
                        }
                      }}
                    >Set Storage</Button>
                  </div>

                  <div className="relative">
                    <Button
                      variant="accent"
                      onClick={() => setShowProductDropdown(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                    >
                      Enroll Product
                    </Button>
                    {showProductDropdown[user.id] && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg z-10">
                        <div className="p-2">
                          {availableProducts.map((product) => (
                            <button
                              key={product.id}
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-neutral-700 rounded flex items-center justify-between"
                              onClick={async () => {
                                if (product.id === 'intensive') {
                                  await fetch('/api/admin/intensive/enroll', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userId: user.id })
                                  })
                                }
                                // Add other product enrollments here
                                setShowProductDropdown(prev => ({ ...prev, [user.id]: false }))
                              }}
                            >
                              <span>{product.name}</span>
                              <span className="text-neutral-400">{product.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                  >
                    Make Admin
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
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
