'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { CATEGORIES, TAG_COLORS, DEFAULT_TAG_COLOR } from '@/lib/constants'
import type { Category } from '@/types'

interface CategoryFilterProps {
  category: Category
  tags: string[]
  activeTag: string
  searchQuery: string
}

export default function CategoryFilter({
  category,
  tags,
  activeTag,
  searchQuery,
}: CategoryFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== 'q') params.delete('q')
    router.push(`${pathname}?${params.toString()}`)
  }

  const info = CATEGORIES[category]

  return (
    <div className="space-y-3">
      {/* 検索バー */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">🔍</span>
        <input
          type="text"
          defaultValue={searchQuery}
          placeholder={`${info.label}のライフハックを検索...`}
          className="w-full pl-9 pr-4 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-[var(--card)] focus:outline-none focus:border-[var(--primary)] transition-colors"
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString())
            if (e.target.value) {
              params.set('q', e.target.value)
            } else {
              params.delete('q')
            }
            params.delete('tag')
            router.push(`${pathname}?${params.toString()}`)
          }}
        />
      </div>

      {/* タグフィルター */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateQuery('tag', '')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !activeTag
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]'
            }`}
          >
            すべて
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => updateQuery('tag', activeTag === tag ? '' : tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-opacity text-white ${
                activeTag === tag
                  ? `${TAG_COLORS[tag] || DEFAULT_TAG_COLOR} ring-2 ring-offset-1 ring-current`
                  : `${TAG_COLORS[tag] || DEFAULT_TAG_COLOR} opacity-70 hover:opacity-100`
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
