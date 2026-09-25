'use client'

// PayPal JS SDK v6 card fields, shared by checkout and the billing add-card form.
//
// v6 renders each field into a box we own. The box carries the border,
// background and focus ring from the design system; PayPal only paints the
// input text inside it. That is what removes the v5 restyle flash.
//
// The SDK is authorised with a short-lived client token minted by
// /api/paypal/client-token, so no PayPal credential ships in the page bundle.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  PayPalProvider,
  PayPalCardFieldsProvider,
  PayPalCardNumberField,
  PayPalCardExpiryField,
  PayPalCardCvvField,
  useEligibleMethods,
  usePayPal,
  INSTANCE_LOADING_STATE,
  type CardFieldTypes,
  type EventPayload,
  type MerchantStyleObject,
} from '@paypal/react-paypal-js/sdk-v6'
import { cn } from '@/lib/design-system/components/shared-utils'

// ---------------------------------------------------------------------------
// Styling
// ---------------------------------------------------------------------------

/** Mirrors `fieldControlClass` minus padding; the SDK fills the box. */
const boxClass =
  'relative h-[42px] w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition-colors'
const boxFocusClass = 'border-primary-500/50 ring-1 ring-primary-500/25'
const boxInvalidClass = '!border-[#FF0040]'

/** Input chrome lives on our box, so the SDK input is flat text only. */
export const cardFieldStyle: MerchantStyleObject = {
  input: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    borderRadius: '0',
    padding: '0 14px',
    height: '42px',
    lineHeight: '20px',
    fontSize: '14px',
    fontFamily: 'system-ui, sans-serif',
    color: '#FFFFFF',
    transition: 'none',
  },
  'input.focus': {
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
  },
  'input::placeholder': {
    color: '#737373',
  },
  '.invalid': {
    color: '#FF0040',
  },
  'input.invalid': {
    border: 'none',
    boxShadow: 'none',
  },
}

// ---------------------------------------------------------------------------
// Client token
// ---------------------------------------------------------------------------

/**
 * Which core script to load. Must be known before the SDK mounts, so it comes
 * from a public env var. Defaults to production; set NEXT_PUBLIC_PAYPAL_ENV=sandbox
 * alongside PAYPAL_ENV=sandbox for sandbox testing.
 */
const SDK_ENVIRONMENT: 'sandbox' | 'production' =
  process.env.NEXT_PUBLIC_PAYPAL_ENV === 'sandbox' ? 'sandbox' : 'production'

async function fetchBrowserClientToken(): Promise<string> {
  const res = await fetch('/api/paypal/client-token', { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.clientToken) {
    throw new Error(data.error || 'Payment system is unavailable. Please try again.')
  }
  return data.clientToken as string
}

// ---------------------------------------------------------------------------
// Per-field UI state (focus / invalid) driven by SDK events
// ---------------------------------------------------------------------------

type FieldUiState = { focused: boolean; invalid: boolean }
type FieldsUiState = Record<CardFieldTypes, FieldUiState>

const initialUi: FieldsUiState = {
  number: { focused: false, invalid: false },
  expiry: { focused: false, invalid: false },
  cvv: { focused: false, invalid: false },
}

const FieldsUiContext = createContext<FieldsUiState>(initialUi)

// ---------------------------------------------------------------------------
// Frame: providers + status
// ---------------------------------------------------------------------------

type FrameStatus =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'error'; message: string }

const FrameStatusContext = createContext<FrameStatus>({ kind: 'loading' })

/** Read whether the card fields are usable yet (for disabling submit). */
export function useCardFieldsStatus(): FrameStatus {
  return useContext(FrameStatusContext)
}

function FrameStatusProvider({ children }: { children: ReactNode }) {
  const { loadingStatus, error: sdkError } = usePayPal()
  const { eligiblePaymentMethods, isLoading: eligibilityLoading, error: eligibilityError } = useEligibleMethods()

  const status = useMemo<FrameStatus>(() => {
    if (sdkError) {
      console.error('[paypal card fields] sdk error:', sdkError)
      return { kind: 'error', message: 'Card payments are unavailable right now. Please refresh and try again.' }
    }
    if (loadingStatus !== INSTANCE_LOADING_STATE.RESOLVED) return { kind: 'loading' }
    if (eligibilityLoading) return { kind: 'loading' }
    // Eligibility is advisory. Only block when PayPal explicitly says no.
    if (!eligibilityError && eligiblePaymentMethods && !eligiblePaymentMethods.isEligible('advanced_cards')) {
      return { kind: 'error', message: 'Card payments are not available on this account yet. Please try again shortly.' }
    }
    return { kind: 'ready' }
  }, [sdkError, loadingStatus, eligibilityLoading, eligibilityError, eligiblePaymentMethods])

  return <FrameStatusContext.Provider value={status}>{children}</FrameStatusContext.Provider>
}

/**
 * Loads the SDK and opens a card-fields session. Children render `CardFieldBox`
 * and call `usePayPalCardFieldsOneTimePaymentSession` or
 * `usePayPalCardFieldsSavePaymentSession`, which pick the session type.
 */
