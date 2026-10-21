# Vibration Fit App Shell Redesign Plan

As of 2026-10-21.

## Summary

Vibration Fit moves to one cinematic shell that renders the same on iPhone, Android and web, built fresh in the existing Next.js codebase. Members get seven sections, a floating pill nav, themed imagery that follows them into every area, and no page shock when they move between Home and a studio.

**Locked decisions**

| Decision | Choice |
| --- | --- |
| Pill tabs | Home · VIVA · Listen · Capture · Tribe |
| Tools | Header grid/search icon on every screen |
| Account | Behind the avatar |
| Home strip | Vision · Manifestations · My World |
| Widget Dashboard | Retired; Home composes itself from signals, with card-level customization later |
| Base colors | Black and charcoal; green #39FF14 for the brand, purple #BF00FF for VIVA only |
| Themes | Database-driven image sets (Beach, Tropical, Mountains, Snow, Sunset), member-generated themes later |
| Prior concept work | Eliminated; nothing from /room or the reverted cinematic Home is reused |
| Copy | The word "AI" never appears; VIVA (Vibrationally Intelligent Virtual Assistant) is "Your Coach" |

## Branding, type and color

Everything the brand already defines is kept; the redesign changes surfaces, not identity.

| Element | Today | In the new shell |
| --- | --- | --- |
| Body type | Poppins 300–800 (`--font-poppins`, forced on `*`) | Unchanged. Headlines use Poppins 700/800, eyebrows Poppins 600 uppercase tracked |
| Script type | Indie Flower (`--font-display`) via `ScriptTitle` and `.hp-display` | Kept for area titles in the AreaBar and the Home greeting; nowhere else |
| Brand green | primary-500 `#39FF14`, hover `#00FF88`, deep `#00CC44` | Primary CTAs, active tab, progress, focus rings |
| VIVA purple | accent-500 `#BF00FF`, `#A855F7` hover | Only inside Coach and on VIVA entry points (input bars, VIVA cards) |
| Cyan | secondary-500 `#00FFFF` | Walkthrough-pending markers and secondary buttons, as today |
| Energy / alert | `#FFB701`, `#FF0040` | Streak flames, destructive actions |
| Buttons | `.btn` pill system in `brand.css` (50px radius, lift on hover) | Same classes; the hero CTA is `.btn-primary`, VIVA actions `.btn-accent` |
| Cards | `#1F1F1F` fill, `#333` 2px border, 16px radius | Replaced by glass: `rgba(20,20,22,.62)` fill, 1px `rgba(255,255,255,.14)` border, 24px radius, blur 20px |
| Base | Pure black | Black `#000` to charcoal `#111` gradient under the theme backdrop |
| Icons | lucide-react | Unchanged; same icons the menu already assigns |

Tokens live in the `@theme` block of `globals.css` and in `design-system/tokens.ts`; the stale `tailwind.config.ts` (which sets primary to `#199D67`) is deleted so only one green exists. New tokens: `--glass-fill`, `--glass-border`, `--glass-blur`, `--section-accent` (green by default, purple inside Coach), `--theme-backdrop`.

Text on imagery always sits on a gradient scrim (black 0% to 70%) so white Poppins stays readable over any theme photo.

## Architecture

There is one app, not three. The iPhone and Android apps are Capacitor shells in remote-URL mode (`capacitor.config.ts`), so the native WebView loads `vibrationfit.com` and renders whatever the web app renders at that width. The redesign ships once; desktop web is the only surface that needs its own navigation answer.

```
Platforms   iPhone (Capacitor WebView) | Android (Capacitor WebView) | Desktop and mobile web
                                  |
AppShell    Theme backdrop | Header | Navigation (pill / rail) | Mini player
(new, one component, behind a flag; never remounts between routes)
                                  |
Areas       AreaBar (glass variant) | SectionHero on section roots | Studio content in glass cards
(existing studios, re-skinned, same routes)
```

