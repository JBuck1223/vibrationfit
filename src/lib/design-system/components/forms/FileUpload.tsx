'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Upload, X, Check } from 'lucide-react'
import { cn } from '../shared-utils'
import { Button } from './Button'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // in MB
  onUpload: (files: File[]) => void
  disabled?: boolean
  label?: string
  
  // Enhanced features
  dragDrop?: boolean
  showProgress?: boolean
  uploadProgress?: number // 0-100
  isUploading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  customTrigger?: React.ReactNode
  
  // Controlled component mode
  value?: File[]
  onChange?: (files: File[]) => void
  
  // Preview options
  showPreviews?: boolean
  previewSize?: 'sm' | 'md' | 'lg'
  
  // Styling
  className?: string
  dropZoneClassName?: string
  
  // Messages
  dragDropText?: string
  dragDropSubtext?: string
  
  // Mobile capture options - bypasses "Preparing..." on iOS
  capture?: 'user' | 'environment' | false // 'user' = front camera, 'environment' = back camera
  showCaptureOption?: boolean // Show separate "Record" button for direct camera access
}

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({
    accept = 'image/*',
    multiple = false,
    maxFiles = 5,
    maxSize = 500,
    onUpload,
    disabled = false,
    label = 'Upload Files',
    
    // Enhanced features
    dragDrop = false,
    showProgress = false,
    uploadProgress = 0,
    isUploading = false,
    variant = 'secondary',
    customTrigger,
    
    // Controlled component mode
    value,
    onChange,
    
    // Preview options
    showPreviews = true,
    previewSize = 'md',
    
    // Styling
    className = '',
    dropZoneClassName = '',
    
    // Messages
    dragDropText = 'Click to upload or drag and drop',
    dragDropSubtext,
  }, ref) => {
    const [internalFiles, setInternalFiles] = useState<File[]>([])
    const [error, setError] = useState<string>('')
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    // Use controlled or uncontrolled mode
    const selectedFiles = value !== undefined ? value : internalFiles
    const setSelectedFiles = (files: File[]) => {
      if (value !== undefined && onChange) {
        onChange(files)
      } else {
        setInternalFiles(files)
      }
    }
    
    // Update internal state if value prop changes
    useEffect(() => {
      if (value !== undefined) {
        setInternalFiles(value)
      }
    }, [value])

    // Helper to check file type with extension fallback (for mobile compatibility)
    const isValidFileType = (file: File, acceptedTypes: string[]): boolean => {
      // Check MIME type first
      const matchesMimeType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'))
        }
        return file.type === type
      })
      
      if (matchesMimeType) return true
      
      // Fallback: check by extension (handles mobile browsers with missing MIME types)
      const extension = file.name.split('.').pop()?.toLowerCase() || ''
      const extensionToCategory: Record<string, string> = {
        // Video extensions
        'mp4': 'video', 'mov': 'video', 'webm': 'video', 'avi': 'video', 
        'm4v': 'video', '3gp': 'video', '3g2': 'video',
        // Image extensions
        'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 
        'webp': 'image', 'heic': 'image', 'heif': 'image',
        // Audio extensions
        'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio', 'm4a': 'audio', 'aac': 'audio',
      }
      
      const category = extensionToCategory[extension]
      if (category && acceptedTypes.some(t => t.includes(`${category}/*`))) {
        return true
      }
      
      return false
    }

    const validateFiles = (files: File[]): string | null => {
      // Validate number of files
      if (!multiple && files.length > 1) {
        return 'Only one file is allowed. Please select a single file.'
      }
      if (files.length > maxFiles) {
        return `Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed. Please remove some files.`
      }

      // Validate file sizes with helpful message
      const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024)
      if (oversizedFiles.length > 0) {
        const fileSizes = oversizedFiles.map(f => `${(f.size / 1024 / 1024).toFixed(1)}MB`).join(', ')
        return `File${oversizedFiles.length > 1 ? 's' : ''} too large (${fileSizes}). Maximum size is ${maxSize}MB.`
      }

      // Validate file types if accept is specified
      if (accept && accept !== '*') {
        const acceptedTypes = accept.split(',').map(type => type.trim())
        const invalidFiles = files.filter(file => !isValidFileType(file, acceptedTypes))
        
        if (invalidFiles.length > 0) {
          const fileNames = invalidFiles.map(f => f.name).join(', ')
          const humanTypes = acceptedTypes
            .map(t => t.replace('/*', '').replace('image', 'images').replace('video', 'videos').replace('audio', 'audio files'))
            .join(', ')
          return `"${fileNames}" - not a supported format. Please use ${humanTypes}.`
        }
      }

      return null
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      processFiles(files)
    }

    const processFiles = (files: File[]) => {
      setError('')

      const validationError = validateFiles(files)
      if (validationError) {
        setError(validationError)
        return
      }

      setSelectedFiles(files)
      onUpload(files)
    }

    const handleRemoveFile = (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index)
      setSelectedFiles(newFiles)
      onUpload(newFiles)
    }

    const handleClick = () => {
      if (!disabled) {
        fileInputRef.current?.click()
      }
    }

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragging(true)
      }
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      processFiles(files)
    }

    // Preview size classes
    const previewSizeClasses = {
      sm: 'w-10 h-10',
      md: 'w-12 h-12',
      lg: 'w-16 h-16'
    }

    // Upload icon
    const UploadIcon = () => (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    )

    // X icon for remove
    const XIcon = () => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )

    // Loader icon
    const LoaderIcon = () => (
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )

    return (
      <div ref={ref} className={cn('space-y-3', className)}>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {/* Drag and drop zone or button */}
        {dragDrop ? (
          <div
            onClick={handleClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer',
              'transition-all duration-300',
              isDragging 
                ? 'border-[#39FF14] bg-[rgba(57,255,20,0.1)]' 
                : 'border-[#666666] hover:border-[#39FF14] hover:bg-[rgba(30,30,30,0.5)]',
              disabled ? 'opacity-50 cursor-not-allowed' : '',
              dropZoneClassName
            )}
          >
            <div className={cn(
              'flex items-center justify-center mb-3',
              isDragging ? 'text-[#39FF14]' : 'text-[#666666]'
            )}>
              <UploadIcon />
            </div>
            <p className="text-[#E5E7EB] font-medium mb-1">
              {dragDropText}
            </p>
            {dragDropSubtext && (
              <p className="text-xs text-[#9CA3AF]">
                {dragDropSubtext}
              </p>
            )}
          </div>
        ) : customTrigger ? (
          <div onClick={handleClick}>
            {customTrigger}
          </div>
        ) : (
          <Button
            type="button"
            variant={variant}
            size="md"
            onClick={handleClick}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <>
                <LoaderIcon />
                <span className="ml-2">Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {label}
              </>
            )}
          </Button>
        )}

        {/* Upload progress bar */}
        {showProgress && isUploading && (
          <div className="space-y-2">
            <div className="w-full bg-[#1F1F1F] rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-[#39FF14] transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-[#9CA3AF] text-center">
              {uploadProgress}% uploaded
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-[rgba(255,0,64,0.1)] border border-[rgba(255,0,64,0.2)] rounded-xl">
            <p className="text-sm text-[#FF0040]">{error}</p>
          </div>
        )}

        {/* File previews */}
        {showPreviews && selectedFiles.length > 0 && (
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[rgba(31,31,31,0.5)] border border-[#333333] rounded-xl hover:bg-[#1F1F1F] transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {file.type.startsWith('image/') && (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className={cn(previewSizeClasses[previewSize], 'object-cover rounded-lg')}
                    />
                  )}
                  {file.type.startsWith('video/') && (
                    <video
                      src={URL.createObjectURL(file)}
                      className={cn(previewSizeClasses[previewSize], 'object-cover rounded-lg')}
                      muted
                    />
                  )}
                  {file.type.startsWith('audio/') && (
                    <div className={cn(previewSizeClasses[previewSize], 'bg-[#333333] rounded-lg flex items-center justify-center')}>
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/') && (
                    <div className={cn(previewSizeClasses[previewSize], 'bg-[#333333] rounded-lg flex items-center justify-center')}>
                      <svg className="w-6 h-6 text-[#9CA3AF]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                      {file.type && ` • ${file.type.split('/')[0]}`}
                    </p>
                  </div>
                </div>
                {!disabled && !isUploading && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-[#9CA3AF] hover:text-[#FF0040] transition-colors ml-2 p-1"
                    title="Remove file"
                  >
                    <XIcon />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)
FileUpload.displayName = 'FileUpload'
