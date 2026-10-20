# Mobile Layout Fix Plan

**Last Updated:** 2026-10-20
**Status:** Phases 1–3 and most of Phase 4 implemented; needs device testing (see Remaining)

Audit of horizontal overflow ("page loses its left/right boundary"), safe areas, and native-shell issues at ~375px, ahead of the iOS/Android launch. The Capacitor app loads `https://vibrationfit.com` remotely (`capacitor.config.ts`), so every web fix below ships to the app on deploy — no store update needed.

Pixel estimates assume 375px viewport → ~343px content (`px-4`), ~309px inside a `Card p-4`, ~291px inside a `Modal` body (`p-6`).

---

## Why the page slides sideways

1. **The app shell scrolls on both axes.** `src/components/SidebarClient.tsx:44` — every member and admin page scrolls inside `<main className="min-w-0 flex-1 overflow-auto">`. `overflow-auto` allows horizontal scroll, and the `overflow-x: hidden` on html/body (`globals.css:10-21`) never reaches this inner scroller. Any child wider than the screen turns the whole page into a side-scroller.
2. **`Button` never wraps.** `src/lib/design-system/components/forms/Button.tsx:99` puts `whitespace-nowrap` on every button, so each button is at least as wide as its label. Two or three labelled buttons in a `flex gap-*` row easily exceed 343px. Almost every concrete offender below comes from this.

Fix #1 is the safety net (stops the sideways scroll everywhere); fix #2 and the per-page fixes stop content from being clipped instead.

---

## Phase 1 — App-wide safety net (not locked, ~1 hour)

