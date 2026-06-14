/**
 * 모든 API 응답이 동일한 형태를 갖도록 강제하는 공통 타입 정의
 * (CLAUDE.md 규칙: "모든 API의 응답 형식은 통일")
 *
 * 성공/실패를 success 플래그로 구분하는 판별 유니온(discriminated union)이다.
 * 클라이언트에서 `if (res.success)` 로 분기하면, TypeScript 가
 * data / error 의 존재 여부를 자동으로 좁혀서 추론해준다.
 */

// 에러 상세 정보
export interface ApiError {
  // 클라이언트가 분기 처리에 사용할 수 있는 에러 코드 (예: "VALIDATION_ERROR")
  code: string
  // 사용자/개발자에게 보여줄 에러 메시지
  message: string
}

// 성공 응답: 항상 data 를 포함
export interface ApiSuccessResponse<TData> {
  success: true
  data: TData
}

// 실패 응답: 항상 error 를 포함
export interface ApiErrorResponse {
  success: false
  error: ApiError
}

// 최종 응답 타입: 성공 또는 실패 둘 중 하나
export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse
