import { cookies } from "next/headers"

import { errorResponse, successResponse } from "@/lib/server/api-response"
import { SESSION_COOKIE_NAME } from "@/lib/server/session"

/**
 * 로그아웃 API (POST /api/auth/logout)
 *
 * 세션 쿠키를 삭제하면 다음 요청부터 미들웨어가 비로그인으로 판단한다.
 */
export async function POST() {
  try {
    // 현재 요청의 쿠키 저장소에서 세션 쿠키를 제거
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
    return successResponse({ message: "로그아웃되었습니다." })
  } catch (error) {
    // 쿠키 접근/삭제 중 예외가 나도 통일된 JSON 응답 계약(ApiResponse)을 유지한다.
    // (try/catch 없이 throw 되면 Next.js 가 500 HTML 을 반환해 클라이언트 .json() 파싱이 깨진다)
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "로그아웃 처리 중 오류가 발생했습니다.",
      500,
      { cause: error instanceof Error ? error.message : String(error) },
    )
  }
}
