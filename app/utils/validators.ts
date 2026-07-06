/**
 * Validate file type against allowed types
 */
export function isValidFileType(mimeType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ]
  return allowedTypes.includes(mimeType)
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024
  return size <= maxBytes
}

/**
 * Validate amount
 */
export function isValidAmount(amount: string | number): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return !isNaN(num) && num > 0 && num <= 1000
}

/**
 * Validate Apple Gift Card code
 */
export function isValidAppleCode(code: string): boolean {
  return /^X[A-Z0-9]{15}$/.test(code)
}