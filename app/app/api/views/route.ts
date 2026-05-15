import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const { lifehack_id } = await req.json()
  if (!lifehack_id) return NextResponse.json({ error: 'lifehack_id required' }, { status: 400 })

  const supabase = createServerClient()
  await supabase.from('views').insert({ lifehack_id })
  return NextResponse.json({ success: true })
}
