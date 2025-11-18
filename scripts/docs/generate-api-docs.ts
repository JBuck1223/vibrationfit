#!/usr/bin/env ts-node
/**
 * Generate API Endpoint Documentation
 * 
 * Scans all API route files and generates documentation.
 * Extracts JSDoc comments and HTTP methods.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface APIEndpoint {
  path: string
  methods: string[]
  description?: string
  params?: string[]
  returns?: string
  file: string
}

function findRouteFiles(dir: string, baseDir: string): string[] {
  const files: string[] = []
  
  const items = readdirSync(dir)
  
  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)
    
    if (stat.isDirectory()) {
      files.push(...findRouteFiles(fullPath, baseDir))
    } else if (item === 'route.ts' || item === 'route.js') {
      files.push(relative(baseDir, fullPath))
    }
  }
  
  return files
}

function extractAPIInfo(filePath: string, content: string): APIEndpoint | null {
  // Convert file path to API path
  // src/app/api/viva/chat/route.ts -> /api/viva/chat
  const apiPath = filePath
    .replace(/^src\/app/, '')
    .replace(/\/route\.(ts|js)$/, '')
  
  // Extract HTTP methods (GET, POST, PUT, DELETE, PATCH)
  const methods: string[] = []
  const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g
  let match
  
  while ((match = methodRegex.exec(content)) !== null) {
    methods.push(match[1])
  }
  
  if (methods.length === 0) return null
  
  // Extract JSDoc comment if exists
  const jsdocRegex = /\/\*\*\s*([\s\S]*?)\*\//
  const jsdocMatch = content.match(jsdocRegex)
  
  let description: string | undefined
  let params: string[] | undefined
  let returns: string | undefined
  
  if (jsdocMatch) {
    const jsdoc = jsdocMatch[1]
    
    // Extract description (first line)
    const descMatch = jsdoc.match(/^\s*\*\s*(.+)/m)
    if (descMatch) {
      description = descMatch[1].trim()
    }
    
    // Extract @param tags
    const paramMatches = jsdoc.matchAll(/@param\s+\{([^}]+)\}\s+(\w+)\s*-\s*(.+)/g)
    params = []
    for (const pm of paramMatches) {
      params.push(`\`${pm[2]}\` (${pm[1]}) - ${pm[3].trim()}`)
    }
    
    // Extract @returns tag
    const returnsMatch = jsdoc.match(/@returns\s+\{([^}]+)\}\s*(.+)/)
    if (returnsMatch) {
      returns = `${returnsMatch[1]} - ${returnsMatch[2].trim()}`
    }
  }
  
  return {
    path: apiPath,
    methods,
    description,
    params,
    returns,
    file: filePath
  }
}

function generateMarkdown(endpoints: APIEndpoint[]): string {
  const now = new Date().toISOString()
  
  let md = `# API Endpoints Reference

**Generated:** ${now}  
**Source:** \`src/app/api/\`  
**Auto-generated** - Do not edit manually. Run \`npm run docs:generate\` to update.

---

## Overview

Total endpoints: ${endpoints.length}

## Endpoints by Category

`
  
  // Group by category (first segment after /api/)
  const byCategory = new Map<string, APIEndpoint[]>()
  
  for (const endpoint of endpoints) {
    const category = endpoint.path.split('/')[2] || 'root'
    if (!byCategory.has(category)) {
      byCategory.set(category, [])
    }
    byCategory.get(category)!.push(endpoint)
  }
  
  // Table of contents
  for (const [category, eps] of Array.from(byCategory.entries()).sort()) {
    md += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`
    for (const ep of eps) {
      md += `- [\`${ep.path}\`](#${ep.path.toLowerCase().replace(/\//g, '').replace(/_/g, '-')})\n`
    }
    md += '\n'
  }
  
  md += '---\n\n'
  
  // Detailed endpoint documentation
  for (const [category, eps] of Array.from(byCategory.entries()).sort()) {
    md += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`
    
    for (const ep of eps) {
      md += `### \`${ep.path}\`\n\n`
      
      if (ep.description) {
        md += `${ep.description}\n\n`
      }
      
      md += `**Methods:** ${ep.methods.map(m => `\`${m}\``).join(', ')}\n\n`
      
      if (ep.params && ep.params.length > 0) {
        md += '**Parameters:**\n\n'
        for (const param of ep.params) {
          md += `- ${param}\n`
        }
        md += '\n'
      }
      
      if (ep.returns) {
        md += `**Returns:** ${ep.returns}\n\n`
      }
      
      md += `**File:** \`${ep.file}\`\n\n`
      md += '---\n\n'
    }
  }
  
  return md
}

async function main() {
  try {
    console.log('📡 Generating API documentation...')
    
    const projectRoot = join(__dirname, '../..')
    const apiDir = join(projectRoot, 'src/app/api')
    const outputPath = join(projectRoot, 'docs/generated/API_ENDPOINTS.md')
    
    // Find all route files
    const routeFiles = findRouteFiles(apiDir, projectRoot)
    console.log(`   Found ${routeFiles.length} route files`)
    
    // Extract API info from each file
    const endpoints: APIEndpoint[] = []
    
    for (const file of routeFiles) {
      const fullPath = join(projectRoot, file)
      const content = readFileSync(fullPath, 'utf-8')
      const info = extractAPIInfo(file, content)
      
      if (info) {
        endpoints.push(info)
      }
    }
    
    console.log(`   Documented ${endpoints.length} endpoints`)
    
    // Generate markdown
    const markdown = generateMarkdown(endpoints)
    
    // Ensure output directory exists
    const { mkdirSync } = await import('fs')
    const { dirname } = await import('path')
    mkdirSync(dirname(outputPath), { recursive: true })
    
    // Write output
    writeFileSync(outputPath, markdown)
    console.log(`✅ API docs generated: ${outputPath}`)
    
  } catch (error) {
    console.error('❌ Error generating API docs:', error)
    process.exit(1)
  }
}

// Run if called directly
main()

