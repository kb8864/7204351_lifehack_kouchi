import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { CATEGORY_SLUGS } from '@/lib/constants'
import type { Category } from '@/types'

/**
 * Google Apps ScriptからのWebhookを受け取るエンドポイント
 *
 * リクエスト例:
 * POST /api/webhook/google-form
 * Authorization: Bearer <WEBHOOK_SECRET>
 * {
 *   "title": "任意のタイトル",
 *   "description": "本文（必須）",
 *   "author": "投稿者名",
 *   "category": "food",
 *   "link": "https://...",
 *   "photo": "https://...",
 *   "tags": "熱中症対策,ご飯"
 * }
 */
export async function POST(req: Request) {
  // シークレット認証
  const auth = req.headers.get('Authorization')
  const expected = `Bearer ${process.env.WEBHOOK_SECRET}`
  if (!auth || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, author, category, link, photo, tags } = body

  if (!description || !category) {
    return NextResponse.json(
      { error: 'description and category are required' },
      { status: 400 }
    )
  }

  if (!CATEGORY_SLUGS.includes(category as Category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  // tagsの処理: "熱中症対策,ご飯" → ["熱中症対策", "ご飯"]
  const tagsArray = tags
    ? String(tags).split(',').map((t: string) => t.trim()).filter(Boolean)
    : []

  const supabase = createServerClient()
  const { error } = await supabase.from('lifehacks').insert({
    title: title || null,
    description,
    author: author || null,
    category,
    link: link || null,
    photo: photo || null,
    tags: tagsArray,
    is_approved: false, // 管理者が承認するまで非公開
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: '承認待ちとして登録しました' })
}
