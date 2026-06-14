import { createBrowserClient } from "@supabase/ssr"

/**
 * 브라우저(클라이언트 컴포넌트)에서 사용하는 Supabase 클라이언트 생성 함수
 *
 * - "use client" 컴포넌트나 클라이언트 측 이벤트 핸들러 안에서 호출한다.
 * - 환경변수는 NEXT_PUBLIC_ 접두사가 있어야 브라우저 번들에 포함된다.
 *
 * 비유: 매 요청마다 새 "리모컨"을 만든다고 생각하면 된다.
 *      이 리모컨으로 Supabase(인증/DB/스토리지)를 브라우저에서 조작한다.
 */
export function createClient() {
  // Supabase 프로젝트 URL (.env.local 에 설정)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // anon(public) 키 — 브라우저에 노출되어도 되는 공개 키
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 환경변수가 없으면 SDK 내부에서 불명확한 오류가 나기 전에 명시적으로 throw
  // (session.ts 의 SESSION_SECRET 누락 시 즉시 throw 하는 패턴과 일관성 유지)
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.",
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
