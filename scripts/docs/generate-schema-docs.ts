#!/usr/bin/env ts-node
/**
 * Generate Database Schema Documentation
 * 
 * Reads the actual schema dump and generates human-readable markdown.
 * This ensures docs are ALWAYS accurate to the actual database.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface Table {
  name: string
  columns: Column[]
  comment?: string
}

interface Column {
  name: string
  type: string
  nullable: boolean
  default?: string
  comment?: string
}

function parseSchemaSQL(sql: string): Table[] {
  const tables: Table[] = []
  
  // Match CREATE TABLE statements
  const tableRegex = /CREATE TABLE[^"]*"([^"]+)"[^"]*"([^"]+)"\s*\(([\s\S]*?)\);/g
  let match
  
  while ((match = tableRegex.exec(sql)) !== null) {
    const [, schema, tableName, columnsStr] = match
    
    if (schema !== 'public') continue // Skip non-public tables
    
    const columns: Column[] = []
    
    // Parse columns
    const columnLines = columnsStr.split('\n').filter(line => line.trim() && !line.trim().startsWith('CONSTRAINT'))
    
    for (const line of columnLines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith(')')) continue
      
      // Match column definition: "column_name" type [NOT NULL] [DEFAULT value]
      const colMatch = trimmed.match(/"([^"]+)"\s+([^\s,]+)(?:\s+DEFAULT\s+([^,]+))?(?:\s+NOT NULL)?/)
      if (colMatch) {
        const [, colName, colType, colDefault] = colMatch
        columns.push({
          name: colName,
          type: colType,
          nullable: !trimmed.includes('NOT NULL'),
          default: colDefault?.trim()
        })
      }
    }
    
    tables.push({ name: tableName, columns })
  }
  
  // Match COMMENT ON statements
  const commentRegex = /COMMENT ON (?:TABLE|COLUMN) "public"\."([^"]+)"(?:\."([^"]+)")? IS '([^']+)'/g
  
  while ((match = commentRegex.exec(sql)) !== null) {
    const [, tableName, columnName, comment] = match
    
    const table = tables.find(t => t.name === tableName)
    if (!table) continue
    
    if (columnName) {
      const column = table.columns.find(c => c.name === columnName)
      if (column) column.comment = comment
    } else {
      table.comment = comment
    }
  }
  
  return tables.sort((a, b) => a.name.localeCompare(b.name))
}

function generateMarkdown(tables: Table[]): string {
  const now = new Date().toISOString()
  
  let md = `# Database Schema Reference

**Generated:** ${now}  
**Source:** \`supabase/COMPLETE_SCHEMA_DUMP.sql\`  
**Auto-generated** - Do not edit manually. Run \`npm run docs:generate\` to update.

---

## Overview

Total tables: ${tables.length}

## Tables

`
  
  // Table of contents
  for (const table of tables) {
    md += `- [${table.name}](#${table.name.toLowerCase().replace(/_/g, '-')})\n`
  }
  
  md += '\n---\n\n'
  
  // Detailed table documentation
  for (const table of tables) {
    md += `## ${table.name}\n\n`
    
    if (table.comment) {
      md += `${table.comment}\n\n`
    }
    
    md += `**Columns:** ${table.columns.length}\n\n`
    md += '| Column | Type | Nullable | Default | Description |\n'
    md += '|--------|------|----------|---------|-------------|\n'
    
    for (const col of table.columns) {
      const nullable = col.nullable ? '✓' : ''
      const defaultVal = col.default || ''
      const comment = col.comment || ''
      
      md += `| \`${col.name}\` | ${col.type} | ${nullable} | ${defaultVal} | ${comment} |\n`
    }
    
    md += '\n'
  }
  
  return md
}

async function main() {
  try {
    console.log('📚 Generating schema documentation...')
    
    const projectRoot = join(__dirname, '../..')
    const schemaPath = join(projectRoot, 'supabase/COMPLETE_SCHEMA_DUMP.sql')
    const outputPath = join(projectRoot, 'docs/generated/SCHEMA.md')
    
    // Read schema SQL
    const schemaSql = readFileSync(schemaPath, 'utf-8')
    
    // Parse tables
    const tables = parseSchemaSQL(schemaSql)
    console.log(`   Found ${tables.length} tables`)
    
    // Generate markdown
    const markdown = generateMarkdown(tables)
    
    // Ensure output directory exists
    const { mkdirSync } = await import('fs')
    const { dirname } = await import('path')
    mkdirSync(dirname(outputPath), { recursive: true })
    
    // Write output
    writeFileSync(outputPath, markdown)
    console.log(`✅ Schema docs generated: ${outputPath}`)
    
  } catch (error) {
    console.error('❌ Error generating schema docs:', error)
    process.exit(1)
  }
}

// Run if called directly
main()

