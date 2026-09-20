# Script Studio

Admin → Script Studio (`/admin/scripts`) stores scripts independently of Life Vision. A script has immutable numbered versions. Paste initial text, edit a working draft, then save the next version. Compare any pair of versions or any version against the working draft. To branch from an older version, select it as the comparison target and choose **Use this version as working draft**. Unsaved drafts live in the page; save before navigating away.

VIVA proposes a complete revision using the configured `prompt_suggestions` model and existing token accounting. Review the diff, optionally edit the proposal, accept into the draft, then save. No proposal overwrites a saved version.

## Personal conversations

The portable skill lives at `skills/vibrationfit-script-import/SKILL.md`. Install that folder into the personal Codex environment's skills folder to use it there. It includes the push helper. Personal ChatGPT without a configured action can produce the same JSON package for manual paste into **Import versions**.

For a direct connection, configure a random secret of at least 32 characters as `SCRIPT_STUDIO_IMPORT_TOKEN` in both the deployed VibrationFit server and the personal helper environment. Set `VIBRATIONFIT_URL` in the helper environment to the intended VibrationFit origin. Keep the secret out of chat and source control. Rotate it in both environments to revoke an old connection. This token only creates scripts and appends versions through `POST /api/script-studio/import`; it cannot read the library, edit old versions, or access other database tables.

The admin session route `POST /api/admin/scripts` accepts the same package without a connection token. Use a UUID `request_id`, `title`, and an ordered `versions` array containing `content` and optional `label`. Include `script_id` to append. Reusing an identical request is idempotent; reusing its ID with different content returns 409. Batch insertion and version numbering happen in one database transaction with a per-script lock.

## Storage and access

