---
name: review-findings
description: 2026-06-14 전체 코드베이스 첫 리뷰에서 발견된 이슈 패턴 — 재발 방지 참고용
metadata:
  type: project
---

## 반복 주의 패턴 (2026-06-14 첫 전체 리뷰)

### Critical 수준
1. **logout route.ts 에러 핸들링 없음** — `src/app/api/auth/logout/route.ts` 에 try/catch 없음. cookies() 나 cookieStore.delete() 실패 시 500이 JSON이 아닌 형태로 반환될 수 있음.
2. **Supabase 환경변수 ! 단언** — client.ts, server.ts 모두 `process.env.NEXT_PUBLIC_SUPABASE_URL!` 등으로 non-null 단언. 변수가 없을 때 런타임 오류 발생 전 조기 검출 불가.

### Major 수준
3. **로그아웃 응답 검증 없음** — page.tsx(Home)의 onLogout()은 fetch 응답의 ok 여부나 result.success를 확인하지 않음.
4. **isEqualSafe 길이 비교 타이밍 공격 부분 노출** — 길이가 다른 경우 즉시 false 반환으로 응답 시간이 미세하게 달라질 수 있음 (실용적 위험도는 낮음).
5. **page.tsx가 "use client" 전체** — src/app/page.tsx 전체가 클라이언트 컴포넌트. 정적 sections을 서버 컴포넌트로 분리할 여지 있음.

### Minor
6. **ThemeToggle 삼중 조건 표현식** — `{mounted ? isDark ? <Sun /> : <Moon /> : <Sun />}` 가독성 낮음.
7. **GithubIcon aria-hidden 문자열 미사용** — JSX에서 `aria-hidden` 단독은 `true`로 처리되므로 문제 없으나, 명시적 `aria-hidden="true"` 가 더 명확.

**Why:** 이후 비슷한 패턴의 코드 추가 시 같은 실수가 반복될 가능성이 높음.
**How to apply:** API 라우트 추가 시 try/catch + errorResponse 패턴 준수 여부, 환경변수 ! 단언 대신 런타임 검증, 클라이언트 컴포넌트 fetch 후 응답 검증 확인.
