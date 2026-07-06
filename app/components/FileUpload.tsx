'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import ProgressBar from './ProgressBar'
import StatusMessage from './StatusMessage'

interface UploadStatus {
  type: 'idle' | 'uploading' | 'success' | 'error'
  message: string
  code?: string
}

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle', message: '' })
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0]
      const fileSizeMB = selectedFile.size / 1024 / 1024
      
      if (fileSizeMB > 10) {
        setStatus({
          type: 'error',
          message: `File too large (${fileSizeMB.toFixed(1)}MB). Maximum size is 10MB.`
        })
        return
      }

      setFile(selectedFile)
      setStatus({ type: 'idle', message: '' })
      
      // Check if filename contains gift card code
      const fileName = selectedFile.name.toUpperCase()
      const hasCode = /X[A-Z0-9]{15}/.test(fileName)
      if (hasCode) {
        setStatus({
          type: 'idle',
          message: `✅ Gift card code detected in filename!`
        })
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setStatus({ type: 'error', message: 'Please select an image to upload' })
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid amount' })
      return
    }

    setStatus({ type: 'uploading', message: 'Uploading...' })
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('amount', amount)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 10
        })
      }, 200)

      const data = await response.json()

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setStatus({
        type: 'success',
        message: '✅ Gift card uploaded successfully!',
        code: data.code,
      })

      // Reset file and amount after success
      setTimeout(() => {
        setFile(null)
        setAmount('')
        setStatus({ type: 'idle', message: '' })
        setProgress(0)
      }, 5000)

    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed. Please try again.'
      })
      setProgress(0)
    }
  }

  const removeFile = () => {
    setFile(null)
    setStatus({ type: 'idle', message: '' })
    setProgress(0)
  }

  return (
    <div className="space-y-4">
      {status.type === 'success' && (
        <div className="bg-emerald-500/20 border border-emerald-400/50 rounded-xl p-4 text-emerald-300 text-center">
          <CheckCircle className="w-6 h-6 mx-auto mb-2" />
          <p className="font-medium">{status.message}</p>
          {status.code && (
            <p className="text-sm mt-1 font-mono bg-emerald-500/10 px-3 py-1 rounded-lg inline-block">
              Code: {status.code}
            </p>
          )}
        </div>
      )}

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-purple-400 bg-purple-500/10'
            : file
            ? 'border-green-400 bg-green-500/5'
            : 'border-white/20 hover:border-white/40 bg-white/5'
        }`}
      >
        <input {...getInputProps()} />
        
        {file ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="w-6 h-6 text-white/60" />
              <div className="text-left">
                <p className="text-sm text-white font-medium truncate max-w-[180px] sm:max-w-xs">
                  {file.name}
                </p>
                <p className="text-xs text-white/40">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeFile()
              }}
              className="p-1.5 hover:bg-white/10 rounded-full transition"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        ) : (
          <div>
            <Upload className="w-10 h-10 mx-auto mb-3 text-white/40" />
            <p className="text-white font-medium">
              {isDragActive ? 'Drop your image here' : 'Take Photo or Upload Image'}
            </p>
            <p className="text-xs text-white/40 mt-1">
              JPG, PNG, GIF, WEBP (Max 10MB)
            </p>
          </div>
        )}
      </div>

      {status.type === 'uploading' && (
        <ProgressBar progress={progress} />
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/80">
            Gift Card Amount ($)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount on card"
            step="0.01"
            min="0.01"
            className="input-field"
            disabled={status.type === 'uploading'}
          />
          <p className="text-xs text-white/30">Examples: 25, 50, 100, 200</p>
        </div>

        <button
          type="submit"
          disabled={!file || !amount || status.type === 'uploading'}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {status.type === 'uploading' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            'Verify Balance'
          )}
        </button>
      </form>

      {status.type === 'error' && (
        <StatusMessage type="error" message={status.message} />
      )}
    </div>
  )
}