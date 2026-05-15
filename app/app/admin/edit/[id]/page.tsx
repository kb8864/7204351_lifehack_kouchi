import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import type { Lifehack } from '@/types'
import EditForm from './EditForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPage({ params }: Props) {
  const { id } = await params
  const lifehackId = parseInt(id, 10)
  if (isNaN(lifehackId)) notFound()

  const session = await getSession()
  if (!session?.isAdmin) redirect('/')

  const supabase = createServerClient()
  const { data } = await supabase
    .from('lifehacks')
    .select('*')
    .eq('id', lifehackId)
    .single()

  if (!data) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-[#1C1C1E] mb-5">ライフハックを編集</h1>
      <EditForm lifehack={data as Lifehack} />
    </div>
  )
}
