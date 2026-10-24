# Mobile Store Release (iOS App Store + Google Play)

**Last Updated:** 2026-10-23
**Status:** Active

The native apps are a Capacitor remote-URL shell (`capacitor.config.ts`, native projects in `mobile/ios` and `mobile/android`, app id `com.vibrationfit.app`). The WebView loads `https://vibrationfit.com/dashboard` live, so most releases need no store submission. Submit a new build when the native shell itself changes (plugins, icons, permissions, version bump).

## What the shell deliberately does not do (App Review 3.1.1)

Purchasing and sign-up never happen inside the app. Memberships are bought on the web.

- `NATIVE_EXTERNAL_PATH_PREFIXES` in `src/lib/mobile/native-shell.ts` lists paths (`/join`, `/checkout`, `/billing`, `/premium-application`, `/free-activation`, `/intensive`, `/admin`, ...) that never render in the shell. `NativeShellBridge` opens them in the system browser as a safety net.
- Member-facing calls to action that point at those paths do not render in the shell. Use `useIsNativeShell()` from `src/hooks/useNativeShell.ts` for React conditionals, or the `hide-in-native` class (defined in `globals.css` on `html[data-native-shell]`) for static anchors. Current examples: the Billing item in the header account menu, the referral banner, the paid membership offer in `ActivationDelivery`, the Intensive links on the sessions page and graduate checklist, the login page's Get Started link, and the home page buy boxes.
- When adding a new upgrade prompt, pricing link or sign-up button anywhere a member can reach, hide it the same way.

Known gap for a later pass: `/account/billing` (plan changes, annual upgrade, add card) still renders inside the shell because it is not under an external prefix. Review may ask about it; the safest fix is to add `/account/billing` to the external prefixes and hide its entry points.

## Review notes (both stores)

Paste into App Store Connect "App Review Information" and the Play Console "App access" section:

- A demo member account (email + password) that already has a membership and some content (a vision, a journal entry, audio). Keep this account alive; reviewers reuse it across versions.
- State plainly: "Membership is purchased on our website. The app is for existing members only and contains no in-app purchase or sign-up."
- Mention that microphone and camera are for recording audio, Vibe Tribe video sessions and journal media.

## Versioning

Bump before every submission:

- iOS: `MARKETING_VERSION` (user-facing, e.g. 1.0.1) and `CURRENT_PROJECT_VERSION` (build number, must increase every upload) in `mobile/ios/App/App.xcodeproj/project.pbxproj`, or in Xcode under App target > General.
- Android: `versionName` and `versionCode` (must increase every upload) in `mobile/android/app/build.gradle`.

Run `npm run mobile:sync` after any web change that affects the native shell before building.

## iOS: archive and upload

Prerequisites: Xcode with the iOS platform installed, signed in to the Apple Developer team (team id is already set in the project), and an App Store Connect record for `com.vibrationfit.app`.

1. `npm run mobile:ios` (opens `mobile/ios/App/App.xcworkspace` in Xcode).
2. Select the `App` scheme and destination "Any iOS Device (arm64)".
3. Product > Archive. Signing is automatic with the team already in the project.
4. In the Organizer window, Distribute App > App Store Connect > Upload. Accept the defaults (upload symbols, manage version and build number if you prefer Xcode to do it).
5. In App Store Connect, attach the build to the version, fill in screenshots (6.9" and 6.5" iPhone sets), the privacy nutrition labels (they must match `PrivacyInfo.xcprivacy`: email, name, audio, photos/videos, other user content, product interaction, all linked to the user, none used for tracking), the demo account, and submit.

TestFlight: the same upload appears in TestFlight automatically. Internal testers (up to 100 team members) need no review; external testers need a short beta review.

### iOS decisions for v1 (reversible)

- **iPhone only.** `TARGETED_DEVICE_FAMILY = 1` in both Debug and Release, and the `UISupportedInterfaceOrientations~ipad` key is gone from `Info.plist`. To add iPad later, set `TARGETED_DEVICE_FAMILY = "1,2"`, add the ipad orientations key back, and supply 13" iPad screenshots. Adding iPad to a shipped app is allowed; removing it later is not, which is why v1 starts iPhone-only.
- **`armv7` removed from `UIRequiredDeviceCapabilities`.** It was obsolete (no 32-bit devices run a supported iOS). Nothing else needs to change.
- **Privacy manifest.** `mobile/ios/App/App/PrivacyInfo.xcprivacy` is in the App target's Resources phase. It declares no tracking, the collected data types above, and the required-reason APIs Capacitor plugins use (UserDefaults `CA92.1`, file timestamp `C617.1`). If you add a plugin that touches system boot time, disk space or active keyboards, add the matching category and reason code.

## Android: signed AAB

### One-time: create the upload keystore

Do not commit the keystore. Run this from the repo root:

```bash
keytool -genkeypair -v -keystore mobile/android/upload-keystore.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

It prompts for a store password, the key password (use the same one unless you have a reason not to), and the distinguished name fields (your name, organisation, locality, country). Write the passwords down in the team password manager; losing them means a new app listing, since Play does not accept a different upload key without a reset request.

Then:

```bash
cp mobile/android/keystore.properties.example mobile/android/keystore.properties
```

and fill in `storePassword`, `keyAlias` (`upload`) and `keyPassword`. `storeFile` is relative to `mobile/android/`, so `upload-keystore.jks` is correct if you used the command above.

Both `mobile/android/keystore.properties` and `*.jks` are gitignored. Back the `.jks` up somewhere outside the repo (password manager attachment or an encrypted drive).

`mobile/android/app/build.gradle` picks the signing config up only when `keystore.properties` exists, so debug builds and CI without the file keep working.

### Build

```bash
cd mobile/android && ./gradlew bundleRelease
```

Output: `mobile/android/app/build/outputs/bundle/release/app-release.aab`. Confirm it is signed:

```bash
keytool -printcert -jarfile mobile/android/app/build/outputs/bundle/release/app-release.aab
```

If it reports "not signed", `keystore.properties` was not found or has a wrong path.

### Play Console

1. Create the app (package `com.vibrationfit.app`) and opt in to Play App Signing. Google keeps the app signing key; the keystore above is only the upload key.
2. Fill in the store listing, the Data safety form (collects email, name, audio, photos/videos, other user content, app interactions; all linked to the user; no sharing for advertising; encrypted in transit; users can request deletion), the content rating questionnaire, and App access (the demo member account and the "membership purchased on the web" note).
3. Upload the AAB to an Internal testing track first, then promote to Production.

### Personal developer accounts: 12 testers for 14 days

Personal Google Play developer accounts created after November 2023 cannot publish to Production until the app has run a Closed testing track with at least 12 testers opted in continuously for 14 days. After that window, apply for production access in the Play Console. Plan the two weeks into the launch timeline, and keep the testers opted in for the whole period. Organisation accounts (verified with a D-U-N-S number) skip this rule.

## Before every submission

- `npm run mobile:sync`
- Bump the version and build numbers on both platforms.
- Smoke test on a real device: login, dashboard, record audio, open a journal entry, start a Vibe Tribe session, background audio keeps playing.
- Check that no purchase, pricing or sign-up control appears anywhere in the app while logged in and logged out.
