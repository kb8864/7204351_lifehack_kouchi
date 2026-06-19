'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Category, Lifehack } from '@/types'
import {
  CATEGORIES,
  CATEGORY_SLUGS,
  TAG_COLORS,
  DEFAULT_TAG_COLOR,
} from '@/lib/constants'

const SUPABASE_ID_OFFSET = 10000

interface BoardProps {
  category: Category
  initialItems: Lifehack[]
  allTags: string[]
}

export default function AdminCategoryBoard({
  category,
  initialItems,
  allTags,
}: BoardProps) {
  const router = useRouter()
  const [items, setItems] = useState<Lifehack[]>(initialItems)
  const [reordering, setReordering] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // 少し動かさないとドラッグ開始しない（タップ・チップ操作と区別）
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const next = arrayMove(items, oldIndex, newIndex)
    // 楽観反映
    setItems(next)
    setReordering(true)

    try {
      const res = await fetch(
        `/api/admin/categories/${category}/reorder`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds: next.map((i) => i.id) }),
        }
      )
      if (!res.ok) throw new Error('reorder failed')
      router.refresh()
    } catch {
      alert('並べ替えの保存に失敗しました')
      // サーバー最新へ戻す
      router.refresh()
    } finally {
      setReordering(false)
    }
  }

  // 行のローカル更新（カテゴリ/タグの楽観反映）
  const patchItem = (id: number, patch: Partial<Lifehack>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    )
  }

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableRow
              key={item.id}
              item={item}
              currentCategory={category}
              allTags={allTags}
              reordering={reordering}
              onPatch={patchItem}
              onRemove={removeItem}
              onRefresh={() => router.refresh()}
            />
          ))}
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <p className="text-center text-sm text-[#8E8E93] py-8">
          このカテゴリに表示するライフハックはありません
        </p>
      )}
    </div>
  )
}

interface RowProps {
  item: Lifehack
  currentCategory: Category
  allTags: string[]
  reordering: boolean
  onPatch: (id: number, patch: Partial<Lifehack>) => void
  onRemove: (id: number) => void
  onRefresh: () => void
}

function SortableRow({
  item,
  currentCategory,
  allTags,
  reordering,
  onPatch,
  onRemove,
  onRefresh,
}: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.18)' : undefined,
  }

  const canEdit = item.id > SUPABASE_ID_OFFSET

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl border border-[#E5E5EA] p-3 flex items-start gap-2"
    >
      {/* ドラッグハンドル */}
      <button
        type="button"
        aria-label="並べ替え"
        {...attributes}
        {...listeners}
        disabled={reordering}
        className="shrink-0 mt-0.5 px-1.5 py-1 text-[#8E8E93] hover:text-[#E85A2C] cursor-grab active:cursor-grabbing touch-none select-none disabled:opacity-40"
      >
        <span className="text-lg leading-none">≡</span>
      </button>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-[#1C1C1E] line-clamp-1">
              {item.title || item.description.slice(0, 40) + '…'}
            </p>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              #{item.id} · {item.author ?? '投稿者なし'} ·{' '}
              {item.is_approved ? '公開' : '非公開'}
            </p>
          </div>
          <RowActions
            item={item}
            canEdit={canEdit}
            onRefresh={onRefresh}
          />
        </div>

        <CategoryChips
          item={item}
          currentCategory={currentCategory}
          onPatch={onPatch}
          onRemove={onRemove}
          onRefresh={onRefresh}
        />

        <TagChips
          item={item}
          allTags={allTags}
          onPatch={onPatch}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  )
}

function RowActions({
  item,
  canEdit,
  onRefresh,
}: {
  item: Lifehack
  canEdit: boolean
  onRefresh: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('このライフハックを削除しますか？')) return
    setDeleting(true)
    try {
      await fetch(`/api/lifehacks/${item.id}`, { method: 'DELETE' })
    } finally {
      onRefresh()
    }
  }

  return (
    <div className="flex gap-2 shrink-0">
      {canEdit && (
        <Link
          href={`/admin/edit/${item.id}`}
          className="text-xs bg-[#F7F7F5] border border-[#E5E5EA] text-[#1C1C1E] px-2 py-1 rounded-lg hover:bg-[#E5E5EA] transition-colors"
        >
          編集
        </Link>
      )}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs bg-red-50 border border-red-200 text-red-500 px-2 py-1 rounded-lg hover:bg-red-100 active:scale-90 transition-all duration-150 disabled:opacity-50"
      >
        削除
      </button>
    </div>
  )
}

