import { z } from "zod"

/**
 * 로그인 폼 입력값 검증 스키마 (Zod)
 * 클라이언트(로그인 폼)와 서버(로그인 API)가 동일한 규칙으로 검증한다.
 */
export const loginSchema = z.object({
  // 아이디: 비어 있지 않아야 함
  username: z.string().min(1, { message: "아이디를 입력해주세요." }),
  // 비밀번호: 비어 있지 않아야 함
  password: z.string().min(1, { message: "비밀번호를 입력해주세요." }),
})

// 스키마로부터 입력값 타입을 자동 추론
export type LoginFormValues = z.infer<typeof loginSchema>
