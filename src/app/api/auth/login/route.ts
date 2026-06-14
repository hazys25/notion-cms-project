import { timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { type NextRequest } from "next/server"

import { errorResponse, successResponse } from "@/lib/server/api-response"
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  signSession,
} from "@/lib/server/session"
import { logger } from "@/lib/server/logger"
import { loginSchema } from "@/schemas/login-schema"

/**
 * 두 문자열을 "타이밍 공격에 안전하게" 비교한다.
 *
 * 일반 비교(===)는 일치하는 글자 수에 따라 응답 시간이 미세하게 달라져
 * 비밀번호를 추측당할 수 있다. timingSafeEqual 은 항상 일정한 시간이 걸리도록 비교한다.
 */
function isEqualSafe(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  // 길이가 다르면 timingSafeEqual 이 throw 하므로 비교할 수 없다.
  // 단, 여기서 곧장 return 하면 "길이 일치 여부"가 응답 시간으로 새어나갈 수 있어,
  // 의도적으로 동일 길이 더미 비교(bufferA vs bufferA)를 한 번 수행해 실행 시간을 균일화한 뒤 false 를 반환한다.
  if (bufferA.length !== bufferB.length) {
    timingSafeEqual(bufferA, bufferA)
    return false
  }
  return timingSafeEqual(bufferA, bufferB)
}

/**
 * 관리자 로그인 API (POST /api/auth/login)
 *
 * 흐름: 입력값 검증 → 환경변수의 관리자 계정과 대조 → 성공 시 세션 쿠키 발급
 */
export async function POST(request: NextRequest) {
  try {
    // 1) 요청 본문 파싱 + Zod 검증
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return errorResponse(
        "VALIDATION_ERROR",
        firstIssue?.message ?? "입력값이 올바르지 않습니다.",
        400,
      )
    }

    const { username, password } = parsed.data

    // 2) 서버에 설정된 관리자 계정 정보 (환경변수)
    const adminUsername = process.env.ADMIN_USERNAME
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminUsername || !adminPassword) {
      return errorResponse(
        "SERVER_CONFIG_ERROR",
        "관리자 계정이 서버에 설정되지 않았습니다.",
        500,
      )
    }

    // 3) 아이디/비밀번호 대조 (타이밍 공격에 안전한 비교)
    const isValid =
      isEqualSafe(username, adminUsername) &&
      isEqualSafe(password, adminPassword)

    if (!isValid) {
      // 어떤 항목이 틀렸는지 알려주지 않는다(보안). 로그인 실패 로그만 남긴다.
      logger.warn("로그인 실패", { username })
      return errorResponse(
        "INVALID_CREDENTIALS",
        "아이디 또는 비밀번호가 올바르지 않습니다.",
        401,
      )
    }

    // 4) 세션 JWT 발급 후 HTTP-only 쿠키에 저장
    const token = await signSession({ username })
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      // JavaScript 로 접근 불가 → XSS 로 토큰 탈취 방지
      httpOnly: true,
      // 운영 환경(HTTPS)에서는 secure 쿠키로 전송
      secure: process.env.NODE_ENV === "production",
      // CSRF 완화
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    })

    logger.info("로그인 성공", { username })
    return successResponse({ username })
  } catch (error) {
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "로그인 처리 중 오류가 발생했습니다.",
      500,
      { cause: error instanceof Error ? error.message : String(error) },
    )
  }
}
