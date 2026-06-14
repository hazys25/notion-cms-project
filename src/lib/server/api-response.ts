import { NextResponse } from "next/server"

import { logger } from "@/lib/server/logger"
import type { ApiError, ApiResponse } from "@/types/api"

/**
 * 통일된 "성공" 응답을 생성하는 헬퍼
 *
 * 모든 라우트 핸들러가 이 함수로 응답하면 응답 형태가 항상 동일해진다.
 *
 * @param data   응답 본문에 담을 데이터
 * @param status HTTP 상태 코드 (기본 200 OK)
 */
export function successResponse<TData>(
  data: TData,
  status: number = 200,
): NextResponse<ApiResponse<TData>> {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * 통일된 "실패" 응답을 생성하는 헬퍼
 *
 * 에러를 로그로 적재한 뒤 일관된 형태로 응답한다.
 * (CLAUDE.md 규칙: 에러 탐지 시 반드시 로그 적재)
 *
 * @param code    에러 코드 (클라이언트 분기용, 예: "VALIDATION_ERROR")
 * @param message 에러 메시지
 * @param status  HTTP 상태 코드 (기본 400 Bad Request)
 * @param context 로그에 함께 남길 부가 정보 (선택)
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  context?: Record<string, unknown>,
): NextResponse<ApiResponse<never>> {
  // 에러 탐지 시 로그 적재
  logger.error(message, { code, status, ...context })

  const error: ApiError = { code, message }
  return NextResponse.json({ success: false, error }, { status })
}
