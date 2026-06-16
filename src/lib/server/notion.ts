import { Client, isFullPage, isFullBlock, APIResponseError } from "@notionhq/client"
import type { PageObjectResponse, BlockObjectResponse } from "@notionhq/client"
import { logger } from "@/lib/server/logger"
import type { Post } from "@/types/post"

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

/**
 * data_source_id 캐시.
 *
 * @notionhq/client v5(API 2025-09-03)는 "데이터베이스 → 데이터소스" 2계층 구조라,
 * 글을 조회하려면 database_id 가 아니라 data_source_id 가 필요하다.
 * 이 ID 는 데이터베이스에 고정된 값이므로, 매 요청마다 retrieve 로 다시 알아내면 API 호출이 낭비된다.
 * → 한 번 알아낸 값을 모듈 변수에 보관해 같은 서버 인스턴스 안에서는 재사용한다(불필요한 호출 방지).
 *
 * 비유: 창고(DB) 안의 "서랍 번호(data_source_id)"는 바뀌지 않으니, 처음 한 번만 확인하고 메모해 둔다.
 */
let cachedDataSourceId: string | null = null

/**
 * 게시글 데이터베이스의 data_source_id 를 반환한다(필요 시 Notion 에 조회 후 캐시).
 *
 * 흐름: NOTION_DATABASE_ID → databases.retrieve → 응답의 data_sources[0].id
 *
 * @returns 조회에 사용할 data_source_id
 * @throws 데이터베이스에 연결된 data_source 가 없으면 에러를 던진다(통합-DB 연결 누락 등).
 */
export async function getNotionDataSourceId(): Promise<string> {
  // 이미 알아낸 값이 있으면 즉시 반환(API 호출 생략).
  if (cachedDataSourceId) return cachedDataSourceId

  const notion = getNotionClient() // 인증된 Notion 클라이언트
  const databaseId = getNotionDatabaseId() // 환경변수의 DB ID

  // 데이터베이스 메타데이터를 조회하면 응답에 data_sources 배열이 들어 있다.
  const database = await notion.databases.retrieve({ database_id: databaseId })

  // 부분 응답(PartialDatabaseObjectResponse)에는 data_sources 가 없을 수 있어 존재 여부를 확인한다.
  const dataSources = "data_sources" in database ? database.data_sources : []
  const firstDataSource = dataSources[0] // 보통 DB 당 데이터소스는 1개

  if (!firstDataSource) {
    throw new Error(
      "Notion 데이터베이스에 연결된 data_source 를 찾지 못했습니다. " +
        "통합(Integration)이 해당 DB 에 Connection 으로 연결됐는지 확인하세요.",
    )
  }

  cachedDataSourceId = firstDataSource.id // 다음 호출을 위해 메모
  return cachedDataSourceId
}

/**
 * 웹에 노출할 발행 상태값.
 * PRD 5장: Status = "발행됨" 인 글만 사이트에 표시하고, "초안" 은 숨긴다.
 */
const PUBLISHED_STATUS_VALUE = "발행됨"

