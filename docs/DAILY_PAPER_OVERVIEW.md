# Daily Paper Tool Overview

Last updated: 2025-11-10  
Status: ✅ Implemented

## Feature Summary

The Daily Paper flow captures a member’s daily alignment ritual with gratitude, top three action steps, and a joyful promise. Entries can be recorded digitally with voice-powered transcription or uploaded as handwritten PDFs/images that are saved to the member archive.

## Database

Table: `public.daily_papers`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, defaults to `gen_random_uuid()` |
| `user_id` | `uuid` | References `auth.users.id`, cascades on delete |
| `entry_date` | `date` | Unique per user (`user_id`, `entry_date`) |
| `gratitude` | `text` | Required gratitude narrative |
| `task_one` / `task_two` / `task_three` | `text` | Top three aligned actions |
| `fun_plan` | `text` | “Something fun I will do today” |
| `attachment_url` / `attachment_key` | `text` | Optional uploaded PDF/image metadata |
| `attachment_content_type` | `text` | MIME type for the uploaded file |
| `attachment_size` | `bigint` | File size in bytes |
| `metadata` | `jsonb` | Free-form metadata (original filename, etc.) |
| `created_at` / `updated_at` | `timestamptz` | Managed automatically (`set_updated_at()` trigger) |

Row-level security is enabled; policy *“Users can manage their daily papers”* restricts access to the entry owner.

## API

Route: `src/app/api/journal/daily-paper/route.ts`

- `GET /api/journal/daily-paper?limit=30&date=YYYY-MM-DD`  
  Returns the authenticated user’s entries (optional `date` filter and `limit`).

- `POST /api/journal/daily-paper`  
  Upserts (per user+date) a Daily Paper entry. Payload shape:

  ```json
  {
    "entryDate": "2025-11-10",
    "gratitude": "text...",
    "tasks": ["task one", "task two", "task three"],
    "funPlan": "Celebrate at sunset",
    "attachment": {
      "url": "https://cdn...",
      "key": "journal/...",
      "contentType": "application/pdf",
      "size": 24576
    },
    "metadata": {
      "source": "daily-paper:new",
      "attachmentOriginalName": "daily-paper.pdf"
    }
  }
  ```

The endpoint validates the payload (Zod schema), normalizes strings, and assigns defaults for optional fields.

## Frontend

### Pages

| Route | File | Notes |
| --- | --- | --- |
| `/journal/daily-paper` | `src/app/journal/daily-paper/page.tsx` | Archive view with streak metrics, gratitude previews, task lists, fun highlight, and attachment CTA. |
| `/journal/daily-paper/new` | `src/app/journal/daily-paper/new/page.tsx` | Voice-enabled form using `RecordingTextarea` + `RecordingInput`, optional attachment upload, POSTs via `useDailyPaperMutation`. |
| `/journal/daily-paper/resources` | `src/app/journal/daily-paper/resources/page.tsx` | Narrative explanation + direct download links for printable PDFs. |

### Hooks & Components

- `useDailyPaperEntries(options)` — Fetch + refresh helper for archive pages.
- `useDailyPaperMutation()` — POST helper returning the saved entry.
- `RecordingInput` — New single-line transcription input built on top of the design system input styling.

## File Uploads

Handwritten PDFs/images upload through `uploadUserFile('journal', file, user.id)` for automatic compression and S3 storage. Upload progress uses the shared `UploadProgress` component.

## Follow-up Ideas

- Add edit/delete support for Daily Paper entries.
- Extend reporting to show alignment streak history and celebratory badges.
- Surface AI insights based on gratitude language over time.






