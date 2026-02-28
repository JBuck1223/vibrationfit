/**
 * Shared phone formatting: country-code detection and E.164.
 * Used by checkout and profile personal information.
 */

const PHONE_COUNTRIES: {
  prefix: string
  code: string
  nationalLength: number
  format: (n: string) => string
}[] = [
  {
    prefix: '44',
    code: '+44',
    nationalLength: 10,
    format: n =>
      n.length <= 4 ? n : n.length <= 7 ? `${n.slice(0, 4)} ${n.slice(4)}` : `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`,
  },
  {
    prefix: '33',
    code: '+33',
    nationalLength: 9,
    format: n =>
      n.length <= 1 ? n : [n.slice(0, 1), ...(n.slice(1).match(/.{1,2}/g) || [])].join(' '),
  },
  {
    prefix: '49',
    code: '+49',
    nationalLength: 11,
    format: n =>
      n.length <= 5 ? n : n.length <= 9 ? `${n.slice(0, 5)} ${n.slice(5)}` : `${n.slice(0, 5)} ${n.slice(5, 9)} ${n.slice(9)}`,
  },
  {
    prefix: '61',
    code: '+61',
    nationalLength: 9,
    format: n => (n.length <= 4 ? n : `${n.slice(0, 4)} ${n.slice(4)}`),
  },
  {
    prefix: '1',
    code: '+1',
    nationalLength: 10,
    format: n =>
      n.length <= 3
        ? n.length
          ? `(${n}`
          : ''
        : n.length <= 6
          ? `(${n.slice(0, 3)}) ${n.slice(3)}`
          : `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`,
  },
]

function getPhoneCountryAndNational(digits: string): { code: string; national: string } | null {
  const d = digits.replace(/\D/g, '')
  if (!d.length) return null
  for (const { prefix, code, nationalLength } of PHONE_COUNTRIES) {
    if (d === prefix || d.startsWith(prefix)) {
      const national =
        d.length > prefix.length
          ? d.slice(prefix.length, prefix.length + nationalLength)
          : d.slice(prefix.length)
      return { code, national }
    }
  }
  const us = PHONE_COUNTRIES.find(c => c.prefix === '1')!
  const national = d.slice(0, us.nationalLength)
  return { code: us.code, national }
}

/** Format digits for display with country code (e.g. +1 (555) 123-4567). */
export function formatPhoneDisplay(digits: string): string {
  const parsed = getPhoneCountryAndNational(digits)
  if (!parsed || !parsed.national) return ''
  const country = PHONE_COUNTRIES.find(c => c.code === parsed!.code)
  const formatted = country ? country.format(parsed.national) : parsed.national
  return `${parsed.code} ${formatted}`.trim()
}

/** Normalize input to digits only; cap at 13 (country + national). */
export function parsePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 13)
}

/** Convert digits to E.164 (e.g. +15551234567) for storage/API. */
export function phoneToE164(digits: string): string {
  const parsed = getPhoneCountryAndNational(digits)
  if (!parsed || !parsed.national) return ''
  const countryDigits = parsed.code.replace('+', '')
  return `+${countryDigits}${parsed.national}`
}

/** Get raw digits from any phone string (E.164 or formatted) for display/input state. */
export function phoneToDigits(phone: string | null | undefined): string {
  return (phone || '').replace(/\D/g, '').slice(0, 13)
}
