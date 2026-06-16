# 개발 로드맵 (ROADMAP)

> 근거 문서: docs/PRD.md (v1.0 · 2026-06-14) · 최종 생성일: 2026-06-16
> 상태 범례: 완료(✅) · 진행 중(🚧) · 예정(⏳)

---

## 개요

**관심주식 뉴스 모음** — Notion 데이터베이스를 단일 원본(SSOT)으로 삼아, 매 거래일 장시작 전에 발행된 관심 종목 뉴스 기사를 웹에서 읽기 좋게 보여주는 공개 읽기 전용 뉴스 큐레이션 블로그다.

이 로드맵은 PRD §8(구현 단계 1~5)을 골격으로 삼고, 의존성·완료 기준·우선순위를 보강하여 개발팀이 "지금 무엇을 해야 하고, 이 작업이 끝났는지 어떻게 아는가"를 스스로 판단할 수 있도록 작성됐다.

**MVP 범위:** Notion API 연동 → 글 목록(홈) → 글 상세(/posts/[id]) → 카테고리 필터(/category/[category]) → 검색 → 반응형/스타일 다듬기까지. 로그인·자동 수집·금융 데이터 연동은 MVP 외.

---

## 단계 요약 (의존성 순)

| Phase | 끝나면 가능해지는 것 | 핵심 작업 수 | 상태 |
|-------|---------------------|-------------|------|
| 1. 프로젝트 기반 | Next.js 15 앱이 로컬에서 돌아가고, 공통 UI/테마 사용 가능 | 3 | ✅ |
| 2. Notion 연동 기반 | 서버에서 Notion DB를 조회할 수 있고, 연결이 검증됨 | 3 | 🚧 |
| 3. 글 목록 (홈) | 발행된 글이 홈에 카드 그리드로 표시됨 | 3 | ✅ |
| 4. 글 상세 | 카드 클릭 시 /posts/[id]에서 본문이 렌더링됨 | 4 | ⏳ |
| 5. 카테고리 필터 | /category/[category]에서 카테고리별 글 목록을 볼 수 있음 | 2 | ⏳ |
| 6. 검색 | 제목/태그 키워드 검색으로 글을 걸러낼 수 있음 | 2 | ⏳ |
| 7. 스타일링 & 최적화 | 반응형/접근성/SEO/캐싱이 정리되어 배포 가능 상태 | 4 | ⏳ |

```
── MVP 경계: Phase 1 ~ 7 전체 ──────────────────────────────────────────────
   MVP 이후 확장(Phase 8)은 PRD §10 참고
```

---

## Phase 1: 프로젝트 기반 구축 ✅

> Next.js 15 앱이 로컬에서 실행되고, 디자인 시스템과 공통 UI를 사용할 수 있다.

- **Task 1-1: Next.js 15 + TypeScript + 빌드 환경 설정** ✅ (필수)
  - 무엇을: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, ESLint, pnpm, `.env.example` 초기 구성.
  - 완료 기준(DoD): `pnpm dev`가 오류 없이 실행되고, `pnpm lint` 및 `pnpm build`가 통과한다.
  - 의존성: 없음.
  - 근거(PRD): §4 기술 스택.

- **Task 1-2: 공통 레이아웃 및 테마 설정** ✅ (필수)
  - 무엇을: `src/app/layout.tsx`에 `lang="ko"` 설정, `ThemeProvider`(next-themes), 전역 폰트(Geist), 디자인 토큰(`globals.css`의 CSS 변수 `--color-*`/`--radius-*`) 구성.
  - 완료 기준(DoD): 라이트/다크 테마 토글이 동작하고, 디자인 토큰이 Tailwind v4 `@theme`에 반영된다.
  - 의존성: Task 1-1.
  - 근거(PRD): §4 Tailwind CSS, §7 기본 스타일링.

- **Task 1-3: shadcn/ui 기본 컴포넌트 설치** ✅ (필수)
  - 무엇을: `components.json` 설정, button / card / input / sonner 등 기본 UI 컴포넌트 추가, `@/lib/utils`(shadcn 표준 경로) 유지.
  - 완료 기준(DoD): `pnpm dlx shadcn@latest add <component>` 명령으로 신규 컴포넌트를 추가할 수 있다.
  - 의존성: Task 1-1.
  - 근거(PRD): §4 shadcn/ui.

