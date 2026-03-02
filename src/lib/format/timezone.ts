/**
 * Format a Date in a specific IANA timezone for emails and display.
 * Use this so scheduled times show in the recipient's or host's timezone, not server UTC.
 */
const DEFAULT_DISPLAY_TIMEZONE = 'America/New_York'

export function formatDateInTimeZone(
  date: Date,
  timeZone: string = DEFAULT_DISPLAY_TIMEZONE
): { date: string; time: string } {
  return {
    date: date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone,
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone,
    }),
  }
}

export { DEFAULT_DISPLAY_TIMEZONE }
