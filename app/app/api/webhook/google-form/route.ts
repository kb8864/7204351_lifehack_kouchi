import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { CATEGORY_SLUGS, TAG_COLORS } from '@/lib/constants'
import type { Category } from '@/types'

// カタカナ → ひらがな に変換（タグ名の表記ゆれを吸収）
function normalizeTag(tag: string): string {
  return tag.trim().replace(/[\u30A1-\u30F6]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  )
}

// 入力タグを既存タグ（TAG_COLORS）と照合し、一致すれば既存タグ名を返す
function resolveTag(input: string, existingTags: string[]): string {
  const normalized = normalizeTag(input)
  const match = existingTags.find((t) => normalizeTag(t) === normalized)
  return match ?? input.trim()
}

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

  // タグの処理: カンマ区切り文字列 → 正規化済み配列
  const existingTags = Object.keys(TAG_COLORS)
  const tagsArray = tags
    ? String(tags)
        .split(',')
        .map((t: string) => resolveTag(t, existingTags))
        .filter(Boolean)
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
    is_approved: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 登録されたカテゴリページとホームを即時再生成
  revalidatePath('/')
  revalidatePath(`/${category}`)

  return NextResponse.json({ success: true, message: '登録しました' })
}
