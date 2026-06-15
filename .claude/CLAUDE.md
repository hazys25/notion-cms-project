# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 환경
- OS: Window11
- 언어: TypeScript
- 프레임워크: Next.js 15, React 19

## 기술 스택
- CSS: Tailwind CSS (v4)
- UI: shadcn/ui
- CMS: Notion API (`@notionhq/client`) — 게시글 콘텐츠의 단일 원본(SSOT)
- 검증: Zod
- 테마: next-themes (라이트/다크)
- API: Next.js API Routes / 서버 컴포넌트

> ℹ️ 이 저장소는 범용 스타터킷에서 출발했으나, 제품(PRD: "관심주식 뉴스 모음", Notion CMS 뉴스 블로그)에 맞춰 **인증·Supabase·Zustand·React Hook Form 등 미사용 스타터 잔재를 제거**했다. 공개 읽기 전용 블로그라 로그인/회원 기능은 범위 밖이다(PRD Non-Goals). 추후 관리 기능이 필요해지면 그때 도입한다.


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
- 외부 API(Notion) 호출 시 부하·요청 수(레이트리밋)를 고려하고, 필요 시 캐싱/ISR 로 호출을 줄인다
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
| `NOTION_API_KEY` | Notion 통합(Integration) 시크릿 키. 서버 전용 비밀값 (`src/lib/server/notion.ts` 에서 호출 시점 검증) |
| `NOTION_DATABASE_ID` | 게시글이 저장된 Notion 데이터베이스 ID |

> 두 값의 연결이 올바른지 `pnpm verify:notion`(`scripts/verify-notion.mjs`)으로 점검할 수 있다. 발급/설정 방법은 `.env.example` 주석 참고.

## 아키텍처 (큰 그림)

Next.js 15 App Router 기반. 개별 파일만 봐서는 안 보이는, 여러 파일이 엮이는 흐름 위주로 정리한다.

### 1. Notion CMS 데이터 흐름 (서버 전용)

게시글의 단일 원본은 Notion 데이터베이스다. 웹은 서버에서 Notion API 로 데이터를 읽어 렌더링한다.

- `src/lib/server/notion.ts` — `getNotionClient()`(호출 시점 `NOTION_API_KEY` 검증, 캐시 없이 매번 생성 — Vercel 서버리스 전제) / `getNotionDatabaseId()`. **서버 전용**(API 키 비밀값이라 `lib/server/` 에 둔다).
- 🔴 **API v5 2계층 구조 주의**: `@notionhq/client` v5(API `2025-09-03`)는 "데이터베이스 → 데이터소스(data source)" 구조다. 글 조회는 `notion.databases.query` 가 아니라 **`notion.dataSources.query({ data_source_id })`** 를 쓴다. `data_source_id` 는 `notion.databases.retrieve({ database_id })` 응답의 `data_sources[0].id` 에서 얻는다.
- `pnpm verify:notion`(`scripts/verify-notion.mjs`) — 키·DB 접근·속성 구조·데이터소스 조회를 한 번에 점검하는 검증 스크립트.

> 발행 규칙(PRD): 웹에는 `Status = 발행됨` 인 글만 노출한다(`초안` 제외).

### 2. 통일된 API 응답 계약

라우트 핸들러는 직접 `NextResponse.json` 하지 말고 헬퍼를 거친다.

- `src/types/api.ts` — `ApiResponse<T>` 는 `success` 플래그 기반 **판별 유니온**. `if (res.success)` 분기 시 `data`/`error` 가 자동 타입 좁혀짐.
- `src/lib/server/api-response.ts` — `successResponse(data, status?)` / `errorResponse(code, message, status?, context?)`. **`errorResponse` 는 내부에서 `logger.error` 로 자동 로그 적재**하므로, 에러 응답을 만들면 로깅 규칙이 함께 충족된다.
- `src/lib/server/logger.ts` — 공통 로거(현재 콘솔 출력, 인터페이스만 쓰면 추후 외부 서비스로 교체 용이).

새 API 라우트 패턴: `try` 안에서 Zod `safeParse` → 실패 시 `errorResponse("VALIDATION_ERROR", ...)`, 성공 처리 후 `successResponse(...)`, `catch` 에서 `errorResponse("INTERNAL_SERVER_ERROR", ..., 500)`.

### 3. 검증 스키마 일원화 (검증이 필요해질 때)

검증 규칙은 라우트/컴포넌트에 인라인하지 말고 `src/schemas/` 에 Zod 스키마로 두어, 클라이언트와 서버가 **같은 스키마 한 곳**을 재사용한다(`export type ... = z.infer<...>`). (현재는 검증 대상 폼/입력이 없어 `src/schemas/` 가 비어 있다 — 검색 등 입력 검증을 추가할 때 이 패턴을 따른다.)

### 4. `src/lib` 디렉토리 구분 — 실행 런타임 기준 (중요)

`lib` 하위는 **"어디서 실행되는가"** 로 폴더를 나눈다. 파일이 어느 폴더에 있는지로 import 가능 범위를 즉시 판단할 수 있다.

| 폴더 | 의미 | import 허용 위치 | 대표 파일 |
|------|------|------------------|-----------|
| `lib/server/` | **서버 전용** | route handler / server action / 서버 컴포넌트 | `api-response`, `logger`, `notion` |
| `lib/` 루트 | **양쪽 공유** | 어디서나 | `constants.ts`, `utils.ts`(shadcn 고정) |

- **혼용 금지**: `lib/server/*` 를 클라이언트 컴포넌트에서 import 하면 빌드 에러 또는 `NOTION_API_KEY` 등 서버 비밀값이 번들에 노출될 수 있다.
- 브라우저 전용 코드가 필요해지면 `lib/client/` 를 새로 만들어 둔다(현재는 없음).
- 공유(`types/`, 그리고 검증 추가 시 `schemas/`)는 `lib` 밖 `src` 최상위에 둔다(타입·검증은 런타임과 무관).

### UI / 테마 메모

- shadcn/ui 추가: `pnpm dlx shadcn@latest add <component>` (`components.json` 설정 존재).
- `@/lib/utils` 는 shadcn 표준 경로이므로 이동하지 않는다(설정·다수 컴포넌트가 참조).
- 테마: `next-themes` + `src/components/providers/theme-provider.tsx`. 기본 light, 시스템 자동전환 off. 디자인 토큰은 `src/app/globals.css` 의 CSS 변수(`--color-*`, `--radius-*`)와 Tailwind v4 `@theme` 로 정의.