Migration: `supabase/migrations/20260919122810_script_studio.sql`. Three new tables: `admin_scripts`, `admin_script_versions`, `admin_script_imports`. RLS is enabled with no client grants or policies; only the service role can access them. Admin routes use the existing verifyAdminAccess helper (database role with the project's existing email fallback) before creating a service client. The external route checks the dedicated import credential. Existing tables and Life Vision policies are unchanged.

Deployment requires shipping the application code and applying the migration. Direct personal pushes also require the connection secret to be configured. Manual admin imports require no new secret.

## Verification

TypeScript passed. Database transaction checks passed for version ordering, identical retry deduplication, conflicting-request rejection, all-or-nothing imports, and client privilege restrictions. The bundled helper test passed against a temporary local HTTP server. Supabase reports the expected [RLS enabled without policies notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) for these server-only tables: the absence of client policies is intentional, and client grants are revoked. No live VIVA request or browser verification was run.

## Groups and sections

Create groups such as Activation Experience, Onboarding, or a course in the library panel. Each group holds multiple video scripts. Use **Script group** to assign or move a script, and the library group filter to browse it. New scripts inherit the selected group. Group assignment is saved immediately for existing scripts.

Every version now stores an ordered section snapshot with stable IDs, titles, text, and lock state. Existing plain-text versions migrate to one **Full script** section without changing text. Add named sections manually, or use **Split at blank lines** to segment pasted content. The first resulting section keeps its identity; later parts receive new IDs. Rename them once and retain those IDs in subsequent imports.

Select a section to edit it. **Lock section** freezes its title and text and blocks removal, splitting, and VIVA editing. Save a version to persist lock changes. Explicitly unlock it before making further edits. VIVA receives the whole script for context but only proposes replacement text for the selected unlocked section. Accepting it changes that section alone.

Comparison pairs sections by ID, including renamed, added, removed, and locked/unlocked sections. Choose a matching section to focus the diff. Restoring historical text preserves currently locked sections. Saved version history remains immutable.

The database checks locks against the latest version in the same transaction that saves the new version. Admin edits supply explicit unlock IDs; personal-token imports cannot unlock sections. `base_version_id` prevents a stale editor from appending changes based on an outdated version. New imports may include `group_id`; structured versions provide a `sections` array instead of `content`. The legacy plain-text format remains supported, but cannot replace or omit locked sections.

Migration: `supabase/migrations/20260919125254_script_groups_and_sections.sql`. Adds server-only `admin_script_groups`, `admin_scripts.group_id`, version section snapshots, and a transactional section-aware import function. Existing client permissions stay unchanged.

Section/group verification passed: TypeScript; three focused schema/restoration tests; and rollback-only database checks for group assignment, retry deduplication, lock preservation, locked text/title/deletion rejection, explicit unlock, stale-version rejection, legacy-import lock enforcement, atomic batch rollback, and client privilege restrictions. The section/group migration has been applied. Application deployment is still separate; browser and live VIVA generation were not tested.

## Moving and ordering scripts

The library displays scripts grouped by experience/course. Every row has a destination group selector and up/down controls. Group changes append the script at the end of the destination group; moves to **Ungrouped** work the same way. Orders persist in the database, and new scripts append automatically. Reordering changes neither saved versions nor the open working draft. Stale requests referencing a former group are rejected. The editor's group selector uses the same move operation.

Migration `20260919132133_script_library_ordering.sql` was applied. TypeScript and rollback-only database tests passed for up/down movement, boundary behavior, appending to another group, stale-group rejection, ungrouping, and client access restrictions. Browser verification was not performed; application deployment remains pending.

## Seeded conversation

Source: [Life Vision Script Rewrite](https://chatgpt.com/c/6aad7aa0-b9bc-83e9-b544-77f53dd5bf55), retrieved September 19, 2026. Seeded into **Activation Experience** in playback order:

| Script | Saved versions | Script ID |
| --- | --- | --- |
| Before You Create Your Life Vision | 5 | f3894001-07d6-4e1d-9c12-bf2452ddcabe |
| Now Imagine Your Whole Life | 8 | 9f3d5871-7ca6-40ed-adfb-1514f873d209 |

Includes the original introduction and complete Business/personal rewrite alternatives in chronological order. Version labels identify their origin. Draft text, punctuation, Markdown, and any embedded historical citations are preserved. Matching section IDs were added as metadata; concatenating section text reproduces each extracted draft exactly. All sections start unlocked. The final invitation is the comprehensive/congruent revision with the membership line preserved.

Excluded surrounding critique, suggested button labels outside scripts, and standalone partial suggestions rather than inventing full versions from them. The full retrieved conversation and seed package remain in local `tmp/script-studio-*` files. The one-off extraction helper is archived under `scripts/archive/database/prepare-script-thread-seed.py`. Seeding was transactional, idempotent by source-specific request IDs, and verified against every section snapshot and assembled script text.

## Studio editing layout

Group and Script selection now use the shared AreaBar context-row dropdowns, matching Life Vision's document selectors. The main workspace follows Life Vision Update: VIVA on the left and an independently scrolling section draft on the right. Mobile has VIVA/Draft pane toggles. Each section expands independently, with Expand all/Collapse all, a lock action, and Draft/Edits/Saved views against the chosen baseline version. VIVA proposals appear inside the target section for review, editing, acceptance, or discard. The composer uses the shared VIVA chat components and supports text/voice; script attachments are not supported.

Create, move, and reorder scripts through the collapsible **Manage library** panel. Import and New script remain in the compact workspace toolbar. Save version and baseline selection live at the top of the draft pane. Full saved-version comparison and restoration remain available below the sections. This change adds optional selectors/helper text to Admin's studio chrome without modifying Life Vision. TypeScript passed; visual verification is left to local review.

Lock controls show current state: closed lock + **Locked**, open lock + **Unlocked**. The tooltip describes the next click, and VIVA labels a locked selection as locked rather than working on it. Section headers include up/down controls, available even when collapsed. Reordering preserves section IDs, text, lock state, and any proposal attached to the selected section. Locks protect wording; they do not prevent rearranging sections. Save a version to persist the new order and any lock changes.

**Full preview** is an editable spoken-script view: section text in order, titles omitted from copy. Each section stays its own field so locks and IDs are preserved; locked sections remain read-only. Hover or focus a block to see its section name. **Copy script** copies the concatenated spoken text. Choosing a section for VIVA from the section editor returns to that view.
