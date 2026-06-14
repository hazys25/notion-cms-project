---
name: project-architecture
description: 이 프로젝트의 핵심 아키텍처 — 인증 흐름, API 계약, Supabase 클라이언트 이중 구조, 검증 스키마 위치
metadata:
  type: project
---

## 인증 3파일 흐름

- `src/lib/auth/session.ts` — JWT 발급(signSession)/검증(verifySession). jose 사용. 쿠키명 `admin_session`, 유효기간 `SESSION_MAX_AGE = 60*60*8`. SESSION_SECRET 없으면 throw.
- `src/middleware.ts` — 전체 보호 + /login 예외. `/api/auth/*` 통과, 정적파일 matcher 제외. PUBLIC_PATHS = ["/login"].
- `src/app/api/auth/login/route.ts` — timingSafeEqual 로 타이밍 안전 비교, HTTP-only 쿠키 발급. `isEqualSafe()` 내부 헬퍼 함수로 wrapping.
- `src/app/api/auth/logout/route.ts` — 쿠키 삭제만. 에러 핸들링 없음(주목).

## API 응답 계약

- `src/types/api.ts` — ApiResponse<T> 판별 유니온 (success: true → data, success: false → error).
- `src/lib/api/api-response.ts` — successResponse(data, status?), errorResponse(code, message, status?, context?). errorResponse 내부에서 logger.error 자동 호출.
- `src/lib/api/logger.ts` — write() 내부 함수로 level별 콘솔 출력. 외부 서비스 교체 고려 설계.

## Supabase 이중 클라이언트

- `src/lib/supabase/client.ts` — createBrowserClient() 동기. 클라이언트 컴포넌트 전용.
- `src/lib/supabase/server.ts` — createServerClient() async, await cookies() 필수. 서버 컴포넌트/라우트/액션 전용.

## 검증 스키마

- `src/schemas/login-schema.ts` — loginSchema (Zod). login/page.tsx(zodResolver)와 api/auth/login/route.ts(safeParse) 공유.

## 환경변수

- SESSION_SECRET (필수 — 없으면 throw)
- ADMIN_USERNAME, ADMIN_PASSWORD (필수 — 없으면 SERVER_CONFIG_ERROR 500 반환)
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (비필수 — ! 단언 사용 중)

**Why:** 이 구조를 숙지해야 인증/API 관련 코드 리뷰에서 맥락 없이 잘못된 지적을 피할 수 있다.
**How to apply:** 인증·API·Supabase 관련 코드 변경 시 3파일 정합성과 클라이언트 혼용 여부를 반드시 확인.
