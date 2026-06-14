/**
 * 에러 및 이벤트 로그를 적재하는 공통 로거
 * (CLAUDE.md 규칙: "에러 핸들링 필수, 에러 탐지 시 로그 적재")
 *
 * 지금은 콘솔에 구조화된 로그를 출력하지만, 호출부는 이 인터페이스만 사용하므로
 * 추후 Sentry / Datadog 등 외부 로깅 서비스로 교체하기 쉽다.
 * (write 함수 내부 구현만 바꾸면 됨)
 */

// 로그 심각도 단계
type LogLevel = "info" | "warn" | "error"

// 로그에 함께 남길 부가 정보 (요청 경로, 사용자 id, 에러 원인 등)
type LogContext = Record<string, unknown>

// 실제 출력 로직 — 한곳에 모아 두면 출력 형식 변경/외부 전송 교체가 쉽다.
function write(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    // 발생 시각 (ISO 8601 형식)
    timestamp: new Date().toISOString(),
    ...context,
  }

  // 심각도에 따라 적절한 콘솔 메서드를 선택
  if (level === "error") {
    console.error(entry)
  } else if (level === "warn") {
    console.warn(entry)
  } else {
    console.info(entry)
  }
}

// 외부에서 사용하는 로거 객체
export const logger = {
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
}