---

## Phase 2: Notion 연동 기반 🚧

> 서버에서 Notion 데이터베이스를 안전하게 조회할 수 있고, 키·DB 속성 구조가 검증된다.

- **Task 2-1: Notion API 클라이언트 모듈 구현** ✅ (필수)
  - 무엇을: `src/lib/server/notion.ts`에 `getNotionClient()`(호출 시점 `NOTION_API_KEY` 검증), `getNotionDatabaseId()`, `getNotionDataSourceId()`(v5 2계층 구조 대응, data_source_id 캐시), `getPublishedPosts()`(Status=발행됨 필터, Published 내림차순) 구현. `src/types/post.ts`에 `Post` 타입 정의.
  - 완료 기준(DoD): 모듈이 `lib/server/`에 위치해 클라이언트 번들에 포함되지 않으며, `pnpm build`가 통과한다.
  - 의존성: Task 1-1.
  - 근거(PRD): §5 Notion DB 구조, §9 환경변수, §8 단계 1.

- **Task 2-2: Notion 검증 스크립트 작성** ✅ (필수)
  - 무엇을: `scripts/verify-notion.mjs` — `.env.local` 파싱, `databases.retrieve`로 DB 접근 확인, PRD §5 속성 구조(Title/Category/Tags/Published/Status) 대조, `dataSources.query` 조회 테스트.
  - 완료 기준(DoD): `pnpm verify:notion` 실행 시 "모든 검증 통과" 메시지가 출력된다.
  - 의존성: Task 2-1.
  - 근거(PRD): §5 Notion DB 구조, §9 환경변수.

- **Task 2-3: Notion 웹 설정 완료 및 환경변수 입력** 🚧 (필수)
  - 무엇을: Notion 에서 Integration(통합) 생성 → `NOTION_API_KEY` 발급, 게시글 데이터베이스에 Integration을 Connection으로 추가, `NOTION_DATABASE_ID` 확인, `.env.local`에 두 값 입력. `pnpm verify:notion`으로 통과 확인.
  - 완료 기준(DoD): `pnpm verify:notion`이 오류 없이 "모든 검증 통과"를 출력하고, Notion DB의 속성 구조가 PRD §5와 일치한다(Title/Category/Tags/Published/Status 타입 모두 정확).
  - 의존성: Task 2-2.
  - 근거(PRD): §5, §9.

  > 가정(명시): Notion 데이터베이스는 이미 생성되어 있거나 이 단계에서 신규 생성한다. DB 속성명과 타입은 PRD §5 사양을 그대로 따른다.

---

## Phase 3: 글 목록 페이지 (홈) ✅

> 홈(/)에서 발행된 글을 최신순 카드 그리드로 볼 수 있다. (F-1)

- **Task 3-1: Post 도메인 타입 및 Notion → Post 변환 함수** ✅ (필수)
  - 무엇을: `src/types/post.ts`에 `Post` 인터페이스(id, title, category, tags, publishedAt) 정의. `notion.ts`의 `toPost()` 및 속성 추출 헬퍼(`extractPlainText`, `extractSelectName`, `extractMultiSelectNames`, `extractDateStart`)로 Notion 원시 응답을 평평한 `Post`로 변환.
  - 완료 기준(DoD): `getPublishedPosts()`가 `Post[]`를 반환하고, TypeScript 오류가 없다.
  - 의존성: Task 2-1.
  - 근거(PRD): §5 DB 구조, F-1.

- **Task 3-2: PostCard 컴포넌트 구현** ✅ (필수)
  - 무엇을: `src/components/posts/post-card.tsx` — 카테고리 배지, 제목(line-clamp-2), 태그 칩 목록, 작성일(한국어 포맷) 표시. `/posts/${post.id}` 링크. 서버 컴포넌트.
  - 완료 기준(DoD): `Post` 객체를 prop으로 받아 카드를 렌더링하며, 카드 클릭 시 `/posts/[id]`로 이동한다(404는 Phase 4 이후 해소).
  - 의존성: Task 3-1.
  - 근거(PRD): §6 화면 구성, F-1.

