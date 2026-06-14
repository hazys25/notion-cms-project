"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * 테마(라이트/다크) 전역 상태를 제공하는 Provider
 *
 * next-themes 가 <html> 태그의 class 를 "dark" 로 토글해주고,
 * globals.css 의 `.dark { ... }` 토큰이 적용되어 색상이 바뀐다.
 * 선택한 테마는 localStorage 에 저장되어 새로고침해도 유지된다.
 *
 * 비유: 집 전체의 "조명 스위치". 스위치 상태(dark/light)에 따라
 *      모든 방(컴포넌트)의 색온도가 한 번에 바뀐다.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
