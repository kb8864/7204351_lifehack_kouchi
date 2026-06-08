import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { TAG_COLORS } from '@/lib/constants'
import type { Category } from '@/types'

type TallyField = {
  key: string
  label: string
  type: string
  value: unknown
}

type TallyPayload = {
  eventType: string
  data: {
    fields: TallyField[]
  }
}

function normalizeTag(tag: string): string {
  return tag.trim().replace(/[\u30A1-\u30F6]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  )
}

function resolveTag(input: string, existingTags: string[]): string {
  const normalized = normalizeTag(input)
  const match = existingTags.find((t) => normalizeTag(t) === normalized)
  return match ?? input.trim()
}

function findField(fields: TallyField[], keywords: string | string[]): TallyField | undefined {
  const keys = Array.isArray(keywords) ? keywords : [keywords]
  return fields.find((f) => keys.every((k) => f.label.includes(k)))
}

function getString(field: TallyField | undefined): string {
  if (!field) return ''
  if (typeof field.value === 'string') return field.value.trim()
  return ''
}

function getTags(field: TallyField | undefined, existingTags: string[]): string[] {
  if (!field || !Array.isArray(field.value)) return []
  const tags: string[] = []
  for (const item of field.value as unknown[]) {
    if (typeof item === 'string' && item.trim()) {
      tags.push(resolveTag(item, existingTags))
    } else if (typeof item === 'object' && item !== null) {
      const obj = item as { text?: string; other?: string }
      if (obj.other) {
        // 「その他」自由入力（カンマ区切りで複数タグ可）
        obj.other.split(',').forEach((t) => {
          if (t.trim()) tags.push(resolveTag(t.trim(), existingTags))
        })
      } else if (obj.text && obj.text !== 'Other') {
        tags.push(resolveTag(obj.text, existingTags))
      }
    }
  }
  return tags
}

export async function POST(req: Request) {
  const auth = req.headers.get('Authorization')
  const expected = `Bearer ${process.env.WEBHOOK_SECRET}`
  if (!auth || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as TallyPayload

  if (body.eventType !== 'FORM_RESPONSE') {
    return NextResponse.json({ ok: true })
  }

  const fields = body.data?.fields ?? []
  const existingTags = Object.keys(TAG_COLORS)
  const author = getString(findField(fields, 'お名前')) || null

  const SECTIONS: {
    category: Category
    titleKey: string[]
    descKey: string[]
    linkKey: string[]
    tagKey: string[]
  }[] = [
    {
      category: 'food',
      titleKey: ['食事', 'タイトル'],
      descKey:  ['食事', 'ライフハック'],
      linkKey:  ['食事', 'URL'],
      tagKey:   ['食事', 'タグ'],
    },
    {
      category: 'costume_make',
      titleKey: ['衣装・メイク', 'タイトル'],
      descKey:  ['衣装・メイク', 'ライフハック'],
      linkKey:  ['衣装・メイク', 'URL'],
      tagKey:   ['衣装・メイク', 'タグ'],
    },
    {
      category: 'other',
      titleKey: ['その他', 'タイトル'],
      descKey:  ['その他', 'ライフハック'],
      linkKey:  ['その他', 'URL'],
      tagKey:   ['その他', 'タグ'],
    },
  ]

  const supabase = createServerClient()
  const results: string[] = []

  for (const { category, titleKey, descKey, linkKey, tagKey } of SECTIONS) {
    const descField  = findField(fields, descKey)
    const titleField = findField(fields, titleKey)

    // フィールド自体が存在しない = 条件分岐でこのセクションが非表示 → スキップ
    if (!descField && !titleField) continue

    const description = getString(descField)   // 空文字も許容
    const title = getString(titleField) || null // なければ null（アプリ側で本文を抜粋）
    const link = getString(findField(fields, linkKey)) || null
    const tags = getTags(findField(fields, tagKey), existingTags)

    const { error } = await supabase.from('lifehacks').insert({
      title,
      description,
      author,
      category,
      link,
      photo: null,
      tags,
      is_approved: true,
    })

    results.push(error ? `${category}: error - ${error.message}` : `${category}: ok`)
  }

  return NextResponse.json({
    ok: true,
    message: results.length === 0 ? '入力なし' : '登録しました',
    results,
  })
}
