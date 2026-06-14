import { cn } from "@/lib/utils"

/**
 * 페이지 상단 제목 영역을 위한 공통 컴포넌트
 *
 * 여러 페이지에서 반복되는 "제목 + 설명" 패턴을 한 곳에서 관리하기 위한 예시.
 * 프로젝트 공통 컴포넌트는 src/components/common 아래에 모은다.
 */
interface PageHeaderProps {
  // 페이지 제목
  title: string
  // 제목 아래 보조 설명 (선택)
  description?: string
  // 추가 스타일 (선택)
  className?: string
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={cn("space-y-1", className)}>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
    </header>
  )
}