- **Task 3-3: 홈 페이지 구현 (ISR 포함)** ✅ (필수)
  - 무엇을: `src/app/page.tsx` — 서버 컴포넌트에서 `getPublishedPosts()` 호출, `export const revalidate = 60`으로 ISR 적용(Notion API 레이트리밋 절감), 조회 성공/빈 목록/에러 상태별 UI 분기, 카드 그리드(모바일 1열 / sm 2열).
  - 완료 기준(DoD): 로컬에서 `pnpm dev` 후 `/`에 접속하면 Notion의 발행 글이 카드로 표시되고, 글이 없으면 안내 문구가 보인다. `pnpm build`가 통과한다.
  - 의존성: Task 2-3(환경변수 입력 완료), Task 3-2.
  - 근거(PRD): §6 홈 화면, §7 MVP, F-1.

---

```
── MVP 경계 (여기까지 완료 시 읽기 가능한 최소 동작 서비스) ──────────────────
   Phase 4~7은 MVP 완성을 위한 필수 단계이며, 배포 전 모두 완료해야 한다.
──────────────────────────────────────────────────────────────────────────────
```

---

## Phase 4: 글 상세 페이지 ⏳

> /posts/[id]에서 개별 글의 Notion 본문 블록이 렌더링된다. (F-2, PRD §8 단계 4)

- **Task 4-1: 단건 게시글 조회 함수 구현** ⏳ (필수)
  - 무엇을: `src/lib/server/notion.ts`에 `getPostById(pageId: string): Promise<Post | null>` 추가. `notion.pages.retrieve({ page_id })`로 단건 조회 후 `toPost()`로 변환. Status가 "발행됨"이 아니면 `null` 반환(미발행 글 직접 접근 차단).
  - 완료 기준(DoD): 유효한 Notion 페이지 ID로 호출하면 `Post`를 반환하고, 미발행/없는 ID는 `null`을 반환한다. TypeScript 오류 없음.
  - 의존성: Task 2-3(환경변수 완료), Task 3-1(Post 타입).
  - 근거(PRD): §5 발행 규칙, F-2.

- **Task 4-2: Notion 페이지 블록 조회 및 렌더링 모듈 구현** ⏳ (필수)
  - 무엇을: `src/lib/server/notion.ts`에 `getPostBlocks(pageId: string)` 추가 — `notion.blocks.children.list({ block_id: pageId })`로 블록 배열 조회(페이지네이션 처리). `src/components/posts/notion-blocks.tsx` 서버 컴포넌트 — `paragraph`, `heading_1~3`, `bulleted_list_item`, `numbered_list_item`, `code`, `image`, `divider`, `quote` 등 주요 블록 타입을 HTML/Tailwind로 렌더링.
  - 완료 기준(DoD): Notion에서 작성한 본문(단락, 제목, 목록, 이미지 등 주요 블록)이 웹 페이지에 올바르게 렌더링된다. 미지원 블록은 무시(렌더링 안 함)하되 에러를 내지 않는다.
  - 의존성: Task 4-1.
  - 근거(PRD): F-2, §5 Content(page content).

  > 결정(2026-06-16 확정): 본문은 **기본 블록만** 렌더링한다(단락 · 제목 h1~h3 · 불릿/번호 목록 · 이미지 · 인용 · 코드 · 구분선). callout/toggle/table/embed 등 특수 블록은 무시하며 에러를 내지 않는다. MVP에서는 `@notionhq/client` 블록 API를 직접 사용하고, `notion-to-md` 등 서드파티 변환 라이브러리는 도입하지 않는다.

