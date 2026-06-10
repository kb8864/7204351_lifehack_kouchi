import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { CATEGORY_SLUGS, TAG_COLORS } from '@/lib/constants'
import type { Category } from '@/types'

// カタカナ → ひらがな に変換（タグ名の表記ゆれを吸収）
function normalizeTag(tag: string): string {
  return tag.trim().replace(/[ァ-ヶ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  )
}

// 入力タグを既存タグ（TAG_COLORS）と照合し、一致すれば既存タグ名を返す
function resolveTag(input: string, existingTags: string[]): string {
  const normalized = normalizeTag(input)
  const match = existingTags.find((t) => normalizeTag(t) === normalized)
  return match ?? input.trim()
}

// タグを配列・文字列どちらでも受け取り、正規化済み重複排除配列に変換
function parseTags(raw: unknown, existingTags: string[]): string[] {
  if (!raw) return []
  const items: string[] = Array.isArray(raw)
    ? (raw as unknown[]).map((t) => String(t))
    : String(raw).split(/[,、]/)
  const resolved = items
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => resolveTag(t, existingTags))
  // 重複排除
  return [...new Set(resolved)]
}

// URL正規化: 不正なURLはnullにする
function normalizeLink(raw: unknown): string | null {
  if (!raw) return null
  const s = String(raw).trim()
  if (!s) return null
  // すでに http:// or https:// で始まる
  if (/^https?:\/\//i.test(s)) return s
  // www. やドメイン形式（スペースなし、ドット含む）
  if (/^(www\.|[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)/i.test(s) && !/\s/.test(s)) {
    return `https://${s}`
  }
  // URLらしくない文字列（スペース含む日本語文など）はnull
  return null
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

  // タグの処理: 配列または文字列(カンマ・読点区切り) → 正規化済み重複排除配列
  const existingTags = Object.keys(TAG_COLORS)
  const tagsArray = parseTags(tags, existingTags)

  // フィールドの正規化
  const normalizedTitle = title ? String(title).trim() || null : null
  const normalizedAuthor = author ? String(author).trim() || null : null
  const normalizedDescription = String(description).trim()
  const normalizedLink = normalizeLink(link)

  const supabase = createServerClient()
  const { error } = await supabase.from('lifehacks').insert({
    title: normalizedTitle,
    description: normalizedDescription,
    author: normalizedAuthor,
    category,
    link: normalizedLink,
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
