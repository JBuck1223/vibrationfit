/** S3 keys are literal, but browsers/CDNs normalize dot segments and escaping. */
export function isSafeStorageKey(key: unknown): key is string {
  return typeof key === 'string' && key.length > 0 && key.length <= 1024 &&
    !/[\\%\x00-\x1f\x7f?#]/.test(key) &&
    key.split('/').every(segment => segment !== '' && segment !== '.' && segment !== '..')
}

export function canAccessStorageKey(key: unknown, userId: string, admin = false): boolean {
  if (!isSafeStorageKey(key)) return false
  if (key.startsWith(`user-uploads/${userId}/`)) return true
  return admin && (key.startsWith('site-assets/') || /^user-uploads\/[^/]+\//.test(key))
}
