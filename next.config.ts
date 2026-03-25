import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 이미지 최적화 — Supabase Storage 등 외부 이미지 허용
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  // 서버 외부 패키지 번들링 제외 (Lambda 크기 최적화)
  serverExternalPackages: ["@anthropic-ai/sdk"],

  // 빌드 시 환경 변수 누락 감지용 헤더
  headers: async function () {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
