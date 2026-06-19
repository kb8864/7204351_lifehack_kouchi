import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getAdminSession } from '@/lib/admin-auth'
import { CATEGORIES, CATEGORY_SLUGS, TAG_COLORS } from '@/lib/constants'
import { getCategoryListing } from '@/lib/data'
import type { Category } from '@/types'
import AdminCategoryBoard from '@/components/admin/AdminCategoryBoard'

interface Props {
  params: Promise<{ category: string }>
}

export default async function AdminListPage({ params }: Props) {
  const { category: categorySlug } = await params
  const isAdmin = await getAdminSession()
  if (!isAdmin) redirect('/admin/login')
  if (!CATEGORY_SLUGS.includes(categorySlug as Category)) notFound()

  const category = categorySlug as Category
  const info = CATEGORIES[category]

  // 配置(順序/所属)・タグ上書きをすべて反映した一覧
  const items = await getCategoryListing(category)
  const allTags = Object.keys(TAG_COLORS)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-[#8E8E93] hover:text-[#E85A2C]">← 管理画面</Link>
      </div>
      <div className={`${info.bgColor} ${info.borderColor} border-2 rounded-2xl p-4`}>
        <div className="text-3xl">{info.icon}</div>
        <h1 className={`text-xl font-bold ${info.color} mt-1`}>{info.label} の管理</h1>
        <p className="text-sm text-[#8E8E93]">{items.length}件</p>
        <p className="text-xs text-[#8E8E93] mt-1">
          ハンドル <span className="font-bold">≡</span> をドラッグで並べ替え。カテゴリチップで表示先を切替、タグチップで編集できます。
        </p>
      </div>

      <AdminCategoryBoard
        category={category}
        initialItems={items}
        allTags={allTags}
      />
    </div>
  )
}
