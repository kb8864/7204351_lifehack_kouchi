/**
 * 検索テキスト正規化ユーティリティ（クライアント・サーバー両用）
 * fs 等の Node.js 専用 API は一切使用しない
 */

/**
 * 検索用にテキストを正規化:
 *   1. NFKC 正規化（全角英数字 → 半角、合成文字の展開など）
 *   2. 小文字化
 *   3. カタカナ(U+30A1〜U+30F6) → ひらがな(コードポイント -0x60)
 */
export function normalizeForSearch(text: string): string {
  const nfkc = text.normalize('NFKC').toLowerCase()
  return nfkc.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCodePoint(ch.codePointAt(0)! - 0x60)
  )
}

/**
 * ライフハック1件から検索対象文字列を生成。
 * title, description, tags を結合して normalizeForSearch する。
 */
export function buildSearchKey(lh: {
  title: string | null
  description: string
  tags: string[]
}): string {
  const parts = [
    lh.title ?? '',
    lh.description,
    ...lh.tags,
  ]
  return normalizeForSearch(parts.join(' '))
}

/**
 * クエリを正規化し空白（全角含む、NFKC後は半角スペース）で分割して
 * 全タームが searchKey に含まれれば true を返す（AND検索）。
 * 空クエリは常に true。
 */
export function matchesQuery(searchKey: string, query: string): boolean {
  const normalized = normalizeForSearch(query)
  const terms = normalized.split(/\s+/).filter((t) => t.length > 0)
  if (terms.length === 0) return true
  return terms.every((term) => searchKey.includes(term))
}
