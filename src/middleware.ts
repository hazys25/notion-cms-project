import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE_NAME, verifySession } from "@/lib/server/session"

/**
 * 인증 미들웨어 — 모든 페이지 요청을 가로채 로그인 여부를 확인한다.
 *
 * 정책: "전체 보호 + /login 예외"
 *   - 로그인하지 않은 사용자가 보호된 페이지에 접근하면 /login 으로 보낸다.
 *   - 이미 로그인한 사용자가 /login 에 접근하면 홈(/)으로 보낸다.
 *
 * 미들웨어는 Edge 런타임에서 실행되며, jose 기반 verifySession 으로 JWT 를 검증한다.
 */

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = ["/login"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 인증 API(/api/auth/*)는 로그인 전에도 호출되어야 하므로 항상 통과시킨다.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // 현재 요청이 공개 경로인지 판단
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )

  // 세션 쿠키를 검증해 로그인 여부 확인
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = await verifySession(token)
  const isLoggedIn = session !== null

  // 1) 로그인한 사용자가 /login 에 오면 홈으로 리다이렉트
  if (isLoggedIn && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 2) 비로그인 사용자가 보호된 경로에 오면 /login 으로 리다이렉트
  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 그 외에는 그대로 통과
  return NextResponse.next()
}

// 미들웨어를 적용할 경로 패턴
// (정적 파일/이미지/파비콘 등은 검사에서 제외해 불필요한 실행을 막는다)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
