import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getAdminSession } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'
import { CATEGORIES, CATEGORY_SLUGS } from '@/lib/constants'
import { getLifehacksByCategory, getHiddenJsonIds, SUPABASE_ID_OFFSET } from '@/lib/data'
import type { Category, Lifehack } from '@/types'
import AdminLifehackRow from './AdminLifehackRow'

interface Props {
  params: Promise<{ category: string }>
}

export default async function AdminListPage({ params }: Props) {
  const { category: categorySlug } = await params
  const isAdmin = await getAdminSession()
  if (!isAdmin) redirect('/admin/login')
  if (!CATEGORY_SLUGS.includes(categorySlug as Category)) notFound()

  const category = categorySlug as Category
  const info = CATEGORIES[category]

  const supabase = createServerClient()
  const [hiddenIds, { data: supabaseData }] = await Promise.all([
    getHiddenJsonIds(),
    supabase
      .from('lifehacks')
      .select('*')
      .eq('category', category)
      .eq('is_deleted', false)
      .order('id', { ascending: true }),
  ])

  // JSONライフハック（非表示IDを除外）
  const jsonLifehacks = getLifehacksByCategory(category).filter(
    (lh) => !hiddenIds.has(lh.id)
  )

  // Supabaseライフハック（オフセットID付与）
  const supabaseLifehacks: Lifehack[] = (supabaseData ?? []).map((row) => ({
    id: row.id + SUPABASE_ID_OFFSET,
    title: row.title,
    description: row.description,
    author: row.author,
    link: row.link,
    photo: row.photo,
    category: row.category,
    tags: row.tags ?? [],
    is_approved: row.is_approved,
    created_at: row.created_at,
  }))

  const lifehacks = [...jsonLifehacks, ...supabaseLifehacks]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-[#8E8E93] hover:text-[#E85A2C]">← 管理画面</Link>
      </div>
      <div className={`${info.bgColor} ${info.borderColor} border-2 rounded-2xl p-4`}>
        <div className="text-3xl">{info.icon}</div>
        <h1 className={`text-xl font-bold ${info.color} mt-1`}>{info.label} の管理</h1>
        <p className="text-sm text-[#8E8E93]">{lifehacks.length}件（JSON: {jsonLifehacks.length} / フォーム投稿: {supabaseLifehacks.length}）</p>
      </div>

      <div className="space-y-3">
        {lifehacks.map((lh) => (
          <AdminLifehackRow
            key={lh.id}
            lifehack={lh}
            canEdit={lh.id > SUPABASE_ID_OFFSET}
          />
        ))}
      </div>
    </div>
  )
}
