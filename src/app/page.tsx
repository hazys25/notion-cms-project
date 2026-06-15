import { ThemeToggle } from "@/components/common/theme-toggle";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

/**
 * 홈 화면 (임시 플레이스홀더)
 *
 * 스타터킷 랜딩 데모(히어로/기능 카드/CTA)를 모두 걷어내고, 제품에 맞는 최소 골격만 남겼다.
 * PRD 기준으로 이 자리에는 추후 "발행된 글 목록(최신순 카드)"이 들어간다(구현 3단계).
 *
 * 정적 콘텐츠 위주라 서버 컴포넌트로 둔다.
 * 상호작용이 있는 테마 전환 버튼만 클라이언트 컴포넌트(ThemeToggle)로 분리되어 있다.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ── 상단 헤더 ───────────────────────────────────────────────
          좌측: 사이트 이름(브랜드) · 우측: 테마 전환 버튼
          sticky + 반투명 배경(backdrop-blur)으로 스크롤 시에도 상단에 고정 */}
      <header className="bg-background/70 sticky top-0 z-50 border-b backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
          <span className="font-heading text-sm font-semibold tracking-tight">
            {SITE_NAME}
          </span>
          <ThemeToggle />
        </nav>
      </header>

      {/* ── 본문 ────────────────────────────────────────────────────
          글 목록 구현 전까지 보여줄 안내 영역. 화면 중앙에 제목/설명을 배치한다. */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-balance md:text-4xl">
          {SITE_NAME}
        </h1>
        {/* text-muted-foreground: 본문보다 한 톤 옅은 보조 텍스트 색 (디자인 토큰) */}
        <p className="text-muted-foreground mt-4 max-w-md text-pretty">
          {SITE_DESCRIPTION}
        </p>
        <p className="text-muted-foreground mt-8 text-sm">
          글 목록을 준비 중입니다.
        </p>
      </main>
    </div>
  );
}
