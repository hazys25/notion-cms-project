import Link from "next/link"
import type { Post } from "@/types/post"

/**
 * 글 카드 (목록의 한 칸)
 *
 * 게시글 한 건을 요약해 보여주는 카드다. 카드 본문은 글 상세(/posts/[id])로 가는 링크이고,
 * 카테고리 배지는 그 카테고리 목록(/category/[category])으로 가는 별도 링크다.
 * 표시 항목: 카테고리 배지 · 제목 · 태그 칩 · 작성일.
 *
 * 🔧 링크 중첩 회피(stretched link 패턴):
 *   카드 전체를 <a> 로 감싸면 그 안의 배지를 또 <a> 로 만들 수 없다(HTML 에서 <a> 중첩은 무효).
 *   그래서 카드를 relative 컨테이너로 두고, 상세 링크를 absolute inset-0 으로 카드 전 영역에 "펼쳐"
 *   깔되, 배지는 z-10 으로 그 위에 띄워 별도 클릭 영역으로 분리한다.
 *   → 카드의 빈 곳/제목을 누르면 상세로, 배지를 누르면 카테고리로 이동한다.
 *
 * 상호작용(상태/이벤트)이 없는 순수 표시용이라 서버 컴포넌트로 둔다(클라이언트 번들 절감).
 *
 * 비유: 서점 진열대의 책 "표지"(누르면 상세)에, 장르 라벨(누르면 같은 장르 모음) 스티커를 겹쳐 붙인 셈이다.
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
    // relative: 안의 stretched link(absolute inset-0)의 기준 좌표가 되도록
    // overflow-hidden: rounded-lg 의 둥근 모서리 "바깥" 보이지 않는 영역까지 stretched link 클릭이
    //   걸리는 것을 막는다(클릭 영역을 실제 카드 모양 안으로 제한).
    // border/bg-card: 카드 외곽선과 배경(디자인 토큰) · rounded-lg: 모서리 둥글게
    // p-5: 안쪽 여백 · transition-colors + hover:bg-accent: 마우스 올리면 배경색 부드럽게 강조
    <article className="group bg-card hover:bg-accent relative overflow-hidden rounded-lg border p-5 transition-colors">
      {/* ── 카테고리 배지(카테고리 목록 링크) ──────────────────────
          값이 있을 때만 표시. 옅은 강조색 배경의 작은 알약(pill) 형태.
          relative z-10: 아래 깔리는 카드 전체 링크보다 위 레이어 → 배지 클릭이 우선 적용된다.
          encodeURIComponent: 카테고리명에 한글/공백이 있어도 안전한 URL 이 되도록 인코딩. */}
      {post.category && (
        <Link
          href={`/category/${encodeURIComponent(post.category)}`}
          className="bg-primary/10 text-primary hover:bg-primary/20 relative z-10 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors"
        >
          {post.category}
        </Link>
      )}

      {/* ── 제목 ───────────────────────────────────────────────────
          mt-2: 위 배지와 간격 · group-hover:text-primary: 카드 hover 시 제목 색 강조
          line-clamp-2: 제목이 길면 두 줄까지만 보이고 말줄임(...) 처리 */}
      <h2 className="font-heading mt-2 text-lg font-semibold tracking-tight text-balance group-hover:text-primary line-clamp-2">
        {post.title}
      </h2>

      {/* ── 카드 전체를 덮는 상세 링크(stretched link) ──────────────
          absolute inset-0: 카드 전 영역으로 펼쳐 빈 곳·제목 클릭을 모두 상세로 보낸다.
          z-0(기본): 배지(z-10) 아래에 깔린다. sr-only 텍스트로 링크의 접근성 이름을 제공한다. */}
      <Link href={`/posts/${post.id}`} className="absolute inset-0">
        <span className="sr-only">{post.title}</span>
      </Link>

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
    </article>
  )
}
