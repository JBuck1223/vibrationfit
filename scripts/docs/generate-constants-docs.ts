#!/usr/bin/env ts-node
/**
 * Generate System Constants Documentation
 * 
 * Documents all important constants and configuration from the actual code.
 * This ensures constants documentation is always accurate.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface VisionCategory {
  key: string
  label: string
  description: string
  order: number
  icon?: string
  color?: string
}

function parseVisionCategories(tsContent: string): VisionCategory[] {
  // Extract VISION_CATEGORIES array from the TypeScript file
  const startIdx = tsContent.indexOf('export const VISION_CATEGORIES')
  if (startIdx === -1) {
    throw new Error('Could not find VISION_CATEGORIES in file')
  }
  
  // Find the array portion - skip the type annotation by looking for '= ['
  const arrayStart = tsContent.indexOf('= [', startIdx) + 2
  
  // Find the matching closing bracket (count nesting)
  let bracketCount = 1
  let arrayEnd = arrayStart + 1
  while (bracketCount > 0 && arrayEnd < tsContent.length) {
    if (tsContent[arrayEnd] === '[') bracketCount++
    if (tsContent[arrayEnd] === ']') bracketCount--
    arrayEnd++
  }
  
  const arrayStr = tsContent.substring(arrayStart + 1, arrayEnd - 1)
  const categories: VisionCategory[] = []
  
  // Match each category object - look for key, label, description, and order fields
  // The icon field is in between but we'll ignore it
  const categoryRegex = /key:\s*['"]([^'"]+)['"],?\s*label:\s*['"]([^'"]+)['"],?\s*description:\s*['"]([^'"]+)['"],?\s*icon:[^,]+,?\s*order:\s*(\d+)/g
  let catMatch
  
  while ((catMatch = categoryRegex.exec(arrayStr)) !== null) {
    categories.push({
      key: catMatch[1],
      label: catMatch[2],
      description: catMatch[3],
      order: parseInt(catMatch[4])
    })
  }
  
  return categories
}

function extractLifeCategoryKeys(categories: VisionCategory[]): string[] {
  return categories
    .filter(c => c.order > 0 && c.order < 13)
    .map(c => c.key)
}

function extractCategoryKeys(categories: VisionCategory[]): Record<string, string> {
  const keys: Record<string, string> = {}
  for (const cat of categories) {
    keys[cat.key.toUpperCase()] = cat.key
  }
  return keys
}

function generateMarkdown(categories: VisionCategory[]): string {
  const now = new Date().toISOString()
  const lifeCategoryKeys = extractLifeCategoryKeys(categories)
  const categoryKeys = extractCategoryKeys(categories)
  
  let md = `# System Constants Reference

**Generated:** ${now}  
**Source:** Actual TypeScript constants  
**Auto-generated** - Do not edit manually. Run \`npm run docs:generate\` to update.

---

## Vision Categories

The single source of truth for all life vision categories.

**Source:** \`src/lib/design-system/vision-categories.ts\`

### All Categories (${categories.length} total)

| Key | Label | Description | Order |
|-----|-------|-------------|-------|
`
  
  for (const cat of categories) {
    md += `| \`${cat.key}\` | ${cat.label} | ${cat.description} | ${cat.order} |\n`
  }
  
  md += `\n### Life Categories Only (${lifeCategoryKeys.length} categories)\n\n`
  md += 'Categories used in the main life vision process (excludes forward/conclusion):\n\n'
  md += '```typescript\n'
  md += `LIFE_CATEGORY_KEYS = ${JSON.stringify(lifeCategoryKeys, null, 2)}\n`
  md += '```\n\n'
  
  md += '### Category Key Constants\n\n'
  md += 'Use these typed constants instead of hardcoding strings:\n\n'
  md += '```typescript\n'
  md += `CATEGORY_KEYS = ${JSON.stringify(categoryKeys, null, 2)}\n`
  md += '```\n\n'
  
  md += '### Field Name Helpers\n\n'
  md += 'Functions to generate database field names:\n\n'
  md += '```typescript\n'
  md += `getCategoryStoryField('fun')      // Returns: 'fun_story'\n`
  md += `getCategoryClarityField('fun')    // Returns: 'clarity_fun'\n`
  md += `getCategoryContrastField('fun')   // Returns: 'contrast_fun'\n`
  md += `getCategoryFields('fun')          // Returns: { clarity: 'clarity_fun', contrast: 'contrast_fun' }\n`
  md += '```\n\n'
  
  md += '### Usage Examples\n\n'
  md += '```typescript\n'
  md += `// ❌ BAD: Hardcoded\n`
  md += `const categories = ['fun', 'health', 'travel', ...]\n\n`
  md += `// ✅ GOOD: Use constant\n`
  md += `import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'\n`
  md += `const categories = LIFE_CATEGORY_KEYS\n\n`
  md += `// ❌ BAD: Hardcoded field name\n`
  md += `const field = 'clarity_fun'\n\n`
  md += `// ✅ GOOD: Use helper\n`
  md += `import { getCategoryClarityField } from '@/lib/design-system/vision-categories'\n`
  md += `const field = getCategoryClarityField('fun')\n`
  md += '```\n\n'
  
  md += '---\n\n'
  md += '## Important Notes\n\n'
  md += '- **NEVER hardcode category keys** - Always import from `vision-categories.ts`\n'
  md += '- **NEVER hardcode field names** - Always use the helper functions\n'
  md += '- If you need to add a category, update `VISION_CATEGORIES` and regenerate docs\n'
  md += '- See: `docs/technical/CATEGORY_KEY_HARDCODING_AUDIT.md` for full audit\n'
  
  return md
}

async function main() {
  try {
    console.log('🔧 Generating constants documentation...')
    
    const projectRoot = join(__dirname, '../..')
    const sourcePath = join(projectRoot, 'src/lib/design-system/vision-categories.ts')
    const outputPath = join(projectRoot, 'docs/generated/CONSTANTS.md')
    
    // Read and parse source file
    const tsContent = readFileSync(sourcePath, 'utf-8')
    const categories = parseVisionCategories(tsContent)
    console.log(`   Found ${categories.length} categories`)
    
    // Generate markdown
    const markdown = generateMarkdown(categories)
    
    // Ensure output directory exists
    const { mkdirSync } = await import('fs')
    const { dirname } = await import('path')
    mkdirSync(dirname(outputPath), { recursive: true })
    
    // Write output
    writeFileSync(outputPath, markdown)
    console.log(`✅ Constants docs generated: ${outputPath}`)
    
  } catch (error) {
    console.error('❌ Error generating constants docs:', error)
    process.exit(1)
  }
}

// Run if called directly
main()

