'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Lifehack, Category } from '@/types'
import { CATEGORIES, CATEGORY_SLUGS } from '@/lib/constants'

export default function EditForm({ lifehack }: { lifehack: Lifehack }) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: lifehack.title ?? '',
    description: lifehack.description,
    author: lifehack.author ?? '',
    link: lifehack.link ?? '',
    photo: lifehack.photo ?? '',
    category: lifehack.category,
    tags: lifehack.tags.join(', '),
    is_approved: lifehack.is_approved,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/lifehacks/${lifehack.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => {
        router.push(`/admin/list/${form.category}`)
      }, 1000)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 space-y-4">
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
          ✅ 保存しました。リダイレクト中...
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-[#1C1C1E]">タイトル（任意）</label>
        <input
          className="w-full border border-[#E5E5EA] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E85A2C]"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[#1C1C1E]">本文 *</label>
        <textarea
          rows={6}
          className="w-full border border-[#E5E5EA] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E85A2C] resize-none"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#1C1C1E]">投稿者</label>
          <input
            className="w-full border border-[#E5E5EA] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E85A2C]"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#1C1C1E]">カテゴリ</label>
          <select
            className="w-full border border-[#E5E5EA] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E85A2C]"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
          >
            {CATEGORY_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {CATEGORIES[slug].icon} {CATEGORIES[slug].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[#1C1C1E]">タグ（カンマ区切り）</label>
        <input
          className="w-full border border-[#E5E5EA] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E85A2C]"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="熱中症対策, ご飯, 疲労回復"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[#1C1C1E]">商品リンク（任意）</label>
        <input
          className="w-full border border-[#E5E5EA] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E85A2C]"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[#1C1C1E]">画像URL（任意）</label>
        <input
          className="w-full border border-[#E5E5EA] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E85A2C]"
          value={form.photo}
          onChange={(e) => setForm({ ...form, photo: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_approved"
          checked={form.is_approved}
          onChange={(e) => setForm({ ...form, is_approved: e.target.checked })}
          className="w-4 h-4 accent-[#E85A2C]"
        />
        <label htmlFor="is_approved" className="text-sm text-[#1C1C1E]">公開する</label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => router.back()}
          className="flex-1 border border-[#E5E5EA] text-[#8E8E93] text-sm font-medium py-2.5 rounded-xl hover:bg-[#F7F7F5] transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.description}
          className="flex-1 bg-[#E85A2C] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#C94B22] transition-colors disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  )
}
