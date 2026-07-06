import { createReadStream } from 'fs'
import { readFile } from 'fs/promises'

// Apple Gift Card code patterns
const CODE_PATTERNS = [
  /X[A-Z0-9]{15}/,      // X + 15 alphanumeric
  /[A-Z0-9]{16}/,        // 16 alphanumeric
  /PBH[0-9]{21}/,        // PBH + 21 digits
]

/**
 * Extract gift card code from filename
 */
export function extractCodeFromFilename(filename: string): string | null {
  const upperName = filename.toUpperCase()
  
  for (const pattern of CODE_PATTERNS) {
    const match = upperName.match(pattern)
    if (match) {
      return match[0]
    }
  }
  
  return null
}

/**
 * Extract gift card code from file content
 * For images, we'd need OCR - this is a placeholder
 * In production, you could use Google Cloud Vision API or Tesseract.js
 */
export async function extractCodeFromFile(buffer: Buffer, mimeType: string): Promise<string | null> {
  // For now, try to read text from the buffer
  // This only works for text-based files (not images)
  try {
    const text = buffer.toString('utf8')
    const upperText = text.toUpperCase()
    
    for (const pattern of CODE_PATTERNS) {
      const match = upperText.match(pattern)
      if (match) {
        return match[0]
      }
    }
  } catch (error) {
    // Silently fail - this is just a fallback
  }
  
  return null
}

/**
 * Check if a file contains a valid gift card code
 */
export function containsValidCode(text: string): boolean {
  const upperText = text.toUpperCase()
  
  for (const pattern of CODE_PATTERNS) {
    if (pattern.test(upperText)) {
      return true
    }
  }
  
  return false
}

/**
 * Validate Apple Gift Card code format
 */
export function isValidAppleCode(code: string): boolean {
  return /^X[A-Z0-9]{15}$/.test(code)
}