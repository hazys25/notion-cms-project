# 🗺️ 개발 로드맵 (ROADMAP)

> Next.js 15 풀스택 스타터킷의 개발 진행 상황을 추적하는 문서입니다.
> 완료된 작업은 ✅ 로 표시하며, `/docs:update-roadmap` 명령어로 갱신합니다.

---

## Phase 1: 프로젝트 기반 구축 ✅

프로젝트의 토대(빌드 환경·디자인 시스템·공통 UI)를 세우는 단계입니다.

- **Task 001: 프로젝트 초기 설정** ✅ - 완료
  - ✅ Next.js 15 App Router + React 19 + TypeScript 설정
  - ✅ Tailwind CSS v4 + PostCSS 구성
  - ✅ ESLint / tsconfig / pnpm 워크스페이스 설정
  - ✅ 환경변수 템플릿(`.env.example`) 정의

- **Task 002: 디자인 시스템 / 테마** ✅ - 완료
  - ✅ `globals.css` 디자인 토큰(CSS 변수 `--color-*`, `--radius-*`) 정의
  - ✅ `next-themes` 기반 라이트/다크 테마 프로바이더 구성
  - ✅ 테마 전환 토글 컴포넌트(`theme-toggle.tsx`) 구현
  - ✅ 랜딩 페이지(히어로/기술 소개/퀵 버튼/CTA) 구성

- **Task 003: 공통 UI 컴포넌트 라이브러리** ✅ - 완료
  - ✅ shadcn/ui 설치 및 `components.json` 설정
  - ✅ 기본 UI 컴포넌트 추가(button, input, card, form, label, textarea, dropdown-menu, sonner)
  - ✅ 프로젝트 공통 컴포넌트(`page-header`) 구성

---

## Phase 2: 인증 & API 기반 ✅

서비스 전반에서 재사용할 인증·응답·검증 골격을 마련하는 단계입니다.

- **Task 004: 관리자 인증 시스템** ✅ - 완료
  - ✅ JWT 세션 발급/검증 모듈(`session.ts`, `jose` 기반 Edge 호환)
  - ✅ 전체 페이지 보호 미들웨어(`middleware.ts`) + `/login` 리다이렉트
  - ✅ 로그인 라우트(타이밍 안전 비교 후 HTTP-only 쿠키 발급)
  - ✅ 로그아웃 라우트(쿠키 삭제)

- **Task 005: 통일된 API 응답 & 로깅** ✅ - 완료
  - ✅ `ApiResponse<T>` 판별 유니온 타입 정의(`types/api.ts`)
  - ✅ `successResponse` / `errorResponse` 헬퍼 구현
  - ✅ 공통 로거(`logger.ts`) + `errorResponse` 내부 자동 로그 적재

- **Task 006: 검증 스키마 일원화** ✅ - 완료
  - ✅ Zod 스키마 디렉터리(`src/schemas`) 구성
  - ✅ 로그인 스키마를 클라이언트 폼(RHF)과 서버 API(safeParse)가 공유
  - ✅ React Hook Form + `zodResolver` 연동

---

## Phase 3: 데이터 계층 확장 🚧

Supabase를 실제 데이터 소스로 연결하고 인증을 확장하는 단계입니다.

- **Task 007: Supabase 클라이언트 설정** ✅ - 완료
  - ✅ 브라우저용 클라이언트(`supabase/client.ts`)
  - ✅ 서버용 클라이언트(`supabase/server.ts`, 비동기 `cookies()` 연동)
  - ✅ 환경변수(`NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY`) 연결

- **Task 008: Supabase DB 스키마 & 타입 생성** - 우선순위
  - 데이터베이스 테이블 스키마 설계
  - `supabase gen types typescript` 로 DB 타입 자동 생성
  - 타입을 클라이언트/서버 쿼리에 적용

- **Task 009: 사용자 DB 기반 인증 확장** - 우선순위
  - env 단일 계정 → Supabase Auth(사용자 DB) 기반으로 확장
  - 회원가입 / 로그인 페이지 및 세션 자동 갱신 처리
  - 역할(role) 기반 접근 제어 도입

---

## Phase 4: 품질 & 확장 ⏳

테스트·상태관리·배포 등 운영 품질을 끌어올리는 단계입니다.

- **Task 010: 테스트 환경 구축** - 우선순위
  - 테스트 프레임워크(Vitest 등) 도입
  - 인증/API 응답 헬퍼 단위 테스트 작성
  - 핵심 사용자 흐름 통합 테스트 작성

- **Task 011: 상태관리(Zustand) 패턴 정립** - 우선순위
  - 전역 스토어 디렉터리 구조 정의
  - 인증/UI 상태 스토어 예시 구현
  - 서버 상태와 클라이언트 상태 분리 가이드 작성

- **Task 012: 배포 & CI 파이프라인** - 우선순위
  - 프로덕션 빌드/환경변수 운영 가이드 작성
  - 커밋 전 lint + build 검증 CI 구성
  - 배포 플랫폼(Vercel 등) 연동

---

**📅 최종 업데이트**: 2026-06-13
**📊 진행 상황**: Phase 1·2 완료, Phase 3 진행 중 (7/12 Tasks 완료, 58%)
