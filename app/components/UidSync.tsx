'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null
  return (
    document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${name}=`))
      ?.split('=')[1] ?? null
  )
}

function setCookieValue(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365 * 5 // 5年
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; SameSite=Lax${secure}`
}

export default function UidSync() {
  const router = useRouter()

  useEffect(() => {
    const cookieUid = getCookieValue('shichifuku_uid')
    const localUid = localStorage.getItem('shichifuku_uid')

    if (localUid && cookieUid !== localUid) {
      // localStorage に値があり Cookie と異なる(消えた場合を含む) → localStorage の値で Cookie を上書き
      setCookieValue('shichifuku_uid', localUid)
      router.refresh()
    } else if (cookieUid && !localUid) {
      // Cookie に値があり localStorage に無い → localStorage に保存
      localStorage.setItem('shichifuku_uid', cookieUid)
    }
    // 両方一致している場合は何もしない
  }, [router])

  return null
}
