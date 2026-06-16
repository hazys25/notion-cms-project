import Link from "next/link"
import type { Post } from "@/types/post"

/**
 * 글 카드 (목록의 한 칸)
 *
 * 게시글 한 건을 요약해 보여주는 카드다. 카드 전체가 글 상세(/posts/[id])로 가는 링크다.
 * 표시 항목: 카테고리 배지 · 제목 · 태그 칩 · 작성일.
 *
 * 상호작용(상태/이벤트)이 없는 순수 표시용이라 서버 컴포넌트로 둔다(클라이언트 번들 절감).
 *
 * 비유: 서점 진열대에 놓인 책 한 권의 "표지"다. 표지를 누르면 책 내용(상세)으로 들어간다.
 */

// 이 컴포넌트가 받는 props — 카드가 그릴 게시글 한 건.
interface PostCardProps {
  post: Post
}

/**
 * ISO 날짜 문자열("2026-06-16")을 한국어 표기("2026년 6월 16일")로 변환한다.
 * 날짜가 없으면 빈 문자열을 반환해 화면에 아무것도 표시하지 않는다.
 *
 * @param isoDate ISO 8601 날짜 문자열 또는 null
 */
function formatPublishedDate(isoDate: string | null): string {
  if (!isoDate) return ""
  // Intl.DateTimeFormat: 브라우저/Node 내장 국제화 포매터. 별도 라이브러리 없이 로케일 표기를 만든다.
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoDate))
}

export function PostCard({ post }: PostCardProps) {
  // 화면에 표시할 작성일(한국어 포맷). 없으면 빈 문자열.
  const formattedDate = formatPublishedDate(post.publishedAt)

  return (
    // group: 자식 요소가 카드 hover 상태에 반응(group-hover)하도록 묶는 Tailwind 유틸
    // block: a 태그를 블록으로 만들어 카드 전체를 클릭 영역으로
    // border/bg-card: 카드 외곽선과 배경(디자인 토큰) · rounded-lg: 모서리 둥글게
    // p-5: 안쪽 여백 · transition-colors + hover:bg-accent: 마우스 올리면 배경색 부드럽게 강조
    <Link
      href={`/posts/${post.id}`}
      className="group bg-card hover:bg-accent block rounded-lg border p-5 transition-colors"
    >
      {/* ── 카테고리 배지 ──────────────────────────────────────────
          값이 있을 때만 표시. 옅은 강조색 배경의 작은 알약(pill) 형태 */}
      {post.category && (
        <span className="bg-primary/10 text-primary inline-block rounded-full px-2.5 py-0.5 text-xs font-medium">
          {post.category}
        </span>
      )}

      {/* ── 제목 ───────────────────────────────────────────────────
          mt-2: 위 배지와 간격 · group-hover:text-primary: 카드 hover 시 제목 색 강조
          line-clamp-2: 제목이 길면 두 줄까지만 보이고 말줄임(...) 처리 */}
      <h2 className="font-heading mt-2 text-lg font-semibold tracking-tight text-balance group-hover:text-primary line-clamp-2">
        {post.title}
      </h2>

      {/* ── 태그 칩 목록 ───────────────────────────────────────────
          태그가 있을 때만 렌더. flex-wrap: 칩이 많으면 다음 줄로 자동 줄바꿈
          gap-1.5: 칩 사이 간격 */}
      {post.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
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

      {/* ── 작성일 ─────────────────────────────────────────────────
          text-muted-foreground: 본문보다 옅은 보조 텍스트 색(날짜는 부가정보라 약하게) */}
      {formattedDate && (
        <p className="text-muted-foreground mt-4 text-xs">{formattedDate}</p>
      )}
    </Link>
  )
}
