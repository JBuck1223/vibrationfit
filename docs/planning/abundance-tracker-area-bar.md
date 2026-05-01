# Abundance Tracker — Area bar IA (updated)

**Last Updated:** April 29, 2026  
**Status:** Planning

## Top bar: three modes

| Mode        | Role | Route (proposed) |
|-------------|------|-------------------|
| **Track**   | Dashboard “at a glance”: filters, totals, recent entries / grid — same as today’s [`/abundance-tracker`](../../src/app/abundance-tracker/page.tsx). | `/abundance-tracker` |
| **Insights**| Reports / analytics view. | `/abundance-tracker/reports` |
| **Goals**   | Period goals and goal UI. | `/abundance-tracker/goals` |

### Drill-in routes (stay under **Track**)

- **`/abundance-tracker/[id]`** and **`/abundance-tracker/[id]/edit`** — detail and edit from the list. Primary tab **Track** stays active; optional secondary row hidden or minimized on detail if cleaner.

### Log flow (**`/abundance-tracker/new`**)

Not named on the top bar. Options when implementing:

1. **Primary action** on the AreaBar (e.g. “Abundance entry”) → `/new` — clearest.
2. **Secondary tab under Track:** e.g. **List | New entry** — only if you want logging one tap without a floating button.

Pick one during build; default recommendation: **primary action** to avoid a fourth navigation tier.

### Copy / `contextText` (optional)

- **Track:** e.g. “Your abundance at a glance…”
- **Insights:** short line matching reports purpose.
- **Goals:** align with existing goals page subtitle.

### Implementation todos (when executing)

1. Add client `AbundanceAreaBar` with tabs **Track | Insights | Goals** and paths above.
2. Extend [`layout.tsx`](../../src/app/abundance-tracker/layout.tsx); remove overlapping [`PageHero`](../../src/app/abundance-tracker/page.tsx) blocks where replaced by the bar.
3. Wire active states for `[id]` / `edit` under Track; wire **`/new`** via CTA or secondary Track tab per decision above.
