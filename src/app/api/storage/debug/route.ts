// /src/app/api/storage/debug/route.ts
// Debug endpoint to test storage calculation for a specific user

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameter
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter required' }, { status: 400 })
    }

    const supabase = await createClient()

    console.log('🔍 STORAGE DEBUG: Fetching files for user:', userId)

    // Get all files from storage for this user
    // Files are in: user-uploads/userId/folder/filename
    const userPath = `user-uploads/${userId}`
    
    const { data: rootFiles, error: listError } = await supabase
      .storage
      .from('user-files')
      .list(userPath, {
        limit: 1000,
        offset: 0,
      })

    if (listError) {
      console.error('❌ Error listing root files:', listError)
      return NextResponse.json({ error: 'Failed to list files', details: listError }, { status: 500 })
    }

    console.log(`📁 Found ${rootFiles?.length || 0} items in user-uploads/${userId}`)

    // Recursively get files from all subfolders
    const getAllFiles = async (path: string, depth = 0): Promise<any[]> => {
      console.log(`  ${'  '.repeat(depth)}📂 Scanning: ${path}`)
      
      const { data: items, error } = await supabase
        .storage
        .from('user-files')
        .list(path, { limit: 1000 })
      
      if (error) {
        console.error(`  ${'  '.repeat(depth)}❌ Error:`, error)
        return []
      }
      
      if (!items || items.length === 0) {
        console.log(`  ${'  '.repeat(depth)}  (empty)`)
        return []
      }
      
      console.log(`  ${'  '.repeat(depth)}  Found ${items.length} items`)
      
      let allFiles: any[] = []
      
      for (const item of items) {
        const fullPath = path ? `${path}/${item.name}` : item.name
        
        if (item.id === null) {
          // It's a folder
          console.log(`  ${'  '.repeat(depth)}  📁 Folder: ${item.name}`)
          const subFiles = await getAllFiles(fullPath, depth + 1)
          allFiles = [...allFiles, ...subFiles]
        } else {
          // It's a file
          const size = item.metadata?.size || 0
          console.log(`  ${'  '.repeat(depth)}  📄 File: ${item.name} (${(size / 1024 / 1024).toFixed(2)} MB)`)
          allFiles.push({
            ...item,
            path: fullPath,
          })
        }
      }
      
      return allFiles
    }

    const allFiles = await getAllFiles(userPath)

    console.log(`\n✅ Total files found: ${allFiles.length}`)

    // Calculate storage by folder type
    const storageByType = allFiles.reduce((acc: any, file: any) => {
      // Extract folder from path (user-uploads/userId/folder/file.ext)
      const pathParts = file.path.split('/')
      const folder = pathParts[2] || 'root' // Index 2 for folder after user-uploads/userId
      
      if (!acc[folder]) {
        acc[folder] = {
          count: 0,
          totalSize: 0,
          files: [],
        }
      }
      
      const fileSize = file.metadata?.size || 0
      acc[folder].count++
      acc[folder].totalSize += fileSize
      acc[folder].files.push({
        name: file.name,
        size: fileSize,
        created_at: file.created_at,
      })
      
      return acc
    }, {})

    // Calculate totals
    const totalFiles = allFiles.length
    const totalSize = allFiles.reduce((sum: number, file: any) => 
      sum + (file.metadata?.size || 0), 0
    )

    console.log(`💾 Total storage: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`📊 Breakdown:`)
    Object.entries(storageByType).forEach(([folder, stats]: [string, any]) => {
      console.log(`  - ${folder}: ${stats.count} files, ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`)
    })

    return NextResponse.json({
      userId,
      totalFiles,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      totalSizeGB: (totalSize / 1024 / 1024 / 1024).toFixed(3),
      storageByType,
      allFilePaths: allFiles.map(f => f.path),
    })

  } catch (error: any) {
    console.error('❌ Storage debug error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: error
    }, { status: 500 })
  }
}