export function PayPalCardFieldsFrame({ children }: { children: ReactNode }) {
  // Stable promise: PayPalProvider re-initialises if this reference changes
  const clientToken = useMemo(() => fetchBrowserClientToken(), [])
  const [ui, setUi] = useState<FieldsUiState>(initialUi)

  const onFocus = useCallback((e: EventPayload) => {
    setUi((prev) => ({ ...prev, [e.sender]: { ...prev[e.sender], focused: true } }))
  }, [])
  const onBlur = useCallback((e: EventPayload) => {
    const field = e.data[e.sender]
    const invalid = !field.isEmpty && !field.isPotentiallyValid
    setUi((prev) => ({ ...prev, [e.sender]: { focused: false, invalid } }))
  }, [])
  const onValidityChange = useCallback((e: EventPayload) => {
    const field = e.data[e.sender]
    // Clear red as soon as the entry could become valid; only set red on blur
    if (field.isPotentiallyValid || field.isEmpty) {
      setUi((prev) => (prev[e.sender].invalid ? { ...prev, [e.sender]: { ...prev[e.sender], invalid: false } } : prev))
    }
  }, [])

  // Providers mount at once so child hooks are valid from the first render;
  // the SDK itself waits on the token promise.
  return (
    <PayPalProvider
      clientToken={clientToken}
      environment={SDK_ENVIRONMENT}
      components={['card-fields']}
      pageType="checkout"
    >
      <FrameStatusProvider>
        <PayPalCardFieldsProvider focus={onFocus} blur={onBlur} validitychange={onValidityChange}>
          <FieldsUiContext.Provider value={ui}>{children}</FieldsUiContext.Provider>
        </PayPalCardFieldsProvider>
      </FrameStatusProvider>
    </PayPalProvider>
  )
}

// ---------------------------------------------------------------------------
// Field box
// ---------------------------------------------------------------------------

const FIELD_COMPONENT = {
  number: PayPalCardNumberField,
  expiry: PayPalCardExpiryField,
  cvv: PayPalCardCvvField,
} as const

const FIELD_ARIA: Record<CardFieldTypes, string> = {
  number: 'Card number',
  expiry: 'Expiration date',
  cvv: 'Security code',
}

/** Label + design-system box with a PayPal field mounted inside. */
export function CardFieldBox({
  type,
  label,
  placeholder,
}: {
  type: CardFieldTypes
  label: string
  placeholder: string
}) {
  const ui = useContext(FieldsUiContext)[type]
  const status = useContext(FrameStatusContext)
  const Field = FIELD_COMPONENT[type]
  const ready = status.kind === 'ready'

  // PayPal's <paypal-hosted-card-field> paints a light grey loader while its
  // iframe boots, then swaps to the iframe before the field's text has
  // settled. We keep the whole element at opacity 0 and show our own
  // placeholder until the SDK unhides its iframe (it keeps `hidden` on the
  // frame until load), then give it a beat to finish its first paint.
  const hostRef = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!ready) return
    const host = hostRef.current
    if (!host) return
    let settle: ReturnType<typeof setTimeout> | undefined
    const startedAt = Date.now()
    const poll = setInterval(() => {
      const frame = host
        .querySelector('paypal-hosted-card-field')
        ?.shadowRoot?.querySelector('iframe')
      const loaded = frame instanceof HTMLIFrameElement && !frame.hidden
      const timedOut = Date.now() - startedAt > IFRAME_REVEAL_FALLBACK_MS
      if (loaded || timedOut) {
        clearInterval(poll)
        settle = setTimeout(() => setRevealed(true), loaded ? IFRAME_SETTLE_MS : 0)
      }
    }, 40)
    return () => {
      clearInterval(poll)
      if (settle) clearTimeout(settle)
    }
  }, [ready])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#E5E7EB]">{label}</label>
      <div className={cn(boxClass, ui.focused && boxFocusClass, ui.invalid && boxInvalidClass)}>
        {/* Our placeholder covers the box until PayPal's frame is ready */}
        <span
          aria-hidden
          className={cn(
            // Same font stack as cardFieldStyle so the swap to PayPal's frame is invisible
            'pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-neutral-500 [font-family:system-ui,sans-serif] transition-opacity duration-150',
            revealed && 'opacity-0'
          )}
        >
          {placeholder}
        </span>
        {ready && (
          <div
            ref={hostRef}
            className={cn(
              'absolute inset-0 transition-opacity duration-150',
              !revealed && 'opacity-0'
            )}
          >
            <Field
              placeholder={placeholder}
              ariaLabel={FIELD_ARIA[type]}
              style={cardFieldStyle}
              containerClassName="absolute inset-0"
            />
          </div>
        )}
      </div>
    </div>
  )
}

/** Delay after the frame loads before revealing, so its first paint is styled */
const IFRAME_SETTLE_MS = 120
/** Reveal regardless after this long, so a field is never stuck hidden */
const IFRAME_REVEAL_FALLBACK_MS = 6000
