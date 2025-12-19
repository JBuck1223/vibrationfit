// API to update email template
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
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

    const { subject, htmlBody, textBody } = await request.json()

    // NOTE: File-based templates require manual file editing
    // This API would need file system write permissions to work
    // For now, show instructions to copy/paste the code

    return NextResponse.json({
      error: 'Template saving is not yet implemented',
      message: 'Please copy the generated code and manually update the template file',
      code: generateTemplateCode(templateId, subject, htmlBody, textBody),
    }, { status: 501 })
  } catch (error: any) {
    console.error('❌ Error updating template:', error)
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