- **Task 4-3: 글 상세 페이지 라우트 구현** ⏳ (필수)
  - 무엇을: `src/app/posts/[id]/page.tsx` — `params.id`로 `getPostById()` 호출, 미발행/없는 글이면 `notFound()`, 정상이면 제목/카테고리/태그/작성일 헤더 + `NotionBlocks` 본문 렌더링. `generateStaticParams`는 선택(필요 시 추가). ISR `revalidate = 60` 적용.
  - 완료 기준(DoD): 홈의 카드 클릭 시 `/posts/[id]`로 이동해 본문이 표시된다. 없는 ID는 404 페이지로 이동한다. `pnpm build`가 통과한다.
  - 의존성: Task 4-2, Task 3-2(카드 링크).
  - 근거(PRD): §6 글 상세 화면, F-2.

- **Task 4-4: 상세 페이지 상단 네비게이션(뒤로 가기)** ⏳ (권장)
  - 무엇을: 글 상세 페이지 상단에 홈(/)으로 돌아가는 "← 목록으로" 링크 추가. Next.js `Link` 컴포넌트 사용(서버 컴포넌트 유지).
  - 완료 기준(DoD): 상세 페이지에서 링크 클릭 시 홈으로 이동한다.
  - 의존성: Task 4-3.
  - 근거(PRD): §6 정보 구조(홈 → 상세 탐색 흐름).

---

## Phase 5: 카테고리 필터 페이지 ⏳

> /category/[category]에서 특정 카테고리에 속한 글 목록을 볼 수 있다. (F-3, PRD §6)

- **Task 5-1: 카테고리별 게시글 조회 함수 구현** ⏳ (필수)
  - 무엇을: `src/lib/server/notion.ts`에 `getPostsByCategory(category: string): Promise<Post[]>` 추가. `dataSources.query`에 `filter: { and: [{ property: "Status", select: { equals: "발행됨" } }, { property: "Category", select: { equals: category } }] }` 적용, Published 내림차순 정렬.
  - 완료 기준(DoD): 카테고리명을 넘기면 해당 카테고리의 발행 글만 반환한다. 빈 카테고리는 빈 배열을 반환한다.
  - 의존성: Task 2-3, Task 3-1.
  - 근거(PRD): F-3, §5 Category 속성.

- **Task 5-2: 카테고리 목록 페이지 라우트 구현** ⏳ (필수)
  - 무엇을: `src/app/category/[category]/page.tsx` — `params.category`(URL 디코딩 처리)로 `getPostsByCategory()` 호출, 홈과 동일한 카드 그리드 레이아웃 재사용, 페이지 상단에 현재 카테고리명 표시, 글 0건이면 안내 문구. ISR `revalidate = 60` 적용. **진입 경로는 PostCard의 카테고리 배지 클릭만**(2026-06-16 확정 — 헤더 전역 카테고리 메뉴는 두지 않음).
  - 완료 기준(DoD): 홈 카드의 카테고리 배지 클릭 시 `/category/[category]`로 이동해 해당 카테고리 글만 표시된다. `pnpm build`가 통과한다.
  - 의존성: Task 5-1, Task 3-2(PostCard 수정).
  - ⚠️ 구현 주의: 현재 PostCard 는 카드 전체가 `/posts/[id]` 링크다. 배지를 카테고리 링크로 만들면 `<a>` 중첩이 되어 무효 HTML 이 된다. 카드 마크업을 조정해야 한다(예: 카드 링크를 `<a>` 대신 영역 분리, 또는 배지를 카드 링크 바깥 레이어로 빼고 카드 링크에 `pointer-events` 조정).
  - 근거(PRD): §6 카테고리 화면, F-3.

---

## Phase 6: 검색 기능 ⏳

> 홈에서 키워드를 입력해 제목/태그 기준으로 글을 필터링할 수 있다. (F-4)

- **Task 6-1: 검색 UI 컴포넌트 구현** ⏳ (필수)
  - 무엇을: `src/components/posts/search-input.tsx` — 클라이언트 컴포넌트(`"use client"`), `input`에 키워드 입력 시 `onChange`로 URL 쿼리파라미터(`?q=키워드`) 갱신(Next.js `useRouter` / `useSearchParams`). 디바운스(300ms) 적용해 과도한 렌더 방지.
  - 완료 기준(DoD): 검색어 입력 시 URL의 `q` 파라미터가 갱신된다. 빈 입력 시 파라미터가 제거된다.
  - 의존성: Task 1-3(shadcn input 컴포넌트).
  - 근거(PRD): F-4, §6 검색창.

  > 결정(2026-06-16 확정): 검색은 클라이언트 사이드에서 이미 로드된 `Post[]`를 제목/태그 기준으로 필터링한다. Notion Search API 서버 호출은 글이 수백 건 이상으로 늘어날 때 재검토한다(Phase 8 / R-4).

