import type { Metadata } from "next";
import { SiteHeader } from "@/components/common/site-header";
import { PostCard } from "@/components/posts/post-card";
import { SITE_NAME } from "@/lib/constants";
import { getPostsByCategory } from "@/lib/server/notion";
import { logger } from "@/lib/server/logger";
import type { Post } from "@/types/post";

/**
 * 카테고리 필터 페이지 (/category/[category] — 구현 5단계)
 *
 * 홈 카드의 카테고리 배지를 누르면 이 페이지로 와서, 같은 카테고리의 발행 글만 모아 본다.
 * 서버 컴포넌트에서 Notion 을 직접 조회해(카테고리 + 발행됨 필터) 홈과 동일한 카드 그리드로 렌더한다.
 *
 * 상태별 화면(홈과 동일한 3분기):
 *  - 조회 성공 + 글 있음 → 카드 그리드
 *  - 조회 성공 + 글 0건  → "이 카테고리에는 글이 없습니다" 안내
 *  - 조회 실패            → 페이지를 죽이지 않고 안내 문구 표시
 */

/**
 * ISR 재검증 주기(초). 홈·상세와 동일하게 60초.
 * 정적으로 만들어 두고 60초마다 백그라운드 갱신해 Notion API 호출을 줄인다(레이트리밋 절감).
 */
export const revalidate = 60;

// Next.js 15 에서 동적 라우트의 params 는 Promise 다 → 사용 전에 await 해야 한다.
type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

/**
 * URL 세그먼트의 카테고리명을 사람이 읽을 수 있는 원래 문자열로 되돌린다.
 *
 * 링크 생성 시 encodeURIComponent 로 인코딩(한글·공백 등)했으므로, 읽을 때는 반대로 디코딩한다.
 * 잘못 인코딩된 값(예: 깨진 % 시퀀스)이 들어와도 페이지가 죽지 않도록 실패 시 원본을 그대로 쓴다.
 *
 * @param rawCategory URL 의 [category] 원본(인코딩된 상태일 수 있음)
 * @returns 디코딩된 카테고리명
 */
function decodeCategory(rawCategory: string): string {
  try {
    return decodeURIComponent(rawCategory);
  } catch {
    // decodeURIComponent 는 형식이 깨진 입력에 URIError 를 던진다 → 원본 문자열로 폴백.
    return rawCategory;
  }
}

/**
 * 카테고리 페이지의 메타데이터(<title>)를 동적으로 생성한다.
 * 탭/검색결과에 "카테고리명 · 사이트명" 형태로 보이게 해 어떤 카테고리인지 드러낸다.
 */
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryName = decodeCategory(category);

  return {
    title: `${categoryName} · ${SITE_NAME}`,
    description: `${categoryName} 카테고리의 관심주식 뉴스 모음`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  // URL 의 [category] 세그먼트 → 디코딩한 실제 카테고리명.
  const { category } = await params;
  const categoryName = decodeCategory(category);

  // 조회 결과를 담을 변수들. 실패 시 hasError 로 분기한다(홈과 동일한 graceful 처리).
  let posts: Post[] = []; // 해당 카테고리의 발행 글 목록(최신순)
  let hasError = false; // Notion 조회 실패 여부

  try {
    posts = await getPostsByCategory(categoryName);
  } catch (error) {
    // 키 미설정·연결 오류 등으로 조회가 실패해도 페이지 자체는 정상 렌더한다.
    // (에러는 로그로 남겨 추후 원인 추적 가능 — CLAUDE.md: 에러 탐지 시 로그 적재)
    hasError = true;
    logger.error("카테고리 글 목록 조회 실패", { category: categoryName, error });
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* ── 상단 헤더(공통) ───────────────────────────────────────── */}
      <SiteHeader />

      {/* ── 본문 ──────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {/* 페이지 소개 영역 — 현재 어떤 카테고리를 보고 있는지 명확히 표시 */}
        <div className="mb-10">
          {/* 작은 라벨 + 카테고리명(h1). 라벨은 옅은 색으로 보조 표시 */}
          <p className="text-muted-foreground text-sm">카테고리</p>
          <h1 className="font-heading mt-1 text-2xl font-bold tracking-tight text-balance md:text-3xl">
            {categoryName}
          </h1>
        </div>

        {/* 상태별 분기: 에러 → 빈 목록 → 카드 그리드 (홈과 동일 패턴) */}
        {hasError ? (
          // 조회 실패 안내(키 미설정 등). 운영자가 원인을 떠올릴 수 있게 짧게 안내한다.
          <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
            글을 불러오지 못했습니다. Notion 연결 설정(API 키·DB 연결)을 확인해 주세요.
          </div>
        ) : posts.length === 0 ? (
          // 조회는 됐지만 이 카테고리에 발행된 글이 없는 경우
          <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
            이 카테고리에는 아직 발행된 글이 없습니다.
          </div>
        ) : (
          // 카드 그리드: 모바일 1열 → sm(640px) 이상 2열. gap-4: 카드 사이 간격
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
