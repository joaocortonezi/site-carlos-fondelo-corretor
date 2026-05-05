import { createHash }   from 'crypto'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-guard'

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { public_id } = await req.json()
  if (typeof public_id !== 'string' || !/^[a-zA-Z0-9_/-]{1,200}$/.test(public_id)) {
    return NextResponse.json({ error: 'public_id inválido.' }, { status: 400 })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const params: Record<string, string | number> = { public_id, timestamp }

  const toSign =
    Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&') + process.env.CLOUDINARY_API_SECRET!

  const signature = createHash('sha1').update(toSign).digest('hex')

  return NextResponse.json({
    signature,
    timestamp,
    api_key:    process.env.CLOUDINARY_API_KEY!,
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  })
}
