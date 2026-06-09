import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminSession } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'
import { getLifehackById, SUPABASE_ID_OFFSET } from '@/lib/data'
import type { Lifehack } from '@/types'
import RestoreButton from './RestoreButton'

export default async function DeletedPage() {
  const isAdmin = await getAdminSession()
  if (!isAdmin) redirect('/admin/login')

  const supabase = createServerClient()
  const [{ data: supabaseDeleted }, { data: hiddenJsonData }] = await Promise.all([
    supabase
      .from('lifehacks')
      .select('*')
      .eq('is_deleted', true)
      .order('id', { ascending: false }),
    supabase.from('hidden_json_ids').select('id'),
  ])

  // Supabase 削除済み（オフセットID付与）
  const supabaseItems: Lifehack[] = (supabaseDeleted ?? []).map((row) => ({
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

  // JSON 非表示（hidden_json_ids から元データを復元）
  const jsonItems: Lifehack[] = (hiddenJsonData ?? [])
    .map((row) => getLifehackById(row.id))
    .filter((lh): lh is Lifehack => lh !== null)

  const deleted = [...jsonItems, ...supabaseItems]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-[#8E8E93] hover:text-[#E85A2C]">
          ← 管理画面
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-3xl">🗑️</span>
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1E]">削除済みライフハック</h1>
          <p className="text-sm text-[#8E8E93]">{deleted.length}件（JSON: {jsonItems.length} / フォーム投稿: {supabaseItems.length}）</p>
        </div>
      </div>

      {deleted.length === 0 ? (
        <div className="text-center py-16 text-[#8E8E93]">
          <div className="text-4xl mb-3">✅</div>
          <p>削除済みのライフハックはありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deleted.map((lh) => (
            <div key={lh.id} className="bg-white rounded-2xl border border-[#E5E5EA] p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {lh.title && (
                    <h3 className="font-semibold text-[#1C1C1E]">{lh.title}</h3>
                  )}
                  <p className="text-sm text-[#8E8E93]">
                    #{lh.id} · カテゴリ: {lh.category} · 投稿者: {lh.author ?? 'なし'}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full shrink-0">
                  {lh.id < SUPABASE_ID_OFFSET ? 'JSON' : 'フォーム投稿'}
                </span>
              </div>

              <div className="text-sm text-[#1C1C1E] bg-[#F7F7F5] rounded-xl p-3 whitespace-pre-wrap">
                {lh.description}
              </div>

              {lh.link && (
                <a
                  href={lh.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#E85A2C] underline break-all"
                >
                  {lh.link}
                </a>
              )}

              <div className="flex flex-wrap gap-1">
                {lh.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <RestoreButton lifehackId={lh.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
