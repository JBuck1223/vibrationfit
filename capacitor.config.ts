import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Vibration Fit native shell (iOS + Android).
 *
 * Remote-URL mode: the WebView loads the live Next.js app instead of a
 * bundled static export, so every web deploy ships to the app instantly.
 * Only native plugin changes require a store resubmission.
 *
 * Dev against your local server from a phone/simulator:
 *   CAP_SERVER_URL=http://192.168.1.50:3000 npx cap sync
 * (use your Mac's LAN IP; localhost does not resolve from a device)
 */
const serverOrigin = process.env.CAP_SERVER_URL || 'https://vibrationfit.com'
const isLocalDev = /^http:\/\//.test(serverOrigin)

/**
 * Entry point. Members-only: land on the dashboard, which server-redirects
 * to /auth/login when signed out. Never the marketing homepage; its hero
 * video does not paint in WKWebView and the app shows a black screen.
 */
const serverUrl = `${serverOrigin.replace(/\/$/, '')}/dashboard`

const config: CapacitorConfig = {
  appId: 'com.vibrationfit.app',
  appName: 'Vibration Fit',
  // Placeholder only. Real content is loaded from server.url.
  webDir: 'mobile/www',
  ios: {
    path: 'mobile/ios',
    contentInset: 'never',
    backgroundColor: '#000000',
    // Match the web app's dark chrome while the first page loads.
    preferredContentMode: 'mobile',
    // No long-press link previews inside the app.
    allowsLinkPreview: false,
  },
  android: {
    path: 'mobile/android',
    backgroundColor: '#000000',
    allowMixedContent: false,
  },
  server: {
    url: serverUrl,
    cleartext: isLocalDev,
    // Hosts the WebView may navigate to in-app. Anything else (Stripe,
    // PayPal, external links) is handed to the system browser by Capacitor.
    allowNavigation: [
      'vibrationfit.com',
      '*.vibrationfit.com',
      '*.supabase.co',
      ...(isLocalDev ? [new URL(serverOrigin).hostname] : []),
    ],
  },
  plugins: {
    SplashScreen: {
      // NativeShellBridge hides the splash as soon as the web app mounts.
      // This is only the ceiling, so a dead network never traps the splash.
      launchShowDuration: 4000,
      launchAutoHide: true,
      launchFadeOutDuration: 200,
      backgroundColor: '#000000',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
}

export default config
