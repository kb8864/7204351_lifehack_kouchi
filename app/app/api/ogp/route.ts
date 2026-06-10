import { NextResponse } from 'next/server'
import { fetchOgpImage as fetchOGPImage } from '@/lib/ogp'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ imageUrl: null })
  }

  const imageUrl = await fetchOGPImage(url)
  return NextResponse.json({ imageUrl })
}
