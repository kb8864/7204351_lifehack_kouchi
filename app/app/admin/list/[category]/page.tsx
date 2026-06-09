import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getAdminSession } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'
import { CATEGORIES, CATEGORY_SLUGS } from '@/lib/constants'
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
  const { data } = await supabase
    .from('lifehacks')
    .select('*')
    .eq('category', category)
    .eq('is_deleted', false)
    .order('id', { ascending: true })

  const lifehacks = (data as Lifehack[]) ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-[#8E8E93] hover:text-[#E85A2C]">← 管理画面</Link>
      </div>
      <div className={`${info.bgColor} ${info.borderColor} border-2 rounded-2xl p-4`}>
        <div className="text-3xl">{info.icon}</div>
        <h1 className={`text-xl font-bold ${info.color} mt-1`}>{info.label} の管理</h1>
        <p className="text-sm text-[#8E8E93]">{lifehacks.length}件</p>
      </div>

      <div className="space-y-3">
        {lifehacks.map((lh) => (
          <AdminLifehackRow key={lh.id} lifehack={lh} />
        ))}
      </div>
    </div>
  )
}