/**
 * 발행된 게시글 목록을 최신순으로 조회한다(글 목록 페이지의 데이터 소스).
 *
 * - 필터: Status(select) 가 "발행됨" 인 글만
 * - 정렬: Published(date) 내림차순(최신 글이 위로)
 *
 * 반환 전에 원시 Notion 응답을 화면 친화적인 Post 타입으로 변환한다(toPost).
 *
 * @returns 발행 글 목록(최신순). 글이 없으면 빈 배열.
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const notion = getNotionClient() // 인증된 Notion 클라이언트
  const dataSourceId = await getNotionDataSourceId() // 조회 대상 데이터소스 ID

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    // Status 속성이 "발행됨" 인 행만 가져온다.
    filter: { property: "Status", select: { equals: PUBLISHED_STATUS_VALUE } },
    // 작성일(Published) 기준 내림차순 → 최신 글이 목록 맨 위에 온다.
    sorts: [{ property: "Published", direction: "descending" }],
  })

  // 응답에는 완전한 페이지(PageObjectResponse) 외에 부분 객체가 섞일 수 있으므로,
  // isFullPage 로 "속성까지 채워진 완전한 페이지"만 걸러낸 뒤 Post 로 변환한다.
  return response.results.filter(isFullPage).map(toPost)
}

/**
 * 글 상세 페이지(/posts/[id])용 — 단건 게시글의 "메타데이터"를 조회한다.
 *
 * 흐름: page_id → pages.retrieve → (완전한 페이지인지 가드) → (발행 상태 확인) → Post 로 변환.
 *
 * 두 가지 "없음"을 모두 null 로 통일해 호출 측이 단순히 `if (!post) notFound()` 로 처리하게 한다:
 *   1) 미발행 글(Status ≠ 발행됨)을 ID 로 직접 접근 → 노출 차단(null)
 *   2) 존재하지 않는/삭제된 page_id → null
 *
 * ⚠️ 함정: pages.retrieve 는 "없는 ID" 에 대해 null 을 반환하지 않고 APIResponseError(object_not_found)
 *    를 "던진다". 그래서 그 에러만 골라 null 로 바꾸고, 키 미설정·네트워크 오류 같은 진짜 문제는
 *    그대로 위로 던져 홈/상세의 에러 처리(로그·404 구분)에 맡긴다.
 *
 * @param pageId 조회할 Notion 페이지 ID(= Post.id, URL 의 [id])
 * @returns 발행된 글이면 Post, 미발행/없는 글이면 null
 */
export async function getPostById(pageId: string): Promise<Post | null> {
  const notion = getNotionClient() // 인증된 Notion 클라이언트

  try {
    const page = await notion.pages.retrieve({ page_id: pageId })

    // 부분 응답(properties 없음)이면 변환할 수 없으므로 안전하게 null.
    if (!isFullPage(page)) return null

    // 미발행 글의 직접 접근 차단(PRD 5장: "발행됨" 만 노출).
    // 목록 조회와 동일한 상수·헬퍼를 재사용해 "발행 판정 기준" 을 한곳에 모은다.
    if (extractSelectName(page.properties.Status) !== PUBLISHED_STATUS_VALUE) {
      return null
    }

    return toPost(page)
  } catch (error) {
    // "없는 페이지" 만 null 로 변환한다(404 로 이어짐).
    if (error instanceof APIResponseError && error.code === "object_not_found") {
      return null
    }
    // 그 외(인증 실패·속성 누락 등)는 진짜 오류다.
    // 호출 측(상세 페이지)은 이 예외를 잡지 않아 500 으로 이어지므로,
    // 원인 추적을 위해 여기서 로그를 남긴 뒤 다시 던진다(CLAUDE.md: 에러 시 로그 적재).
    logger.error("게시글 메타데이터 조회 실패", { pageId, error })
    throw error
  }
}

/**
 * 글 상세 페이지용 — 단건 게시글의 "본문 블록"을 모두 조회한다.
 *
 * Notion 본문은 블록(단락·제목·목록·이미지 …)의 배열이며, 한 번의 API 호출은 최대 100개까지만
 * 돌려주고 나머지는 커서(next_cursor)로 이어 가져와야 한다. 그래서 has_more 가 false 가 될 때까지
 * 반복 호출해 모든 블록을 모은다(긴 글도 누락 없이 표시).
 *
 * 중첩 블록(목록 안의 목록 등 자식)은 MVP 범위에서 제외한다 — 최상위 1뎁스만 가져온다.
 * (자식까지 재귀 조회하면 글 하나에 API 호출이 급증해 레이트리밋 위험이 커진다.)
 *
 * 조회에 실패하면(네트워크 오류·레이트리밋 등) 예외를 위로 던지지 않고 빈 배열로 폴백한다.
 * → 메타데이터(getPostById)는 이미 성공해 글 자체는 존재하는 상황이므로, 본문 일부를 못 가져왔다고
 *   상세 페이지 전체를 500 으로 떨어뜨리기보다 "제목·메타는 보이되 본문은 비는" 편이 사용자 경험상 낫다.
 *   (홈의 graceful 처리와 같은 기조 + CLAUDE.md: 에러 시 로그 적재.)
 *
 * @param pageId 본문을 가져올 Notion 페이지 ID
 * @returns 완전한 블록 객체 배열(렌더 가능한 블록만). 조회 실패 시 빈 배열.
 */
