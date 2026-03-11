export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params

    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { subject, htmlBody, textBody } = await request.json()

    return NextResponse.json({
      error: 'Template saving is not yet implemented',
      message: 'Please copy the generated code and manually update the template file',
      code: generateTemplateCode(templateId, subject, htmlBody, textBody),
    }, { status: 501 })
  } catch (error: any) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateTemplateCode(
  templateId: string,
  subject: string,
  htmlBody: string,
  textBody: string
): string {
  return `// Generated template code for ${templateId}

const subject = \`${subject}\`

const htmlBody = \`${htmlBody.replace(/`/g, '\\`')}\`

const textBody = \`${textBody.replace(/`/g, '\\`')}\`

return { subject, htmlBody, textBody }
`
}
