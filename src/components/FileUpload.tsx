'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/lib/design-system'
import { compressVideoClientSide, shouldCompressVideoClientSide } from '@/lib/client-video-compression'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // in MB
  onUpload: (files: File[]) => void
  disabled?: boolean
  label?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'image/*',
  multiple = false,
  maxFiles = 5,
  maxSize = 500,
  onUpload,
  disabled = false,
  label = 'Upload Files'
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setError('')

    // Validate number of files
    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Process files (compress videos if needed)
    const processedFiles: File[] = []
    
    for (const file of files) {
      if (shouldCompressVideoClientSide(file)) {
        try {
          console.log(`Compressing video: ${file.name}`)
          const compressedFile = await compressVideoClientSide(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            maxSizeMB: 50
          })
          processedFiles.push(compressedFile)
        } catch (error) {
          console.warn('Video compression failed, using original:', error)
          processedFiles.push(file)
        }
      } else {
        processedFiles.push(file)
      }
    }

    // Validate file sizes after compression
    const oversizedFiles = processedFiles.filter(file => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError(`Files must be under ${maxSize}MB`)
      return
    }

    setSelectedFiles(processedFiles)
    onUpload(processedFiles)
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onUpload(newFiles)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={handleClick}
        disabled={disabled}
      >
        {label}
      </Button>

      {error && (
        <p className="text-sm text-error-600">{error}</p>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-neutral-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {file.type.startsWith('image/') && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                {file.type.startsWith('video/') && (
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-12 h-12 object-cover rounded"
                    muted
                  />
                )}
                {file.type.startsWith('audio/') && (
                  <div className="w-12 h-12 bg-neutral-700 rounded flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'white' }}>
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/') && (
                  <div className="w-12 h-12 bg-neutral-700 rounded flex items-center justify-center">
                    <svg className="w-6 h-6 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className="text-sm text-white font-medium truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[0]}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="text-error-600 hover:text-error-500 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
