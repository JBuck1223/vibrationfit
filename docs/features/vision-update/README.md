# VIVA Vision Update

**Last Updated:** September 3, 2026
**Status:** Active

A VIVA-led flow for updating the Life Vision at `/life-vision/update`, replacing the category-by-category wizard as the primary update path (the wizard remains available as "Update Myself").

## Experience

Two panes (side by side on desktop, tabbed on mobile):

- **Left — VIVA chat**: the member talks or speaks (mic → Whisper via `VivaChatInput`) about what has changed in their life.
- **Right — the draft**: all 12 life categories plus Forward/Conclusion as editable sections, with the existing yellow "changed from active" indicators and a per-category **Edits / Draft / Active** view toggle: Draft is the editable text, Active is the read-only committed version, and Edits (only shown when the section differs from active) renders a word diff — green highlights for additions, red strikethrough for removals.

VIVA proposes full replacement text for a category and streams it into that category's editor as a highlighted proposal. The member can **accept** (saves to draft), **edit inline** before accepting, or **discard**. Nothing saves without an accept.

A persistent **Commit as Active** button runs the existing commit flow and then opens the Activation Kit confirmation (see `docs/features/activation-kit/README.md`).

## Harmony recommendations

Because the endpoint sees the whole draft, the prompt instructs VIVA to flag ripple effects after an edit ("This also wants to live in Fun and Travel — want me to update those too?") and, only after a yes, stream proposals into those categories' editors. Ripple proposals are additive and never rewrite unrelated parts of a category.

## Architecture

| Piece | Location |
|---|---|
| Page | `src/app/life-vision/update/page.tsx` |
| Streaming endpoint | `src/app/api/viva/vision-update/route.ts` |
| System prompt | `src/lib/viva/prompts/vision-update-prompts.ts` |
| Stream parser | `src/lib/life-vision/vision-update-stream.ts` |
| Entry point | `LifeVisionAreaBar` Update tab → `/life-vision/update` |

### Stream protocol

The endpoint reuses the coach stream transport (`src/lib/viva/coach-stream.ts`: padding → meta line → tokens, iOS-safe). Category proposals are framed inline in the token stream:

```
<<<VISION fun>>>
(full replacement text for the fun category)
<<<END VISION>>>
```

`parseVisionUpdateMessage()` splits a (possibly partial) assistant message into chat text and per-category proposals, hiding partially streamed markers. Assistant history keeps the raw markers so the model sees its own prior proposals.

### Thread persistence

Each session is saved with the same tables as VIVA coach: a `conversation_sessions` row (`mode: 'vision_update'`, `vision_id` = the draft id) plus `ai_conversations` messages (assistant messages keep raw proposal markers). The endpoint returns the session id in the `X-Conversation-Id` response header; the client passes it back on subsequent turns. On page load the client restores the latest session for the draft via `GET /api/viva/conversations/[id]/messages` and re-surfaces pending proposals from the last VIVA reply, skipping any whose text already matches the draft (i.e. already accepted).

### Constraints honored

- Life Vision Generation System is LOCKED: no schema changes, no changes to `commit_vision_draft_as_active` or draft semantics.
- The endpoint is read-only against the draft. Accepted proposals save through the existing `PATCH /api/vision/draft/update`; commits go through the existing commit route.
- Token usage is tracked per turn (`action_type: 'vision_refinement'`) with a balance check up front.

## Follow-on (not built)

**90-day review**: a scheduled job flags members whose active vision is 90+ days old and surfaces a nudge card linking to `/life-vision/update?mode=quarterly-review`; a review context loader seeds the session with VIVA's observations since the last commit. No tokens are spent until the member clicks through. The endpoint already accepts a `sessionSeed` string for this.
