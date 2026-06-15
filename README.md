# 관심주식 뉴스 모음 (Notion CMS News Blog)

**Notion 을 CMS 로 활용한 관심 종목 뉴스 큐레이션 블로그**입니다.
전일 장마감 후 ~ 당일 장시작 전 사이 관심 종목 관련 기사를 수집하여, Notion 에서 일자별 게시글로 작성하면
자동으로 블로그에 반영됩니다. (별도 관리자 화면 없이 Notion 편집만으로 콘텐츠 운영)

- 📋 **제품 요구사항:** [`docs/PRD.md`](docs/PRD.md) 참고
- 🗺️ **개발 로드맵:** [`docs/ROADMAP.md`](docs/ROADMAP.md) 참고

> ℹ️ **현재 상태:** Next.js 15 스타터킷에서 출발했으나, 제품(Notion CMS 뉴스 블로그)에 맞춰
> **미사용 스타터 잔재(관리자 인증·Supabase·Zustand·React Hook Form)를 제거**했습니다.
> 공개 읽기 전용 블로그이므로 로그인/회원 기능은 범위 밖입니다(PRD Non-Goals).
> Notion 연동 기반(`@notionhq/client`)은 구성되어 있으며, 글 목록/상세 페이지는 PRD·로드맵에 따라 **순차 구현 예정**입니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) + React 19 |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| UI | shadcn/ui (Base UI 기반) |
| CMS | Notion API (`@notionhq/client`) — 콘텐츠 단일 원본(SSOT) |
| 검증 | Zod |
| 테마 | next-themes (라이트/다크) |
| 패키지 매니저 | pnpm |

## 빠른 시작

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경변수 파일 생성
cp .env.example .env.local        # Windows PowerShell: Copy-Item .env.example .env.local
#   → .env.local 에 NOTION_API_KEY / NOTION_DATABASE_ID 를 채워 넣으세요.

# 3. Notion 연결 검증 (선택)
pnpm verify:notion

# 4. 개발 서버 실행
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열면 현재는 최소 홈 화면이 표시됩니다.
(발행 글 목록은 구현 3단계에서 이 자리에 추가됩니다.)

## 주요 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 (파일 삭제/이동 후 잔여 참조 확인용으로도 사용) |
| `pnpm start` | 빌드 결과 실행 |
| `pnpm lint` | ESLint 검사 (**커밋 전 필수**) |
| `pnpm verify:notion` | Notion 키·DB·속성 구조 연결 검증 (`scripts/verify-notion.mjs`) |

## 폴더 구조

```
src/
├─ app/
│  ├─ layout.tsx             # 루트 레이아웃 (테마 Provider + 전역 Toaster)
│  ├─ page.tsx               # 홈 (현재는 최소 플레이스홀더 → 추후 글 목록)
│  └─ globals.css            # Tailwind v4 + 테마 토큰
├─ components/
│  ├─ ui/                    # shadcn/ui 컴포넌트 (button, input, card, sonner)
│  ├─ common/                # 프로젝트 공통 컴포넌트 (theme-toggle)
│  └─ providers/             # 전역 Provider (theme-provider)
├─ lib/                      # 실행 런타임 기준으로 구분 (server / 공유)
│  ├─ server/                # 서버 전용 — route handler · server action · 서버 컴포넌트에서만 import
│  │  ├─ api-response.ts     # successResponse / errorResponse 헬퍼
│  │  ├─ logger.ts           # 공통 로거 (에러 적재)
│  │  └─ notion.ts           # Notion 클라이언트 (API 키 비밀값 — 서버 전용)
│  ├─ constants.ts           # 공유 상수 (SITE_NAME 등)
│  └─ utils.ts               # cn() 등 유틸 (shadcn 표준 경로 — 이동 금지)
└─ types/                    # 공유 — 타입 정의
   └─ api.ts                 # ApiResponse<T> 등 공통 타입
```

> **`lib/` 구분 규칙**: `lib/server/` = 서버 전용, `lib/` 루트(`constants`·`utils`) = 양쪽 공유. **혼용 금지** — 서버 코드(`NOTION_API_KEY` 사용)를 클라이언트 컴포넌트에서 import하면 빌드가 깨지거나 비밀값이 노출될 수 있습니다. (브라우저 전용 코드가 필요해지면 `lib/client/` 를 새로 만듭니다.)

## 핵심 규칙 (CLAUDE.md 기반)

- **통일된 API 응답**: 모든 라우트 핸들러는 `successResponse` / `errorResponse` 로 응답합니다.
  응답은 항상 `{ success, data }` 또는 `{ success, error }` 형태입니다. (`src/types/api.ts`)
- **에러 핸들링 + 로깅**: 에러 발생 시 `logger` 로 로그를 적재합니다. (`errorResponse` 내부에서 자동 처리)
- **검증 일원화**: 입력 검증이 필요해지면 Zod 스키마(`src/schemas`)를 클라이언트와 서버가 함께 재사용합니다.
- **코드 컨벤션**: 주석/문서는 한국어, 변수·함수명은 영어 풀네임으로 작성합니다.

## Notion CMS 연동

게시글의 단일 원본은 Notion 데이터베이스입니다. 웹은 서버에서 Notion API 로 데이터를 읽어 렌더링합니다.

1. [notion.so/my-integrations](https://www.notion.so/my-integrations) 에서 통합(Integration)을 생성하고 시크릿 키를 복사합니다.
2. PRD §5 구조(`Title`/`Category`/`Tags`/`Published`/`Status`)로 데이터베이스를 만들고, 통합을 해당 DB 에 Connection 으로 연결합니다.
3. `.env.local` 에 `NOTION_API_KEY` / `NOTION_DATABASE_ID` 를 입력한 뒤 `pnpm verify:notion` 으로 연결을 확인합니다.

```ts
// 서버 컴포넌트 / 라우트 핸들러에서만 사용 (API 키는 비밀값)
import { getNotionClient, getNotionDatabaseId } from "@/lib/server/notion";
```

> 🔴 **API v5 주의**: `@notionhq/client` v5 는 "데이터베이스 → 데이터소스" 2계층 구조라,
> 글 조회는 `notion.dataSources.query({ data_source_id })` 를 사용합니다.
> (`data_source_id` 는 `notion.databases.retrieve` 응답의 `data_sources[0].id`)

## 다음 단계

PRD §8 구현 단계를 따릅니다.

- **글 목록 페이지** — 발행 글(`Status = 발행됨`)을 `Published` 기준 최신순 카드 목록으로 표시
- **글 상세 페이지** — Notion 페이지 본문(블록) 렌더링
- **카테고리 필터 / 검색** — `Category`·제목/태그 기반 탐색
- **반응형/캐싱 최적화** — 모바일·데스크톱 대응, ISR 등으로 Notion 호출 최소화
