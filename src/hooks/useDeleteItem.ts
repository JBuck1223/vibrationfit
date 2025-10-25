'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deleteUserFile } from '@/lib/storage/s3-storage-presigned'

interface UseDeleteItemOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  itemType?: string
}

export function useDeleteItem(options: UseDeleteItemOptions = {}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)

  const initiateDelete = (item: any) => {
    setItemToDelete(item)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    
    setDeleting(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Please log in to delete this item')
      }

      // Delete image file if it exists
      if (itemToDelete.image_url) {
        try {
          const url = new URL(itemToDelete.image_url)
          const imagePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
          console.log('Deleting S3 file:', imagePath)
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
        .eq('id', itemToDelete.id)

      if (error) throw error

      // Update user stats (decrement counts)
      try {
        await supabase.rpc('decrement_vision_board_stats', { 
          p_user_id: user.id,
          p_status: itemToDelete.status 
        })
      } catch (rpcError) {
        console.warn('RPC function decrement_vision_board_stats not found:', rpcError)
        // Continue with deletion even if stats update fails
      }

      // Call success callback
      options.onSuccess?.()
      
    } catch (error) {
      console.error('Error deleting item:', error)
      options.onError?.(error as Error)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
      setItemToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setItemToDelete(null)
  }

  return {
    showDeleteConfirm,
    deleting,
    itemToDelete,
    initiateDelete,
    confirmDelete,
    cancelDelete
  }
}
