'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  lifehackId: number
}

export default function RestoreButton({ lifehackId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRestore = async () => {
    setLoading(true)
    try {
      await fetch(`/api/lifehacks/${lifehackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-2 border-t border-[#E5E5EA]">
      <button
        onClick={handleRestore}
        disabled={loading}
        className="w-full bg-green-500 text-white text-sm font-semibold py-2 rounded-xl hover:bg-green-600 active:scale-95 transition-all duration-150 disabled:opacity-50"
      >
        復活させる
      </button>
    </div>
  )
}
