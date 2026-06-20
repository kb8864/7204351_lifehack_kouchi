import type { Transition, Variants } from 'motion/react'

/**
 * 和風よさこい・祭りモーションの共通プリセット。
 * すべて transform / opacity 中心（GPU合成）で構成し、
 * 長い一覧では whileInView + viewport once と併用する想定。
 */

// 祭りの配色（globals.css の CSS変数と対応）
export const WA_COLORS = {
  primary: '#C73E3A', // 朱
  primaryDark: '#9E2B27',
  secondary: '#223A70', // 藍
  accent: '#C9A227', // 金
} as const

// お気に入りバースト用の粒子色（朱・金・藍を散らす）
export const BURST_COLORS = [
  '#C73E3A',
  '#C9A227',
  '#223A70',
  '#E0533F',
  '#D9B441',
] as const

// --- spring プリセット ---
export const springSoft: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 22,
}

export const springPop: Transition = {
  type: 'spring',
  stiffness: 480,
  damping: 16,
}

export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 14,
}

// --- 一覧グリッドの stagger（提灯が次々立ち上がる） ---
export const gridContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
}

// 各カードが下から弾性ライズイン
export const cardRise: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springSoft,
  },
}

// reduced-motion 縮退用：フェードのみ
export const cardRiseReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
}

// --- 詳細ページの段階表示 ---
export const detailContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

export const detailItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: springSoft },
}

// ヒーロー画像はスケールイン
export const heroReveal: Variants = {
  hidden: { opacity: 0, scale: 1.08 },
  show: { opacity: 1, scale: 1, transition: { ...springSoft, damping: 26 } },
}

// reduced-motion 縮退（詳細・ヒーロー共通）
export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
}

// チップのポップイン
export const chipPop: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: springPop },
}
