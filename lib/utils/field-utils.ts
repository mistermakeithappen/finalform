/**
 * Sanitize a string to be used as a field key
 * - Convert to lowercase
 * - Replace spaces with underscores
 * - Remove special characters except underscores
 * - Ensure it starts with a letter or underscore
 */
export function sanitizeFieldKey(text: string): string {
  if (!text) return ''
  
  // Convert to lowercase and replace spaces with underscores
  let key = text.toLowerCase().replace(/\s+/g, '_')
  
  // Remove all special characters except underscores and numbers
  key = key.replace(/[^a-z0-9_]/g, '')
  
  // Ensure it starts with a letter or underscore (not a number)
  if (/^\d/.test(key)) {
    key = '_' + key
  }
  
  // If empty after sanitization, return a default
  if (!key) {
    key = 'field'
  }
  
  return key
}

/**
 * Generate a unique field key from text
 */
export function generateFieldKey(text: string, existingKeys: string[] = []): string {
  const baseKey = sanitizeFieldKey(text)
  
  // If the key doesn't exist, return it
  if (!existingKeys.includes(baseKey)) {
    return baseKey
  }
  
  // Otherwise, append a number to make it unique
  let counter = 1
  let uniqueKey = `${baseKey}_${counter}`
  
  while (existingKeys.includes(uniqueKey)) {
    counter++
    uniqueKey = `${baseKey}_${counter}`
  }
  
  return uniqueKey
}

/**
 * Extract a readable label from HTML content
 */
export function extractLabelFromHTML(html: string, maxLength: number = 50): string {
  // Strip HTML tags
  const textContent = html.replace(/<[^>]*>/g, '')
  
  // Trim whitespace
  const trimmed = textContent.trim()
  
  // Limit length
  if (trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength) + '...'
  }
  
  return trimmed || 'HTML Content'
}