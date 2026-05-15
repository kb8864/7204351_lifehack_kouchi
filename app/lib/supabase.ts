import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// クライアントサイド用（anon key、RLS適用）
export const createBrowserClient = () =>
  createClient(supabaseUrl, supabaseAnonKey)

// サーバーサイド用（service role key、RLSをバイパス）
export const createServerClient = () =>
  createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
