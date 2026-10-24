# App Shell Glass Recipes

**Last Updated:** 2026-10-24
**Status:** Current

The member app is violet frosted glass over a per-section photo backdrop (`ThemeBackdrop`). Every new surface in the shell uses one of these shared recipes so the app reads as one thing on bright pictures (Watercolor) and in the Light theme.

## Constants (`src/lib/app-shell/glass.ts`)

| Constant | Use |
|---|---|
| `GLASS_CARD` | Cards on the backdrop (Home tiles, posts). |
| `PILL_BASE` + `PILL_ON` / `PILL_OFF` | Every tab row and filter pill. Inactive pills are solid violet glass, never a faint white tint. |
| `PILL_WELL` | The well a segmented toggle sits in (Listen / Create). |
| `GLASS_MENU` | Floating dropdown menus. |
| `GLASS_SHEET` | Dialog and sheet panels. |
| `SCRIM` | The dimmed layer behind a dialog (`bg-black/60 backdrop-blur-sm`). |

`.glass-panel` / `.glass-chrome` (`globals.css`) resolve to the same violet gradient through `--glass-fill`, and to frosted white in the Light theme.

## Overlays

Cards and glass panels use `backdrop-filter`, which makes them the containing block for `position: fixed` children. An overlay rendered inside a card is clipped to the card. Every dialog, sheet and lightbox renders through `OverlayPortal` (`src/lib/design-system/components/overlays/OverlayPortal.tsx`); the shared `Modal`, `ImageLightbox` and confirmation dialogs already do.

Media viewers (`ImageLightbox`, `ProfilePictureLightbox`) have no dark backdrop: the picture sits over the page as wide as the viewport allows with a little padding, controls are glass pills, and the root carries `data-shell-mode-skip` so the Light theme leaves the white controls alone.

## Loading

`RouteLoading` (route transitions) paints the theme picture blurred under a glass disc. `PageLoading` (`src/components/app-shell/ShellPageSkeleton.tsx`) is the in-page version. Never return a `min-h-screen bg-black` spinner.

## Shell-wide remaps (`src/components/app-shell/studioGlass.ts`, `lightMode.ts`)

In dark themes `SHELL_DARK_CSS` lifts `text-neutral-400/500/600` to white, turns `hover:bg-neutral-800/900` into a soft white lift, maps dark `input`/`textarea` fields to glass fields and floating `bg-neutral-800/900` menus to solid glass. `LIGHT_MODE_CSS` flips the same classes to ink on frosted white. Writing new UI with the constants above is still preferred over relying on the remaps.
