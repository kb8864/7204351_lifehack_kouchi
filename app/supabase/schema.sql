-- ================================================
-- 七福ライフハック Supabase スキーマ
-- Supabase SQL Editorで実行してください
-- ================================================

-- ユーザーテーブル（LINEログイン用）
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  picture_url  TEXT,
  is_admin     BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ライフハックテーブル
CREATE TABLE IF NOT EXISTS lifehacks (
  id          SERIAL PRIMARY KEY,
  title       TEXT,
  description TEXT NOT NULL,
  author      TEXT,
  link        TEXT,
  photo       TEXT,
  category    TEXT NOT NULL CHECK (category IN ('food', 'health', 'costume_make', 'other')),
  tags        TEXT[] DEFAULT '{}',
  is_approved BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- お気に入りテーブル
CREATE TABLE IF NOT EXISTS favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  lifehack_id INTEGER REFERENCES lifehacks(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lifehack_id)
);

-- 閲覧数テーブル（週間ランキング用）
CREATE TABLE IF NOT EXISTS views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lifehack_id INTEGER REFERENCES lifehacks(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- OGPキャッシュテーブル
CREATE TABLE IF NOT EXISTS ogp_cache (
  url         TEXT PRIMARY KEY,
  image_url   TEXT,
  cached_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- インデックス
-- ================================================
CREATE INDEX IF NOT EXISTS idx_lifehacks_category ON lifehacks(category);
CREATE INDEX IF NOT EXISTS idx_lifehacks_is_approved ON lifehacks(is_approved);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_lifehack_id ON favorites(lifehack_id);
CREATE INDEX IF NOT EXISTS idx_views_lifehack_id ON views(lifehack_id);
CREATE INDEX IF NOT EXISTS idx_views_viewed_at ON views(viewed_at);

-- ================================================
-- RLS (Row Level Security)
-- ================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifehacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE ogp_cache ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーを削除してから再作成
DROP POLICY IF EXISTS "lifehacks_select" ON lifehacks;
DROP POLICY IF EXISTS "favorites_select" ON favorites;
DROP POLICY IF EXISTS "views_insert" ON views;
DROP POLICY IF EXISTS "ogp_cache_select" ON ogp_cache;

-- lifehacks: 承認済みは全員読み取り可
CREATE POLICY "lifehacks_select" ON lifehacks
  FOR SELECT USING (is_approved = true);

-- favorites: anon insertは不可（API経由のservice roleのみ）
CREATE POLICY "favorites_select" ON favorites
  FOR SELECT USING (false);

-- views: 全員insert可
CREATE POLICY "views_insert" ON views
  FOR INSERT WITH CHECK (true);

-- ogp_cache: 読み取り可
CREATE POLICY "ogp_cache_select" ON ogp_cache
  FOR SELECT USING (true);

-- ================================================
-- お気に入り数を集計するビュー
-- ================================================
CREATE OR REPLACE VIEW lifehack_favorite_counts AS
SELECT
  lifehack_id,
  COUNT(*) as favorite_count
FROM favorites
GROUP BY lifehack_id;

-- ================================================
-- 週間ランキングビュー（過去7日間）
-- ================================================
CREATE OR REPLACE VIEW weekly_ranking AS
SELECT
  v.lifehack_id,
  COUNT(*) as view_count
FROM views v
WHERE v.viewed_at > NOW() - INTERVAL '7 days'
GROUP BY v.lifehack_id
ORDER BY view_count DESC
LIMIT 5;
