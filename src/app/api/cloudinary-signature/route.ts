import { createHash } from 'crypto'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { public_id } = await req.json()

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
