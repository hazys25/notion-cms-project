import {
  ArrowRight,
  Code,
  Database,
  Layers,
  Lock,
  Moon,
  Palette,
  Rocket,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { GithubIcon } from "@/components/common/github-icon";
import { SiteHeader } from "@/components/common/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GITHUB_REPO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ── 스타터 킷 특징 목록 ─────────────────────────────────────────────
// 히어로 아래 카드 그리드에 그대로 렌더링되는 데이터.
// icon: lucide-react 아이콘 컴포넌트 / title: 특징 제목 / description: 한 줄 설명
type Feature = {
  // 카드 좌상단에 표시할 아이콘 (컴포넌트 자체를 보관)
  icon: LucideIcon;
  // 특징 제목 (예: "Next.js 15 App Router")
  title: string;
  // 특징을 한 줄로 풀어 쓴 설명
  description: string;
};

const features: Feature[] = [
  {
    icon: Rocket,
    title: "Next.js 15 App Router",
    description: "React 19 서버 컴포넌트 기반의 최신 라우팅으로 빠르게 시작합니다.",
  },
  {
    icon: Code,
    title: "TypeScript",
    description: "엄격한 타입 검사로 런타임 이전에 오류를 잡아냅니다.",
  },
  {
    icon: Palette,
    title: "Tailwind CSS v4 · shadcn/ui",
    description: "토큰 기반 디자인 시스템과 접근성 있는 UI 컴포넌트를 제공합니다.",
  },
  {
    icon: Database,
    title: "Supabase",
    description: "인증·DB·스토리지·실시간을 한 번에 다루는 백엔드를 연결합니다.",
  },
  {
    icon: Layers,
    title: "Zustand",
    description: "보일러플레이트 없는 가벼운 전역 상태관리를 지원합니다.",
  },
  {
    icon: ShieldCheck,
    title: "React Hook Form · Zod",
    description: "스키마 기반의 타입 안전한 폼 검증을 손쉽게 구성합니다.",
  },
  {
    icon: Moon,
    title: "다크 모드 내장",
    description: "next-themes 기반 라이트/다크 전환을 기본 제공합니다.",
  },
  {
    icon: Lock,
    title: "관리자 인증",
    description: "쿠키 세션 기반의 보호 라우트가 미리 구성되어 있습니다.",
  },
];

// 랜딩 페이지 — 정적 콘텐츠 위주라 서버 컴포넌트로 유지한다.
// 상호작용이 있는 상단 헤더만 SiteHeader(클라이언트 컴포넌트)로 분리했다.
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ── 상단 네비바 ─── 로그아웃·테마 전환 등 상호작용 담당(클라이언트 컴포넌트) */}
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        {/* ── 히어로 섹션 ─────────────────────────────────────────────
            좌측: 텍스트/퀵 버튼 · 우측: 코드 기반 비주얼 목업 (2열로 명확히 분리)
            모바일에서는 1열 세로 스택, lg 이상에서 좌우 2열 */}
        <section className="relative isolate grid items-center gap-12 py-24 sm:py-32 lg:grid-cols-2">
          {/* 배경 glow — 클릭 막고(-z-10/pointer-events-none) 흐릿한 색 번짐만 연출 */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-0 -z-10 h-72 w-[36rem] max-w-full -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500/25 via-purple-500/25 to-fuchsia-500/25 blur-3xl"
          />

          {/* 좌측: 텍스트 + 행동 유도 영역 (모바일 중앙 정렬 → lg 좌측 정렬) */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* 작은 배지 — shadcn Badge 미설치라 span 으로 직접 스타일 */}
            <span className="text-muted-foreground mb-6 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
              Next.js 15 · React 19
            </span>

            {/* 메인 타이틀 — 그라데이션 텍스트로 강조 */}
            <h1 className="font-heading max-w-xl text-4xl font-bold tracking-tight text-balance md:text-6xl">
              빠른 웹 개발을 위한
              <br />
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                최신 스타터 킷
              </span>
            </h1>

            {/* 보조 설명 */}
            <p className="text-muted-foreground mt-6 max-w-md text-base text-pretty md:text-lg">
              인증, 상태관리, 폼 검증, 디자인 시스템까지 미리 갖춰진 구성으로 아이디어를 곧바로
              제품으로 만들어보세요.
            </p>

            {/* ── 퀵 버튼(인페이지 CTA) ───────────────────────────────
                앵커 링크에 buttonVariants 클래스를 입혀 버튼처럼 렌더링.
                h-11/px-6 으로 기본 size("lg") 보다 크게 키워 히어로에서 강조 */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#get-started"
                className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-sm")}
              >
                시작하기
                <ArrowRight />
              </a>
              <a
                href="#features"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 px-6 text-sm",
                )}
              >
                기능 둘러보기
              </a>
            </div>
          </div>

          {/* 우측: 코드 기반 비주얼 목업 — 외부 이미지 없이 가짜 코드 에디터 창으로 연출 */}
          <div className="bg-card w-full overflow-hidden rounded-xl border shadow-sm">
            {/* 타이틀바 — 신호등 점 3개 + 파일명 탭 */}
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <span className="size-3 rounded-full bg-red-400" />
              <span className="size-3 rounded-full bg-yellow-400" />
              <span className="size-3 rounded-full bg-green-400" />
              <span className="text-muted-foreground ml-3 font-mono text-xs">
                app/page.tsx
              </span>
            </div>
            {/* 코드 본문 — 토큰별 색상 span 으로 신택스 하이라이트 흉내 (실제 동작 코드 아님) */}
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed sm:text-sm">
              <code>
                <span className="text-fuchsia-500">import</span>
                <span className="text-muted-foreground"> {"{ Starter }"} </span>
                <span className="text-fuchsia-500">from</span>
                <span className="text-emerald-500"> &quot;@/kit&quot;</span>
                <span className="text-muted-foreground">;</span>
                {"\n\n"}
                <span className="text-fuchsia-500">export default function</span>
                <span className="text-sky-500"> App</span>
                <span className="text-muted-foreground">() {"{"}</span>
                {"\n"}
                <span className="text-fuchsia-500">  return</span>
                <span className="text-muted-foreground"> (</span>
                {"\n"}
                <span className="text-muted-foreground">    {"<"}</span>
                <span className="text-sky-500">Starter</span>
                {"\n"}
                <span className="text-indigo-500">      auth</span>
                {"\n"}
                <span className="text-indigo-500">      database</span>
                <span className="text-muted-foreground">=</span>
                <span className="text-emerald-500">&quot;supabase&quot;</span>
                {"\n"}
                <span className="text-indigo-500">      ui</span>
                <span className="text-muted-foreground">=</span>
                <span className="text-emerald-500">&quot;shadcn&quot;</span>
                {"\n"}
                <span className="text-muted-foreground">    {"/>"}</span>
                {"\n"}
                <span className="text-muted-foreground">  );</span>
                {"\n"}
                <span className="text-muted-foreground">{"}"}</span>
              </code>
            </pre>
          </div>
        </section>

        {/* ── 특징(기반 기술) 섹션 ────────────────────────────────────
            features 배열을 반응형 카드 그리드로 렌더링.
            id="features" + scroll-mt-20: 퀵 버튼 앵커 대상이자 sticky 헤더에 안 가리도록 오프셋 */}
        <section id="features" className="scroll-mt-20 pb-24 sm:pb-32">
          {/* 섹션 헤더 */}
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              필요한 모든 것이 준비되어 있습니다
            </h2>
            <p className="text-muted-foreground mt-3 text-sm md:text-base">
              검증된 기술 스택을 영역별로 구성해 설정 없이 바로 기능 개발을 시작할 수 있습니다.
            </p>
          </div>

          {/* 카드 그리드 — 모바일 1열 / 태블릿 2열 / 데스크탑 3열 */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              // 배열에 담아둔 아이콘 컴포넌트를 꺼내 렌더링 (대문자 변수여야 JSX 로 인식)
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="hover:border-foreground/20 transition-colors hover:shadow-sm"
                >
                  <CardHeader>
                    {/* 아이콘 — 그라데이션 배경의 둥근 박스 안에 흰색으로 표시 */}
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 text-white">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ── 하단 CTA 섹션 ───────────────────────────────────────────
            id="get-started" + scroll-mt-20: "시작하기" 퀵 버튼의 앵커 대상.
            그라데이션 보더/배경 카드로 마지막 행동(저장소로 이동)을 강조 */}
        <section id="get-started" className="scroll-mt-20 pb-24 sm:pb-32">
          <div className="relative isolate overflow-hidden rounded-2xl border px-6 py-16 text-center sm:px-12">
            {/* 은은한 그라데이션 배경 */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-fuchsia-500/10"
            />
            <h2 className="font-heading text-2xl font-bold tracking-tight text-balance md:text-4xl">
              지금 바로 웹 개발을 시작하세요
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-sm text-pretty md:text-base">
              저장소를 클론하면 인증·디자인 시스템·상태관리가 모두 연결된 상태에서 곧바로 기능
              개발에 집중할 수 있습니다.
            </p>
            {/* 버튼 2개 — 둘 다 GITHUB_REPO_URL 로 이동 (새 탭) */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-sm")}
              >
                웹 개발 시작하기
                <ArrowRight />
              </a>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 px-6 text-sm",
                )}
              >
                <GithubIcon />
                GitHub에서 보기
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── 푸터 ────────────────────────────────────────────────────
          좌측: 브랜드/카피라이트 · 우측: GitHub 링크(GITHUB_REPO_URL) */}
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm sm:flex-row">
          {/* 좌측: 브랜드 + 저작권 */}
          <div className="flex items-center gap-2">
            <span className="size-4 rounded bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500" />
            <span>Starter Kit</span>
          </div>
          {/* 우측: GitHub 링크 — 새 탭으로 저장소 열기 */}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <GithubIcon className="size-4" />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
