'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 内部コンテナ（#main-scroll）スクロール構成では、Next.js のスクロール復元
 * （window スクロール前提）が効かない。ページごとのスクロール位置を保存し、
 *
 *  - ブラウザの戻る/進む（popstate）
 *  - 直前にいたページへ戻る遷移（例: 一覧 → 詳細 → 「一覧に戻る」リンク）
 *
 * のときは元の位置へ復元、それ以外の遷移では先頭へ戻す。
 */

const STORAGE_KEY = 'shichifuku_scroll_positions'
/** popstate 直後の pathname 変更を「戻る/進む」とみなす猶予 */
const POP_GRACE_MS = 1000
/** 復元先までコンテンツ高さが伸びるのを待つ上限（loading.tsx → 本体描画の遅延吸収） */
const RESTORE_TIMEOUT_MS = 1500

type Positions = Record<string, number>

function readPositions(): Positions {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Positions) : {}
  } catch {
    return {}
  }
}

function writePosition(path: string, top: number) {
  try {
    const positions = readPositions()
    positions[path] = top
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
  } catch {
    // プライベートモード等で sessionStorage が使えない場合は保存を諦める
  }
}

// SSR では layout effect が走らないため、サーバー側は useEffect を参照させて警告を回避
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function ScrollMemory() {
  const pathname = usePathname()
  /** 現在ページのスクロール量。遷移でコンテンツが縮んで clamp される前の値を保持する */
  const currentTop = useRef(0)
  const poppedAt = useRef(0)
  /** 現在いるページ */
  const currentPath = useRef<string | null>(null)
  /** 現在ページに来る前にいたページ（= 「戻る」先とみなすパス） */
  const originPath = useRef<string | null>(null)

  useEffect(() => {
    const el = document.getElementById('main-scroll')
    if (!el) return

    const onScroll = () => {
      currentTop.current = el.scrollTop
    }
    const onPop = () => {
      poppedAt.current = Date.now()
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('popstate', onPop)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('popstate', onPop)
    }
  }, [])

  useIsomorphicLayoutEffect(() => {
    const el = document.getElementById('main-scroll')
    if (!el) return

    const prev = currentPath.current
    currentPath.current = pathname

    // 初回マウント時は保存も復元もしない（直リンク/リロードは先頭表示のまま）
    if (prev === null) return
    if (prev === pathname) return

    // 離脱するページの位置を保存（clamp 前の値を使うため scroll ハンドラの記録値を採用）
    writePosition(prev, currentTop.current)

    const isPop = Date.now() - poppedAt.current < POP_GRACE_MS
    const isBackToOrigin = pathname === originPath.current
    originPath.current = prev

    const target = isPop || isBackToOrigin ? (readPositions()[pathname] ?? 0) : 0
    currentTop.current = target

    el.scrollTop = target
    if (target === 0) return

    // 一覧が描画されて高さが戻るまで数フレーム追従する
    let raf = 0
    const deadline = performance.now() + RESTORE_TIMEOUT_MS
    const step = () => {
      const max = el.scrollHeight - el.clientHeight
      el.scrollTop = Math.min(target, max)
      // 目標位置まで伸びた or 時間切れなら追従終了（以降のユーザー操作を邪魔しない）
      if (max >= target || performance.now() > deadline) return
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  return null
}