function CategoryChips({
  item,
  currentCategory,
  onPatch,
  onRemove,
  onRefresh,
}: {
  item: Lifehack
  currentCategory: Category
  onPatch: (id: number, patch: Partial<Lifehack>) => void
  onRemove: (id: number) => void
  onRefresh: () => void
}) {
  const [saving, setSaving] = useState(false)
  const current: Category[] =
    item.categories && item.categories.length > 0
      ? item.categories
      : [item.category]
  const currentSet = new Set(current)

  const toggle = async (c: Category) => {
    if (saving) return
    const isOn = currentSet.has(c)
    // 最後の1つはOFF不可
    if (isOn && current.length <= 1) return

    const nextSet = new Set(current)
    if (isOn) nextSet.delete(c)
    else nextSet.add(c)
    const nextList = CATEGORY_SLUGS.filter((s) => nextSet.has(s))

    setSaving(true)
    // 楽観反映
    onPatch(item.id, { categories: nextList })
    // 表示中カテゴリをOFFにしたらこの一覧から消す
    const removedCurrent = c === currentCategory && isOn

    try {
      const res = await fetch(
        `/api/admin/lifehacks/${item.id}/categories`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories: nextList }),
        }
      )
      if (!res.ok) throw new Error('failed')
      if (removedCurrent) onRemove(item.id)
      onRefresh()
    } catch {
      alert('カテゴリの保存に失敗しました')
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORY_SLUGS.map((c) => {
        const info = CATEGORIES[c]
        const on = currentSet.has(c)
        const isLast = on && current.length <= 1
        return (
          <button
            key={c}
            type="button"
            onClick={() => toggle(c)}
            disabled={saving || isLast}
            aria-pressed={on}
            title={isLast ? '所属は最低1つ必要です' : undefined}
            className={[
              'text-[11px] px-2 py-0.5 rounded-full border transition-colors',
              on
                ? `${info.bgColor} ${info.color} ${info.borderColor} font-medium`
                : 'bg-white text-[#8E8E93] border-[#E5E5EA]',
              isLast ? 'opacity-60 cursor-not-allowed' : '',
              saving ? 'opacity-60' : '',
            ].join(' ')}
          >
            {info.icon} {info.label}
          </button>
        )
      })}
    </div>
  )
}

function TagChips({
  item,
  allTags,
  onPatch,
  onRefresh,
}: {
  item: Lifehack
  allTags: string[]
  onPatch: (id: number, patch: Partial<Lifehack>) => void
  onRefresh: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')

  const tags = item.tags ?? []

  const save = async (nextTags: string[]) => {
    setSaving(true)
    onPatch(item.id, { tags: nextTags })
    try {
      const res = await fetch(`/api/admin/lifehacks/${item.id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: nextTags }),
      })
      if (!res.ok) throw new Error('failed')
      onRefresh()
    } catch {
      alert('タグの保存に失敗しました')
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  const addTag = (t: string) => {
    const trimmed = t.trim()
    if (!trimmed) return
    if (tags.includes(trimmed)) return
    save([...tags, trimmed])
  }

  const removeTag = (t: string) => {
    save(tags.filter((x) => x !== t))
  }

  const handleSubmit = () => {
    addTag(input)
    setInput('')
  }

  // 未付与の既存タグ
  const available = allTags.filter((t) => !tags.includes(t))

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5 items-center">
        {tags.map((t) => (
          <span
            key={t}
            className={`inline-flex items-center gap-1 text-[11px] text-white px-2 py-0.5 rounded-full ${
              TAG_COLORS[t] ?? DEFAULT_TAG_COLOR
            }`}
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              disabled={saving}
              aria-label={`${t} を削除`}
              className="leading-none hover:opacity-70 disabled:opacity-50"
            >
              ×
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={saving}
          className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-[#E85A2C] text-[#E85A2C] hover:bg-orange-50 disabled:opacity-50"
        >
          ＋タグ
        </button>
      </div>

      {open && (
        <div className="rounded-lg border border-[#E5E5EA] bg-[#FAFAF8] p-2 space-y-2">
          {available.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {available.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  disabled={saving}
                  className={`text-[11px] text-white px-2 py-0.5 rounded-full opacity-80 hover:opacity-100 disabled:opacity-50 ${
                    TAG_COLORS[t] ?? DEFAULT_TAG_COLOR
                  }`}
                >
                  ＋{t}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="新しいタグ"
              className="flex-1 min-w-0 text-xs border border-[#E5E5EA] rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[#E85A2C]"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || input.trim() === ''}
              className="text-xs bg-[#E85A2C] text-white px-3 py-1 rounded-lg disabled:opacity-50"
            >
              追加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
