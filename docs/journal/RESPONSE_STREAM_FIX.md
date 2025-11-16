# Journal Upload Response Stream Fix

**Date:** November 16, 2024

## Issue

Users were encountering the following error when uploading files to journal entries:

```
Some uploads failed: Failed to execute 'text' on 'Response': body stream already read
```

This error occurred during file uploads, particularly when the upload API returned an error response.

## Root Cause

The bug was in the error handling code in both storage utility files:
- `src/lib/storage/s3-storage-presigned.ts`
- `src/lib/storage/s3-storage.ts`

When an upload failed, the code attempted to read the Response body twice:

```typescript
if (!response.ok) {
  try {
    const errorData = await response.json()  // First read
    errorMessage = errorData.error || errorMessage
  } catch {
    const responseText = await response.text()  // Second read - ERROR!
    errorMessage = responseText || errorMessage
  }
}
```

The problem:
1. First, it tried to parse the response as JSON with `await response.json()`
2. If that failed, it tried to read the response as text with `await response.text()`
3. **But the Response body stream was already consumed** by the first `.json()` call!

Response bodies can only be read once. Once consumed, any attempt to read again throws:
```
Failed to execute 'text' on 'Response': body stream already read
```

## Solution

Changed the error handling to read the response as text first, then attempt to parse it as JSON:

```typescript
if (!response.ok) {
  // Read response as text first, then try to parse as JSON
  let errorMessage = `Upload failed with status ${response.status}`
  try {
    const responseText = await response.text()  // Read once as text
    if (responseText) {
      try {
        const errorData = JSON.parse(responseText)  // Then parse JSON
        errorMessage = errorData.error || responseText
      } catch {
        // Not JSON, use raw text
        errorMessage = responseText
      }
    }
  } catch {
    // Couldn't read response
  }
  throw new Error(errorMessage)
}
```

This approach:
1. ✅ Reads the Response body only once (as text)
2. ✅ Attempts to parse the text as JSON if possible
3. ✅ Falls back to raw text if JSON parsing fails
4. ✅ Handles all error cases gracefully

## Files Modified

1. **`src/lib/storage/s3-storage-presigned.ts`**
   - Fixed `uploadViaApiRoute()` function (line 229-247)

2. **`src/lib/storage/s3-storage.ts`**
   - Fixed `uploadLargeFile()` function (line 57-75)
   - Fixed `uploadUserFile()` function (line 127-145)
   - Fixed `deleteUserFile()` function (line 221-239)

## Impact

This fix resolves:
- ✅ Journal entry upload failures
- ✅ Vision board image upload errors
- ✅ Audio recording upload issues
- ✅ Any other file uploads that encounter API errors

## Testing

To verify the fix works:
1. Try uploading files to a journal entry
2. If any uploads fail (network issues, file validation, etc.), the error message should now be properly displayed
3. No more "body stream already read" errors

## Technical Notes

**Key Lesson:** Response bodies in the Fetch API can only be read once. The stream is consumed after the first read operation (`.text()`, `.json()`, `.blob()`, etc.).

**Best Practice:** When you need to handle both JSON and non-JSON responses:
1. Read the body as text first (`await response.text()`)
2. Then attempt to parse as JSON using `JSON.parse()`
3. This gives you one read operation and flexibility in parsing

**Alternative Approach:** You could also use `response.clone()` to create a copy of the response before reading, but that's less efficient since it duplicates the body data.

