import { SignJWT, jwtVerify } from "jose"

/**
 * 세션(로그인 상태) 관리 유틸 — JWT 기반
 *
 * - 로그인에 성공하면 사용자 정보를 담은 JWT 를 발급해 HTTP-only 쿠키에 저장한다.
 * - 이후 요청마다 미들웨어가 이 쿠키의 JWT 를 검증해 로그인 여부를 판단한다.
 *
 * jose 라이브러리는 Node 런타임과 Edge 런타임(미들웨어) 양쪽에서 모두 동작하므로,
 * 라우트 핸들러(발급)와 미들웨어(검증)에서 동일하게 사용할 수 있다.
 *
 * 비유: JWT 는 "위조 방지 도장이 찍힌 출입증"이다.
 *      서버만 아는 비밀키(SESSION_SECRET)로 도장을 찍고, 같은 키로 진위를 검증한다.
 */

// 세션을 저장할 쿠키 이름
export const SESSION_COOKIE_NAME = "admin_session"

// 세션 유효 기간(초) — 8시간
export const SESSION_MAX_AGE = 60 * 60 * 8

// JWT 에 담는 페이로드(payload) 형태
export interface SessionPayload {
  // 로그인한 사용자 아이디
  username: string
}

// 비밀키를 Uint8Array 로 변환해 반환 (jose 가 요구하는 형식)
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error("SESSION_SECRET 환경변수가 설정되지 않았습니다.")
  }
  return new TextEncoder().encode(secret)
}

/**
 * 세션 JWT 발급
 * @param payload 토큰에 담을 사용자 정보
 * @returns 서명된 JWT 문자열
 */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: "HS256" }) // HMAC-SHA256 서명
    .setIssuedAt() // 발급 시각
    .setExpirationTime(`${SESSION_MAX_AGE}s`) // 만료 시각
    .sign(getSecretKey())
}

/**
 * 세션 JWT 검증
 * @param token 쿠키에서 읽은 JWT (없을 수 있음)
 * @returns 유효하면 페이로드, 유효하지 않으면 null
 */
export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    })
    return { username: String(payload.username) }
  } catch {
    // 만료/위조 등으로 검증에 실패하면 비로그인으로 간주
    return null
  }
}
