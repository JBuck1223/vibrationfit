/**
 * Production base URL for outbound links (emails, SMS, stored in DB).
 *
 * NEVER resolves to localhost. Even when running locally, any link that
 * reaches a real user must point to the production domain.
 *
 * Use `process.env.NEXT_PUBLIC_APP_URL` only for internal API calls or
 * Stripe redirect URLs where localhost is intentional during development.
 */
export const OUTBOUND_URL = 'https://vibrationfit.com'