export async function getPostBlocks(pageId: string): Promise<BlockObjectResponse[]> {
  const notion = getNotionClient() // 인증된 Notion 클라이언트

  const blocks: BlockObjectResponse[] = [] // 누적할 블록 목록
  let cursor: string | undefined = undefined // 다음 페이지 조회 커서(처음엔 없음)

  try {
    do {
      const response = await notion.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor, // undefined 면 처음부터
        page_size: 100, // Notion 허용 최대치(왕복 횟수 최소화)
      })

      // 목록 조회와 동일하게, 완전한 블록(BlockObjectResponse)만 걸러 타입을 좁힌다.
      blocks.push(...response.results.filter(isFullBlock))

      // 더 있으면 다음 커서로, 없으면 루프 종료. next_cursor 는 string|null 이므로 undefined 로 정규화.
      cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined
    } while (cursor)

    return blocks
  } catch (error) {
    // 본문 조회 실패는 페이지를 죽이지 않고 빈 본문으로 폴백하되, 원인은 반드시 로그로 남긴다.
    logger.error("본문 블록 조회 실패", { pageId, error })
    return []
  }
}

/**
 * Notion 페이지 속성 한 칸의 타입.
 * properties 는 속성명 → 속성값(여러 타입의 판별 유니온) 형태의 맵이다.
 */
type NotionPageProperty = PageObjectResponse["properties"][string]

/**
 * 원시 Notion 페이지(PageObjectResponse) 한 건을 화면용 Post 로 변환한다.
 *
 * 속성명("Title"/"Category"/...)은 PRD 5장에서 정의한 Notion DB 컬럼명과 일치해야 한다.
 * 각 속성의 깊은 중첩 구조에서 값을 안전하게 꺼내는 일은 아래 extract* 헬퍼에 위임한다.
 *
 * @param page 완전한 Notion 페이지 응답
 * @returns 평평하게 정리된 게시글 객체
 */
function toPost(page: PageObjectResponse): Post {
  const properties = page.properties // 이 페이지의 속성 맵

  return {
    id: page.id,
    title: extractPlainText(properties.Title),
    category: extractSelectName(properties.Category),
    tags: extractMultiSelectNames(properties.Tags),
    publishedAt: extractDateStart(properties.Published),
  }
}

/**
 * title 속성에서 순수 텍스트를 추출한다.
 * title 은 서식 조각(rich text) 배열이라, 각 조각의 plain_text 를 이어 붙인다.
 *
 * @param property Title 속성값(없거나 다른 타입이면 빈 문자열 반환)
 */
function extractPlainText(property: NotionPageProperty | undefined): string {
  if (property?.type === "title") {
    return property.title.map((part) => part.plain_text).join("")
  }
  return ""
}

/**
 * select(단일 선택) 속성에서 선택된 항목의 이름을 추출한다.
 * @param property Category 속성값(미선택/타입 불일치 시 null)
 */
function extractSelectName(property: NotionPageProperty | undefined): string | null {
  if (property?.type === "select") {
    return property.select?.name ?? null
  }
  return null
}

/**
 * multi_select(복수 선택) 속성에서 선택된 모든 항목 이름을 배열로 추출한다.
 * @param property Tags 속성값(없거나 타입 불일치 시 빈 배열)
 */
function extractMultiSelectNames(property: NotionPageProperty | undefined): string[] {
  if (property?.type === "multi_select") {
    return property.multi_select.map((option) => option.name)
  }
  return []
}

/**
 * date 속성에서 시작일(start)을 ISO 문자열로 추출한다.
 * @param property Published 속성값(미입력/타입 불일치 시 null)
 */
function extractDateStart(property: NotionPageProperty | undefined): string | null {
  if (property?.type === "date") {
    return property.date?.start ?? null
  }
  return null
}
