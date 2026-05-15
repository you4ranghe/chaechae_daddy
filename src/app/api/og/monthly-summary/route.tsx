import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

function formatWon(n: number): string {
  if (n >= 100_000_000) return `₩${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000_000) return `₩${(n / 10_000_000).toFixed(1)}천만`;
  if (n >= 1_000_000) return `₩${(n / 1_000_000).toFixed(1)}백만`;
  if (n >= 10_000) return `₩${Math.round(n / 10_000)}만`;
  return `₩${n.toLocaleString()}`;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const completed = Math.max(0, parseInt(sp.get("completed") || "0", 10) || 0);
  const revenue = Math.max(0, parseInt(sp.get("revenue") || "0", 10) || 0);
  const handle = (sp.get("handle") || "creator").slice(0, 30);
  const month = sp.get("month") || defaultMonth();
  const acceptRate = Math.max(0, Math.min(100, parseInt(sp.get("acceptRate") || "0", 10) || 0));

  const fontsDir = path.join(process.cwd(), "public", "fonts");
  const [bold, regular] = await Promise.all([
    readFile(path.join(fontsDir, "Pretendard-Bold.otf")),
    readFile(path.join(fontsDir, "Pretendard-Regular.otf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0F172A",
          color: "white",
          position: "relative",
          fontFamily: "Pretendard",
          padding: 72,
        }}
      >
        {/* 배경 블롭 */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -180,
            width: 600,
            height: 600,
            borderRadius: 9999,
            backgroundColor: "#6366F1",
            opacity: 0.45,
            filter: "blur(80px)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -120,
            width: 480,
            height: 480,
            borderRadius: 9999,
            backgroundColor: "#EC4899",
            opacity: 0.3,
            filter: "blur(80px)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 280,
            right: 180,
            width: 200,
            height: 200,
            borderRadius: 9999,
            backgroundColor: "#A855F7",
            opacity: 0.35,
            filter: "blur(60px)",
            display: "flex",
          }}
        />

        {/* 상단: 브랜드 + 핸들 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  backgroundColor: "#6366F1",
                  display: "flex",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 2,
                display: "flex",
              }}
            >
              CW AGENT
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 999,
              padding: "10px 22px",
              fontSize: 22,
              fontWeight: 700,
              color: "#E0E7FF",
            }}
          >
            @{handle}
          </div>
        </div>

        {/* 중앙: 핵심 메시지 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#A5B4FC",
              letterSpacing: 4,
              marginBottom: 22,
              display: "flex",
            }}
          >
            {month.toUpperCase()} HIGHLIGHTS
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 18,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontSize: 220,
                fontWeight: 700,
                lineHeight: 1,
                background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
                backgroundClip: "text",
                color: "transparent",
                display: "flex",
              }}
            >
              {completed}
            </div>
            <div
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: "white",
                display: "flex",
              }}
            >
              건
            </div>
          </div>

          <div
            style={{
              fontSize: 38,
              fontWeight: 400,
              color: "#CBD5E1",
              marginTop: 4,
              display: "flex",
            }}
          >
            협찬을 완료했어요
          </div>
        </div>

        {/* 하단: 보조 지표 */}
        <div
          style={{
            display: "flex",
            gap: 16,
            zIndex: 1,
          }}
        >
          <MetricTile
            label="누적 수익"
            value={formatWon(revenue)}
            accent="#6366F1"
          />
          <MetricTile
            label="수락률"
            value={`${acceptRate}%`}
            accent="#EC4899"
          />
          <MetricTile
            label="기간"
            value={month}
            accent="#A855F7"
            small
          />
        </div>

        {/* 마이크로 푸터 */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 72,
            fontSize: 18,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: 1.5,
            display: "flex",
          }}
        >
          Made with CW Agent
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: [
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
        { name: "Pretendard", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}

function MetricTile({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent: string;
  small?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 20,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 18,
          color: "#CBD5E1",
          letterSpacing: 1,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: accent,
            display: "flex",
          }}
        />
        {label}
      </div>
      <div
        style={{
          fontSize: small ? 32 : 44,
          fontWeight: 700,
          color: "white",
          display: "flex",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function defaultMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}
