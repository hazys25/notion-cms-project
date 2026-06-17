import { SiteHeader } from "@/components/common/site-header";
import { PostCard } from "@/components/posts/post-card";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import { getPublishedPosts } from "@/lib/server/notion";
import { logger } from "@/lib/server/logger";
import type { Post } from "@/types/post";

/**
 * 홈 화면 (발행된 글 목록 — 구현 3단계)
 *
 * 서버 컴포넌트에서 Notion 의 발행 글을 직접 조회해 최신순 카드 목록으로 렌더링한다.
 * (NOTION_API_KEY 가 비밀값이라 데이터 조회는 반드시 서버에서 수행한다.)
 *
 * 상태별 화면:
 *  - 조회 성공 + 글 있음 → 카드 그리드
 *  - 조회 성공 + 글 0건  → "발행된 글이 없습니다" 안내
 *  - 조회 실패(키 미설정/연결 오류 등) → 페이지를 죽이지 않고 안내 문구 표시
 */

/**
 * ISR 재검증 주기(초).
 *
 * 이 페이지를 정적으로 생성해두고, 60초마다 백그라운드에서 다시 만들어 Notion 데이터를 갱신한다.
 * → 방문자가 몰려도 Notion API 호출은 최대 60초에 한 번꼴로 줄어든다(레이트리밋·부하 절감).
 *
 * 비유: 매 손님마다 창고에 다녀오는 대신, "60초짜리 사진"을 찍어두고 그 사진을 보여주다가
 *      주기적으로 사진만 새로 찍는 방식이다.
 */
export const revalidate = 60;

export default async function Home() {
  // 조회 결과를 담을 변수들. 실패 시 hasError 로 분기한다.
  let posts: Post[] = []; // 발행된 글 목록(최신순)
  let hasError = false; // Notion 조회 실패 여부

  try {
    posts = await getPublishedPosts();
  } catch (error) {
    // 키 미설정·통합 연결 누락 등으로 조회가 실패해도 페이지 자체는 정상 렌더한다.
    // (에러는 로그로 남겨 추후 원인 추적이 가능하게 한다 — CLAUDE.md: 에러 탐지 시 로그 적재)
    hasError = true;
    logger.error("발행 글 목록 조회 실패", { error });
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* ── 상단 헤더(공통) ───────────────────────────────────────── */}
      <SiteHeader />

      {/* ── 본문 ──────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {/* 페이지 소개 영역 */}
        <div className="mb-10">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-balance md:text-3xl">
            {SITE_NAME}
          </h1>
          {/* text-muted-foreground: 본문보다 한 톤 옅은 보조 텍스트 색(디자인 토큰) */}
          <p className="text-muted-foreground mt-2 text-pretty">
            {SITE_DESCRIPTION}
          </p>
        </div>

        {/* 상태별 분기: 에러 → 빈 목록 → 카드 그리드 순으로 처리 */}
        {hasError ? (
          // 조회 실패 안내(키 미설정 등). 운영자가 원인을 떠올릴 수 있게 짧게 안내한다.
          <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
            글을 불러오지 못했습니다. Notion 연결 설정(API 키·DB 연결)을 확인해 주세요.
          </div>
        ) : posts.length === 0 ? (
          // 조회는 됐지만 발행된 글이 아직 없는 경우
          <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
            아직 발행된 글이 없습니다.
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
