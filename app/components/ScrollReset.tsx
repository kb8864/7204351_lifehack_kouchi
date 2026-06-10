'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 内部コンテナ（#main-scroll）スクロール構成では、Next.js のスクロール復元
 * （window スクロール前提）が効かず、ページ遷移後にスクロール位置が引き継がれて
 * しまう。pathname 変更時に main コンテナを先頭へ戻す。
 */
export default function ScrollReset() {
  const pathname = usePathname()

  useEffect(() => {
    const el = document.getElementById('main-scroll')
    if (el) el.scrollTo(0, 0)
  }, [pathname])

  return null
}
