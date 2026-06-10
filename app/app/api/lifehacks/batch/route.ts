import { NextResponse } from 'next/server'
import { getLifehackByDisplayId } from '@/lib/data'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get('ids') ?? ''
  const ids = raw
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n))
    .slice(0, 100) // 上限100件

  if (ids.length === 0) {
    return NextResponse.json({ lifehacks: [] })
  }

  const lifehacks = (
    await Promise.all(ids.map((id) => getLifehackByDisplayId(id)))
  ).filter(Boolean)

  return NextResponse.json({ lifehacks })
}
