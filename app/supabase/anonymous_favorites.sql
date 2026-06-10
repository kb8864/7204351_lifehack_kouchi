-- anonymous_favorites テーブル作成 (冪等)
-- Supabase SQL Editor で手動実行してください。
-- 既にテーブルが存在する場合は何もしません。

CREATE TABLE IF NOT EXISTS anonymous_favorites (
  uid         TEXT        NOT NULL,
  lifehack_id INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (uid, lifehack_id)
);

CREATE INDEX IF NOT EXISTS idx_anon_fav_lifehack_id ON anonymous_favorites(lifehack_id);

-- RLS を有効化（anon からの直接アクセスは許可しない。service role のみ使用）
ALTER TABLE anonymous_favorites ENABLE ROW LEVEL SECURITY;

-- 注意: anon キー用のポリシーは作成しません。
-- アプリサーバーは SUPABASE_SERVICE_ROLE_KEY を使用するため RLS をバイパスします。
