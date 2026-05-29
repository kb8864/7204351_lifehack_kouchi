import * as cheerio from 'cheerio'
import { createServerClient } from './supabase'

export async function fetchOGPImage(url: string): Promise<string | null> {
  // キャッシュを確認
  const supabase = createServerClient()
  const { data: cached } = await supabase
    .from('ogp_cache')
    .select('image_url')
    .eq('url', url)
    .single()

  if (cached) return cached.image_url

  // 新規フェッチ
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ShichifukuBot/1.0)',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      await cacheOGP(url, null)
      return null
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    const imageUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      null

    const resolved = imageUrl && imageUrl.startsWith('http') ? imageUrl : null
    await cacheOGP(url, resolved)
    return resolved
  } catch {
    await cacheOGP(url, null)
    return null
  }
}

async function cacheOGP(url: string, imageUrl: string | null) {
  const supabase = createServerClient()
  await supabase.from('ogp_cache').upsert({ url, image_url: imageUrl })
}
