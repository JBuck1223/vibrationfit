// /src/app/api/storage/usage/route.ts
// API route for fetching user's storage usage across all folders

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all files from storage for this user
    // Files are organized: userId/folder/filename
    const { data: files, error: listError } = await supabase
      .storage
      .from('user-files')
      .list(user.id, {
        limit: 1000,
        offset: 0,
      })

    if (listError) {
      console.error('Error listing files:', listError)
      return NextResponse.json({ error: 'Failed to fetch storage data' }, { status: 500 })
    }

    // Recursively get files from all subfolders
    const getAllFiles = async (path: string): Promise<any[]> => {
      const { data: items } = await supabase
        .storage
        .from('user-files')
        .list(path, { limit: 1000 })
      
      if (!items) return []
      
      let allFiles: any[] = []
      
      for (const item of items) {
        const fullPath = `${path}/${item.name}`
        
        if (item.id === null) {
          // It's a folder, recurse into it
          const subFiles = await getAllFiles(fullPath)
          allFiles = [...allFiles, ...subFiles]
        } else {
          // It's a file
          allFiles.push({
            ...item,
            path: fullPath,
          })
        }
      }
      
      return allFiles
    }

    const allFiles = await getAllFiles(user.id)

    // Calculate storage by folder type
    const storageByType = allFiles.reduce((acc: any, file: any) => {
      // Extract folder from path (userId/folder/file.ext)
      const pathParts = file.path.split('/')
      const folder = pathParts[1] || 'other'
      
      if (!acc[folder]) {
        acc[folder] = {
          count: 0,
          totalSize: 0,
          files: [],
        }
      }
      
      acc[folder].count++
      acc[folder].totalSize += file.metadata?.size || 0
      acc[folder].files.push({
        name: file.name,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
        updated_at: file.updated_at,
      })
      
      return acc
    }, {})

    // Calculate totals
    const totalFiles = allFiles.length
    const totalSize = allFiles.reduce((sum: number, file: any) => 
      sum + (file.metadata?.size || 0), 0
    )

    // Get recent uploads (last 10)
    const recentFiles = [...allFiles]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(f => ({
        name: f.name,
        path: f.path,
        size: f.metadata?.size || 0,
        created_at: f.created_at,
      }))

    return NextResponse.json({
      totalFiles,
      totalSize,
      storageByType,
      recentFiles,
    })

  } catch (error: any) {
    console.error('Storage API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

