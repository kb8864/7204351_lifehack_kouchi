-- ================================================
-- 七福ライフハック: 複数カテゴリ所属・並び順・タグ上書き 移行SQL
-- Supabase SQL Editor で1回だけ実行してください（既存データは保持されます）
-- ================================================

-- ------------------------------------------------
-- 1) category の CHECK 制約を撤廃
--    （practice / festival が弾かれていた問題の修正。
--     カテゴリの妥当性はアプリ側 CATEGORY_SLUGS で検証する）
-- ------------------------------------------------
ALTER TABLE lifehacks DROP CONSTRAINT IF EXISTS lifehacks_category_check;

-- ------------------------------------------------
-- 2) 配置テーブル（どのライフハックを・どのカテゴリに・どの順番で出すか）
--    display_id = 統一ID（JSONライフハック: 1〜76 / フォーム投稿: Supabase id + 10000）
--    1ライフハックは複数カテゴリに行を持てる（＝またがって表示）
--    position = カテゴリ内の表示順（小さいほど先頭）
--    「配置行が1行でもある」ライフハック＝管理済み。その行集合が所属カテゴリの正となる。
--    配置行が無いライフハック＝未管理。元の単一カテゴリにデフォルト順で表示される。
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS lifehack_placements (
  display_id INTEGER NOT NULL,
  category   TEXT    NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (display_id, category)
);

CREATE INDEX IF NOT EXISTS idx_placements_category ON lifehack_placements(category, position);
CREATE INDEX IF NOT EXISTS idx_placements_display_id ON lifehack_placements(display_id);

-- ------------------------------------------------
-- 3) タグ上書きテーブル（存在すれば元タグを置き換える。JSON・投稿いずれにも適用）
--    display_id ごとに、表示したいタグ配列をそのまま保持する
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS lifehack_tag_overrides (
  display_id INTEGER PRIMARY KEY,
  tags       TEXT[]  NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------
-- 4) RLS: サーバーは service role（RLSバイパス）で読み書きするため、
--    公開ポリシーは作らない（anon からは読めない＝サーバー経由のみ）
-- ------------------------------------------------
ALTER TABLE lifehack_placements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifehack_tag_overrides ENABLE ROW LEVEL SECURITY;
