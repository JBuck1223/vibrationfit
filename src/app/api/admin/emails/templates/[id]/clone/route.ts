// API to clone email template
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, subject, htmlBody, textBody } = await request.json()

    // Generate new template ID from name
    const newTemplateId = name.toLowerCase().replace(/\s+/g, '-')

    // Generate full template file code
    const templateCode = generateFullTemplateFile(newTemplateId, name, subject, htmlBody, textBody)

    return NextResponse.json({
      message: 'Copy this code to create a new template file',
      templateId: newTemplateId,
      fileName: `${newTemplateId}.ts`,
      filePath: `/src/lib/email/templates/${newTemplateId}.ts`,
      code: templateCode,
    })
  } catch (error: any) {
    console.error('❌ Error cloning template:', error)
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
  // Generate TypeScript interface name
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