- `AppShell` replaces `SidebarLayout` for member pages when the `shell=next` flag is set (cookie or account flag), so you can review it from the real iOS and Android apps on production before anyone else sees it.
- `sections.ts` is one catalog (id, label, icon, accent, root, sub-tabs) that drives the pill, the rail, the header title and active-state matching. It replaces the six groups in `menu-definitions.ts`.
- `ThemeProvider` loads the member's active theme once per session and exposes `useThemeImage(slot)` plus the CSS variables the backdrop and heroes read.
- Native specifics already in `NativeShellBridge.tsx` (status bar, safe-area insets, Android back, deep links) are extended, not rewritten.
- The old `GlobalLayout` → `SidebarLayout` → `Sidebar.tsx` chain stays untouched until the flag flips for everyone.

## Navigation

Seven sections, one catalog, two renderings: a floating pill on phones and tablets, a left rail on desktop.

| Section | Accent | Root | Sub-tabs (AreaBar) |
| --- | --- | --- | --- |
| Home | green | `/home` | Vision · Manifestations · My World strip; Activity, Badges, Streaks as links |
| VIVA | purple | `/viva` | Threads sheet (phone) or rail (desktop) |
| Listen | green | `/listen` | Life Vision · Stories · Meditations · Songs · Incantations · Queries · Playlists |
| Capture | green | `/capture` | Daily Paper · Journal · Abundance |
| Tribe | green | `/tribe` | Vibe Tribe · Alignment Gym · Referrals |
| Tools | green | `/tools` | Search and Training on top; creation grid below |
| Account | green | `/account` | Billing · Settings · Appearance · Household · Tokens and Storage · Activity, Badges, Streaks |

**Pill (under 1024px, and the native apps).** Five tabs: Home, VIVA, Listen, Capture, Tribe. Glass pill, 64px tall, 16px from each side, floating `env(safe-area-inset-bottom) + 12px` above the home indicator. Active tab is the section accent with a 4px dot beneath; VIVA is the only purple tab. Haptic tick on change in the native apps. The pill hides while the keyboard is open and while a full-screen player is up.

**Header (every screen).** Left: section icon plus title, or a back chevron inside a sub-page. Right: search (opens Tools search), the Tools grid icon, and the avatar (opens Account). Scrolling collapses it to 48px with a glass background so the title never disappears.

**Rail (1024px and up).** 72px icon rail with labels on hover, 240px with labels when expanded; the same seven items in the same order, accent on the active one. Content column capped at 1200px so hero cards keep their proportions.

**Old URLs.** Every existing route keeps working. `/dashboard`, `/audio/*`, `/story`, `/meditations`, `/tracking/*` and `/your-world` redirect to their new homes; deep links and the PWA `start_url` move from `/dashboard` to `/home`.

## Areas and continuity

Page shock is prevented structurally: the backdrop, header, pill and player belong to the shell and never remount, so moving from Home into Journal changes only the content column. The studios keep their routes, their AreaBars and their tabs; they change skin, not shape.

**Seven rules every screen follows**

1. One backdrop. The theme photo is a fixed full-viewport layer under everything. It persists across navigation and only cross-fades (400ms) when the section changes, so Listen feels a touch different from Capture without ever going to flat black.
2. One chrome. Header, pill or rail, and the mini player are rendered once by `AppShell`, outside the route tree. No page draws its own header.
3. AreaBar stays, as glass. Every studio keeps its `*AreaBar.tsx` wrapper and its tabs array. `AreaBar` gets a `variant="glass"` that renders a translucent panel with the section icon, a `ScriptTitle` in Indie Flower, and pill-chip tabs in the section accent. Switching the variant is one prop in each wrapper, so all areas change on the same day.
4. Hero only at the root. A section root (`/listen`, `/capture`) opens with a `SectionHero` fed by the theme slot. Studio sub-pages (`/journal/new`, `/map/week`) open with the compact AreaBar and go straight to work. Big picture at the door, tools inside.
5. One content width and rhythm. Max 1200px column, 16px side gutters on phones, 24px tablets, 32px desktop. Cards use the same 24px radius and 16px gap everywhere. Studio pages that hard-code `#1F1F1F` cards inherit the new `Card` default without edits.
6. Same motion. Route changes slide the content column 12px with a 200ms fade; sheets rise from the bottom; nothing bounces. Native apps add a haptic tick on tab change.
7. Same copy voice. Eyebrow caps for context ("DAILY PAPER"), one verb-first CTA per hero ("Start Today's Paper"), never "AI".

