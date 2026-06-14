import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// 본문용 / 코드용 폰트를 CSS 변수로 등록 (globals.css 의 --font-sans, --font-mono 와 연결)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 브라우저 탭 제목/설명 등 사이트 메타데이터
export const metadata: Metadata = {
  title: "웹 개발 스타터킷",
  description: "Next.js 15 · TypeScript · Tailwind · shadcn/ui · Supabase · Zustand 기반 스타터킷",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 한국어 사이트이므로 lang="ko" 로 지정
    // suppressHydrationWarning: next-themes 가 <html> class 를 바꾸면서 생기는
    //   서버/클라이언트 불일치 경고를 의도적으로 무시 (테마 적용에 필수)
    // scroll-smooth: 퀵 버튼(앵커 링크) 클릭 시 해당 섹션으로 부드럽게 스크롤
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* 테마(라이트/다크) Provider — 기본은 현재 형태(라이트), 시스템 자동전환은 끔 */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          {/* 전역 토스트(알림) — Provider 안에 둬야 토스트도 현재 테마를 따른다. */}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
