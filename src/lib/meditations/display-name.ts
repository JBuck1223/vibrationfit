export function accountDisplayName(account: {
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
} | null | undefined): string {
  if (!account) return 'Member'
  const full = account.full_name?.trim()
  if (full) return full
  const joined = [account.first_name, account.last_name].filter(Boolean).join(' ').trim()
  return joined || 'Member'
}
