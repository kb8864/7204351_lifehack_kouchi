'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface SearchInputProps {
  defaultValue: string
  defaultCategory: string
}

export default function SearchInput({ defaultValue, defaultCategory }: SearchInputProps) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (value) params.set('q', value)
    if (defaultCategory) params.set('category', defaultCategory)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="キーワードで検索（例：熱中症、足袋、アミノバイタル）"
        className="w-full pl-9 pr-24 py-3 border border-[var(--border)] rounded-xl text-sm bg-[var(--card)] focus:outline-none focus:border-[var(--primary)] transition-colors shadow-sm"
        autoFocus
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--primary)] text-white text-sm px-3 py-1.5 rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors"
      >
        検索
      </button>
    </form>
  )
}