**What changes inside each area**

| Area | Keeps | Changes |
| --- | --- | --- |
| Daily Paper, Journal, Abundance | Routes, AreaBar tabs, editors | Glass AreaBar; a Capture root above them; Quick Capture tiles; recent entries show the member's own images |
| MAP | Day, week, month views, builders | Glass AreaBar; linked from Home's today card; no section root of its own |
| Life Vision studio | All create and refine routes | Reached from Tools and from the Vision card on Home; its listening surface moves to Listen |
| Audio studio (`/audio`) | Player, playlists, record and mix | Split: listening tabs become Listen; create, generate, record, mix and songwriter become Tools |
| Story studio (`/story`) | Editor, generation, audio | Consume views per kind under Listen; `/story/new` under Tools |
| Meditations | Library, FocusSession, TrackStudio | Library and player under Listen; TrackStudio under Tools; player routed through the global mini player |
| Manifestations | Gallery, create, queue | Home strip card; gallery under Tools; images feed the smart image slots |
| VIVA | Chat, threads, embedded VivaChat | Purple section shell; threads as a sheet on phones |
| Vibe Tribe, Alignment Gym | Feeds, sessions, video | Tribe root with three tabs; existing full-height feed shell replaced by the glass AreaBar |
| Account, Tracking | Settings, billing, badges, streaks | Tracking hub dissolves into Account tabs; Appearance tab added for themes |

**Transition states handled**

- Returning from a studio to Home restores scroll position and does not re-fetch the hero.
- The mini player survives every navigation, including into VIVA, and docks above the pill rather than over it.
- Walkthrough overlays (`StudioWalkthroughHost`) mount inside the content column, so they never cover the pill.
- Onboarding (`/begin`) keeps its own focused shell and lands on the new Home at completion.

## Theme system

A theme is a named set of images for named slots, stored in the database, chosen by the member, and applied by the shell to every area. Where the member has real imagery of their own, it takes precedence over the theme.

**Data model**

| Table | Columns |
| --- | --- |
| `themes` | id, slug, name, kind (`system` or `custom`), owner_user_id, tint (optional rgba overlay), is_published, created_at |
| `theme_images` | id, theme_id, slot, image_url, s3_key, prompt, width, height, sort_order |
| `user_accounts.theme_id` | The member's active theme, edited from Account → Appearance (matches the flat-column settings pattern already in use) |

**Slots**

| Slot | Where it shows |
| --- | --- |
| `area.backdrop` | Fixed blurred layer behind every screen; the fallback for any empty slot |
| `home.hero`, `viva.hero`, `listen.hero`, `capture.hero`, `tribe.hero`, `tools.hero`, `account.hero` | Section root heroes |
| `studio.daily-paper`, `studio.journal`, `studio.abundance`, `studio.map`, `studio.manifestations`, `studio.life-vision`, `studio.story`, `studio.meditations`, `studio.songs` | Each studio's AreaBar banner and empty states |
| `card.1` to `card.6` | Pool for list items and sets that have no image of their own |
| `greeting.morning`, `greeting.evening` | Optional time-of-day variants of the Home hero |

