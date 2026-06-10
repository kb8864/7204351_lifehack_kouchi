import { unstable_cache } from 'next/cache'

// Amazon・Rakutenはサーバーサイドからのスクレイピングをブロックするため
// Microlink API 経由で取得する
const NEED_PROXY = /amazon\.(co\.jp|com)|amzn\.(asia|to)|rakuten\.co\.jp|a\.r10\.to|hb\.afl\.rakuten\.co\.jp/i

async function fetchViaMicrolink(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(12000) }
    )
    if (!res.ok) return null
    const json = await res.json() as { data?: { image?: { url?: string } } }
    const img = json?.data?.image?.url ?? null
    return img && img.startsWith('http') ? img : null
  } catch {
    return null
  }
}

async function _fetchOgpImage(url: string): Promise<string | null> {
  if (NEED_PROXY.test(url)) {
    return fetchViaMicrolink(url)
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const html = await res.text()

    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    const img = m ? m[1] : null
    return img && img.startsWith('http') ? img : null
  } catch {
    return null
  }
}

export const fetchOgpImage = unstable_cache(
  _fetchOgpImage,
  ['ogp-image'],
  { revalidate: 60 * 60 * 24 } // 24時間キャッシュ
)

/** リンクを持つライフハックのOGP画像を並列取得して id→imageUrl マップを返す */
export async function getOgpImageMap(
  lifehacks: { id: number; link: string | null }[]
): Promise<Record<number, string>> {
  const withLink = lifehacks.filter((lh) => lh.link)
  const results = await Promise.all(
    withLink.map(async (lh) => {
      const img = await fetchOgpImage(lh.link!)
      return { id: lh.id, img }
    })
  )
  const map: Record<number, string> = {}
  for (const { id, img } of results) {
    if (img) map[id] = img
  }
  return map
}
