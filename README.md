# 관심주식 뉴스 모음 (Notion CMS News Blog)

**Notion 을 CMS 로 활용한 관심 종목 뉴스 큐레이션 블로그**입니다.
전일 장마감 후 ~ 당일 장시작 전 사이 관심 종목 관련 기사를 수집하여, Notion 에서 일자별 게시글로 작성하면
자동으로 블로그에 반영됩니다. (별도 관리자 화면 없이 Notion 편집만으로 콘텐츠 운영)

- 📋 **제품 요구사항:** [`docs/PRD.md`](docs/PRD.md) 참고
- 🗺️ **개발 로드맵:** [`docs/ROADMAP.md`](docs/ROADMAP.md) 참고

> ℹ️ **현재 상태:** 이 저장소는 Next.js 15 풀스택 **스타터킷(인증·DB·폼 검증 골격)** 위에서 출발합니다.
> Notion 연동(`@notionhq/client`)·글 목록/상세 페이지는 PRD·로드맵에 따라 **순차 구현 예정**이며,
> 아래 문서는 현재 세팅되어 있는 기반 골격을 설명합니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) + React 19 |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| UI | shadcn/ui (Base UI 기반) |
| 백엔드 | Supabase (`@supabase/ssr`) |
| 상태관리 | Zustand |
| 폼 / 검증 | React Hook Form + Zod |
| 패키지 매니저 | pnpm |

## 빠른 시작

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경변수 파일 생성 (Supabase 사용 시)
cp .env.example .env.local        # Windows PowerShell: Copy-Item .env.example .env.local
#   → .env.local 에 Supabase URL / anon 키를 채워 넣으세요.

# 3. 개발 서버 실행
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열면
스타터 킷의 특징을 소개하는 랜딩 화면이 나타납니다. (`/login` 으로 관리자 로그인 후 접근)

## 주요 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 빌드 결과 실행 |
| `pnpm lint` | ESLint 검사 (커밋 전 실행 권장) |

## 폴더 구조

```
src/
├─ app/
│  ├─ api/auth/              # 로그인 / 로그아웃 라우트 (통일된 API 응답 + 로깅)
│  ├─ layout.tsx             # 루트 레이아웃 (전역 Toaster 배치)
│  ├─ page.tsx               # 스타터킷 소개 랜딩 화면
│  └─ globals.css            # Tailwind v4 + 테마 토큰
├─ components/
│  ├─ ui/                    # shadcn/ui 컴포넌트 (button, input, card, form ...)
│  ├─ common/                # 프로젝트 공통 컴포넌트 (page-header, theme-toggle)
│  └─ providers/             # 전역 Provider (theme-provider)
├─ lib/                      # 실행 런타임 기준으로 구분 (server / client / 공유)
│  ├─ server/                # 서버 전용 — route handler · server action · middleware 에서만 import
│  │  ├─ api-response.ts     # successResponse / errorResponse 헬퍼
│  │  ├─ logger.ts           # 공통 로거 (에러 적재)
│  │  ├─ session.ts          # JWT 세션 발급/검증 (jose)
│  │  └─ supabase.ts         # 서버용 Supabase 클라이언트 (쿠키 연동)
│  ├─ client/                # 클라이언트(브라우저) 전용
│  │  └─ supabase.ts         # 브라우저용 Supabase 클라이언트
│  ├─ constants.ts           # 공유 상수
│  └─ utils.ts               # cn() 등 유틸 (shadcn 표준 경로 — 이동 금지)
├─ schemas/                  # 공유 — Zod 검증 (클라이언트 폼 + 서버 API 재사용)
│  └─ login-schema.ts        # 로그인 폼 Zod 검증 스키마
├─ types/                    # 공유 — 타입 정의
│  └─ api.ts                 # ApiResponse<T> 등 공통 타입
└─ middleware.ts             # 전체 페이지 보호 + 로그인 리다이렉트 (위치 고정)
```

> **`lib/` 구분 규칙**: `lib/server/` = 서버 전용, `lib/client/` = 브라우저 전용, `lib/` 루트(`constants`·`utils`) = 양쪽 공유. **혼용 금지** — 서버 코드를 클라이언트 컴포넌트에서 import하면 빌드가 깨지거나 비밀값이 노출될 수 있습니다.

## 핵심 규칙 (CLAUDE.md 기반)

- **통일된 API 응답**: 모든 라우트 핸들러는 `successResponse` / `errorResponse` 로 응답합니다.
  응답은 항상 `{ success, data }` 또는 `{ success, error }` 형태입니다. (`src/types/api.ts`)
- **에러 핸들링 + 로깅**: 에러 발생 시 `logger` 로 로그를 적재합니다. (`errorResponse` 내부에서 자동 처리)
- **검증 일원화**: Zod 스키마(`src/schemas`)를 클라이언트 폼과 서버 API 가 함께 재사용합니다.
- **코드 컨벤션**: 주석/문서는 한국어, 변수·함수명은 영어 풀네임으로 작성합니다.

## 관리자 인증

env 기반 ID/PW 를 **JWT 세션 쿠키(HTTP-only)** 로 관리하는 자체 인증이 포함되어 있습니다.
미들웨어가 모든 페이지를 보호하며, 비로그인 시 `/login` 으로 리다이렉트합니다. (`/login` 만 예외)

- 기본 계정: `.env.local` 의 `ADMIN_USERNAME` / `ADMIN_PASSWORD` (기본값 `admin` / 설정한 비밀번호)
- 세션 서명 키: `.env.local` 의 `SESSION_SECRET` (무작위 값, 외부 노출 금지)

| 파일 | 역할 |
|------|------|
| `src/middleware.ts` | 전체 페이지 보호 + 로그인 리다이렉트 |
| `src/lib/server/session.ts` | JWT 발급/검증 (jose, Edge 호환) |
| `src/app/api/auth/login/route.ts` | 로그인 (타이밍 안전 비교 후 쿠키 발급) |
| `src/app/api/auth/logout/route.ts` | 로그아웃 (쿠키 삭제) |
| `src/app/login/page.tsx` | 로그인 폼 (RHF + Zod) |

> ⚠️ 운영 환경에서는 `SESSION_SECRET` 을 반드시 새 값으로 교체하고, 단일 관리자 계정 대신
> Supabase Auth 등 사용자 DB 기반 인증으로 확장하는 것을 권장합니다.

## Supabase 사용 방법

이 스타터킷은 Supabase **클라이언트 설정**만 포함합니다. (실제 프로젝트 생성은 직접 진행)

1. [supabase.com](https://supabase.com) 에서 프로젝트를 생성합니다.
2. `Project Settings > API` 에서 URL 과 anon 키를 복사해 `.env.local` 에 입력합니다.
3. 사용처에 맞는 클라이언트를 import 합니다.

```ts
// 클라이언트 컴포넌트 ("use client")
import { createClient } from "@/lib/client/supabase";
const supabase = createClient();

// 서버 컴포넌트 / 라우트 핸들러 / 서버 액션
import { createClient } from "@/lib/server/supabase";
const supabase = await createClient();
```

## 다음 단계 (확장 아이디어)

- **인증 추가**: 세션 자동 갱신용 `middleware.ts` 와 로그인/회원가입 페이지 구성
- **DB 타입 생성**: `supabase gen types typescript` 로 DB 스키마 타입 자동 생성
- **컴포넌트 추가**: `pnpm dlx shadcn@latest add <component>` 로 필요한 UI 컴포넌트 설치