Yes, studios get their own images. A theme ships one image per studio in the same world (the Beach theme's Journal is a quiet morning shoreline, its MAP a trail map on sand), so the member knows where they are by the picture before reading the title. A theme that lacks a studio image falls back to that section's hero, then to the backdrop.

A launch theme is 15 to 20 images. Five ship at launch: Beach, Tropical, Mountains, Snow and Sunset. They are generated once with the existing `imageService` (fal nano-banana), prompted for wide, empty foregrounds with no people or text so the scrim and headline always have room, and stored under `site-assets/themes/{slug}/` in two sizes.

**Image resolution** (`resolveImage(slot, ctx)`, one server function, cached; first hit wins):

1. Member's own image (manifestations, journal, song covers)
2. Active theme, this slot (`theme_images` where slot matches)
3. Theme backdrop (`area.backdrop`, always present)

**Smart slots** prefer the member's content, in this order: newest `manifestations.image_url` or `actualized_image_url` for the Manifestations card; `journal_entries.thumbnail_urls` and `daily_papers.attachment_url` for recent entries; song covers for Songs; `profile_picture_url` for the avatar. Life Vision has no cover column today, so `vision_versions.cover_image_url` is added and generated once per version from its content.

**Custom themes** reuse the manifestation queue pattern: a `themes` row of kind `custom`, one queue job per slot with a slot-specific prompt built from the member's mood words, results uploaded to `user-uploads/{userId}/themes/{themeId}/` and inserted into `theme_images`, token cost checked up front with `validateTokenBalance` and recorded with `trackTokenUsage`. A finished custom theme can be set active or, with `is_published`, offered to everyone.

**Performance.** The backdrop is `position: fixed`, so scrolling never repaints it; heroes lazy-load; images are WebP at 1200px for phones and 2400px for desktop; `backdrop-filter` is limited to the pill, header and AreaBar with a solid fallback under `@supports not (backdrop-filter)` for older Android WebViews.

## Section by section

Each section root is a composition of the same parts: a hero, a strip or chip row, two or three content blocks, and the pinned input where one belongs. Sub-pages are the existing studios behind a glass AreaBar.

**Home (`/home`).** Hero: eyebrow "YOUR WORLD TODAY", a three-line headline (Choose / Activate / Align), the member's name in Indie Flower, one green CTA that points at the most useful next action (today's MAP, an unplayed vision, an unfinished paper). Under it the Vision · Manifestations · My World strip, each card showing the member's own image where one exists. Then Continue Listening (from the global audio store), Today on MAP, and a Progress strip with the current streak and newest badge linking to Account. The widget grid is retired; card visibility becomes a preference later.

**VIVA (`/viva`).** Purple section accent. Hero with the VIVA mark, "Your Coach", one line of her promise, four suggestion cards (feel better now, get aligned with my vision, create a daily plan, play something for my state). Recent Conversations as horizontal cards, Suggested Tools row, pinned input with attach and voice. Threads open as a bottom sheet on phones and a left rail on desktop. The existing chat engine, thread API and embedded `VivaChat` are reused as they are.

**Listen (`/listen`).** Consume only. Hero "Play Your Life Vision" with the active vision; chip tabs Life Vision, Stories, Meditations, Songs, Incantations, Queries, Playlists; Life Vision Sets as cover cards with streak counts; Curated for You; Continue Listening. Everything plays through the global player, which gains a `meditation` category so FocusSession stops using its own audio path. The create tabs of `/audio` move to Tools.

**Capture (`/capture`).** Segmented control Daily Paper · Journal · Abundance; hero for today's paper with the date; Quick Capture tiles (journal entry, abundance win, voice note, photo); Recent Entries with the member's thumbnails; a pinned "Share with VIVA" input that opens a Coach thread seeded with the capture. The three studios underneath are unchanged apart from the glass AreaBar.

