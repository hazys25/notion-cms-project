"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { GithubIcon } from "@/components/common/github-icon";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { GITHUB_REPO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

/**
 * 랜딩 페이지 상단 네비게이션 헤더
 *
 * - 로그아웃(useRouter·fetch)·테마 전환 등 상호작용이 있어 클라이언트 컴포넌트로 분리했다.
 * - page.tsx 본체는 서버 컴포넌트로 유지하여 정적 콘텐츠가 클라이언트 번들에 포함되지 않도록 한다.
 */
export function SiteHeader() {
  // 로그아웃 후 로그인 페이지로 이동하기 위해 사용
  const router = useRouter();

  // 로그아웃 핸들러 — 세션 쿠키를 삭제하고, 응답 성공 여부를 확인한 뒤 로그인 페이지로 이동
  const onLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      // 통일된 API 응답(ApiResponse) 계약에 맞춰 성공/실패를 명시적으로 분기
      const result = (await response.json()) as ApiResponse<{ message: string }>;

      if (result.success) {
        toast.success("로그아웃되었습니다.");
        router.replace("/login");
        router.refresh();
      } else {
        // 서버가 에러를 반환하면 실패 토스트를 띄우고 페이지 이동은 하지 않는다.
        toast.error(result.error.message);
      }
    } catch {
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

  return (
    // sticky + 반투명 배경(backdrop-blur)으로 스크롤 시에도 상단에 고정
    <header className="bg-background/70 sticky top-0 z-50 border-b backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        {/* 좌측: 브랜드 + 퀵 앵커 링크(데스크탑 전용) */}
        <div className="flex items-center gap-6">
          {/* 브랜드 — 그라데이션 점 + 텍스트 */}
          <div className="flex items-center gap-2">
            <span className="size-5 rounded-md bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500" />
            <span className="font-heading text-sm font-semibold tracking-tight">
              Starter Kit
            </span>
          </div>
          {/* 퀵 앵커 링크 — 페이지 내 해당 섹션으로 부드럽게 스크롤(좁은 화면에선 숨김) */}
          <div className="text-muted-foreground hidden items-center gap-5 text-sm font-medium md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">
              기능
            </a>
            <a href="#get-started" className="hover:text-foreground transition-colors">
              시작하기
            </a>
          </div>
        </div>
        {/* 우측: 테마 전환 + GitHub + 로그아웃 */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* GitHub 아이콘 버튼 — 새 탭으로 저장소 열기 */}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub 저장소 열기"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <GithubIcon />
          </a>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut />
            로그아웃
          </Button>
        </div>
      </nav>
    </header>
  );
}