| # | File | Change |
|---|------|--------|
| 1.1 | `src/components/SidebarClient.tsx:44` | `overflow-auto` → `overflow-y-auto overflow-x-clip` |
| 1.2 | `src/components/SidebarClient.tsx:38` | `h-screen` → `h-dvh` |
| 1.3 | `src/components/GlobalLayout.tsx:298-300` (Vibe Tribe shell) | add `min-w-0 overflow-x-clip` to `main` |
| 1.4 | `src/components/GlobalLayout.tsx:320-322` (intensive, document scroll) | add `overflow-x-clip` to the `min-w-0 md:ml-[280px]` wrapper |
| 1.5 | `src/app/globals.css:10-21` | html/body `overflow-x: hidden` → `overflow-x: clip` (doesn't create a scroll container, keeps `sticky` working) |

Side note: `GlobalLayout.tsx:191` `window.scrollTo(0,0)` does nothing on member pages because `main` is the scroller. It should scroll `main` instead.

## Phase 2 — Design system (🔒 LOCKED — needs your permission)

Highest leverage: each of these fixes dozens of call sites.

| # | Component | Change |
|---|-----------|--------|
| 2.1 | `forms/Button.tsx:99` | Wrap on mobile: `whitespace-normal text-center sm:whitespace-nowrap max-w-full`. Make `sm` smaller on mobile (today `sm` = `md` = `px-4 py-3`). Optional `fullWidthOnMobile` prop → `w-full sm:w-auto`. |
| 2.2 | `forms/SaveButton.tsx:51`, `cards/PracticeCard.tsx:281` | Same nowrap treatment as Button. |
| 2.3 | `forms/VIVAButton.tsx:17-20` | Responsive padding: `px-4 md:px-7`, `px-5 md:px-10`. |
| 2.4 | `overlays/Modal.tsx` | `max-h-[calc(100dvh-2rem)]`; header/body/footer `p-4 sm:p-6`; footer `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end`; `min-w-0 break-words` on the title; bottom safe-area padding. |
| 2.5 | Delete / Warning / InsufficientTokens / InsufficientStorage dialogs | Button row `flex flex-col-reverse gap-3 sm:flex-row`; `p-4 sm:p-6`. |
| 2.6 | `utils/Toggle.tsx`, `utils/HouseholdScopeToggle.tsx` | Wrapper `max-w-full overflow-x-auto`; smaller mobile padding; truncate member names. |
| 2.7 | `layout/Grid.tsx:104-106` | `repeat(N, minmax(0,1fr))` and `minmax(min(280px,100%),1fr)`. |
| 2.8 | `typography/PageHero.tsx:44-48` | Title row `flex-wrap`, action `max-w-full` (only `begin/intake` uses `action` today). |
| 2.9 | `navigation/AreaBar.tsx` | `:796` compact tab label `min-w-0 truncate`; `:815/:844` right actions `min-w-0`; `:430` sheet `pb-[max(2rem,env(safe-area-inset-bottom))]`. |
| 2.10 | `forms/Select.tsx:128-133` | Flip upward and clamp near the bottom of the screen (copy the DatePicker approach). |

**Re-check after 2.4:** `src/components/alignment-gym/RequestCoachingForm.tsx:182` uses `max-md:-mx-6` to match the Modal's `p-6`. Change it to `-mx-4`.

## Phase 3 — Page offenders (not locked)

Confirmed button rows wider than the screen at 375px, ranked by how visible they are. The usual fix is `flex flex-col sm:flex-row gap-3` (buttons `w-full sm:w-auto`) or `flex flex-wrap`.

| # | Location | Problem |
|---|----------|---------|
| 3.1 | `src/components/dashboard/DashboardHome.tsx:187` | Customize mode: Reset to default + Add widgets + Done ≈ 415px. **The dashboard side-scrolls whenever Customize is on.** |
| 3.2 | `src/app/referral/page.tsx:424,428` | Message editor footer: counter + Cancel + Reset to Default + Save ≈ 380px |
| 3.3 | `src/app/journal/[id]/page.tsx:634`, `abundance-tracker/[id]/page.tsx:283`, `story/[storyId]/page.tsx:696` | Add to manifestation + Delete + Edit row ≈ 430px |
| 3.4 | `src/app/life-vision/new/[category]/page.tsx:1390` | "Refine {Category} with VIVA" + Save & Continue (main builder CTA) |
| 3.5 | `life-vision/new/[category]/page.tsx:1622,1641`, `intensive/life-vision/create/[category]/page.tsx:1417,1436`, `story/update/page.tsx:843,852` | Back to Editing + Apply Selected Edits / Continue to Save |
| 3.6 | `src/components/VersionActionToolbar.tsx:111` | Delete Draft + Commit as Active (~344px), used on Life Vision and Profile version pages. Add `flex-wrap`. |
| 3.7 | `src/app/life-vision/update/page.tsx:1411,1518` | Button rows inside a Modal (~291px available) |
| 3.8 | `src/app/life-vision/[id]/refine/page.tsx:232,1418`, `[id]/draft/page.tsx:513`, `[id]/page.tsx:887` | Two-button rows, 300–336px |
| 3.9 | `src/app/manifestations/queue/[batchId]/page.tsx:583`, `manifestations/ideas/page.tsx:679` | Two- and three-button rows (390–500px) |
| 3.10 | `src/app/manifestations/page.tsx:3283` | Fixed bulk-select bar centred, ~365px wide |
| 3.11 | `src/app/journal/[id]/page.tsx:413` | Nested button row inside PageHero children doesn't wrap |
| 3.12 | `src/app/snapshot/[id]/page.tsx:418` | Title + `shrink-0` group (Generate with VIVA + Edit) |
| 3.13 | `src/components/dashboard/widgets/ReferralsWidget.tsx:91-104` | `shrink-0` headline clips the "1/3" count |
| 3.14 | `src/app/life-vision/household/page.tsx:212` | `p-12` Card is too narrow for its button → `p-6 md:p-12` |
| 3.15 | `src/app/tools/scenes/page.tsx:446` | Three-button row → `flex-wrap` |
| 3.16 | `src/app/assessment/in-progress/page.tsx:932` | Legacy prev/next row. Copy the `[id]/in-progress` pattern. |
| 3.17 | `src/app/travel-tracker/page.tsx:165` | `Container px-6` on top of the page padding → `px-0 sm:px-6` |

**Long text that doesn't break.** Add `break-all` / `min-w-0` at:
- `src/components/account-studio/AccountHouseholdSettings.tsx:338`
- `src/app/account/settings/password/page.tsx:89`
- `src/app/household/invite/[token]/page.tsx:251-252`
- `src/app/referral/referrals/page.tsx:38`
- `src/app/account/settings/delete/page.tsx:139`

**Popovers wider than the screen:**
- `src/components/vibe-tribe/UserMiniProfile.tsx:60` (`min-w-[280px]`): use `w-[min(280px,calc(100vw-2rem))]`.
- `src/components/vibe-tribe/EmojiPickerButton.tsx:9,90` (352px): use `max-w-[calc(100vw-1rem)]`.

**VIVA chat:**
- `src/components/viva/VivaMarkdown.tsx`: root `min-w-0 break-words`; `table` wrapped in `overflow-x-auto`; `pre` gets `overflow-x-auto max-w-full`; links get `break-all`. Model output with tables, code or long URLs currently pushes the chat sideways.
- `VivaChatMessage.tsx:15` user bubble: add `break-words [overflow-wrap:anywhere]`.
- `VivaChat.tsx` (legacy): `:43` bubble `break-words`; `:264` input needs a bottom safe-area inset.

## Phase 4 — Native shell (iOS/Android launch)

| # | Issue | Fix |
|---|-------|-----|
| 4.1 | **The top safe area is applied 2–3× in the native app.** `globals.css:52` body `padding-top` + `globals.css:67` `.sticky.top-0 { top: inset }` + AreaBar's inline `paddingTop: env(safe-area-inset-top)` (`AreaBar.tsx:738`). Combined with `h-dvh` shells this also adds an extra page scroll ("double scroll") and misaligns the menu button with the AreaBar title. | Pick one model. Recommended: remove the body padding and let each fixed/sticky top element own its inset. Test the menu button, AreaBar, Header, and VibeNotificationBell together. |
| 4.2 | Toasts sit under the status bar (`layout.tsx:118`, `offset="16px"`) | Sonner `mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}` |
| 4.3 | Mobile drawer (`Sidebar.tsx:626`) has no top inset; contents sit under the notch | `pt-[env(safe-area-inset-top)]` |
| 4.4 | `PlayerSpacer` (`GlobalLayout.tsx:43`, `h-20`) leaves out the bottom inset; the last content sits under the mini player | `h-[calc(5rem+env(safe-area-inset-bottom))]` |
| 4.5 | `AudioStudioPlayer.tsx:42` uses an undefined `safe-area-bottom` class | Replace with a real inset class |
| 4.6 | `IntensiveMobileNav.tsx:142` has no bottom inset | Add one |
| 4.7 | Keyboard: `capacitor.config.ts` `Keyboard.resize: 'body'`, but the shells size with `dvh`. Inputs near the bottom (Modals, AreaBar version sheet) can end up behind the keyboard. Only VivaShell adapts. | Try `resize: 'native'` and retest modals and sheets with inputs |
| 4.8 | Modal (`Modal.tsx:34`) and the AreaBar sheet (`AreaBar.tsx:412`) lock `body` scroll, but the real scroller is `main`, so the page behind them still scrolls | Lock the `main` scroller (or both) |
| 4.9 | `Info.plist:79-82` allows iPhone landscape; content goes under the notch, with no left/right insets | Lock iPhone to portrait (simplest), or add `padding-inline: env(safe-area-inset-left/right)` |
| 4.10 | `allowsLinkPreview` not set, so long-press link previews appear in the app | `ios.allowsLinkPreview: false` |
| 4.11 | Android targetSdk 36 forces edge-to-edge, so `StatusBar.setBackgroundColor` has no effect and `env()` insets are unreliable on older WebViews | Test on a real Android device early; consider `--safe-area-inset-*` fallbacks |
| 4.12 | Header logo (`Header.tsx:88-96`, `width={363}` with no class) is tight beside the Dashboard and Logout buttons | `h-8 w-auto max-w-[60vw] shrink` |

## Cleanup (optional)

- Unused components: `MobileBottomNav` in the design system and in `Sidebar.tsx:687`, `AudioPlayer.tsx`, `IntensiveWelcomeScreen.tsx`, `IntensiveCompletionScreen.tsx`. Delete them, or fix them before re-enabling.
- `p-10`/`p-12` base padding at `auth/verify`, `auth/setup-password`, `auth/impersonate-verify`, and `DashboardHome.tsx:262`: change to `p-6 md:p-*`.

## Already solid (no action)

- Viewport meta (`device-width`, `viewport-fit=cover`, zoom not locked).
- 16px input rule, so iOS doesn't zoom when a field is focused.
- Container / Section / PageLayout / Card / Stack / Inline.
- PageTitles, DatePicker / TimePicker, toast width, PersistentMiniPlayer.
- Most of AreaBar.
- VivaChatInput and the `/viva` composer.
- All 5 member tables (wrapped in `overflow-x-auto`).
- Referral share-link rows.
- `NativeShellBridge` `data-native-shell` hook.

## Implementation notes (2026-10-20)

- **Native safe-area model (4.1):** the body padding stays. Added `--native-inset-top` (`globals.css`: 0 on the web, the status-bar inset in the native shell). Shell heights (`.h-screen`, `.h-dvh`, `.min-h-screen`, VivaShell) subtract it in native. AreaBar's title-row padding subtracts it, so it is 0 in native. Sticky `.top-0` inside `[data-app-scroller]` (the shell `<main>`) pins at 0.
- **Modal footer:** not given a built-in layout, because callers pass their own footer rows and a forced flex layout would change desktop. Button wrapping covers it.
- **AreaBar title-row actions:** left as is. No current overflow was found.
- **Modal and AreaBar sheet:** both now lock the shell `<main>` scroll as well as the body.
- **`capacitor.config.ts`:** `allowsLinkPreview: false` needs `npm run mobile:sync` and a native rebuild.

## Remaining

- 4.7 Keyboard resize mode (`body` vs `native`): decide while testing on a device.
- 4.9 iPhone landscape: lock to portrait, or add left/right insets. This is a product call.
- 4.11 Android edge-to-edge insets: test on a real device.
- Device pass for 4.1: menu button and AreaBar alignment, no double scroll, toasts below the clock.
- `GlobalLayout.tsx:191` scroll-to-top on navigation targets `window`, not the shell `<main>`.

## Suggested order

1. Phase 1 (one PR, ships immediately and stops the sideways scroll app-wide).
2. Phase 2.1–2.5 (with permission), then recheck the Phase 3 list. Many rows will be fixed by the Button change alone.
3. Remaining Phase 3 items: start with Dashboard, Referral, the "Add to manifestation" rows, and the Life Vision builder.
4. Phase 4 on a real iPhone and Android device before submitting to the stores. 4.1 is the most important item there.
