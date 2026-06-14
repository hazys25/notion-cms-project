"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * 라이트 ↔ 다크(블랙) 테마를 전환하는 버튼
 *
 * - next-themes 의 useTheme 으로 현재 테마를 읽고 setTheme 으로 전환한다.
 * - mounted 체크: 서버 렌더링 시점에는 실제 테마를 알 수 없으므로,
 *   클라이언트에서 마운트된 뒤에만 올바른 아이콘을 보여줘 hydration 불일치를 막는다.
 */
export function ThemeToggle() {
  // resolvedTheme: 실제로 적용 중인 테마("light" | "dark")
  const { resolvedTheme, setTheme } = useTheme();
  // 클라이언트 마운트 여부 (hydration 안전 처리용)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="테마 전환"
      // 현재가 다크면 라이트로, 라이트면 다크로 전환
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {/* 마운트 전에는 기본 아이콘(달)을 보여주고, 마운트 후 현재 테마에 맞는 아이콘으로 교체.
          중첩 삼항 대신 "마운트 전" 분기를 먼저 처리해 의도를 명확히 한다. */}
      {!mounted ? <Moon /> : isDark ? <Sun /> : <Moon />}
      <span className="sr-only">테마 전환</span>
    </Button>
  );
}
