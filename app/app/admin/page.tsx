import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminSession } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/constants'
import type { Category } from '@/types'

export default async function AdminPage() {
  const isAdmin = await getAdminSession()
  if (!isAdmin) redirect('/admin/login')

  const supabase = createServerClient()

  const [{ count: totalCount }, { count: pendingCount }, { count: deletedCount }, { data: categoryData }] =
    await Promise.all([
      supabase.from('lifehacks').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
      supabase
        .from('lifehacks')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false)
        .eq('is_deleted', false),
      supabase
        .from('lifehacks')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', true),
      supabase
        .from('lifehacks')
        .select('category')
        .eq('is_approved', true)
        .eq('is_deleted', false),
    ])

  const counts: Record<string, number> = {}
  categoryData?.forEach((row) => {
    counts[row.category] = (counts[row.category] ?? 0) + 1
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">⚙️</span>
        <h1 className="text-xl font-bold text-[#1C1C1E]">管理者ダッシュボード</h1>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-[#E5E5EA] shadow-sm">
          <div className="text-2xl font-bold text-[#E85A2C]">{totalCount ?? 0}</div>
          <div className="text-xs text-[#8E8E93] mt-1">ライフハック総数</div>
        </div>
        <div className={`rounded-2xl p-4 border-2 shadow-sm ${(pendingCount ?? 0) > 0 ? 'bg-orange-50 border-orange-300' : 'bg-white border-[#E5E5EA]'}`}>
          <div className="text-2xl font-bold text-orange-500">{pendingCount ?? 0}</div>
          <div className="text-xs text-[#8E8E93] mt-1">承認待ち</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E5E5EA] shadow-sm">
          <div className="text-2xl font-bold text-gray-400">{deletedCount ?? 0}</div>
          <div className="text-xs text-[#8E8E93] mt-1">削除済み</div>
        </div>
        {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(
          ([slug, info]) => (
            <div key={slug} className={`${info.bgColor} rounded-2xl p-4 border ${info.borderColor} shadow-sm`}>
              <div className={`text-2xl font-bold ${info.color}`}>{counts[slug] ?? 0}</div>
              <div className="text-xs text-[#8E8E93] mt-1">{info.icon} {info.label}</div>
            </div>
          )
        )}
      </div>

      {/* クイックアクション */}
      <div className="space-y-3">
        <h2 className="font-bold text-[#1C1C1E]">操作メニュー</h2>
        <div className="grid gap-3">
          <Link
            href="/admin/pending"
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all hover:shadow-md ${
              (pendingCount ?? 0) > 0
                ? 'bg-orange-50 border-orange-300'
                : 'bg-white border-[#E5E5EA]'
            }`}
          >
            <span className="text-2xl">📋</span>
            <div>
              <div className="font-semibold text-[#1C1C1E]">承認待ちライフハック</div>
              <div className="text-sm text-[#8E8E93]">
                Googleフォームから送信された{pendingCount ?? 0}件を確認・承認する
              </div>
            </div>
            <span className="ml-auto text-[#E85A2C]">→</span>
          </Link>

          <Link
            href="/admin/deleted"
            className="flex items-center gap-3 p-4 rounded-2xl border border-[#E5E5EA] bg-white hover:shadow-sm transition-shadow"
          >
            <span className="text-2xl">🗑️</span>
            <div>
              <div className="font-semibold text-[#1C1C1E]">削除済みライフハック</div>
              <div className="text-sm text-[#8E8E93]">{deletedCount ?? 0}件を復活させる</div>
            </div>
            <span className="ml-auto text-[#8E8E93]">→</span>
          </Link>

          {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(
            ([slug, info]) => (
              <Link
                key={slug}
                href={`/admin/list/${slug}`}
                className={`flex items-center gap-3 p-4 rounded-2xl border ${info.borderColor} ${info.bgColor} hover:shadow-sm transition-shadow`}
              >
                <span className="text-2xl">{info.icon}</span>
                <div>
                  <div className="font-semibold text-[#1C1C1E]">{info.label}の管理</div>
                  <div className="text-sm text-[#8E8E93]">{counts[slug] ?? 0}件を編集・削除</div>
                </div>
                <span className="ml-auto text-[#8E8E93]">→</span>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  )
}
