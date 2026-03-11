export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params

    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { name, subject, htmlBody, textBody } = await request.json()

    const newTemplateId = name.toLowerCase().replace(/\s+/g, '-')

    const templateCode = generateFullTemplateFile(newTemplateId, name, subject, htmlBody, textBody)

    return NextResponse.json({
      message: 'Copy this code to create a new template file',
      templateId: newTemplateId,
      fileName: `${newTemplateId}.ts`,
      filePath: `/src/lib/email/templates/${newTemplateId}.ts`,
      code: templateCode,
    })
  } catch (error: any) {
    console.error('Error cloning template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateFullTemplateFile(
  templateId: string,
  name: string,
  subject: string,
  htmlBody: string,
  textBody: string
): string {
  const interfaceName = templateId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'EmailData'
  
  const functionName = 'generate' + interfaceName.replace('EmailData', 'Email')

  return `// /src/lib/email/templates/${templateId}.ts
// Email template: ${name}

export interface ${interfaceName} {
  // Add your data fields here
  [key: string]: any
}

export function ${functionName}(
  data: ${interfaceName}
): { subject: string; htmlBody: string; textBody: string } {
  
  const subject = \`${subject.replace(/`/g, '\\`')}\`

  const htmlBody = \`${htmlBody.replace(/`/g, '\\`')}\`

  const textBody = \`${textBody.replace(/`/g, '\\`')}\`

  return { subject, htmlBody, textBody }
}
`
}
