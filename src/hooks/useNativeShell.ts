'use client'

import { useEffect, useState } from 'react'
import { getNativePlatform, isNativeShell, type NativePlatform } from '@/lib/mobile/native-shell'

interface NativeShellState {
  /** Resolved after mount so SSR and first client render match. */
  ready: boolean
  isNative: boolean
  platform: NativePlatform
}

export function useNativeShell(): NativeShellState {
  const [state, setState] = useState<NativeShellState>({
    ready: false,
    isNative: false,
    platform: 'web',
  })

  useEffect(() => {
    setState({ ready: true, isNative: isNativeShell(), platform: getNativePlatform() })
  }, [])

  return state
}

/**
 * True once mounted inside the Capacitor iOS/Android shell; false on the web and
 * during SSR/first paint. Use it to drop purchase / sign-up CTAs from the shell
 * (App Review 3.1.1). Static anchors can use the `hide-in-native` class instead.
 */
export function useIsNativeShell(): boolean {
  return useNativeShell().isNative
}