- **Task 6-2: 검색 결과 필터링 및 홈 통합** ⏳ (필수)
  - 무엇을: `src/app/page.tsx` — URL의 `searchParams.q`를 읽어 `posts`를 `title`과 `tags`로 클라이언트 필터링(대소문자 무시). 검색어 있을 때 결과 건수 표시. `SearchInput` 컴포넌트를 홈 상단에 배치.
  - 완료 기준(DoD): 키워드 입력 시 제목 또는 태그에 키워드가 포함된 글만 카드 그리드에 표시된다. 결과 0건이면 "검색 결과가 없습니다" 안내가 표시된다.
  - 의존성: Task 6-1, Task 3-3.
  - 근거(PRD): F-4, §6 홈 화면 검색창.

---

## Phase 7: 스타일링 및 배포 최적화 ⏳

> 반응형/접근성/SEO/캐싱이 정리되어 Vercel에 배포 가능한 상태가 된다. (F-5, PRD §8 단계 5)

- **Task 7-1: 반응형 레이아웃 점검 및 보완** ⏳ (필수)
  - 무엇을: 홈(카드 그리드), 글 상세(본문 가독성), 카테고리 페이지를 모바일(375px) / 태블릿(768px) / 데스크톱(1280px) 뷰포트에서 실제 확인. 글 상세 본문의 prose 스타일(줄간격, 최대 너비, 이미지 반응형) 추가. Tailwind v4 반응형 유틸 활용.
  - 완료 기준(DoD): 세 뷰포트 모두에서 가로 스크롤이 없고, 텍스트가 읽기 편한 너비(max-w-prose 수준)로 제한된다.
  - 의존성: Task 4-3, Task 5-2.
  - 근거(PRD): F-5, §7 반응형 디자인.

- **Task 7-2: SEO 메타데이터 설정** ⏳ (권장)
  - 무엇을: `src/app/posts/[id]/page.tsx`에 `generateMetadata` 추가 — 글 제목을 `<title>`로, 카테고리/태그를 `keywords`로, OG 태그(`og:title`, `og:description`) 설정. 홈 `layout.tsx`의 사이트 수준 메타데이터는 `SITE_NAME`/`SITE_DESCRIPTION` 상수에서 이미 가져옴(Task 1-1 완료).
  - 완료 기준(DoD): 글 상세 페이지를 SNS에 공유하면 글 제목이 OG 미리보기에 표시된다. `pnpm build` 출력에서 해당 경로의 메타데이터 경고가 없다.
  - 의존성: Task 4-3.
  - 근거(PRD): §2.1 탐색 목표(검색엔진 노출 간접 지원).

- **Task 7-3: ISR 캐싱 전략 최종 확인** ⏳ (필수)
  - 무엇을: 모든 페이지(`/`, `/posts/[id]`, `/category/[category]`)에 `export const revalidate = 60` 적용 여부 확인. Notion API 레이트리밋(평균 초당 3회, 3 req/s)을 고려해 revalidate 값의 적정성 검토. 필요 시 값 조정.
  - 완료 기준(DoD): 세 경로 모두 `revalidate`가 설정되어 있고, `pnpm build` 출력에서 해당 경로가 ISR(Dynamic with revalidation) 모드로 표시된다.
  - 의존성: Task 4-3, Task 5-2.
  - 근거(PRD): §4 Vercel 배포, CLAUDE.md 외부 API 레이트리밋 주의사항.

