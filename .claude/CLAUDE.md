# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 환경
- OS: Window11
- 언어: TypeScript
- 프레임워크: Next.js 15, React 19

## 기술 스택
- CSS: Tailwind CSS
- UI: shadcn/ui
- 백엔드: Supabase (PostgreSQL + Auth + Storage + Realtime)
- 상태관리: Zustand
- 폼: React Hook Form, Zod
- API: Supabase Client, Next.js API Routes
- 파일 처리: Supabase Storage


## 언어 및 커뮤니케이션 규칙
- 기본 응답 언어: 한국어로 작성
- 코드 주석: 한국어로 작성
- 문서화: 한국어로 작성
- (중요)변수명/함수명: 영어로 작성(코드 표준 준수)

## 변수 생성 규칙
- (중요)변수 타입: 변수는 항상 사용하는 목적에 맞는 타입을 선택
- 변수명: 약어를 사용하지 않고 사용 목적에 맞는 풀네임을 선택하여 생성


## Git 규칙
- 커밋 메시지: 한국어와 영어 모두로 작성
- 브랜치명: feature/기능명 형식
- IMPORTANT: 커밋 전에 반드시 린트 실행

## 추가 사항
- DB 트랜잭션 처리 시 부하체크 필수
- 모든 API의 응답 형식은 통일
- 에러 핸들링 필수, 에러 탐지 시 로그 적재

## 명령어

패키지 매니저는 **pnpm** 입니다. (테스트 프레임워크는 아직 없음 — 검증은 lint + build 로 수행)

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 (http://localhost:3000) |
| `pnpm build` | 프로덕션 빌드 + 타입 검사 (파일 삭제/이동 후 잔여 참조 확인용으로도 사용) |
| `pnpm start` | 빌드 결과 실행 |
| `pnpm lint` | ESLint 검사 — **커밋 전 필수** |

> 이 PC의 pnpm 실행 주의사항(PATH/corepack)은 사용자 메모리 `pnpm-setup.md` 참고.

## 필수 환경변수 (`.env.local`)

| 변수 | 용도 |
|------|------|
| `SESSION_SECRET` | JWT 세션 서명 키. **없으면 인증 전체가 throw** (`src/lib/auth/session.ts`) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 관리자 로그인 계정 (env 기반 단일 계정) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 연결 (사용 시) |

## 아키텍처 (큰 그림)

Next.js 15 App Router 기반. 개별 파일만 봐서는 안 보이는, 여러 파일이 엮이는 흐름 위주로 정리한다.

### 1. 인증 흐름 — 전체 보호 + `/login` 예외

세 파일이 하나의 흐름을 이룬다. 인증을 건드릴 땐 셋을 함께 봐야 한다.

- `src/lib/server/session.ts` — JWT 발급(`signSession`)/검증(`verifySession`). `jose` 사용으로 **Node·Edge 양쪽 호환**. 쿠키명 `admin_session`, 유효기간 8시간 상수도 여기 정의.
- `src/middleware.ts` — **모든 페이지를 가로채** 세션 검증. 비로그인 → `/login`, 로그인 상태로 `/login` 접근 → `/`. `/api/auth/*` 는 항상 통과(로그인 전 호출 필요), 정적 파일은 `matcher` 로 제외.
- `src/app/api/auth/login/route.ts` — env 계정과 **타이밍 안전 비교**(`timingSafeEqual`) 후 HTTP-only 쿠키 발급. 로그아웃은 `api/auth/logout/route.ts` 에서 쿠키 삭제.

> 페이지 보호는 미들웨어가 일괄 담당하므로, 개별 페이지에 인증 가드를 중복으로 넣지 않는다.

### 2. 통일된 API 응답 계약

라우트 핸들러는 직접 `NextResponse.json` 하지 말고 헬퍼를 거친다.

- `src/types/api.ts` — `ApiResponse<T>` 는 `success` 플래그 기반 **판별 유니온**. `if (res.success)` 분기 시 `data`/`error` 가 자동 타입 좁혀짐.
- `src/lib/server/api-response.ts` — `successResponse(data, status?)` / `errorResponse(code, message, status?, context?)`. **`errorResponse` 는 내부에서 `logger.error` 로 자동 로그 적재**하므로, 에러 응답을 만들면 로깅 규칙이 함께 충족된다.
- `src/lib/server/logger.ts` — 공통 로거(현재 콘솔 출력, 인터페이스만 쓰면 추후 외부 서비스로 교체 용이).

새 API 라우트 패턴: `try` 안에서 Zod `safeParse` → 실패 시 `errorResponse("VALIDATION_ERROR", ...)`, 성공 처리 후 `successResponse(...)`, `catch` 에서 `errorResponse("INTERNAL_SERVER_ERROR", ..., 500)`. (`login/route.ts` 가 표준 예시)

### 3. Supabase 이중 클라이언트

용도에 따라 import 경로가 다르다 — **혼용 금지**.

- `@/lib/client/supabase` (`createClient()`, 동기) → 클라이언트 컴포넌트(`"use client"`)용.
- `@/lib/server/supabase` (`createClient()`, **async — `await` 필요**) → 서버 컴포넌트/라우트 핸들러/서버 액션용. Next.js 15 의 비동기 `cookies()` 와 연동.

### 4. 검증 스키마 일원화

`src/schemas/` 의 Zod 스키마를 **클라이언트 폼과 서버 API 가 함께 재사용**한다. 예: `login-schema.ts` 를 `login/page.tsx`(RHF `zodResolver`)와 `api/auth/login/route.ts`(`safeParse`)가 공유 → 필드 규칙은 스키마 한 곳만 수정하면 양쪽 반영.

### 5. `src/lib` 디렉토리 구분 — 실행 런타임 기준 (중요)

`lib` 하위는 **"어디서 실행되는가"** 로 폴더를 나눈다. 파일이 어느 폴더에 있는지로 import 가능 범위를 즉시 판단할 수 있다.

| 폴더 | 의미 | import 허용 위치 | 대표 파일 |
|------|------|------------------|-----------|
| `lib/server/` | **서버 전용** | route handler / server action / 서버 컴포넌트 / `middleware.ts` | `api-response`, `logger`, `session`, `supabase` |
| `lib/client/` | **브라우저 전용** | 클라이언트 컴포넌트(`"use client"`) | `supabase` |
| `lib/` 루트 | **양쪽 공유** | 어디서나 | `constants.ts`, `utils.ts`(shadcn 고정) |

- **혼용 금지**: `lib/server/*` 를 클라이언트 컴포넌트에서 import 하면 빌드 에러 또는 `SESSION_SECRET` 등 서버 비밀값이 번들에 노출될 수 있다.
- 공유(`schemas/`, `types/`)는 `lib` 밖 `src` 최상위에 둔다(검증·타입은 런타임과 무관).

### UI / 테마 메모

- shadcn/ui 추가: `pnpm dlx shadcn@latest add <component>` (`components.json` 설정 존재).
- `@/lib/utils` 는 shadcn 표준 경로이므로 이동하지 않는다(설정·다수 컴포넌트가 참조).
- 테마: `next-themes` + `src/components/providers/theme-provider.tsx`. 기본 light, 시스템 자동전환 off. 디자인 토큰은 `src/app/globals.css` 의 CSS 변수(`--color-*`, `--radius-*`)와 Tailwind v4 `@theme` 로 정의.


