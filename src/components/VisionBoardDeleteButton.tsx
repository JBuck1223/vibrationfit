'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@/lib/design-system'
import { deleteUserFile } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

interface VisionBoardDeleteButtonProps {
  itemId: string
  itemName: string
  imageUrl?: string
  status: string
}

export function VisionBoardDeleteButton({ itemId, itemName, imageUrl, status }: VisionBoardDeleteButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to delete vision board item')
        return
      }

      // Delete image file if it exists
      if (imageUrl) {
        try {
          const imagePath = imageUrl.split('/').slice(-3).join('/') // Extract path from URL
          await deleteUserFile(imagePath)
        } catch (error) {
          console.warn('Failed to delete image file:', error)
          // Continue with database deletion even if image deletion fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('vision_board_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      // Update user stats (decrement counts)
      // Note: This RPC function needs to be created in Supabase
      try {
        await supabase.rpc('decrement_vision_board_stats', { 
          p_user_id: user.id,
          p_status: status 
        })
      } catch (rpcError) {
        console.warn('RPC function decrement_vision_board_stats not found:', rpcError)
        // Continue with deletion even if stats update fails
      }

      // Refresh the page to show updated list
      router.refresh()
    } catch (error) {
      console.error('Error deleting vision board item:', error)
      alert('Failed to delete vision board item')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDeleteConfirm(true)}
        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Creation</h3>
              <p className="text-neutral-300 mb-6">
                Are you sure you want to delete "{itemName}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  loading={deleting}
                  disabled={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
