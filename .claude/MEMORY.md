# 七福ライフハック プロジェクトメモ

## 技術スタック
- Next.js 16.2.6 (App Router) + React 19
- Tailwind CSS v4（@import "tailwindcss" 形式）
- Supabase (PostgreSQL)
- LINE Login (OAuth2)
- jose (JWT)
- cheerio (OGP解析)

## 重要: Next.js 16 の変更点
- middleware.ts → proxy.ts に改名、関数名も middleware → proxy
- viewport は metadata から分離して `export const viewport: Viewport = {}` で別エクスポート
- CSS: @import url() は @import "tailwindcss" の前に書く

## ファイル構成
- Next.jsアプリ: /七福ライフハック/app/
- DB スキーマ: app/supabase/schema.sql
- シードスクリプト: app/scripts/seed.ts (npm run seed)
- GASコード: app/scripts/google-apps-script.js
- デプロイ手順: app/DEPLOY.md
