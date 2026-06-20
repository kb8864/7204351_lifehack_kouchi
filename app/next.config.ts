import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // React <ViewTransition> を有効化（一覧サムネ→詳細ヒーローの共有要素モーフ用）。
    // 非対応ブラウザでは自動的に通常遷移へフォールバックする。
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'profile.line-scdn.net',
      },
    ],
  },
};

export default nextConfig;
