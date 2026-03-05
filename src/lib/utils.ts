import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a string to Title Case, handling hyphens and multiple spaces.
 * "vanessa" → "Vanessa", "mary-jane" → "Mary-Jane"
 */
export function toTitleCase(str: string): string {
  if (!str) return str
  return str
    .toLowerCase()
    .replace(/(^|\s|-)\S/g, (char) => char.toUpperCase())
}
