'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Badge, Input } from '@/lib/design-system/components'
import { AdminWrapper } from '@/components/AdminWrapper'
import { createClient } from '@/lib/supabase/client'
import { Search, UserPlus, Shield, Mail, Calendar } from 'lucide-react'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string
  is_admin: boolean
  user_metadata: any
}

function UsersAdminContent() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')

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
      <Container size="xl" className="py-12">
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
    <Container size="xl" className="py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">User Management</h1>
        <p className="text-lg text-neutral-400">
          Manage users and admin permissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500 mb-2">
              {users.length}
            </div>
            <div className="text-sm text-neutral-400">Total Users</div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-500 mb-2">
              {adminUsers.length}
            </div>
            <div className="text-sm text-neutral-400">Admin Users</div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-500 mb-2">
              {regularUsers.length}
            </div>
            <div className="text-sm text-neutral-400">Regular Users</div>
          </div>
        </Card>
      </div>

      {/* Search and Add Admin */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Search users by email or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setShowAddAdmin(true)}
          className="flex items-center gap-2"
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
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-semibold text-white">Admin Users</h2>
            <Badge variant="success">{adminUsers.length}</Badge>
          </div>
          
          <div className="space-y-4">
            {adminUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-primary-500/10 rounded-lg border border-primary-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{user.email}</span>
                      <Badge variant="success">Admin</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </span>
                      {user.last_sign_in_at && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Last seen: {new Date(user.last_sign_in_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                  className="text-red-400 border-red-400 hover:bg-red-400/10"
                >
                  Remove Admin
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Regular Users */}
      <Card className="p-6">
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
              <div key={user.id} className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-neutral-400" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </span>
                      {user.last_sign_in_at && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Last seen: {new Date(user.last_sign_in_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="primary"
                  onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                >
                  Make Admin
                </Button>
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
