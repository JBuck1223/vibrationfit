---
name: vibrationfit-script-import
description: Send script versions from a personal Codex conversation into VibrationFit Script Studio, or prepare a JSON package for manual import from ChatGPT.
---

# Send scripts to VibrationFit

Use when the author asks to push one or more script variations into their admin Script Studio.

Preserve the full text of each chosen version exactly, in chronological order. Do not include surrounding conversation or invent missing versions. If the source conversation is not available, ask for the text or the specific accessible task. Use short labels to describe each revision.

Create a UTF-8 JSON file with this shape:

```json
{
  "request_id": "a fresh UUID for this batch",
  "title": "Welcome video",
  "versions": [
    { "label": "Original", "content": "Full first script" },
    { "label": "Warmer opening", "content": "Full second script" }
  ]
}
```

To append versions to an existing script, include its exact `script_id` from Script Studio. Omit it to create a new script. Never guess an ID from a title. Limits: 50 versions per batch, 100,000 characters per version, 200 characters per title or label.

The connection uses `VIBRATIONFIT_URL` and `SCRIPT_STUDIO_IMPORT_TOKEN` from the environment. The import token is an append-only credential, not a database service-role key. Do not print credentials, put them in the package, or request them in conversation.

Run the bundled helper:

```sh
node <skill-directory>/scripts/push.mjs <package.json>
```

On a network error, retry only with the same package and request_id. After two failures, retain the file and report the error. A successful response includes a script_id and admin link; return the link. Imports save versions for review; they do not publish the script anywhere.

Without a configured connection (including ChatGPT without an action), provide the JSON package for **Admin → Script Studio → Import versions**. Do not claim the package has been pushed.

## Groups and matching sections

Use an existing `group_id` when creating a video script inside an experience or course group. Copy the ID from Script Studio; do not invent it. Each video is its own script within the group. To move an existing script between groups, use Script Studio's group selector.

A version can provide `sections` instead of `content`:

```json
{
  "label": "Clearer invitation",
  "sections": [
    { "id": "opening", "title": "Opening", "content": "Approved opening", "locked": true },
    { "id": "invitation", "title": "Invitation", "content": "Revised invitation", "locked": false }
  ]
}
```

Keep each section's ID stable across all versions, even if its title changes. For an existing script, use its actual section IDs, not newly invented replacements. Send the full ordered section snapshot with each version, including unchanged sections. Up to 100 sections per script, with a combined 100,000-character text limit. Preserve locked sections exactly (ID, title, text, and lock). Personal imports cannot unlock sections; the author must explicitly unlock and save in Script Studio first. If available, include `base_version_id` to reject an import based on an outdated version. On a locked-section or stale-version conflict, stop and obtain the current script rather than bypassing the check.
