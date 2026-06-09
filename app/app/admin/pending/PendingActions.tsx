'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  lifehackId: number
}

export default function PendingActions({ lifehackId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoading(true)
    try {
      await fetch(`/api/lifehacks/${lifehackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: action === 'approve' ? true : null }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 pt-2 border-t border-[#E5E5EA]">
      <button
        onClick={() => handleAction('approve')}
        disabled={loading}
        className="flex-1 bg-green-500 text-white text-sm font-semibold py-2 rounded-xl hover:bg-green-600 active:scale-95 transition-all duration-150 disabled:opacity-50"
      >
        ✅ 承認する
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={loading}
        className="flex-1 bg-red-100 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-200 active:scale-95 transition-all duration-150 disabled:opacity-50"
      >
        🗑️ 削除する
      </button>
    </div>
  )
}