**Tribe (`/tribe`).** Tabs Vibe Tribe · Alignment Gym · Referrals. Hero shows the next live session or the newest pinned post. The Vibe Tribe feed, composer, notifications and the Alignment Gym hub keep their components; the full-height feed shell is replaced by the glass AreaBar so Tribe matches the other sections.

**Tools (`/tools`).** Search field and Training at the top, then a grid of creation tiles: Manifestations, VIVA, Stories, Meditations (TrackStudio), Songs (songwriter), Incantations, Queries, Life Vision builder, Audio record and mix. Search v1 filters the tools catalog and the member's recent creations client-side; Training is the existing walkthrough catalog per studio.

**Account (`/account`).** Tabs Billing · Settings · Appearance · Household · Tokens and Storage · Activity · Badges · Streaks. Appearance holds the theme picker (five system themes, then Create your own). The duplicate `/billing` route redirects to `/account/billing`; `/tracking` dissolves into these tabs; assessment, profile and voice profile move here.

**Orphans.** Travel Tracker, Homeschool, Projects and Scenes are hidden from navigation until each is re-skinned; their URLs keep working.

## Platform specifics

| Concern | iOS | Android | Desktop web |
| --- | --- | --- | --- |
| Safe areas | Pill offset by `env(safe-area-inset-bottom)`; header by the existing `--native-inset-top` | Same | None |
| Keyboard | Pill hides on `keyboardWillShow`; input bars stay docked | Same via Capacitor Keyboard events | Not applicable |
| Blur | Full glass | Glass on pill, header, AreaBar only; solid fallback where `backdrop-filter` is unsupported | Full glass |
| Hero media | Stills only (video does not paint in WKWebView) | Stills | Optional slow Ken Burns on stills |
| Back | Header chevron | Hardware back: sub-page → section root → Home → exit | Browser back |
| Haptics | Tab change tick via `@capacitor/haptics` | Same | None |
| Navigation | Pill | Pill | Left rail at 1024px and up, pill below that |
| Entry URL | Capacitor `url` and deep links to `/home` | Same | PWA `start_url` to `/home` |
| Previewing | Set the `shell=next` flag on production and open the real app | Same | Same flag on vibrationfit.com, or `CAP_SERVER_URL` for local device builds |

Paths that must open in the system browser (`/checkout`, `/billing`, `/join`, `/admin`, print views) stay on the existing `NATIVE_EXTERNAL_PATH_PREFIXES` list.

## Phasing and rollout

Five phases, each shippable on its own because the old shell stays in place until the flag flips for everyone in the last one.

| Phase | Ships | Who sees it | Gate to next |
| --- | --- | --- | --- |
| 0 Foundation | Tokens, `AppShell`, sections catalog, theme tables, seed script, flag | Flag only | tsc clean, flag works on a device |
| 1 Home + VIVA | Cinematic Home, concept strip, smart cards, Coach shell | You | Your sign-off |
| 2 Listen + Tools | Consume/create split, glass AreaBar in every studio, player category | You | No-page-shock review |
| 3 Rest + themes | Capture, Tribe, Account, Appearance picker, redirects, orphans rehomed | Beta cohort | Beta feedback clear |
| 4 Launch | Custom themes, flag on for all, old sidebar removed, store builds | Everyone | — |

The flag is a cookie (`shell=next`) or an account flag, read in `GlobalLayout`. With it set, the member sees the new shell on production from the real iOS and Android apps; without it, nothing changes. Each phase ends with a device check on an iPhone and an Android phone, plus desktop web, before the next begins.

## Open questions

- [ ] Time-of-day variants: should the Home hero shift between morning and evening images of the same theme, or stay fixed?
- [ ] Household accounts: does a shared household get one theme or one per member?
- [ ] Custom theme pricing: a flat token cost per theme or per image?
- [ ] Onboarding: should new members pick a theme during `/begin`, or receive Sunset by default and discover Appearance later?
- [ ] Desktop rail: labels always visible, or icon-only with hover labels?
