import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// 인증이 필요 없는 공개 경로
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/landing", "/pricing", "/api", "/onboarding"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

// Next.js 16에서는 middleware → proxy로 변경됨
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일, Next.js 내부 경로는 건너뛰기
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/fonts/") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|otf|ttf|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 요청 쿠키에 반영
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          // 응답 객체 갱신
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          // 응답 쿠키에 반영
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // 세션 갱신 (토큰 리프레시 포함)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 이미 로그인된 상태에서 로그인/회원가입 페이지 → 대시보드로
  if ((pathname === "/login" || pathname === "/signup") && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 온보딩 페이지는 인증 필요
  if (pathname.startsWith("/onboarding")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // 공개 경로는 인증 불필요
  if (isPublicPath(pathname)) {
    return response;
  }

  // 로그인 안 된 유저 → /login으로 리다이렉트
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|otf|ttf|woff|woff2)$).*)"],
};
