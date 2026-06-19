/**
 * Google Apps Script - フォーム送信を七福ライフハックAppに転送するスクリプト
 *
 * ★ 実際のGoogleフォームの構成（2026-06時点）に対応:
 *
 *   あなたのお名前は？                          → 投稿者名（全カテゴリ共通）
 *   Q1-1. 食事系のライフハックを教えてください      → 本文     (category: food)
 *   Q1-2. このライフハックのタイトルを…           → タイトル
 *   Q1-3. …商品リンクなどがあれば…              → 商品リンク
 *   Q1-4. 下のチェックボックスから…（最大2個）     → タグ（チェックボックス）
 *   Q2-1 〜 Q2-4                              → 衣装・メイク (category: costume_make)
 *   Q3-1 〜 Q3-4                              → その他      (category: other)
 *
 * ★ セクション4・5はリンク質問が無く、3問構成（Qn-3がタグ）:
 *   Q4-1. 練習時のライフハックを教えてください      → 本文     (category: practice)
 *   Q4-2. このライフハックのタイトルを…           → タイトル
 *   Q4-3. 下のチェックボックスから…（最大2個）     → タグ（チェックボックス）
 *   練習タグ候補: おすすめグッズ / 熱中症対策 / 豆知識 / その他
 *   Q5-1 〜 Q5-3                              → お祭り      (category: festival)
 *   お祭りタグ候補: おすすめグッズ / 熱中症対策 / 疲労回復 / 雨対策 / メイク / その他
 *
 * 質問タイトルは「Q1-1」「Q2−3（全角ハイフン）」のような番号部分だけで判定するので、
 * 質問文の文言を多少変えても動作する。番号（Qn-m）は変えないこと。
 *
 * 1回の送信で複数カテゴリ（Q1とQ2の両方など）が記入されていた場合は、
 * カテゴリごとに別々のライフハックとして登録される。
 * 本文（Qn-1）が空のセクションは無視される。
 *
 * セットアップ手順:
 * 1. Googleフォームを開く → 右上「︙」→「スクリプトエディタ」
 * 2. このコードを貼り付け、WEBHOOK_URL と WEBHOOK_SECRET を設定
 *    （WEBHOOK_SECRET は Vercel の環境変数 WEBHOOK_SECRET と同じ値）
 * 3. 左メニュー「トリガー」→「トリガーを追加」
 *    - 実行する関数: onFormSubmit
 *    - イベントの種類: フォーム送信時
 * 4. 保存して権限を承認
 * 5. フォームからテスト送信して、実行ログ（左メニュー「実行数」）で
 *    「送信成功」が出ることを確認する
 */

const WEBHOOK_URL = 'https://729summerlifehacks.vercel.app/api/webhook/google-form'
const WEBHOOK_SECRET = '7294351' // .env.local / Vercel の WEBHOOK_SECRET と同じ値

// セクション番号 → アプリのカテゴリ
const SECTION_CATEGORY = {
  1: 'food', // 食事
  2: 'costume_make', // 衣装・メイク
  3: 'other', // その他
  4: 'practice', // 練習
  5: 'festival', // お祭り
}

// リンク質問を持つセクション（1〜3）。4・5はリンク無しでQn-3がタグ
const SECTION_HAS_LINK = { 1: true, 2: true, 3: true, 4: false, 5: false }

function fieldFor(sectionNo, subNo) {
  if (subNo === 1) return 'description'
  if (subNo === 2) return 'title'
  if (SECTION_HAS_LINK[sectionNo]) {
    if (subNo === 3) return 'link'
    if (subNo === 4) return 'tags'
  } else {
    if (subNo === 3) return 'tags'
  }
  return null
}

// 「Q1-1」「Q2−3」「Ｑ5ー3」など、半角/全角・各種ハイフンの揺れを吸収して
// セクション番号と設問番号を取り出す
const QUESTION_NUMBER_RE = /[QＱ]\s*([1-5１-５])\s*[-−ー–—‐－]\s*([1-4１-４])/

function toHalfWidthDigit(ch) {
  const code = ch.charCodeAt(0)
  // 全角数字 '０'(0xFF10)〜'９'(0xFF19) → 半角
  if (code >= 0xff10 && code <= 0xff19) return String(code - 0xff10)
  return ch
}

function onFormSubmit(e) {
  const responses = e.response.getItemResponses()

  let author = ''
  // セクションごとの回答を貯める箱
  const sections = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} }

  responses.forEach(function (response) {
    const questionTitle = response.getItem().getTitle()
    const answer = response.getResponse()

    // 投稿者名
    if (questionTitle.indexOf('お名前') !== -1) {
      author = String(answer).trim()
      return
    }

    // Qn-m 形式の質問
    const m = questionTitle.match(QUESTION_NUMBER_RE)
    if (!m) {
      console.log('対応付けできない質問をスキップ: ' + questionTitle)
      return
    }
    const sectionNo = Number(toHalfWidthDigit(m[1]))
    const subNo = Number(toHalfWidthDigit(m[2]))
    const field = fieldFor(sectionNo, subNo)
    if (!SECTION_CATEGORY[sectionNo] || !field) return

    sections[sectionNo][field] = answer
  })

  // 本文が記入されているセクションだけ、1件ずつWebhookに送信
  let sent = 0
  for (let sectionNo = 1; sectionNo <= 5; sectionNo++) {
    const s = sections[sectionNo]
    const description = s.description ? String(s.description).trim() : ''
    if (!description) continue // 空きセクションは無視

    // チェックボックスの回答は配列で来る。文字列なら配列に包む
    let tags = []
    if (Array.isArray(s.tags)) {
      tags = s.tags.map(function (t) { return String(t).trim() }).filter(String)
    } else if (s.tags) {
      tags = [String(s.tags).trim()].filter(String)
    }

    const payload = {
      category: SECTION_CATEGORY[sectionNo],
      description: description,
      author: author || null,
      title: s.title ? String(s.title).trim() : null,
      link: s.link ? String(s.link).trim() : null,
      tags: tags,
    }

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + WEBHOOK_SECRET,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    }

    try {
      const res = UrlFetchApp.fetch(WEBHOOK_URL, options)
      const code = res.getResponseCode()
      if (code >= 200 && code < 300) {
        sent++
        console.log('送信成功 [' + payload.category + ']: ' + res.getContentText())
      } else {
        console.error(
          '送信失敗 [' + payload.category + '] HTTP ' + code + ': ' + res.getContentText()
        )
      }
    } catch (error) {
      console.error('送信エラー [' + payload.category + ']: ' + error)
    }
  }

  if (sent === 0) {
    console.log('送信対象のセクションがありませんでした（本文がすべて空）')
  }
}
