import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * 서버(서버 컴포넌트 / 라우트 핸들러 / 서버 액션)에서 사용하는 Supabase 클라이언트 생성 함수
 *
 * - next/headers 의 cookies() 를 통해 사용자 세션 쿠키를 읽고 쓴다.
 * - Next.js 15 부터 cookies() 는 비동기(Promise)이므로 await 가 필요하다 → 함수도 async.
 *
 * 비유: 서버는 사용자의 "출입증(쿠키)"을 확인해야 누가 요청했는지 안다.
 *      이 함수는 그 출입증을 읽고 갱신하는 통로를 Supabase 에 연결해준다.
 */
export async function createClient() {
  // 현재 요청에 포함된 쿠키 저장소
  const cookieStore = await cookies()

  // Supabase 연결 정보 (.env.local 에 설정)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 환경변수가 없으면 SDK 내부에서 불명확한 오류가 나기 전에 명시적으로 throw
  // (session.ts 의 SESSION_SECRET 누락 시 즉시 throw 하는 패턴과 일관성 유지)
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.",
    )
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        // 요청에 담긴 모든 쿠키를 Supabase 에 전달
        getAll() {
          return cookieStore.getAll()
        },
        // Supabase 가 갱신한 세션 쿠키들을 응답 쿠키에 기록
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // 의도적으로 무시(예외 객체를 쓰지 않으므로 바인딩 생략):
            // 서버 컴포넌트에서 호출되면 쿠키 쓰기가 막혀 예외가 발생할 수 있다.
            // 미들웨어에서 세션을 갱신하는 구조라면 이 예외는 무시해도 안전하다.
            // (이 스타터킷은 인증 미들웨어를 포함하지 않으므로 참고용 주석으로 남긴다.)
          }
        },
      },
    },
  )
}
