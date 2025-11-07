'use client'

import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Container, PageLayout, Card, Button, Spinner } from '@/lib/design-system/components'
import { Shield, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AdminWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminWrapper({ children, fallback }: AdminWrapperProps) {
  const { isAdmin, isLoading, user } = useAdminAuth()
  const router = useRouter()

  if (isLoading) {
    return (
      <PageLayout>
        <Container size="xl" className="py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Spinner variant="primary" size="lg" className="mx-auto mb-4" />
              <p className="text-neutral-400">Verifying admin access...</p>
            </div>
          </div>
        </Container>
      </PageLayout>
    )
  }

  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <PageLayout>
        <Container size="sm" className="py-12">
          <Card className="text-center p-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              Admin Access Required
            </h1>
            
            <p className="text-neutral-400 mb-6">
              This page is restricted to administrators only. You need special permissions to access this area.
            </p>

            {user ? (
              <div className="space-y-4">
                <div className="bg-neutral-800 rounded-lg p-4">
                  <p className="text-sm text-neutral-400 mb-2">Logged in as:</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                
                <p className="text-sm text-neutral-500">
                  If you believe you should have admin access, please contact the system administrator.
                </p>
                
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/dashboard')}
                  className="mt-4"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-neutral-500">
                  Please sign in with an admin account to access this page.
                </p>
                
                <Button 
                  variant="primary" 
                  onClick={() => router.push('/auth/login?admin=true')}
                  className="mt-4"
                >
                  Sign In
                </Button>
              </div>
            )}
          </Card>
        </Container>
      </PageLayout>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Admin Content */}
      {children}
    </div>
  )
}
