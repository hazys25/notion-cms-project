import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { NotionBlocks } from "@/components/posts/notion-blocks";
import { SITE_NAME } from "@/lib/constants";
import { getPostById, getPostBlocks } from "@/lib/server/notion";

/**
 * 글 상세 페이지 (/posts/[id] — 구현 4단계)
 *
 * 홈의 카드를 누르면 이 페이지로 와서 글의 제목·분류·본문을 읽는다.
 * 서버 컴포넌트에서 Notion 의 단건 글(메타데이터 + 본문 블록)을 직접 조회해 렌더한다.
 *
 * 상태별 화면:
 *  - 발행된 글 → 헤더(제목/카테고리/태그/작성일) + 본문(NotionBlocks)
 *  - 미발행/없는 글 → notFound() 로 404 페이지
 */

/**
 * ISR 재검증 주기(초). 홈과 동일하게 60초.
 * 정적으로 만들어 두고 60초마다 백그라운드 갱신해 Notion API 호출을 줄인다(레이트리밋 절감).
 */
export const revalidate = 60;

// Next.js 15 에서 동적 라우트의 params 는 Promise 다 → 사용 전에 await 해야 한다.
type PostDetailPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * getPostById 를 React cache() 로 감싼 버전.
 *
 * 같은 요청 안에서 이 함수가 여러 번 호출돼도(현재는 본문 렌더, 추후 generateMetadata 추가 시 2회)
 * Notion 조회는 한 번만 수행하고 결과를 공유한다 → 불필요한 API 호출·레이트리밋 위험을 줄인다.
 *
 * 비유: 같은 손님이 5분 안에 같은 서류를 두 번 요청하면, 창고에 두 번 가지 않고 복사본을 건넨다.
 */
const getCachedPostById = cache(getPostById);

/**
 * 글 상세 페이지의 메타데이터(<title>·description·OG)를 동적으로 생성한다.
 *
 * 본문 렌더(PostDetailPage)와 동일하게 getCachedPostById 를 쓰므로, React cache() 덕분에
 * 한 요청 안에서 Notion 페이지 조회는 한 번만 일어난다(메타+본문이 같은 결과를 공유 → API 호출 절감).
 *
 * 글을 찾지 못하면 빈 객체를 반환해 사이트 기본 메타데이터(layout.tsx)를 그대로 쓰게 한다.
 *
 * @param params URL 의 [id] (Promise — Next.js 15 규약)
 * @returns 해당 글의 메타데이터
 */
export async function generateMetadata({
  params,
}: PostDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getCachedPostById(id);

  // 없는/미발행 글이면 사이트 기본 메타데이터에 위임.
  if (!post) return {};

  // 카테고리가 있으면 description 으로 활용(없으면 생략).
  const description = post.category ?? undefined;

  return {
    title: post.title,
    description,
    // SNS 공유 미리보기(OpenGraph) — 제목/설명을 글 기준으로 노출.
    openGraph: {
      title: post.title,
      description,
      type: "article",
    },
  };
}

/**
 * ISO 날짜 문자열을 한국어 표기로 변환한다(없으면 빈 문자열).
 * (목록 카드와 동일한 표기 규칙 — 상세 헤더의 작성일 표시에 사용)
 */
function formatPublishedDate(isoDate: string | null): string {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoDate));
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  // URL 의 [id] 세그먼트(= Notion 페이지 ID). params 가 Promise 라 await 로 꺼낸다.
  const { id } = await params;

  // 글 메타데이터 조회. 미발행/없는 글이면 null → 404 로 보낸다.
  const post = await getCachedPostById(id);
  if (!post) notFound();

  // 본문 블록 조회(메타데이터가 유효한 글에 대해서만 수행).
  const blocks = await getPostBlocks(id);

  // 화면에 표시할 작성일(한국어). 없으면 빈 문자열.
  const formattedDate = formatPublishedDate(post.publishedAt);

  return (
    <div className="flex flex-1 flex-col">
      {/* ── 상단 헤더 ───────────────────────────────────────────────
          홈과 동일한 sticky 헤더. 브랜드명을 홈 링크로 만들어 네비게이션을 겸한다. */}
      <header className="bg-background/70 sticky top-0 z-50 border-b backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
          <Link
            href="/"
            className="font-heading text-sm font-semibold tracking-tight"
          >
            {SITE_NAME}
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      {/* ── 본문 ────────────────────────────────────────────────────
          max-w-3xl: 글은 카드 그리드보다 좁게 잡아 한 줄 길이를 읽기 편하게 제한한다. */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        {/* 뒤로 가기(목록으로) — Task 4-4. 본문 위쪽에 둔다. */}
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-block text-sm transition-colors"
        >
          ← 목록으로
        </Link>

        {/* ── 글 헤더(메타데이터) ─────────────────────────────────── */}
        <header className="mb-8">
          {/* 카테고리 배지(값이 있을 때만) */}
          {post.category && (
            <span className="bg-primary/10 text-primary inline-block rounded-full px-2.5 py-0.5 text-xs font-medium">
              {post.category}
            </span>
          )}

          {/* 제목 — 이 페이지의 유일한 h1(접근성·SEO 의 단일 h1 원칙) */}
          <h1 className="font-heading mt-3 text-3xl font-bold tracking-tight text-balance">
            {post.title}
          </h1>

          {/* 태그 칩 목록(있을 때만) */}
          {post.tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}

          {/* 작성일(있을 때만) — 부가정보라 옅은 색 */}
          {formattedDate && (
            <p className="text-muted-foreground mt-4 text-sm">{formattedDate}</p>
          )}
        </header>

        {/* 구분선 — 헤더와 본문 분리 */}
        <hr className="mb-8" />

        {/* ── 본문 블록 ──────────────────────────────────────────── */}
        <article>
          <NotionBlocks blocks={blocks} />
        </article>
      </main>
    </div>
  );
}
