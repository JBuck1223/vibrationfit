/**
 * FileUpload Component - Usage Examples
 * 
 * This file demonstrates all the new features of the enhanced FileUpload component
 */

import { useState } from 'react'
import { FileUpload } from './FileUpload'
import { Button } from '@/lib/design-system'
import { Sparkles } from 'lucide-react'

// ============================================
// EXAMPLE 1: Basic Usage (backward compatible)
// ============================================
export function BasicUpload() {
  const handleUpload = (files: File[]) => {
    console.log('Files selected:', files)
  }

  return (
    <FileUpload
      accept="image/*"
      multiple
      maxFiles={5}
      maxSize={10}
      onUpload={handleUpload}
      label="Upload Images"
    />
  )
}

// ============================================
// EXAMPLE 2: Drag and Drop Zone
// ============================================
export function DragDropUpload() {
  const handleUpload = (files: File[]) => {
    console.log('Files dropped:', files)
  }

  return (
    <FileUpload
      dragDrop
      accept="image/*,video/*"
      multiple
      maxFiles={10}
      maxSize={50}
      onUpload={handleUpload}
      dragDropText="Drop your files here or click to browse"
      dragDropSubtext="Supports images and videos up to 50MB"
    />
  )
}

// ============================================
// EXAMPLE 3: With Upload Progress
// ============================================
export function UploadWithProgress() {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (files: File[]) => {
    setUploading(true)
    setProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  return (
    <FileUpload
      accept="image/*"
      multiple
      maxFiles={5}
      maxSize={10}
      onUpload={handleUpload}
      showProgress
      uploadProgress={progress}
      isUploading={uploading}
      label="Upload with Progress"
    />
  )
}

// ============================================
// EXAMPLE 4: Controlled Component Mode
// ============================================
export function ControlledUpload() {
  const [files, setFiles] = useState<File[]>([])

  const handleUpload = (newFiles: File[]) => {
    console.log('Upload triggered with:', newFiles)
    // You can do additional processing here
  }

  const handleChange = (newFiles: File[]) => {
    setFiles(newFiles)
  }

  return (
    <div>
      <FileUpload
        value={files}
        onChange={handleChange}
        onUpload={handleUpload}
        accept="image/*"
        multiple
        maxFiles={5}
        maxSize={10}
        label="Controlled Upload"
      />
      <p className="text-sm text-neutral-400 mt-2">
        {files.length} file(s) selected
      </p>
    </div>
  )
}

// ============================================
// EXAMPLE 5: Custom Trigger Button
// ============================================
export function CustomTriggerUpload() {
  const handleUpload = (files: File[]) => {
    console.log('Files selected:', files)
  }

  return (
    <FileUpload
      accept="image/*"
      multiple
      maxFiles={5}
      maxSize={10}
      onUpload={handleUpload}
      customTrigger={
        <Button variant="primary" size="lg">
          <Sparkles className="w-5 h-5 mr-2" />
          Choose Your Photos
        </Button>
      }
    />
  )
}

// ============================================
// EXAMPLE 6: Vision Board Style (Drag & Drop + Large Previews)
// ============================================
export function VisionBoardUpload() {
  const [file, setFile] = useState<File | null>(null)

  const handleUpload = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0])
    }
  }

  const handleChange = (files: File[]) => {
    setFile(files[0] || null)
  }

  return (
    <FileUpload
      dragDrop
      accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
      multiple={false}
      maxFiles={1}
      maxSize={10}
      onUpload={handleUpload}
      value={file ? [file] : []}
      onChange={handleChange}
      dragDropText="Click to upload or drag and drop"
      dragDropSubtext="PNG, JPG, WEBP, or HEIC (max 10MB)"
      previewSize="lg"
    />
  )
}

// ============================================
// EXAMPLE 7: Journal Entry Style (Multiple Files with Progress)
// ============================================
export function JournalEntryUpload() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleUpload = async (newFiles: File[]) => {
    setUploading(true)
    setProgress(0)

    // Simulate multi-file upload
    for (let i = 0; i < newFiles.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setProgress(((i + 1) / newFiles.length) * 100)
    }

    setUploading(false)
    console.log('All files uploaded!')
  }

  return (
    <FileUpload
      dragDrop
      accept="image/*,video/*,audio/*"
      multiple
      maxFiles={10}
      maxSize={100}
      onUpload={handleUpload}
      value={files}
      onChange={setFiles}
      showProgress
      uploadProgress={progress}
      isUploading={uploading}
      dragDropText="Upload images, videos, or audio files"
      dragDropSubtext="Up to 10 files, max 100MB each"
      previewSize="md"
    />
  )
}

// ============================================
// EXAMPLE 8: Different Button Variants
// ============================================
export function VariantExamples() {
  const handleUpload = (files: File[]) => {
    console.log('Files:', files)
  }

  return (
    <div className="space-y-4">
      <FileUpload
        accept="image/*"
        onUpload={handleUpload}
        variant="primary"
        label="Primary Upload"
      />
      
      <FileUpload
        accept="image/*"
        onUpload={handleUpload}
        variant="secondary"
        label="Secondary Upload"
      />
      
      <FileUpload
        accept="image/*"
        onUpload={handleUpload}
        variant="ghost"
        label="Ghost Upload"
      />
      
      <FileUpload
        accept="image/*"
        onUpload={handleUpload}
        variant="outline"
        label="Outline Upload"
      />
    </div>
  )
}

// ============================================
// EXAMPLE 9: No Previews (File Names Only)
// ============================================
export function NoPreviewUpload() {
  const handleUpload = (files: File[]) => {
    console.log('Files:', files)
  }

  return (
    <FileUpload
      accept="*"
      multiple
      maxFiles={10}
      maxSize={50}
      onUpload={handleUpload}
      showPreviews={false}
      label="Upload Any Files"
    />
  )
}

// ============================================
// EXAMPLE 10: Custom Styling
// ============================================
export function CustomStyledUpload() {
  const handleUpload = (files: File[]) => {
    console.log('Files:', files)
  }

  return (
    <FileUpload
      dragDrop
      accept="image/*"
      multiple
      maxFiles={5}
      maxSize={10}
      onUpload={handleUpload}
      className="my-custom-wrapper"
      dropZoneClassName="border-purple-500 hover:border-purple-400"
      dragDropText="Drop your beautiful images here"
      previewSize="lg"
    />
  )
}

