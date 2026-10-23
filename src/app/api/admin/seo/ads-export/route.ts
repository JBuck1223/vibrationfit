import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { buildGoogleAdsExport, EXPORT_FILES, type ExportFile } from '@/lib/seo/google-ads-export'

export const dynamic = 'force-dynamic'

// Google Ads Editor CSV download, generated live from the SEO page registry.
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const file = new URL(request.url).searchParams.get('file') as ExportFile | null
  if (!file || !EXPORT_FILES.includes(file)) {
    return NextResponse.json({ error: `file must be one of ${EXPORT_FILES.join(', ')}` }, { status: 400 })
  }
  const { files } = buildGoogleAdsExport()
  return new NextResponse(files[file], {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="vibrationfit-google-ads-${file}.csv"`,
    },
  })
}
