import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import type { Lifehack } from '@/types'
import PendingActions from './PendingActions'

export default async function PendingPage() {
  const session = await getSession()
  if (!session?.isAdmin) redirect('/')

  const supabase = createServerClient()
  const { data } = await supabase
    .from('lifehacks')
    .select('*')
    .eq('is_approved', false)
    .order('created_at', { ascending: false })

  const pending = (data as Lifehack[]) ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📋</span>
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1E]">承認待ちライフハック</h1>
          <p className="text-sm text-[#8E8E93]">{pending.length}件</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-16 text-[#8E8E93]">
          <div className="text-4xl mb-3">✅</div>
          <p>承認待ちのライフハックはありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((lh) => (
            <div key={lh.id} className="bg-white rounded-2xl border border-[#E5E5EA] p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {lh.title && (
                    <h3 className="font-semibold text-[#1C1C1E]">{lh.title}</h3>
                  )}
                  <p className="text-sm text-[#8E8E93]">
                    カテゴリ: {lh.category} | 投稿者: {lh.author ?? 'なし'}
                  </p>
                </div>
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full shrink-0">
                  承認待ち
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

              <PendingActions lifehackId={lh.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
