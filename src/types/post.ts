/**
 * 게시글(Post) 도메인 타입
 *
 * Notion API 가 돌려주는 원시 응답(PageObjectResponse)은 속성마다
 * `{ type: "select", select: { name, color, ... } }` 처럼 깊게 중첩돼 있어
 * 화면 컴포넌트가 직접 다루기엔 번거롭다.
 *
 * 그래서 "화면이 실제로 필요로 하는 값만 평평하게(flat) 추출한" 형태를 별도 타입으로 둔다.
 * → Notion 응답 구조가 바뀌어도, 변환부(toPost)만 고치면 화면 코드는 영향이 없다(결합도 ↓).
 *
 * 비유: Notion 응답이 "포장 가득한 택배 상자"라면, Post 는 "상자를 뜯어 꺼낸 알맹이"다.
 */

// 게시글 한 건 — Notion 데이터베이스의 한 페이지(row)에 대응한다.
export interface Post {
  // Notion 페이지 ID — 글 상세 페이지(/posts/[id]) 라우팅의 키로 사용한다.
  id: string

  // 게시글 제목 — 카드/상세의 헤드라인으로 표시한다. (Notion 의 title 속성)
  title: string

  // 카테고리(단일 선택) — 카드의 분류 배지로 표시한다.
  // 선택값이 없을 수 있으므로 null 을 허용한다. (Notion 의 select 속성)
  category: string | null

  // 태그 목록(복수 선택) — 카드 하단의 태그 칩으로 표시한다.
  // 값이 없으면 빈 배열. (Notion 의 multi_select 속성)
  tags: string[]

  // 작성일(ISO 8601 문자열, 예: "2026-06-16") — 목록 정렬 기준이자 화면 일자 표기에 사용한다.
  // 날짜가 비어 있을 수 있으므로 null 을 허용한다. (Notion 의 date 속성)
  publishedAt: string | null
}
