/**
 * 既存JSONをSupabaseにインポートするシードスクリプト
 * 実行方法: npx tsx scripts/seed.ts
 * 事前に .env.local を設定してください
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

type RawLifehack = {
  id: number
  title?: string
  description: string
  author?: string
  link?: string
  photo?: string
  tags: string | string[] | string[][]
}

const categoryFiles: { file: string; category: string }[] = [
  { file: '../../public/food.json', category: 'food' },
  { file: '../../public/health.json', category: 'health' },
  { file: '../../public/costume_make.json', category: 'costume_make' },
  { file: '../../public/other.json', category: 'other' },
]

function normalizeTags(tags: RawLifehack['tags']): string[] {
  if (!tags) return []
  // ネストした配列（health.json id:4 のケース）を平坦化
  const flat = Array.isArray(tags) ? tags.flat(2) : [tags]
  return flat.filter((t): t is string => typeof t === 'string')
}

async function seed() {
  console.log('シードを開始します...')

  for (const { file, category } of categoryFiles) {
    const filePath = path.resolve(__dirname, file)
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RawLifehack[]

    const rows = raw.map((item) => ({
      title: item.title || null,
      description: item.description,
      author: item.author || null,
      link: item.link || null,
      photo: item.photo || null,
      category,
      tags: normalizeTags(item.tags),
      is_approved: true,
    }))

    const { error } = await supabase.from('lifehacks').insert(rows)

    if (error) {
      console.error(`[${category}] エラー:`, error.message)
    } else {
      console.log(`[${category}] ${rows.length}件インポート完了`)
    }
  }

  console.log('シード完了！')
}

seed().catch(console.error)
