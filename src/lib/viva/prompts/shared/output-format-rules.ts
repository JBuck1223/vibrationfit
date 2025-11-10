/**
 * Output Format Rules
 * 
 * Standard instructions for how VIVA should format responses
 * (JSON, plain text, markdown, etc.)
 */

export const JSON_OUTPUT_RULES = `
OUTPUT:
- Return valid JSON per the schema (no extra commentary).
- Return strict JSON only - no backticks, no code fences, no explanations.
- Do not explain your reasoning unless explicitly requested.
`

export const PLAIN_TEXT_OUTPUT_RULES = `
OUTPUT:
- Return only the requested text, no explanation or commentary.
- No markdown formatting, no code fences, no backticks.
- Natural, flowing prose only.
`

export const MARKDOWN_OUTPUT_RULES = `
OUTPUT:
- Return well-formatted markdown.
- Use proper headings (##, ###) for sections.
- Use paragraphs for flowing text.
- No code fences around the entire output.
`

/**
 * Standard JSON schema instructions
 */
export function jsonSchemaInstruction(schema: string): string {
  return `Return strict JSON in this exact schema:
${schema}

${JSON_OUTPUT_RULES}`
}

