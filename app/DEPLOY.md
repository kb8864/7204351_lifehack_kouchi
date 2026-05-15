# デプロイ手順

## 1. 事前準備

### 1-1. Supabaseプロジェクトの作成

1. https://app.supabase.com にアクセス → 新しいプロジェクトを作成
2. 「SQL Editor」を開き、`supabase/schema.sql` の内容を全てコピーして実行
3. 「Settings > API」から以下をメモ:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`:https://wmctsjumwgsnfndrdmqm.supabase.co/rest/v1/
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtY3RzanVtd2dzbmZuZHJkbXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTM4NDgsImV4cCI6MjA5NDQyOTg0OH0.Q9YJ1yix_wFsuQdZPGrorXzWzPwit7hqSPh-JF0yNYM
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`:

### 1-2. LINE Developersのチャンネル作成

1. https://developers.line.biz にアクセス
2. プロバイダー「七福よさこい連祝禧」を作成
3. 「LINE Login」チャンネルを作成
4. 「チャンネルID」と「チャンネルシークレット」をメモ
5. 開発中のコールバックURL: `http://localhost:3000/api/auth/callback/line`
6. 本番のコールバックURL: `https://[vercel-domain]/api/auth/callback/line`

### 1-3. GitHubリポジトリの作成

1. GitHub で新しいリポジトリを作成（private推奨）
2. `app/` フォルダの内容をpush

## 2. ローカル開発の開始

```bash
# .env.local を作成
cp .env.local.example .env.local
# .env.local を編集して実際の値を入力

# 依存関係のインストール（済みの場合は不要）
npm install

# Supabaseにデータをインポート（初回のみ）
npm run seed

# 開発サーバー起動
npm run dev
# → http://localhost:3000 を開く
```

## 3. Vercelへのデプロイ

### 3-1. Vercelプロジェクトの作成

1. https://vercel.com にアクセス → GitHubでサインイン
2. 「New Project」→ GitHubのリポジトリを選択
3. **Root Directory** を `app` に変更（重要！）
4. 環境変数を設定（下記参照）
5. 「Deploy」をクリック

### 3-2. Vercelの環境変数設定

```
NEXT_PUBLIC_SUPABASE_URL      = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY     = eyJ...
LINE_CHANNEL_ID               = 1234567890
LINE_CHANNEL_SECRET           = xxxxx
JWT_SECRET                    = (openssl rand -base64 32 で生成)
NEXT_PUBLIC_APP_URL           = https://[your-app].vercel.app
WEBHOOK_SECRET                = (任意の文字列)
```

### 3-3. デプロイ後の作業

1. LINE DevelopersのコールバックURLに本番URLを追加
2. 管理者のLINEでログインしてSupabaseの `users` テーブルを確認
3. 管理者ユーザーの `is_admin` を `true` に更新:
   ```sql
   UPDATE users SET is_admin = true WHERE line_user_id = 'U...';
   ```

## 4. Googleフォームの連携設定

1. Googleフォームを新規作成（https://forms.google.com）
2. 以下の質問を追加:
   | 質問タイトル | タイプ | 必須 |
   |-------------|-------|------|
   | 本文 | 段落 | ✅ |
   | 投稿者名 | 短い回答 | |
   | カテゴリ | ドロップダウン (food/health/costume_make/other) | ✅ |
   | タイトル | 短い回答 | |
   | 商品リンク | 短い回答 | |
   | 画像URL | 短い回答 | |
   | タグ（カンマ区切り） | 短い回答 | |

3. 「3点メニュー > スクリプトエディタ」を開く
4. `scripts/google-apps-script.js` の内容を貼り付け
5. `WEBHOOK_URL` と `WEBHOOK_SECRET` を設定
6. 「保存 > トリガー > フォーム送信時」のトリガーを追加

## 5. 費用の目安

| サービス                   | 費用                 |
| -------------------------- | -------------------- |
| Vercel                     | 無料（Hobby プラン） |
| Supabase                   | 無料（Free プラン）  |
| Google Forms / Apps Script | 無料                 |
| LINE Login                 | 無料                 |
| **合計**                   | **¥0/月**            |

150名規模であれば全て無料枠内で収まります。
