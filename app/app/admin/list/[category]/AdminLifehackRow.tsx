'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Lifehack } from '@/types'

export default function AdminLifehackRow({ lifehack, canEdit = true }: { lifehack: Lifehack; canEdit?: boolean }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('このライフハックを削除しますか？')) return
    setDeleting(true)
    await fetch(`/api/lifehacks/${lifehack.id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E5EA] p-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[#1C1C1E] line-clamp-1">
          {lifehack.title || lifehack.description.slice(0, 40) + '…'}
        </p>
        <p className="text-xs text-[#8E8E93] mt-0.5">
          #{lifehack.id} · {lifehack.author ?? '投稿者なし'} · {lifehack.is_approved ? '公開' : '非公開'}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        {canEdit && (
          <Link
            href={`/admin/edit/${lifehack.id}`}
            className="text-xs bg-[#F7F7F5] border border-[#E5E5EA] text-[#1C1C1E] px-2 py-1 rounded-lg hover:bg-[#E5E5EA] transition-colors"
          >
            編集
          </Link>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs bg-red-50 border border-red-200 text-red-500 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          削除
        </button>
      </div>
    </div>
  )
}
