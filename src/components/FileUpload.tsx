'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/lib/design-system'
import { Upload, X, Loader2 } from 'lucide-react'

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
}

export const FileUpload: React.FC<FileUploadProps> = ({
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
}) => {
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

  const validateFiles = (files: File[]): string | null => {
    // Validate number of files
    if (!multiple && files.length > 1) {
      return 'Only one file allowed'
    }
    if (files.length > maxFiles) {
      return `Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed`
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      return `Files must be under ${maxSize}MB`
    }

    // Validate file types if accept is specified
    if (accept && accept !== '*') {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const invalidFiles = files.filter(file => {
        return !acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.replace('/*', '/'))
          }
          return file.type === type || file.name.endsWith(type)
        })
      })
      if (invalidFiles.length > 0) {
        return 'Some files are not accepted file types'
      }
    }

    return null
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className={`space-y-3 ${className}`}>
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
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-300
            ${isDragging 
              ? 'border-primary-500 bg-primary-500/10' 
              : 'border-neutral-700 hover:border-primary-500 hover:bg-neutral-900/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${dropZoneClassName}
          `}
        >
          <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-primary-500' : 'text-neutral-600'}`} />
          <p className="text-neutral-300 font-medium mb-1">
            {dragDropText}
          </p>
          {dragDropSubtext && (
            <p className="text-xs text-neutral-500">
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
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {label}
            </>
          )}
        </Button>
      )}

      {/* Upload progress bar */}
      {showProgress && isUploading && (
        <div className="space-y-2">
          <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 text-center">
            {uploadProgress}% uploaded
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* File previews */}
      {showPreviews && selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-neutral-800/50 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {file.type.startsWith('image/') && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className={`${previewSizeClasses[previewSize]} object-cover rounded`}
                  />
                )}
                {file.type.startsWith('video/') && (
                  <video
                    src={URL.createObjectURL(file)}
                    className={`${previewSizeClasses[previewSize]} object-cover rounded`}
                    muted
                  />
                )}
                {file.type.startsWith('audio/') && (
                  <div className={`${previewSizeClasses[previewSize]} bg-neutral-700 rounded flex items-center justify-center`}>
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/') && (
                  <div className={`${previewSizeClasses[previewSize]} bg-neutral-700 rounded flex items-center justify-center`}>
                    <svg className="w-6 h-6 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                    {file.type && ` • ${file.type.split('/')[0]}`}
                  </p>
                </div>
              </div>
              {!disabled && !isUploading && (
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="text-neutral-400 hover:text-red-400 transition-colors ml-2 p-1"
                  title="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