- **Task 7-4: Vercel 배포 및 환경변수 설정** ⏳ (필수)
  - 무엇을: Vercel 프로젝트 생성(GitHub 저장소 연결), Vercel 대시보드에서 `NOTION_API_KEY` / `NOTION_DATABASE_ID` 환경변수 입력. 프로덕션 빌드 배포 후 실제 URL에서 홈·상세·카테고리·검색 동작 확인. 커밋 전 `pnpm lint` 실행(CLAUDE.md Git 규칙).
  - 완료 기준(DoD): Vercel 배포 URL에서 홈에 글이 표시되고, 상세·카테고리 페이지가 정상 동작한다. Vercel 빌드 로그에 오류가 없다.
  - 의존성: Task 7-1, Task 7-2, Task 7-3.
  - 근거(PRD): §4 Deployment(Vercel).

---

## Phase 8: MVP 이후 확장 (Out of MVP) ⏳

> PRD §10 에서 정의한 향후 확장 항목. MVP 완료 후 별도 우선순위 결정.

| 항목 | 설명 | 근거 |
|------|------|------|
| 기사 자동 수집/스케줄링 | 장마감·장시작 시점에 맞춘 자동 기사 수집 파이프라인 | PRD §10 |
| Notion Webhook 연동 | Notion 발행 시 즉시 ISR 재검증 트리거 | PRD §10 |
| 태그 클라우드 / 태그 필터 페이지 | Tags 기반 탐색 강화(`/tag/[tag]` 라우트) | PRD §10 |
| RSS / 뉴스레터 | 일자별 게시글 구독 채널(`/feed.xml`) | PRD §10 |
| OG 이미지 자동 생성 | `next/og`로 글별 OG 이미지 생성 | PRD §10 |

---

## 리스크 & 미해결 (Open Questions)

### 기술적 리스크

| # | 항목 | 내용 | 심각도 |
|---|------|------|--------|
| R-1 | `@notionhq/client` v5 API 2계층 구조 | `dataSources.query` 사용이 정상 동작하는지 `pnpm verify:notion`으로 반드시 확인 필요. 검증 실패 시 Task 2-1의 `getNotionDataSourceId()` 로직 재검토. | 높음 |
| R-2 | Notion 블록 렌더링 커버리지 | Notion 본문에 사용된 블록 타입이 MVP에서 구현한 타입 범위를 벗어나면 해당 블록이 표시되지 않음. 실제 DB 글의 블록 구성을 Task 4-2 전에 확인 권장. | 중간 |
| R-3 | Notion API 레이트리밋 | 평균 초당 3회(3 req/s) 제한. ISR 60초 설정으로 완화하나, 빌드 시 `generateStaticParams`로 다수 페이지를 한꺼번에 생성할 경우 초과 가능. Task 7-3에서 재검토. | 중간 |
| R-4 | 검색 확장성(클라이언트 필터링) | 클라이언트 필터링으로 확정(Q-2). 글이 수백 건 이상으로 늘어나면 성능 저하 가능 → 그 시점에 Notion Search API 서버 호출로 전환 검토(Phase 8). | 낮음 |

### 결정 완료 (Resolved · 2026-06-16)

| # | 결정 | 관련 Task |
|---|------|-----------|
| Q-2 | 검색은 **클라이언트 사이드 필터링**(제목/태그). Notion Search API 는 글 수백 건 이상 시 재검토. | Task 6-1 |
| Q-3 | 글 상세 본문은 **기본 블록만** 렌더(단락/제목 h1~h3/목록/이미지/인용/코드/구분선). 특수 블록은 무시. | Task 4-2 |
| Q-4 | 카테고리 진입은 **카드 배지 클릭만**. 헤더 전역 카테고리 메뉴는 두지 않음. | Task 5-2 |

### 사용자 확인이 필요한 미해결 항목

| # | 질문 | 관련 Task |
|---|------|-----------|
| Q-1 | Notion DB 속성 구조가 PRD §5 사양(Title/Category/Tags/Published/Status, 각 타입)과 완전히 일치하는가? Notion 웹 설정·키 입력 후 `pnpm verify:notion` 실행 결과로 확인 필요(현재 보류). | Task 2-3 |

---

**최종 업데이트:** 2026-06-16
**진행 상황:** Phase 1~3 완료 · Phase 2 일부(Task 2-3) 진행 중 · Phase 4~7 예정 (완료 6/16 Tasks · 37.5%)
