// Instagram Graph API 클라이언트 (Facebook Login for Business 기반)
// 필요 환경변수:
//   META_APP_ID, META_APP_SECRET, META_REDIRECT_URI
//
// 인스타 비즈니스/크리에이터 계정만 Insights API 지원.
// OAuth는 facebook.com 도메인 — 사용자가 페이스북 페이지 연결 필요.

const FB_BASE = "https://graph.facebook.com/v21.0";
const FB_OAUTH = "https://www.facebook.com/v21.0/dialog/oauth";

const REQUIRED_SCOPES = [
  "instagram_basic",
  "instagram_manage_insights",
  "instagram_manage_messages",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "business_management",
];

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("META_APP_ID"),
    redirect_uri: requireEnv("META_REDIRECT_URI"),
    state,
    scope: REQUIRED_SCOPES.join(","),
    response_type: "code",
  });
  return `${FB_OAUTH}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  expires_in?: number;
}> {
  const params = new URLSearchParams({
    client_id: requireEnv("META_APP_ID"),
    client_secret: requireEnv("META_APP_SECRET"),
    redirect_uri: requireEnv("META_REDIRECT_URI"),
    code,
  });
  const res = await fetch(`${FB_BASE}/oauth/access_token?${params.toString()}`);
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// 단기(1~2시간) → 장기(60일) 토큰 교환
export async function exchangeForLongLivedToken(shortToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: requireEnv("META_APP_ID"),
    client_secret: requireEnv("META_APP_SECRET"),
    fb_exchange_token: shortToken,
  });
  const res = await fetch(`${FB_BASE}/oauth/access_token?${params.toString()}`);
  if (!res.ok) throw new Error(`long-lived exchange failed: ${res.status}`);
  return res.json();
}

// 사용자의 페이지 목록 → 인스타 비즈니스 계정 찾기
export async function findInstagramBusinessAccount(token: string): Promise<{
  pageId: string;
  pageAccessToken: string;
  igUserId: string;
  igUsername: string;
} | null> {
  const pagesRes = await fetch(
    `${FB_BASE}/me/accounts?fields=id,access_token,instagram_business_account&access_token=${token}`,
  );
  if (!pagesRes.ok) throw new Error(`pages fetch failed: ${pagesRes.status}`);
  const pages = (await pagesRes.json()) as {
    data: Array<{
      id: string;
      access_token: string;
      instagram_business_account?: { id: string };
    }>;
  };

  for (const page of pages.data || []) {
    if (!page.instagram_business_account?.id) continue;
    const igId = page.instagram_business_account.id;
    const igRes = await fetch(
      `${FB_BASE}/${igId}?fields=username&access_token=${page.access_token}`,
    );
    if (!igRes.ok) continue;
    const ig = (await igRes.json()) as { username?: string };
    return {
      pageId: page.id,
      pageAccessToken: page.access_token,
      igUserId: igId,
      igUsername: ig.username || "",
    };
  }
  return null;
}

// 프로필 인사이트 — 팔로워, 미디어 카운트, 최근 30일 지표
export async function fetchAccountInsights(
  igUserId: string,
  accessToken: string,
): Promise<{
  followers: number;
  follows: number;
  mediaCount: number;
  impressions: number;
  reach: number;
  profileViews: number;
}> {
  // 기본 카운터
  const profileRes = await fetch(
    `${FB_BASE}/${igUserId}?fields=followers_count,follows_count,media_count&access_token=${accessToken}`,
  );
  const profile = (await profileRes.json()) as {
    followers_count?: number;
    follows_count?: number;
    media_count?: number;
  };

  // Insights API — 최근 30일 일별 합산
  const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  const insightsRes = await fetch(
    `${FB_BASE}/${igUserId}/insights?metric=impressions,reach,profile_views&period=day&since=${since}&access_token=${accessToken}`,
  );
  const insights = (await insightsRes.json()) as {
    data?: Array<{ name: string; values: Array<{ value: number }> }>;
  };

  const sumMetric = (name: string): number => {
    const m = insights.data?.find((d) => d.name === name);
    if (!m) return 0;
    return m.values.reduce((sum, v) => sum + (v.value || 0), 0);
  };

  return {
    followers: profile.followers_count || 0,
    follows: profile.follows_count || 0,
    mediaCount: profile.media_count || 0,
    impressions: sumMetric("impressions"),
    reach: sumMetric("reach"),
    profileViews: sumMetric("profile_views"),
  };
}

// 특정 미디어의 인사이트
export async function fetchMediaInsights(
  mediaId: string,
  accessToken: string,
): Promise<{
  likes: number;
  comments: number;
  reach: number;
  impressions: number;
  saves: number;
}> {
  const res = await fetch(
    `${FB_BASE}/${mediaId}?fields=like_count,comments_count,insights.metric(reach,impressions,saved)&access_token=${accessToken}`,
  );
  const data = (await res.json()) as {
    like_count?: number;
    comments_count?: number;
    insights?: { data: Array<{ name: string; values: Array<{ value: number }> }> };
  };

  const getInsight = (name: string): number => {
    const m = data.insights?.data?.find((d) => d.name === name);
    return m?.values?.[0]?.value || 0;
  };

  return {
    likes: data.like_count || 0,
    comments: data.comments_count || 0,
    reach: getInsight("reach"),
    impressions: getInsight("impressions"),
    saves: getInsight("saved"),
  };
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`환경변수 ${key}가 필요합니다.`);
  return v;
}
