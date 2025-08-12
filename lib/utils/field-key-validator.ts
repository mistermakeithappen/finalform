/**
 * Sanitizes a field key to ensure it only contains valid characters
 * Valid characters are: lowercase letters, numbers, underscores, and hyphens
 * Cannot start with a number or hyphen
 */
export function sanitizeFieldKey(key: string): string {
  if (!key) return ''
  
  return key
    .toLowerCase()
    // Remove any invalid characters (keep only a-z, 0-9, underscore, hyphen)
    .replace(/[^a-z0-9_-]/g, '')
    // Remove leading hyphens
    .replace(/^-+/, '')
    // Remove leading numbers
    .replace(/^[0-9]+/, '')
    // If empty after sanitization, provide a default
    || 'field'
}

/**
 * Validates if a field key is valid
 */
export function isValidFieldKey(key: string): boolean {
  if (!key) return false
  
  // Must start with a letter or underscore
  // Can contain letters, numbers, underscores, and hyphens
  const pattern = /^[a-z_][a-z0-9_-]*$/
  return pattern.test(key)
}

/**
 * Generates a unique field key based on a label
 */
export function generateFieldKey(label: string, existingKeys: string[] = []): string {
  // Start with sanitized label
  let baseKey = sanitizeFieldKey(
    label
      .toLowerCase()
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^a-z0-9_-]/g, '') // Remove invalid characters
  )
  
  // If empty, use 'field' as base
  if (!baseKey) {
    baseKey = 'field'
  }
  
  // Ensure uniqueness
  let key = baseKey
  let counter = 1
  
  while (existingKeys.includes(key)) {
    key = `${baseKey}_${counter}`
    counter++
  }
  
  return key
}

/**
 * Returns an error message if the field key is invalid
 */
export function validateFieldKey(key: string, existingKeys: string[] = []): string | null {
  if (!key) {
    return 'Field key is required'
  }
  
  if (!isValidFieldKey(key)) {
    return 'Field key can only contain lowercase letters, numbers, underscores, and hyphens. Must start with a letter or underscore.'
  }
  
  if (existingKeys.includes(key)) {
    return 'Field key must be unique'
  }
  
  return null
}