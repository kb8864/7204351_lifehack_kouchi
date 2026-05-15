/**
 * Google Apps Script - フォーム送信を七福ライフハックAppに転送するスクリプト
 *
 * セットアップ手順:
 * 1. Googleフォームを開く
 * 2. 「：」→「スクリプトエディタ」を開く
 * 3. このコードを貼り付ける
 * 4. WEBHOOK_URLとWEBHOOK_SECRETを設定
 * 5. 「トリガー」→「フォーム送信時」のトリガーを追加
 *
 * Googleフォームの質問設定:
 * 1. 本文（必須・段落）       → タイトル: "本文"
 * 2. 投稿者名（任意・短い回答） → タイトル: "投稿者名"
 * 3. カテゴリ（必須・ドロップダウン）→ タイトル: "カテゴリ"
 *    選択肢: food, health, costume_make, other
 * 4. 商品リンク（任意・短い回答） → タイトル: "商品リンク"
 * 5. 画像URL（任意・短い回答）   → タイトル: "画像URL"
 * 6. タグ（任意・短い回答）     → タイトル: "タグ（カンマ区切り）"
 * 7. タイトル（任意・短い回答）  → タイトル: "タイトル"
 */

const WEBHOOK_URL = 'https://YOUR-VERCEL-APP.vercel.app/api/webhook/google-form'
const WEBHOOK_SECRET = 'your-webhook-secret' // .env.localのWEBHOOK_SECRETと同じ値

function onFormSubmit(e) {
  const responses = e.response.getItemResponses()
  const data = {}

  responses.forEach(function (response) {
    const title = response.getItem().getTitle()
    const answer = response.getResponse()

    if (title === '本文') data.description = answer
    else if (title === '投稿者名') data.author = answer
    else if (title === 'カテゴリ') data.category = answer
    else if (title === '商品リンク') data.link = answer
    else if (title === '画像URL') data.photo = answer
    else if (title === 'タグ（カンマ区切り）') data.tags = answer
    else if (title === 'タイトル') data.title = answer
  })

  if (!data.description || !data.category) {
    console.log('必須項目が不足しています')
    return
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + WEBHOOK_SECRET,
    },
    payload: JSON.stringify(data),
    muteHttpExceptions: true,
  }

  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options)
    console.log('送信成功:', response.getContentText())
  } catch (error) {
    console.error('送信エラー:', error)
  }
}
