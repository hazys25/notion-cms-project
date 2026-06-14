import { Client } from "@notionhq/client"

/**
 * Notion API 클라이언트 (서버 전용)
 *
 * 이 프로젝트는 Notion 을 CMS(콘텐츠 저장소)로 사용한다.
 * 게시글 데이터는 Notion 데이터베이스에 저장되고, 웹은 이 클라이언트로 그 데이터를 읽어온다.
 *
 * ⚠️ 반드시 "서버"에서만 사용한다(서버 컴포넌트 / 라우트 핸들러 / 서버 액션).
 *    NOTION_API_KEY 는 비밀값이므로 클라이언트 번들(브라우저)에 노출되면 안 된다.
 *    그래서 이 파일은 lib/server/ 에 둔다.
 *
 * 비유: Notion 데이터베이스가 "원고 창고"라면, 이 클라이언트는 창고 문을 여는 "마스터 열쇠(API 키)"다.
 *      열쇠는 직원(서버)만 가지고 있어야 하고, 손님(브라우저)에게 넘기면 안 된다.
 */

/**
 * Notion 클라이언트를 생성해 반환한다.
 *
 * 환경변수 검증을 "모듈 로드 시점"이 아니라 "호출 시점"에 수행한다.
 * → 빌드 단계에서 env 가 없다고 throw 되어 빌드가 깨지는 것을 막기 위함이며,
 *   session.ts(getSecretKey) / supabase.ts 의 검증 패턴과 일관성을 맞춘 것이다.
 *
 * 캐시(싱글톤)를 두지 않고 매번 생성한다.
 * → 배포 대상이 Vercel(서버리스)이라 요청마다 인스턴스가 새로 뜨므로 모듈 캐시는 사실상 무효이고,
 *   Notion 클라이언트는 API 키만 들고 있는 가벼운 객체라 생성 비용이 거의 없다.
 *   supabase.ts 가 매 호출 createClient() 하는 방식과도 일관된다.
 *
 * @returns 인증이 적용된 Notion 클라이언트
 * @throws NOTION_API_KEY 환경변수가 없으면 명시적으로 에러를 던진다.
 */
export function getNotionClient(): Client {
  // Notion 통합(Integration)의 시크릿 키 (.env.local 에 설정)
  const notionApiKey = process.env.NOTION_API_KEY
  if (!notionApiKey) {
    throw new Error("NOTION_API_KEY 환경변수가 설정되지 않았습니다.")
  }

  return new Client({ auth: notionApiKey })
}

/**
 * 게시글이 저장된 Notion 데이터베이스 ID 를 반환한다.
 *
 * 데이터를 조회하는 모든 곳(목록/상세/카테고리)이 이 함수를 통해 ID 를 얻도록 해서,
 * 환경변수 누락 검증을 한곳에 모은다(검증 로직 중복 방지).
 *
 * @returns Notion 데이터베이스 ID
 * @throws NOTION_DATABASE_ID 환경변수가 없으면 명시적으로 에러를 던진다.
 */
export function getNotionDatabaseId(): string {
  // 게시글 데이터베이스의 ID (.env.local 에 설정)
  const notionDatabaseId = process.env.NOTION_DATABASE_ID
  if (!notionDatabaseId) {
    throw new Error("NOTION_DATABASE_ID 환경변수가 설정되지 않았습니다.")
  }

  return notionDatabaseId
}
