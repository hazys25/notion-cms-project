import Link from "next/link"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { SITE_NAME } from "@/lib/constants"

/**
 * 사이트 공통 상단 헤더
 *
 * 모든 페이지(홈 · 글 상세 · 카테고리) 최상단에 고정으로 노출되는 헤더다.
 * 좌측엔 사이트 이름(항상 홈으로 가는 링크 = 네비게이션 겸용), 우측엔 테마 전환 버튼을 둔다.
 *
 * 왜 별도 컴포넌트인가:
 *   같은 헤더 마크업이 여러 페이지에 반복되던 것을 한곳으로 모았다.
 *   헤더 디자인을 바꿀 때 이 파일 하나만 고치면 모든 페이지에 반영된다(중복 제거).
 *
 * 상호작용 상태가 없는 표시용이라 서버 컴포넌트로 둔다(테마 토글 버튼만 내부에서 클라이언트 컴포넌트).
 */
export function SiteHeader() {
  return (
    // sticky top-0: 스크롤해도 상단에 고정 · z-50: 본문 위로 떠 있게
    // bg-background/70 + backdrop-blur: 반투명 + 배경 흐림으로 아래 내용이 비치게(고정 헤더 가독성)
    // border-b: 본문과 구분하는 아래쪽 경계선
    <header className="bg-background/70 sticky top-0 z-50 border-b backdrop-blur">
      {/* mx-auto + max-w-5xl: 콘텐츠 폭을 가운데로 제한 · justify-between: 브랜드(좌)와 토글(우)을 양끝 배치 */}
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
  )
}
