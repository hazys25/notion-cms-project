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

---

## Phase 5 카테고리 필터 리뷰 (2026-06-17)

### stretched link 패턴 반복 주의 포인트
카드에 "전체 클릭 = 상세 이동"이면서 내부 요소(배지 등)를 별도 링크로 두는 stretched link 패턴을 사용할 때:
- **`overflow-hidden` 필수**: `rounded-lg` 컨테이너에 `overflow-hidden`이 없으면 border-radius 바깥의 보이지 않는 모서리 영역에도 absolute inset-0 링크의 클릭이 걸린다.
- **내부 인터랙티브 요소에 `relative z-10` 필수**: 링크가 아닌 태그 칩 등도 stretched link(z-0)가 그 위를 덮으므로, 나중에 링크로 만들 요소라면 사전에 `relative z-10`을 추가해 두어야 한다.
- `sr-only` 텍스트로 스크린 리더용 접근성 이름 제공은 올바른 패턴.

### 기능 일관성 패턴
같은 도메인 요소(카테고리 배지)가 홈 카드에서는 링크가 되었는데 상세 페이지에서는 비링크 `<span>`으로 남으면 UX가 일관성이 없다. 인터랙션이 추가될 때 동일 요소가 쓰이는 모든 위치를 함께 업데이트해야 한다(`src/app/posts/[id]/page.tsx`의 카테고리 `<span>` 미수정 사례).

### queryPosts 헬퍼 패턴 (좋은 예)
`NonNullable<Parameters<Client["dataSources"]["query"]>[0]["filter"]>` 로 SDK 타입을 직접 추출하는 패턴은 SDK 버전업 시 자동으로 따라가는 타입 출처 일원화의 좋은 예. 이후 비슷한 SDK 파라미터 타입 추출 시 동일 패턴 사용.
