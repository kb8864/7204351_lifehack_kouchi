'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/constants'
import type { Lifehack } from '@/types'

interface SearchLifehack {
  id: number
  title: string | null
  description: string
  tags: string[]
  category: string
}

interface Props {
  lifehacks: SearchLifehack[]
  popularTags: string[]
}

export default function HomeSearch({ lifehacks, popularTags }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = query.trim()
    ? lifehacks
        .filter(
          (lh) =>
            lh.description.toLowerCase().includes(query.toLowerCase()) ||
            lh.title?.toLowerCase().includes(query.toLowerCase()) ||
            lh.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 8)
    : []

  const showPanel = focused && (query.trim() !== '' || popularTags.length > 0)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 bg-[var(--card)] border rounded-xl px-4 py-3 transition-colors shadow-sm ${
          focused ? 'border-[var(--primary)]' : 'border-[var(--border)]'
        }`}
      >
        <span className="text-[var(--muted)]">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="ライフハックを検索..."
          className="flex-1 text-sm bg-transparent focus:outline-none text-[var(--foreground)] placeholder-[var(--muted)]"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="text-[var(--muted)] hover:text-[var(--foreground)] text-xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden">
          {/* 人気タグのサジェスト（未入力時） */}
          {!query && popularTags.length > 0 && (
            <div className="p-3">
              <p className="text-xs text-[var(--muted)] mb-2">みんながよく検索するキーワード</p>
              <div className="flex flex-wrap gap-1.5">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="text-xs bg-[var(--background)] text-[var(--foreground)] px-2.5 py-1 rounded-full hover:bg-[var(--primary)] hover:text-white transition-colors"
                  >
                    🔍 {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 検索結果（入力時） */}
          {query && results.length > 0 && (
            <div className="max-h-72 overflow-y-auto divide-y divide-[#F0F0F0]">
              {results.map((lh) => {
                const info = CATEGORIES[lh.category as keyof typeof CATEGORIES]
                return (
                  <Link
                    key={lh.id}
                    href={`/lifehack/${lh.id}`}
                    onClick={() => { setFocused(false); setQuery('') }}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--background)] transition-colors"
                  >
                    <span className="text-base mt-0.5 shrink-0">{info?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1">
                        {lh.title || lh.description.slice(0, 30) + '…'}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">
                        {lh.description}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* 結果なし */}
          {query && results.length === 0 && (
            <div className="px-4 py-6 text-center text-[var(--muted)] text-sm">
              「{query}」に一致するライフハックが見つかりませんでした
            </div>
          )}
        </div>
      )}
    </div>
  )
}
